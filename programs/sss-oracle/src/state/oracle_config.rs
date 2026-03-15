use crate::errors::OracleError;
use anchor_lang::prelude::*;

pub const MAX_FEEDS: u8 = 16;
pub const MAX_CURRENCY_LEN: usize = 8;

pub const AGG_MEDIAN: u8 = 0;
pub const AGG_MEAN: u8 = 1;
pub const AGG_WEIGHTED_MEAN: u8 = 2;

pub const ORACLE_CONFIG_SEED: &[u8] = b"oracle_config";

#[account]
#[derive(InitSpace)]
pub struct OracleConfig {
    pub version: u8,
    pub authority: Pubkey,
    /// Pending new authority (two-step transfer pattern).
    pub pending_authority: Option<Pubkey>,
    /// Secondary signer allowed to crank feeds and run aggregation.
    pub cranker: Pubkey,
    pub mint: Pubkey,
    #[max_len(8)]
    pub base_currency: String,
    #[max_len(8)]
    pub quote_currency: String,
    pub max_staleness_seconds: i64,
    /// 0 = disabled (all confidence values accepted).
    pub max_confidence_interval_bps: u16,
    /// 0 = Median · 1 = Mean · 2 = Weighted Mean
    pub aggregation_method: u8,
    pub min_feeds_required: u8,
    /// 0 = disabled.
    pub deviation_threshold_bps: u16,
    /// Max single-crank price change (bps). 0 = disabled.
    /// Recommended: 1000 (10%) for stable pairs, 3000 (30%) for volatile.
    pub max_price_change_bps: u16,
    /// Basis-point premium added to the mint price. Can be negative.
    pub mint_premium_bps: i16,
    /// Basis-point discount subtracted from the redeem price. Can be negative.
    pub redeem_discount_bps: i16,
    pub manual_price: u64,
    /// When true, manual_price overrides feed aggregation.
    pub manual_price_active: bool,
    /// Last successfully aggregated price (9-decimal fp).
    /// Also updated by set_manual_price when active, so raw-state readers
    /// see the effective price. After deactivating manual mode, call
    /// aggregate to refresh from live feeds.
    pub last_aggregated_price: u64,
    pub last_aggregated_confidence: u64,
    pub last_aggregated_timestamp: i64,
    pub feed_count: u8,
    /// Blocks cranks, aggregation, and price reads when true.
    /// Authority can still update config, set manual price, transfer
    /// authority, and close the oracle while paused.
    pub paused: bool,
    pub bump: u8,
    pub reserved: [u8; 32],
}

impl OracleConfig {
    pub const CURRENT_VERSION: u8 = 1;

    pub fn is_authority(&self, key: &Pubkey) -> bool {
        self.authority == *key
    }

    pub fn is_cranker(&self, key: &Pubkey) -> bool {
        self.cranker == *key || self.authority == *key
    }

    /// Manual override takes priority; falls back to cached aggregation with staleness check.
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
