use anchor_lang::prelude::*;

pub const FEED_TYPE_SWITCHBOARD: u8 = 0;
pub const FEED_TYPE_PYTH: u8 = 1;
pub const FEED_TYPE_CHAINLINK: u8 = 2;
pub const FEED_TYPE_MANUAL: u8 = 3;
pub const FEED_TYPE_API: u8 = 4;

pub const MAX_FEED_LABEL_LEN: usize = 32;
pub const PRICE_FEED_SEED: &[u8] = b"price_feed";

#[account]
#[derive(InitSpace)]
pub struct PriceFeedEntry {
    pub oracle_config: Pubkey,
    pub feed_index: u8,
    /// Source type (see FEED_TYPE_* constants).
    pub feed_type: u8,
    /// On-chain feed address. Pubkey::default() for manual/API sources.
    pub feed_address: Pubkey,
    #[max_len(32)]
    pub label: String,
    /// Last price (9-decimal fixed point).
    pub last_price: u64,
    /// Last confidence interval (9-decimal fp).
    pub last_confidence: u64,
    pub last_timestamp: i64,
    /// Weight for weighted-mean aggregation (bps; 10 000 = 1.0×).
    pub weight: u16,
    pub enabled: bool,
    /// Per-feed staleness override. 0 → use global max_staleness_seconds.
    pub max_staleness_override: i64,
    pub bump: u8,
    pub reserved: [u8; 32],
}

impl PriceFeedEntry {
    pub fn is_stale(&self, current_timestamp: i64, global_max_staleness: i64) -> bool {
        let effective = if self.max_staleness_override > 0 {
            self.max_staleness_override
        } else {
            global_max_staleness
        };
        current_timestamp.saturating_sub(self.last_timestamp) > effective
    }
}
