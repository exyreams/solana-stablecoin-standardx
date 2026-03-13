use anchor_lang::prelude::*;

// ── Feed type constants ────────────────────────────────────
pub const FEED_TYPE_SWITCHBOARD: u8 = 0;
pub const FEED_TYPE_PYTH: u8 = 1;
pub const FEED_TYPE_CHAINLINK: u8 = 2;
pub const FEED_TYPE_MANUAL: u8 = 3;
pub const FEED_TYPE_API: u8 = 4;

pub const MAX_FEED_LABEL_LEN: usize = 32;

/// PDA seed prefix
pub const PRICE_FEED_SEED: &[u8] = b"price_feed";

// ── Account ────────────────────────────────────────────────
#[account]
#[derive(InitSpace)]
pub struct PriceFeedEntry {
    /// Parent OracleConfig pubkey.
    pub oracle_config: Pubkey,

    /// Unique index inside this oracle (0 .. MAX_FEEDS-1).
    pub feed_index: u8,

    /// Source type (see `FEED_TYPE_*` constants).
    pub feed_type: u8,

    /// On-chain address of the external feed
    /// (Switchboard aggregator, Pyth price account, etc.).
    /// `Pubkey::default()` when the source is manual / off-chain API.
    pub feed_address: Pubkey,

    /// Human-readable label, e.g. "switchboard-eur-usd".
    #[max_len(32)]
    pub label: String,

    /// Last recorded price (9-decimal fixed point).
    pub last_price: u64,

    /// Last recorded confidence interval (9-decimal fp).
    pub last_confidence: u64,

    /// Unix timestamp of the last price update.
    pub last_timestamp: i64,

    /// Weight used in weighted-mean aggregation (bps; 10 000 = 1.0×).
    pub weight: u16,

    /// Admin can disable a feed without removing it.
    pub enabled: bool,

    /// Per-feed staleness override.  0 → use global `max_staleness_seconds`.
    pub max_staleness_override: i64,

    /// PDA bump.
    pub bump: u8,

    /// Reserved for future upgrades.
    pub reserved: [u8; 32],
}

impl PriceFeedEntry {
    /// Returns `true` when this feed's price is too old.
    pub fn is_stale(&self, current_timestamp: i64, global_max_staleness: i64) -> bool {
        let effective = if self.max_staleness_override > 0 {
            self.max_staleness_override
        } else {
            global_max_staleness
        };
        current_timestamp.saturating_sub(self.last_timestamp) > effective
    }
}
