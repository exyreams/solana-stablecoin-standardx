use anchor_lang::prelude::*;

#[error_code]
pub enum OracleError {
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Oracle is paused")]
    OraclePaused,
    #[msg("Caller is not the pending authority")]
    NotPendingAuthority,
    #[msg("Price feed is stale")]
    StalePriceFeed,
    #[msg("Confidence interval too wide")]
    ConfidenceTooWide,
    #[msg("Not enough valid feeds for aggregation")]
    InsufficientFeeds,
    #[msg("Feed deviation exceeds threshold")]
    ExcessiveDeviation,
    #[msg("Aggregated price is stale")]
    AggregatedPriceStale,
    #[msg("Price change exceeds circuit breaker limit")]
    PriceChangeExceedsLimit,
    #[msg("Maximum number of feeds reached")]
    MaxFeedsReached,
    #[msg("Feed index out of bounds")]
    FeedIndexOutOfBounds,
    #[msg("Feed already exists at this index")]
    FeedAlreadyExists,
    #[msg("Feed not enabled")]
    FeedNotEnabled,
    #[msg("Invalid feed account")]
    InvalidFeedAccount,
    #[msg("Oracle has active feeds — remove all before closing")]
    ActiveFeedsExist,
    #[msg("Feed count underflow — state may be corrupted")]
    FeedCountUnderflow,
    #[msg("Invalid price: must be greater than zero")]
    InvalidPrice,
    #[msg("Invalid aggregation method")]
    InvalidAggregationMethod,
    #[msg("Manual price not active")]
    ManualPriceNotActive,
    #[msg("Invalid parameter")]
    InvalidParameter,
    #[msg("Currency label too long (max 8 bytes)")]
    CurrencyLabelTooLong,
    #[msg("Feed label too long (max 32 bytes)")]
    FeedLabelTooLong,
    #[msg("Math overflow")]
    MathOverflow,
}
