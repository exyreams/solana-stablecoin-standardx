use crate::errors::OracleError;
use crate::events::RedeemPriceComputed;
use crate::math::fixed_point::apply_bps;
use crate::state::OracleConfig;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct GetRedeemPrice<'info> {
    #[account(constraint = !oracle_config.paused @ OracleError::OraclePaused)]
    pub oracle_config: Account<'info, OracleConfig>,
}

pub fn handler(ctx: Context<GetRedeemPrice>) -> Result<()> {
    let cfg = &ctx.accounts.oracle_config;
    let clock = Clock::get()?;

    let base_price = cfg.get_current_price(clock.unix_timestamp)?;
    // Negate discount_bps: positive discount means redeemer gets less.
    let redeem_price = apply_bps(base_price, -cfg.redeem_discount_bps)?;

    emit!(RedeemPriceComputed {
        oracle_config: cfg.key(),
        base_price,
        redeem_price,
        discount_bps: cfg.redeem_discount_bps,
    });

    anchor_lang::solana_program::program::set_return_data(&redeem_price.to_le_bytes());

    Ok(())
}
