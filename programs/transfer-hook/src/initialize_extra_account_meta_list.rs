use anchor_lang::prelude::*;
use anchor_spl::token_interface::Mint;
use spl_tlv_account_resolution::{
    account::ExtraAccountMeta, seeds::Seed, state::ExtraAccountMetaList,
};

use crate::errors::HookError;

pub const EXTRA_ACCOUNT_META_LIST_SEEDS: &[u8] = b"extra-account-metas";

#[derive(Accounts)]
pub struct InitializeExtraAccountMetaList<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// ExtraAccountMetaList PDA — tells Token-2022 which extra accounts to pass
    /// to this hook on every transfer.
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
    /// CHECK: Stored as a fixed pubkey in the ExtraAccountMetaList.
    pub sss_token_program: UncheckedAccount<'info>,

    /// roles_config PDA from sss-token — used to verify the payer is the master
    /// authority, preventing front-running attacks where an adversary initializes
    /// the ExtraAccountMetaList with a wrong sss_token_program.
    /// CHECK: Verified via PDA derivation (owned by sss_token_program,
    /// seeds ["roles_config", mint]) and raw data read for authority.
    pub roles_config: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_handler(ctx: Context<InitializeExtraAccountMetaList>) -> Result<()> {
    // Verify payer is the master_authority of this stablecoin:
    //   1. Confirm roles_config is the correct PDA (prevents address spoofing).
    //   2. Confirm roles_config is owned by sss_token_program (legitimate program).
    //   3. Read master_authority from raw account data at offset 8 (after discriminator).
    //   4. Require payer == master_authority.

    let sss_program_key = ctx.accounts.sss_token_program.key();
    let mint_key = ctx.accounts.mint.key();

    let (expected_roles_pda, _) =
        Pubkey::find_program_address(&[b"roles_config", mint_key.as_ref()], &sss_program_key);
    require!(
        ctx.accounts.roles_config.key() == expected_roles_pda,
        HookError::InvalidAuthority
    );

    require!(
        *ctx.accounts.roles_config.owner == sss_program_key,
        HookError::InvalidAuthority
    );

    // RolesConfig layout: [8 discriminator][32 master_authority][...]
    let data = ctx.accounts.roles_config.try_borrow_data()?;
    require!(data.len() >= 40, HookError::InvalidAuthority);
    let authority_bytes: [u8; 32] = data[8..40]
        .try_into()
        .map_err(|_| error!(HookError::InvalidAuthority))?;
    let master_authority = Pubkey::new_from_array(authority_bytes);

    require!(
        ctx.accounts.payer.key() == master_authority,
        HookError::InvalidAuthority
    );

    // Token-2022 execute instruction account layout:
    //   0  source_token
    //   1  mint
    //   2  destination_token
    //   3  authority (owner or delegate)
    //   4  extra_account_meta_list
    //   5  sss_token_program      (extra #0)
    //   6  source_blacklist_entry  (extra #1)
    //   7  destination_blacklist_entry (extra #2)
    //   8  stablecoin_state        (extra #3)
    let account_metas = vec![
        // Extra #0: sss-token program as a fixed pubkey.
        ExtraAccountMeta::new_with_pubkey(&ctx.accounts.sss_token_program.key(), false, false)?,
        // Extra #1: source blacklist entry PDA.
        // We use the token account owner (offset 32) rather than the authority at
        // index 3, because the authority could be a delegate.
        ExtraAccountMeta::new_external_pda_with_seeds(
            5, // sss-token program at overall index 5
            &[
                Seed::Literal {
                    bytes: b"blacklist".to_vec(),
                },
                Seed::AccountKey { index: 1 }, // mint
                Seed::AccountData {
                    account_index: 0,
                    data_index: 32,
                    length: 32,
                }, // source owner
            ],
            false,
            false,
        )?,
        // Extra #2: destination blacklist entry PDA.
        ExtraAccountMeta::new_external_pda_with_seeds(
            5,
            &[
                Seed::Literal {
                    bytes: b"blacklist".to_vec(),
                },
                Seed::AccountKey { index: 1 }, // mint
                Seed::AccountData {
                    account_index: 2,
                    data_index: 32,
                    length: 32,
                }, // dest owner
            ],
            false,
            false,
        )?,
        // Extra #3: stablecoin_state PDA.
        // When authority at index 3 matches this PDA, the transfer is a seize
        // and blacklist checks are skipped.
        ExtraAccountMeta::new_external_pda_with_seeds(
            5,
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

    ExtraAccountMetaList::init::<spl_transfer_hook_interface::instruction::ExecuteInstruction>(
        &mut ctx.accounts.extra_account_meta_list.try_borrow_mut_data()?,
        &account_metas,
    )?;

    Ok(())
}
