use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::Token2022,
    token_interface::{mint_to, Mint as MintAccount, MintTo, TokenAccount},
};

use crate::{
    errors::SssError,
    events::TokensMinted,
    state::{MinterQuota, RolesConfig, StablecoinState},
};

#[derive(Accounts)]
pub struct MintTokens<'info> {
    pub minter: Signer<'info>,

    #[account(
        mut,
        seeds = [b"stablecoin_state", mint.key().as_ref()],
        bump = stablecoin_state.bump,
    )]
    pub stablecoin_state: Account<'info, StablecoinState>,

    #[account(
        seeds = [b"roles_config", mint.key().as_ref()],
        bump = roles_config.bump,
    )]
    pub roles_config: Account<'info, RolesConfig>,

    #[account(
        mut,
        seeds = [MinterQuota::SEED, mint.key().as_ref(), minter.key().as_ref()],
        bump = minter_quota.bump,
    )]
    pub minter_quota: Account<'info, MinterQuota>,

    #[account(mut)]
    pub mint: Box<InterfaceAccount<'info, MintAccount>>,

    #[account(mut, token::mint = mint)]
    pub recipient_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Program<'info, Token2022>,
}

pub fn handler(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
    // ── Guards (read-only checks first, no mutable borrow yet) ──────────────
    require!(amount > 0, SssError::ZeroAmount);
    require!(!ctx.accounts.stablecoin_state.paused, SssError::Paused);

    let quota = &mut ctx.accounts.minter_quota;

    // Check if minter is authorized via quota system
    require!(quota.active, SssError::MinterInactive);

    // Track the running total for audit purposes.
    // For unlimited minters (quota == 0) we still accumulate `minted`
    // so the off-chain event indexer has an accurate picture.
    let new_minted = quota.minted.checked_add(amount).ok_or(SssError::Overflow)?;

    // Quota ceiling check — only enforced when quota > 0.
    if quota.quota > 0 {
        require!(new_minted <= quota.quota, SssError::QuotaExceeded);
    }

    quota.minted = new_minted;

    // ── Read values needed for PDA signing before any mutable borrow ────────
    let mint_key = ctx.accounts.mint.key();
    let bump = ctx.accounts.stablecoin_state.bump;
    let signer_seeds: &[&[&[u8]]] = &[&[b"stablecoin_state", mint_key.as_ref(), &[bump]]];

    // ── Mint using PDA authority ─────────────────────────────────────────────
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: ctx.accounts.stablecoin_state.to_account_info(), // PDA signs
        },
        signer_seeds,
    );
    mint_to(cpi_ctx, amount)?;

    // ── Sync total_supply with actual on-chain mint supply ───────────────────
    // This ensures accuracy even if tokens were burned directly via
    // Token-2022 without going through this program's burn instruction.
    ctx.accounts.mint.reload()?;
    let state = &mut ctx.accounts.stablecoin_state;
    state.total_supply = ctx.accounts.mint.supply;

    emit!(TokensMinted {
        mint: mint_key,
        recipient: ctx.accounts.recipient_token_account.key(),
        amount,
        minter: ctx.accounts.minter.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
