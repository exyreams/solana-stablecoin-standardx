use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::Token2022,
    token_interface::{Mint, TokenAccount},
};

use crate::{
    errors::SssError,
    events::TokensSeized,
    state::{RolesConfig, StablecoinState},
};

/// Seize tokens from any account using the permanent delegate authority.
///
/// No blacklist check: seizure may target accounts that are not blacklisted
/// (e.g. court orders). Blacklisting and seizure are independent tools.
///
/// No pause check: seizure must remain operational even when the stablecoin
/// is paused — operators may need to move funds during a security incident.
///
/// Transfer hook bypass: the hook detects that the transfer authority is the
/// stablecoin_state PDA (permanent delegate) and skips blacklist checks,
/// allowing seizure from blacklisted accounts.
///
/// When the mint has a TransferHook extension (SSS-2), pass hook-related
/// accounts as `remaining_accounts` in this order:
///   1. ExtraAccountMetaList PDA — seeds: ["extra-account-metas", mint]
///   2. Transfer hook program
///   3. sss-token program (extra #0)
///   4. Source blacklist entry PDA (extra #1)
///   5. Destination blacklist entry PDA (extra #2)
///   6. stablecoin_state PDA (extra #3)
///
/// For SSS-1 mints (no hook), `remaining_accounts` should be empty.
#[derive(Accounts)]
pub struct Seize<'info> {
    /// Permission guard only — actual CPI signer is the stablecoin_state PDA.
    pub seizer: Signer<'info>,

    /// Registered permanent delegate of the mint; signs the transfer_checked CPI.
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

    #[account(mut, constraint = mint.key() == stablecoin_state.mint @ SssError::Unauthorized)]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    /// Token account being seized from (no owner signature required).
    #[account(mut, token::mint = mint)]
    pub from_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    /// Treasury / destination token account.
    #[account(mut, token::mint = mint)]
    pub to_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Program<'info, Token2022>,
    // SSS-2: pass all hook-related accounts as remaining_accounts (see doc above).
}

pub fn handler<'info>(ctx: Context<'_, '_, '_, 'info, Seize<'info>>, amount: u64) -> Result<()> {
    require!(amount > 0, SssError::ZeroAmount);

    let state = &ctx.accounts.stablecoin_state;
    let roles = &ctx.accounts.roles_config;

    require!(
        state.enable_permanent_delegate,
        SssError::ComplianceNotEnabled
    );
    require!(
        ctx.accounts.seizer.key() == roles.seizer
            || ctx.accounts.seizer.key() == roles.master_authority,
        SssError::NotSeizer
    );

    let mint_key = ctx.accounts.mint.key();
    let bump = state.bump;
    let signer_seeds: &[&[&[u8]]] = &[&[b"stablecoin_state", mint_key.as_ref(), &[bump]]];

    // We don't use Anchor's transfer_checked wrapper because it drops
    // remaining_accounts when passing into invoke_signed, breaking Transfer Hooks.
    // Build the instruction directly and append remaining_accounts manually.
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

    for extra_info in ctx.remaining_accounts.iter() {
        ix.accounts
            .push(anchor_lang::solana_program::instruction::AccountMeta {
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
