use crate::errors::OracleError;
use crate::events::{OracleConfigUpdated, OraclePauseStateChanged};
use crate::state::OracleConfig;
use anchor_lang::prelude::*;

// ── Params ─────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateOracleConfigParams {
    pub max_staleness_seconds: Option<i64>,
    pub max_confidence_interval_bps: Option<u16>,
    pub aggregation_method: Option<u8>,
    pub min_feeds_required: Option<u8>,
    pub deviation_threshold_bps: Option<u16>,
    pub max_price_change_bps: Option<u16>,
    pub mint_premium_bps: Option<i16>,
    pub redeem_discount_bps: Option<i16>,
    pub cranker: Option<Pubkey>,
    pub paused: Option<bool>,
    // Authority transfer removed — use transfer_oracle_authority instead.
}

// ── Accounts ───────────────────────────────────────────────

#[derive(Accounts)]
pub struct UpdateOracleConfig<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority @ OracleError::Unauthorized,
    )]
    pub oracle_config: Account<'info, OracleConfig>,
}

// ── Handler ────────────────────────────────────────────────

pub fn handler(ctx: Context<UpdateOracleConfig>, params: UpdateOracleConfigParams) -> Result<()> {
    let cfg = &mut ctx.accounts.oracle_config;
    let clock = Clock::get()?;

    if let Some(v) = params.max_staleness_seconds {
        require!(v > 0, OracleError::InvalidParameter);
        cfg.max_staleness_seconds = v;
    }
    if let Some(v) = params.max_confidence_interval_bps {
        cfg.max_confidence_interval_bps = v;
    }
    if let Some(v) = params.aggregation_method {
        require!(v <= 2, OracleError::InvalidAggregationMethod);
        cfg.aggregation_method = v;
    }
    if let Some(v) = params.min_feeds_required {
        require!(v > 0, OracleError::InvalidParameter);
        cfg.min_feeds_required = v;
    }
    if let Some(v) = params.deviation_threshold_bps {
        cfg.deviation_threshold_bps = v;
    }
    if let Some(v) = params.max_price_change_bps {
        cfg.max_price_change_bps = v;
    }
    if let Some(v) = params.mint_premium_bps {
        cfg.mint_premium_bps = v;
    }
    if let Some(v) = params.redeem_discount_bps {
        cfg.redeem_discount_bps = v;
    }
    if let Some(v) = params.cranker {
        cfg.cranker = v;
    }
    if let Some(v) = params.paused {
        let previous = cfg.paused;
        cfg.paused = v;
        // Emit a dedicated event when pause state actually changes.
        if v != previous {
            emit!(OraclePauseStateChanged {
                oracle_config: cfg.key(),
                paused: v,
                authority: cfg.authority,
                timestamp: clock.unix_timestamp,
            });
        }
    }

    emit!(OracleConfigUpdated {
        oracle_config: cfg.key(),
        authority: cfg.authority,
    });

    Ok(())
}
