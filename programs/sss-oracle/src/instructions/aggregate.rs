use crate::errors::OracleError;
use crate::events::PriceAggregated;
use crate::math::aggregation::*;
use crate::math::fixed_point::confidence_within_range;
use crate::state::*;
use anchor_lang::prelude::*;

// ── Accounts ───────────────────────────────────────────────

#[derive(Accounts)]
pub struct Aggregate<'info> {
    pub cranker: Signer<'info>,

    #[account(
        mut,
        constraint = oracle_config.is_cranker(&cranker.key()) @ OracleError::Unauthorized,
        constraint = !oracle_config.paused                    @ OracleError::OraclePaused,
    )]
    pub oracle_config: Account<'info, OracleConfig>,
    // Pass every PriceFeedEntry that belongs to this oracle as remaining accounts.
}

// ── Handler ────────────────────────────────────────────────

pub fn handler(ctx: Context<Aggregate>) -> Result<()> {
    let cfg = &mut ctx.accounts.oracle_config;
    let clock = Clock::get()?;
    let current_ts = clock.unix_timestamp;

    // ── Short-circuit: manual override ─────────────────────
    if cfg.manual_price_active {
        cfg.last_aggregated_price = cfg.manual_price;
        cfg.last_aggregated_confidence = 0;
        cfg.last_aggregated_timestamp = current_ts;

        emit!(PriceAggregated {
            oracle_config: cfg.key(),
            aggregated_price: cfg.manual_price,
            aggregated_confidence: 0,
            feeds_used: 0,
            timestamp: current_ts,
        });
        return Ok(());
    }

    // ── Collect valid data points from remaining accounts ──
    let oracle_config_key = cfg.key();
    let max_staleness = cfg.max_staleness_seconds;
    let max_conf_bps = cfg.max_confidence_interval_bps;

    let mut valid_data: Vec<FeedDataPoint> = Vec::with_capacity(MAX_FEEDS as usize);

    for account_info in ctx.remaining_accounts.iter() {
        // Must be owned by this program
        if account_info.owner != ctx.program_id {
            continue;
        }

        // Attempt deserialization (includes discriminator check)
        let feed = {
            let data = account_info.try_borrow_data()?;
            let mut slice: &[u8] = &data;
            match PriceFeedEntry::try_deserialize(&mut slice) {
                Ok(f) => f,
                Err(_) => continue,
            }
        };

        // Belongs to this oracle?
        if feed.oracle_config != oracle_config_key {
            continue;
        }
        // Enabled?
        if !feed.enabled {
            continue;
        }
        // Non-zero?
        if feed.last_price == 0 {
            continue;
        }
        // Fresh?
        if feed.is_stale(current_ts, max_staleness) {
            continue;
        }
        // Confidence acceptable? (0 = disabled, accept all)
        if max_conf_bps > 0 {
            let ok = confidence_within_range(feed.last_price, feed.last_confidence, max_conf_bps)?;
            if !ok {
                continue;
            }
        }

        valid_data.push(FeedDataPoint {
            price: feed.last_price,
            confidence: feed.last_confidence,
            weight: feed.weight,
        });
    }

    // ── Minimum-feeds gate ─────────────────────────────────
    require!(
        valid_data.len() >= cfg.min_feeds_required as usize,
        OracleError::InsufficientFeeds
    );

    // ── Deviation gate (0 = disabled) ──────────────────────
    if cfg.deviation_threshold_bps > 0 {
        let prices: Vec<u64> = valid_data.iter().map(|d| d.price).collect();
        require!(
            check_deviation(&prices, cfg.deviation_threshold_bps)?,
            OracleError::ExcessiveDeviation
        );
    }

    // ── Aggregate ──────────────────────────────────────────
    let prices: Vec<u64> = valid_data.iter().map(|d| d.price).collect();
    let aggregated_price = match cfg.aggregation_method {
        AGG_MEDIAN => {
            let mut p = prices;
            compute_median(&mut p)?
        }
        AGG_MEAN => compute_mean(&prices)?,
        AGG_WEIGHTED_MEAN => compute_weighted_mean(&valid_data)?,
        _ => return Err(OracleError::InvalidAggregationMethod.into()),
    };

    let aggregated_confidence = compute_aggregate_confidence(&valid_data)?;

    // ── Store ──────────────────────────────────────────────
    cfg.last_aggregated_price = aggregated_price;
    cfg.last_aggregated_confidence = aggregated_confidence;
    cfg.last_aggregated_timestamp = current_ts;

    emit!(PriceAggregated {
        oracle_config: cfg.key(),
        aggregated_price,
        aggregated_confidence,
        feeds_used: valid_data.len() as u8,
        timestamp: current_ts,
    });

    Ok(())
}
