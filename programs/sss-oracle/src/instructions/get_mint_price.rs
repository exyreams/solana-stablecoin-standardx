use crate::errors::OracleError;
use crate::events::MintPriceComputed;
use crate::math::fixed_point::apply_bps;
use crate::state::OracleConfig;
use anchor_lang::prelude::*;

// ── Accounts ───────────────────────────────────────────────

#[derive(Accounts)]
pub struct GetMintPrice<'info> {
    #[account(
        constraint = !oracle_config.paused @ OracleError::OraclePaused,
    )]
    pub oracle_config: Account<'info, OracleConfig>,
}

// ── Handler ────────────────────────────────────────────────

pub fn handler(ctx: Context<GetMintPrice>) -> Result<()> {
    let cfg = &ctx.accounts.oracle_config;
    let clock = Clock::get()?;

    let base_price = cfg.get_current_price(clock.unix_timestamp)?;
    let mint_price = apply_bps(base_price, cfg.mint_premium_bps)?;

    emit!(MintPriceComputed {
        oracle_config: cfg.key(),
        base_price,
        mint_price,
        premium_bps: cfg.mint_premium_bps,
    });

    // Expose the result via return-data so CPI callers can read it.
    anchor_lang::solana_program::program::set_return_data(&mint_price.to_le_bytes());

    Ok(())
}
