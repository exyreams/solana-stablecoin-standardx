use crate::errors::OracleError;
use anchor_lang::prelude::*;

// ── Constants ──────────────────────────────────────────────
pub const MAX_FEEDS: u8 = 16;
pub const MAX_CURRENCY_LEN: usize = 8;

/// Aggregation method identifiers
pub const AGG_MEDIAN: u8 = 0;
pub const AGG_MEAN: u8 = 1;
pub const AGG_WEIGHTED_MEAN: u8 = 2;

/// PDA seed prefix
pub const ORACLE_CONFIG_SEED: &[u8] = b"oracle_config";

// ── Account ────────────────────────────────────────────────
#[account]
#[derive(InitSpace)]
pub struct OracleConfig {
    /// Schema version for future state migrations.
    /// Increment when the account layout changes.
    pub version: u8,

    // ── Identity ───────────────────────────────────────────
    /// Authority that can manage every aspect of the oracle.
    pub authority: Pubkey,

    /// Pending new authority (two-step transfer pattern).
    /// Set by current authority, accepted by the pending party.
    pub pending_authority: Option<Pubkey>,

    /// Secondary signer authorised to crank feeds and run aggregation.
    pub cranker: Pubkey,

    /// The stablecoin mint this oracle serves.
    pub mint: Pubkey,

    // ── Currency pair ──────────────────────────────────────
    /// Base currency symbol, e.g. "EUR", "GBP", "JPY"
    #[max_len(8)]
    pub base_currency: String,

    /// Quote currency symbol, typically "USD"
    #[max_len(8)]
    pub quote_currency: String,

    // ── Quality gates ──────────────────────────────────────
    /// Maximum age (seconds) before a single feed is considered stale.
    pub max_staleness_seconds: i64,

    /// Maximum confidence interval (bps) for a single feed.
    /// 0 = disabled (all confidence values accepted).
    pub max_confidence_interval_bps: u16,

    /// 0 = Median · 1 = Mean · 2 = Weighted Mean
    pub aggregation_method: u8,

    /// Minimum valid feeds required for aggregation to succeed.
    pub min_feeds_required: u8,

    /// Maximum acceptable deviation between any two feeds (bps).
    /// 0 = disabled (no deviation check).
    pub deviation_threshold_bps: u16,

    // ── Circuit breaker ────────────────────────────────────
    /// Maximum single-crank price change (bps).
    /// If a cranked price deviates from the previous value by more than
    /// this threshold, the crank is rejected.
    /// 0 = disabled (any price change accepted).
    /// Recommended: 1000 (10%) for stable pairs, 3000 (30%) for volatile.
    pub max_price_change_bps: u16,

    // ── Spread ─────────────────────────────────────────────
    /// Basis-point premium added when computing the **mint** price.
    /// Positive → minter pays more.  Can be negative.
    pub mint_premium_bps: i16,

    /// Basis-point discount subtracted when computing the **redeem** price.
    /// Positive → redeemer receives less.  Can be negative.
    pub redeem_discount_bps: i16,

    // ── Manual override ────────────────────────────────────
    /// Manual fallback price (9-decimal fixed point).
    pub manual_price: u64,

    /// When `true`, `manual_price` overrides feed aggregation.
    pub manual_price_active: bool,

    // ── Cached aggregation ─────────────────────────────────
    /// Last successfully aggregated price (9-decimal fp).
    ///
    /// **Note:** When `manual_price_active` is true and `set_manual_price`
    /// is called, this field is also updated to the manual price so that
    /// downstream raw-state readers see the effective price.  After
    /// deactivating manual mode, call `aggregate` to refresh this field
    /// from live feeds before querying `get_mint_price`/`get_redeem_price`.
    pub last_aggregated_price: u64,

    /// RMS confidence of the last aggregation (9-decimal fp).
    pub last_aggregated_confidence: u64,

    /// Unix timestamp of the last aggregation.
    pub last_aggregated_timestamp: i64,

    // ── Housekeeping ───────────────────────────────────────
    /// Number of PriceFeedEntry PDAs currently active.
    pub feed_count: u8,

    /// Global pause flag — blocks cranks, aggregation and price reads.
    /// Authority can still update config, set manual price, transfer
    /// authority, and close the oracle while paused.
    pub paused: bool,

    /// PDA bump seed.
    pub bump: u8,

    /// Reserved for future upgrades.
    pub reserved: [u8; 32],
}

impl OracleConfig {
    /// Current schema version.  Increment when the account layout changes.
    pub const CURRENT_VERSION: u8 = 1;

    /// Returns `true` when `key` equals the stored authority.
    pub fn is_authority(&self, key: &Pubkey) -> bool {
        self.authority == *key
    }

    /// Returns `true` when `key` is either the cranker **or** the authority.
    pub fn is_cranker(&self, key: &Pubkey) -> bool {
        self.cranker == *key || self.authority == *key
    }

    /// Resolve the "current" price — manual override takes priority.
    /// Falls back to the cached aggregation with a staleness check.
    pub fn get_current_price(&self, current_timestamp: i64) -> Result<u64> {
        if self.manual_price_active {
            require!(self.manual_price > 0, OracleError::InvalidPrice);
            return Ok(self.manual_price);
        }

        require!(self.last_aggregated_price > 0, OracleError::InvalidPrice);

        let age = current_timestamp.saturating_sub(self.last_aggregated_timestamp);
        require!(
            age <= self.max_staleness_seconds,
            OracleError::AggregatedPriceStale
        );

        Ok(self.last_aggregated_price)
    }
}
