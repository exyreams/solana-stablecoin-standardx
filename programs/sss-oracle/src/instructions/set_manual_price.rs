use crate::errors::OracleError;
use crate::events::ManualPriceSet;
use crate::state::OracleConfig;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct SetManualPrice<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority @ OracleError::Unauthorized,
    )]
    pub oracle_config: Account<'info, OracleConfig>,
}

pub fn handler(ctx: Context<SetManualPrice>, price: u64, active: bool) -> Result<()> {
    if active {
        require!(price > 0, OracleError::InvalidPrice);
    }

    let cfg = &mut ctx.accounts.oracle_config;
    cfg.manual_price = price;
    cfg.manual_price_active = active;

    // Propagate to cached aggregation so downstream readers see the manual
    // price immediately without needing to call aggregate first.
    if active {
        let clock = Clock::get()?;
        cfg.last_aggregated_price = price;
        cfg.last_aggregated_confidence = 0;
        cfg.last_aggregated_timestamp = clock.unix_timestamp;
    }

    emit!(ManualPriceSet {
        oracle_config: cfg.key(),
        price,
        active,
    });

    Ok(())
}
