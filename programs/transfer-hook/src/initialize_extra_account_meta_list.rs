use anchor_lang::prelude::*;
use anchor_spl::token_interface::Mint;
use spl_tlv_account_resolution::{
    account::ExtraAccountMeta, seeds::Seed, state::ExtraAccountMetaList,
};

use crate::errors::HookError;

/// PDA seeds for the ExtraAccountMetaList account.
/// Must match what Token-2022 uses to look up the hook's validation account.
pub const EXTRA_ACCOUNT_META_LIST_SEEDS: &[u8] = b"extra-account-metas";

#[derive(Accounts)]
pub struct InitializeExtraAccountMetaList<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// ExtraAccountMetaList PDA — tells Token-2022 which extra accounts
    /// must be passed to this hook on every transfer.
    ///
    /// CHECK: Account data is written manually by ExtraAccountMetaList::init.
    #[account(
        init,
        payer = payer,
        space = ExtraAccountMetaList::size_of(4).unwrap(),
        seeds = [EXTRA_ACCOUNT_META_LIST_SEEDS, mint.key().as_ref()],
        bump,
    )]
    pub extra_account_meta_list: UncheckedAccount<'info>,

    pub mint: Box<InterfaceAccount<'info, Mint>>,

    /// The sss-token program whose blacklist PDAs we need to resolve.
    /// CHECK: Stored as a fixed pubkey in the ExtraAccountMetaList so
    /// Token-2022 can derive blacklist PDAs owned by this program.
    pub sss_token_program: UncheckedAccount<'info>,

    /// The roles_config PDA from sss-token — used to verify the payer
    /// is the master authority.  This prevents front-running attacks where
    /// an adversary initializes the ExtraAccountMetaList with a wrong
    /// sss_token_program before the legitimate admin does.
    ///
    /// CHECK: Verified via PDA derivation (must be owned by sss_token_program
    /// with seeds ["roles_config", mint]) and raw data read for authority.
    pub roles_config: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_handler(ctx: Context<InitializeExtraAccountMetaList>) -> Result<()> {
    // ── Authority verification ───────────────────────────────────────────
    //
    // Verify that the payer is the master_authority of this stablecoin.
    // We do this by:
    //   1. Confirming roles_config is the correct PDA (derived from
    //      sss_token_program + mint), preventing address spoofing.
    //   2. Confirming roles_config is owned by sss_token_program,
    //      ensuring it was created by the legitimate program.
    //   3. Reading master_authority from the account data at offset 8
    //      (after the 8-byte Anchor discriminator).
    //   4. Requiring payer == master_authority.

    let sss_program_key = ctx.accounts.sss_token_program.key();
    let mint_key = ctx.accounts.mint.key();

    // Step 1: Verify roles_config PDA address
    let (expected_roles_pda, _) =
        Pubkey::find_program_address(&[b"roles_config", mint_key.as_ref()], &sss_program_key);
    require!(
        ctx.accounts.roles_config.key() == expected_roles_pda,
        HookError::InvalidAuthority
    );

    // Step 2: Verify ownership
    require!(
        *ctx.accounts.roles_config.owner == sss_program_key,
        HookError::InvalidAuthority
    );

    // Step 3: Read master_authority from raw account data
    // RolesConfig layout: [8 discriminator][32 master_authority][...]
    let data = ctx.accounts.roles_config.try_borrow_data()?;
    require!(data.len() >= 40, HookError::InvalidAuthority);
    let authority_bytes: [u8; 32] = data[8..40]
        .try_into()
        .map_err(|_| error!(HookError::InvalidAuthority))?;
    let master_authority = Pubkey::new_from_array(authority_bytes);

    // Step 4: Payer must be the master authority
    require!(
        ctx.accounts.payer.key() == master_authority,
        HookError::InvalidAuthority
    );

    // ── Build ExtraAccountMetaList ───────────────────────────────────────
    //
    // Token-2022 execute instruction account layout:
    //
    //   0  source_token           (token account)
    //   1  mint
    //   2  destination_token      (token account)
    //   3  authority              (owner or delegate)
    //   4  extra_account_meta_list (this PDA)
    //   ── extra accounts resolved from this list ──
    //   5  sss_token_program      (extra #0)
    //   6  source_blacklist_entry  (extra #1)
    //   7  destination_blacklist_entry (extra #2)
    //   8  stablecoin_state        (extra #3)

    let account_metas = vec![
        // Extra #0 (index 5): sss-token program as a fixed pubkey.
        // Needed so we can derive blacklist PDAs under this program.
        ExtraAccountMeta::new_with_pubkey(
            &ctx.accounts.sss_token_program.key(),
            false, // is_signer
            false, // is_writable
        )?,
        // Extra #1 (index 6): source blacklist entry.
        // PDA of sss-token program (at index 5): ["blacklist", mint, source_owner].
        // We read the owner from the source token account's data (offset 32)
        // instead of using the authority at index 3, because the authority
        // could be a delegate — we always want to check the actual wallet owner.
        ExtraAccountMeta::new_external_pda_with_seeds(
            5, // program at overall index 5 (sss-token)
            &[
                Seed::Literal {
                    bytes: b"blacklist".to_vec(),
                },
                Seed::AccountKey { index: 1 }, // mint
                Seed::AccountData {
                    account_index: 0, // source token account
                    data_index: 32,   // owner field offset in TokenAccount
                    length: 32,       // Pubkey size
                },
            ],
            false,
            false,
        )?,
        // Extra #2 (index 7): destination blacklist entry.
        // PDA of sss-token program (at index 5): ["blacklist", mint, dest_owner].
        ExtraAccountMeta::new_external_pda_with_seeds(
            5, // program at overall index 5 (sss-token)
            &[
                Seed::Literal {
                    bytes: b"blacklist".to_vec(),
                },
                Seed::AccountKey { index: 1 }, // mint
                Seed::AccountData {
                    account_index: 2, // destination token account
                    data_index: 32,   // owner field offset
                    length: 32,       // Pubkey size
                },
            ],
            false,
            false,
        )?,
        // Extra #3 (index 8): stablecoin_state PDA.
        // Used by the hook to identify permanent delegate (seize) operations.
        // When the authority at index 3 matches this PDA, the transfer is a
        // seize operation and blacklist checks are skipped.
        // Derived as PDA of sss-token (at index 5): ["stablecoin_state", mint].
        ExtraAccountMeta::new_external_pda_with_seeds(
            5, // program at overall index 5 (sss-token)
            &[
                Seed::Literal {
                    bytes: b"stablecoin_state".to_vec(),
                },
                Seed::AccountKey { index: 1 }, // mint
            ],
            false,
            false,
        )?,
    ];

    // Write the ExtraAccountMetaList into the PDA's data.
    ExtraAccountMetaList::init::<spl_transfer_hook_interface::instruction::ExecuteInstruction>(
        &mut ctx.accounts.extra_account_meta_list.try_borrow_mut_data()?,
        &account_metas,
    )?;

    Ok(())
}
