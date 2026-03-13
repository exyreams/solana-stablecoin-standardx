use anchor_lang::prelude::*;

pub mod errors;
pub mod events;
pub mod instructions;
pub mod math;
pub mod state;

pub use instructions::*;

declare_id!("7nFqXZae9mzYP7LefmCe9C1V2zzPbrY3nLR9WVGorQee");

#[program]
pub mod sss_oracle {
    use super::*;

    /// ---------------------------------------------------------------
    /// 1) Initialize Oracle
    /// Creates an OracleConfig PDA for a stablecoin mint.
    /// Seeds: ["oracle_config", mint]
    /// ---------------------------------------------------------------
    pub fn initialize_oracle(
        ctx: Context<InitializeOracle>,
        params: InitializeOracleParams,
    ) -> Result<()> {
        instructions::initialize_oracle::handler(ctx, params)
    }

    /// ---------------------------------------------------------------
    /// 2) Update Oracle Config
    /// Modify staleness, confidence, aggregation, spreads, etc.
    /// Authority transfer is NOT available here — use
    /// `transfer_oracle_authority` instead.
    /// ---------------------------------------------------------------
    pub fn update_oracle_config(
        ctx: Context<UpdateOracleConfig>,
        params: UpdateOracleConfigParams,
    ) -> Result<()> {
        instructions::update_oracle_config::handler(ctx, params)
    }

    /// ---------------------------------------------------------------
    /// 3) Transfer Oracle Authority (two-step)
    /// Step 1: Current authority calls with Some(new_pubkey) to initiate.
    /// Cancel: Current authority calls with None to cancel.
    /// Step 2: Pending authority calls to accept.
    /// ---------------------------------------------------------------
    pub fn transfer_oracle_authority(
        ctx: Context<TransferOracleAuthority>,
        new_authority: Option<Pubkey>,
    ) -> Result<()> {
        instructions::transfer_oracle_authority::handler(ctx, new_authority)
    }

    /// ---------------------------------------------------------------
    /// 4) Add Feed
    /// Register a new PriceFeedEntry under the oracle.
    /// Seeds: ["price_feed", oracle_config, feed_index]
    /// ---------------------------------------------------------------
    pub fn add_feed(ctx: Context<AddFeed>, params: AddFeedParams) -> Result<()> {
        instructions::add_feed::handler(ctx, params)
    }

    /// ---------------------------------------------------------------
    /// 5) Remove Feed
    /// Close a PriceFeedEntry and reclaim rent.
    /// ---------------------------------------------------------------
    pub fn remove_feed(ctx: Context<RemoveFeed>, feed_index: u8) -> Result<()> {
        instructions::remove_feed::handler(ctx, feed_index)
    }

    /// ---------------------------------------------------------------
    /// 6) Crank Feed
    /// Push a new price observation to a specific feed entry.
    /// Called by the cranker or authority.
    /// Subject to circuit breaker if `max_price_change_bps > 0`.
    /// ---------------------------------------------------------------
    pub fn crank_feed(ctx: Context<CrankFeed>, price: u64, confidence: u64) -> Result<()> {
        instructions::crank_feed::handler(ctx, price, confidence)
    }

    /// ---------------------------------------------------------------
    /// 7) Set Manual Price
    /// Authority-only fallback override.  Works even while paused —
    /// allows preparing a known-good price before unpausing.
    /// ---------------------------------------------------------------
    pub fn set_manual_price(ctx: Context<SetManualPrice>, price: u64, active: bool) -> Result<()> {
        instructions::set_manual_price::handler(ctx, price, active)
    }

    /// ---------------------------------------------------------------
    /// 8) Get Mint Price
    /// Read aggregated price, apply mint premium, emit + return data.
    /// ---------------------------------------------------------------
    pub fn get_mint_price(ctx: Context<GetMintPrice>) -> Result<()> {
        instructions::get_mint_price::handler(ctx)
    }

    /// ---------------------------------------------------------------
    /// 9) Get Redeem Price
    /// Read aggregated price, apply redeem discount, emit + return data.
    /// ---------------------------------------------------------------
    pub fn get_redeem_price(ctx: Context<GetRedeemPrice>) -> Result<()> {
        instructions::get_redeem_price::handler(ctx)
    }

    /// ---------------------------------------------------------------
    /// 10) Aggregate
    /// Pull prices from all feed entries (remaining accounts),
    /// filter stale/invalid, aggregate, store result.
    /// Deviation check is skipped when `deviation_threshold_bps = 0`.
    /// ---------------------------------------------------------------
    pub fn aggregate(ctx: Context<Aggregate>) -> Result<()> {
        instructions::aggregate::handler(ctx)
    }

    /// ---------------------------------------------------------------
    /// 11) Close Oracle
    /// Close the OracleConfig account. All feeds must be removed first.
    /// ---------------------------------------------------------------
    pub fn close_oracle(ctx: Context<CloseOracle>) -> Result<()> {
        instructions::close_oracle::handler(ctx)
    }
}
