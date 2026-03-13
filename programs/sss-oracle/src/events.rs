use anchor_lang::prelude::*;

// ── Lifecycle ───────────────────────────────────────────────
#[event]
pub struct OracleInitialized {
    pub oracle_config: Pubkey,
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub base_currency: String,
    pub quote_currency: String,
}

#[event]
pub struct OracleConfigUpdated {
    pub oracle_config: Pubkey,
    pub authority: Pubkey,
}

#[event]
pub struct OracleClosed {
    pub oracle_config: Pubkey,
    pub authority: Pubkey,
}

// ── Authority transfer ─────────────────────────────────────

#[event]
pub struct OracleAuthorityTransferInitiated {
    pub oracle_config: Pubkey,
    pub current_authority: Pubkey,
    pub pending_authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct OracleAuthorityTransferCompleted {
    pub oracle_config: Pubkey,
    pub new_authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct OracleAuthorityTransferCancelled {
    pub oracle_config: Pubkey,
    pub cancelled_by: Pubkey,
    pub was_pending: Pubkey,
    pub timestamp: i64,
}

// ── Pause ──────────────────────────────────────────────────

#[event]
pub struct OraclePauseStateChanged {
    pub oracle_config: Pubkey,
    pub paused: bool,
    pub authority: Pubkey,
    pub timestamp: i64,
}

// ── Feed management ────────────────────────────────────────
#[event]
pub struct FeedAdded {
    pub oracle_config: Pubkey,
    pub feed_entry: Pubkey,
    pub feed_index: u8,
    pub feed_type: u8,
    pub label: String,
}

#[event]
pub struct FeedRemoved {
    pub oracle_config: Pubkey,
    pub feed_index: u8,
}

#[event]
pub struct FeedCranked {
    pub oracle_config: Pubkey,
    pub feed_index: u8,
    pub price: u64,
    pub confidence: u64,
    pub timestamp: i64,
}

// ── Price ──────────────────────────────────────────────────
#[event]
pub struct ManualPriceSet {
    pub oracle_config: Pubkey,
    pub price: u64,
    pub active: bool,
}

#[event]
pub struct PriceAggregated {
    pub oracle_config: Pubkey,
    pub aggregated_price: u64,
    pub aggregated_confidence: u64,
    pub feeds_used: u8,
    pub timestamp: i64,
}

#[event]
pub struct MintPriceComputed {
    pub oracle_config: Pubkey,
    pub base_price: u64,
    pub mint_price: u64,
    pub premium_bps: i16,
}

#[event]
pub struct RedeemPriceComputed {
    pub oracle_config: Pubkey,
    pub base_price: u64,
    pub redeem_price: u64,
    pub discount_bps: i16,
}
