use crate::errors::OracleError;
use crate::events::FeedCranked;
use crate::math::fixed_point::deviation_bps;
use crate::state::*;
use anchor_lang::prelude::*;

// ── Accounts ───────────────────────────────────────────────

#[derive(Accounts)]
pub struct CrankFeed<'info> {
    pub cranker: Signer<'info>,

    #[account(
        constraint = oracle_config.is_cranker(&cranker.key()) @ OracleError::Unauthorized,
        constraint = !oracle_config.paused                    @ OracleError::OraclePaused,
    )]
    pub oracle_config: Account<'info, OracleConfig>,

    #[account(
        mut,
        constraint = price_feed_entry.oracle_config == oracle_config.key()
            @ OracleError::InvalidFeedAccount,
        constraint = price_feed_entry.enabled @ OracleError::FeedNotEnabled,
    )]
    pub price_feed_entry: Account<'info, PriceFeedEntry>,
}

// ── Handler ────────────────────────────────────────────────

pub fn handler(ctx: Context<CrankFeed>, price: u64, confidence: u64) -> Result<()> {
    require!(price > 0, OracleError::InvalidPrice);

    let cfg = &ctx.accounts.oracle_config;
    let feed = &mut ctx.accounts.price_feed_entry;

    // ── Circuit breaker ────────────────────────────────────
    // If the feed has a previous price and the circuit breaker is enabled,
    // reject cranks where the price changed by more than the threshold.
    // First crank (last_price == 0) always passes — no reference point.
    if feed.last_price > 0 && cfg.max_price_change_bps > 0 {
        let change = deviation_bps(feed.last_price, price)?;
        require!(
            change <= cfg.max_price_change_bps,
            OracleError::PriceChangeExceedsLimit
        );
    }

    let clock = Clock::get()?;

    feed.last_price = price;
    feed.last_confidence = confidence;
    feed.last_timestamp = clock.unix_timestamp;

    emit!(FeedCranked {
        oracle_config: ctx.accounts.oracle_config.key(),
        feed_index: feed.feed_index,
        price,
        confidence,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
