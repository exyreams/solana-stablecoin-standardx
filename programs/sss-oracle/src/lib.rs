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

    pub fn initialize_oracle(
        ctx: Context<InitializeOracle>,
        params: InitializeOracleParams,
    ) -> Result<()> {
        instructions::initialize_oracle::handler(ctx, params)
    }

    pub fn update_oracle_config(
        ctx: Context<UpdateOracleConfig>,
        params: UpdateOracleConfigParams,
    ) -> Result<()> {
        instructions::update_oracle_config::handler(ctx, params)
    }

    /// Two-step authority transfer. Step 1: current authority calls with Some(pubkey).
    /// Cancel: call with None. Step 2: pending authority calls to accept.
    pub fn transfer_oracle_authority(
        ctx: Context<TransferOracleAuthority>,
        new_authority: Option<Pubkey>,
    ) -> Result<()> {
        instructions::transfer_oracle_authority::handler(ctx, new_authority)
    }

    pub fn add_feed(ctx: Context<AddFeed>, params: AddFeedParams) -> Result<()> {
        instructions::add_feed::handler(ctx, params)
    }

    pub fn remove_feed(ctx: Context<RemoveFeed>, feed_index: u8) -> Result<()> {
        instructions::remove_feed::handler(ctx, feed_index)
    }

    /// Push a new price observation. Subject to circuit breaker if `max_price_change_bps > 0`.
    pub fn crank_feed(ctx: Context<CrankFeed>, price: u64, confidence: u64) -> Result<()> {
        instructions::crank_feed::handler(ctx, price, confidence)
    }

    /// Authority-only fallback override. Works even while paused.
    pub fn set_manual_price(ctx: Context<SetManualPrice>, price: u64, active: bool) -> Result<()> {
        instructions::set_manual_price::handler(ctx, price, active)
    }

    pub fn get_mint_price(ctx: Context<GetMintPrice>) -> Result<()> {
        instructions::get_mint_price::handler(ctx)
    }

    pub fn get_redeem_price(ctx: Context<GetRedeemPrice>) -> Result<()> {
        instructions::get_redeem_price::handler(ctx)
    }

    /// Pull prices from all feed entries (remaining accounts), filter stale/invalid, aggregate.
    pub fn aggregate(ctx: Context<Aggregate>) -> Result<()> {
        instructions::aggregate::handler(ctx)
    }

    /// Close the OracleConfig account. All feeds must be removed first.
    pub fn close_oracle(ctx: Context<CloseOracle>) -> Result<()> {
        instructions::close_oracle::handler(ctx)
    }
}
