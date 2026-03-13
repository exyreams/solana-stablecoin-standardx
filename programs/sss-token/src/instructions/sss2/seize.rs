use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::Token2022,
    token_interface::{transfer_checked, Mint, TokenAccount, TransferChecked},
};

use crate::{
    errors::SssError,
    events::TokensSeized,
    state::{RolesConfig, StablecoinState},
};

/// Seize tokens from any account using the permanent delegate authority.
///
/// # Design Notes
///
/// **No blacklist check required:**  Seizure may target accounts that are not
/// blacklisted (e.g., court orders, regulatory directives).  Blacklisting and
/// seizure are independent compliance tools.  If an operator wants to
/// blacklist-then-seize, they issue two separate instructions.
///
/// **No pause check:**  Seizure must remain operational even when the
/// stablecoin is paused.  During a security incident the operator may need to
/// pause minting/burning while still moving funds to a treasury.
///
/// **Transfer hook bypass:**  When the transfer hook is active, the hook
/// detects that the transfer authority is the stablecoin_state PDA
/// (permanent delegate) and skips blacklist checks.  This allows seizing
/// from blacklisted accounts.
///
/// # Transfer Hook Accounts (SSS-2)
///
/// When the mint has a TransferHook extension, Token-2022's `transfer_checked`
/// processor CPIs into the hook program using extra accounts resolved from the
/// ExtraAccountMetaList.  These **must** be passed as `remaining_accounts`:
///
///   1. ExtraAccountMetaList PDA — seeds: `["extra-account-metas", mint]`
///      (owned by the transfer-hook program)
///   2. Transfer hook program
///   3. sss-token program (extra #0 in the meta list)
///   4. Source blacklist entry PDA (extra #1)
///   5. Destination blacklist entry PDA (extra #2)
///   6. stablecoin_state PDA (extra #3)
///
/// For SSS-1 mints (no hook), `remaining_accounts` should be empty.
#[derive(Accounts)]
pub struct Seize<'info> {
    /// The human operator who triggered the seize — must hold the `seizer` role.
    /// This is a permission guard only; the actual CPI signer is the stablecoin_state PDA.
    pub seizer: Signer<'info>,

    /// The stablecoin_state PDA is the registered permanent delegate of the mint.
    /// It signs the transfer_checked CPI using PDA seeds.
    #[account(
        seeds = [b"stablecoin_state", stablecoin_state.mint.as_ref()],
        bump = stablecoin_state.bump,
    )]
    pub stablecoin_state: Account<'info, StablecoinState>,

    #[account(
        seeds = [b"roles_config", stablecoin_state.mint.as_ref()],
        bump = roles_config.bump,
    )]
    pub roles_config: Account<'info, RolesConfig>,

    /// The mint whose permanent delegate is the stablecoin_state PDA.
    #[account(mut, constraint = mint.key() == stablecoin_state.mint @ SssError::Unauthorized)]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    /// Token account being seized from (does not need owner's signature).
    #[account(mut, token::mint = mint)]
    pub from_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    /// Treasury / destination token account.
    #[account(mut, token::mint = mint)]
    pub to_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Program<'info, Token2022>,
    // When transfer_hook is enabled (SSS-2), the client must pass all
    // hook-related accounts as remaining_accounts.  See doc comment above
    // for the required account list.
}

pub fn handler<'info>(ctx: Context<'_, '_, '_, 'info, Seize<'info>>, amount: u64) -> Result<()> {
    require!(amount > 0, SssError::ZeroAmount);

    let state = &ctx.accounts.stablecoin_state;
    let roles = &ctx.accounts.roles_config;

    // Guard: SSS-2 permanent delegate must be enabled
    require!(
        state.enable_permanent_delegate,
        SssError::ComplianceNotEnabled
    );
    require!(
        ctx.accounts.seizer.key() == roles.seizer
            || ctx.accounts.seizer.key() == roles.master_authority,
        SssError::NotSeizer
    );

    // The stablecoin_state PDA was registered as the mint's permanent delegate
    // during `initialize`. We use new_with_signer so the PDA counter-signs the CPI.
    let mint_key = ctx.accounts.mint.key();
    let bump = state.bump;
    let signer_seeds: &[&[&[u8]]] = &[&[b"stablecoin_state", mint_key.as_ref(), &[bump]]];

    // Build CPI with remaining_accounts appended for transfer hook support.
    //
    // When the mint has a TransferHook extension (SSS-2), Token-2022's
    // processor needs the hook-related accounts to be present *after* the
    // standard TransferChecked accounts in the CPI's account list.
    // `with_remaining_accounts` appends them in the correct position.
    //
    // When no hook is active (SSS-1), remaining_accounts is empty and
    // Token-2022 processes a standard transfer — no extra accounts needed.
    // We don't use Anchor's `transfer_checked` wrapper because it drops
    // `remaining_accounts` when passing into `invoke_signed`, which breaks Transfer Hooks.
    // Instead, we build the instruction directly and append `remaining_accounts` manually.
    let mut ix = spl_token_2022::instruction::transfer_checked(
        ctx.accounts.token_program.key,
        &ctx.accounts.from_token_account.key(),
        &ctx.accounts.mint.key(),
        &ctx.accounts.to_token_account.key(),
        &ctx.accounts.stablecoin_state.key(),
        &[],
        amount,
        state.decimals,
    )?;

    // Append the extra accounts directly to the CPI instruction's account vector!
    // Without this, Token-2022 doesn't receive the accounts from the Solana runtime.
    for extra_info in ctx.remaining_accounts.iter() {
        ix.accounts.push(anchor_lang::solana_program::instruction::AccountMeta {
            pubkey: *extra_info.key,
            is_signer: extra_info.is_signer,
            is_writable: extra_info.is_writable,
        });
    }

    let mut account_infos = vec![
        ctx.accounts.from_token_account.to_account_info(),
        ctx.accounts.mint.to_account_info(),
        ctx.accounts.to_token_account.to_account_info(),
        ctx.accounts.stablecoin_state.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
    ];
    account_infos.extend_from_slice(ctx.remaining_accounts);

    anchor_lang::solana_program::program::invoke_signed(&ix, &account_infos, signer_seeds)?;

    emit!(TokensSeized {
        mint: state.mint,
        from: ctx.accounts.from_token_account.key(),
        to: ctx.accounts.to_token_account.key(),
        amount,
        seizer: ctx.accounts.seizer.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
