use crate::errors::OracleError;
use crate::events::OracleInitialized;
use crate::state::*;
use anchor_lang::prelude::*;

// ── Params ─────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeOracleParams {
    /// Base currency symbol, e.g. "EUR"
    pub base_currency: String,
    /// Quote currency symbol, e.g. "USD"
    pub quote_currency: String,
    /// Max feed age in seconds
    pub max_staleness_seconds: i64,
    /// Max confidence width (bps); 0 = disabled
    pub max_confidence_interval_bps: u16,
    /// 0 = Median, 1 = Mean, 2 = Weighted Mean
    pub aggregation_method: u8,
    /// Minimum valid feeds for aggregation
    pub min_feeds_required: u8,
    /// Maximum deviation between any two feeds (bps); 0 = disabled
    pub deviation_threshold_bps: u16,
    /// Max single-crank price change (bps); 0 = disabled
    pub max_price_change_bps: u16,
    /// Mint-side spread (bps, signed)
    pub mint_premium_bps: i16,
    /// Redeem-side spread (bps, signed)
    pub redeem_discount_bps: i16,
    /// Address allowed to crank feeds
    pub cranker: Pubkey,
}

// ── Accounts ───────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(params: InitializeOracleParams)]
pub struct InitializeOracle<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// The stablecoin mint.
    /// CHECK: stored as reference only; mint ownership is validated elsewhere.
    pub mint: UncheckedAccount<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + OracleConfig::INIT_SPACE,
        seeds = [ORACLE_CONFIG_SEED, mint.key().as_ref()],
        bump,
    )]
    pub oracle_config: Account<'info, OracleConfig>,

    pub system_program: Program<'info, System>,
}

// ── Handler ────────────────────────────────────────────────

pub fn handler(ctx: Context<InitializeOracle>, params: InitializeOracleParams) -> Result<()> {
    // ── Validate inputs ────────────────────────────────────
    require!(
        params.base_currency.len() <= MAX_CURRENCY_LEN,
        OracleError::CurrencyLabelTooLong
    );
    require!(
        params.quote_currency.len() <= MAX_CURRENCY_LEN,
        OracleError::CurrencyLabelTooLong
    );
    require!(
        params.max_staleness_seconds > 0,
        OracleError::InvalidParameter
    );
    require!(
        params.aggregation_method <= 2,
        OracleError::InvalidAggregationMethod
    );
    require!(params.min_feeds_required > 0, OracleError::InvalidParameter);

    // ── Populate account ───────────────────────────────────
    let cfg = &mut ctx.accounts.oracle_config;

    cfg.version = OracleConfig::CURRENT_VERSION;
    cfg.authority = ctx.accounts.authority.key();
    cfg.pending_authority = None;
    cfg.cranker = params.cranker;
    cfg.mint = ctx.accounts.mint.key();
    cfg.base_currency = params.base_currency.clone();
    cfg.quote_currency = params.quote_currency.clone();
    cfg.max_staleness_seconds = params.max_staleness_seconds;
    cfg.max_confidence_interval_bps = params.max_confidence_interval_bps;
    cfg.aggregation_method = params.aggregation_method;
    cfg.min_feeds_required = params.min_feeds_required;
    cfg.deviation_threshold_bps = params.deviation_threshold_bps;
    cfg.max_price_change_bps = params.max_price_change_bps;
    cfg.mint_premium_bps = params.mint_premium_bps;
    cfg.redeem_discount_bps = params.redeem_discount_bps;
    cfg.manual_price = 0;
    cfg.manual_price_active = false;
    cfg.last_aggregated_price = 0;
    cfg.last_aggregated_confidence = 0;
    cfg.last_aggregated_timestamp = 0;
    cfg.feed_count = 0;
    cfg.paused = false;
    cfg.bump = ctx.bumps.oracle_config;
    cfg.reserved = [0u8; 32];

    // ── Event ──────────────────────────────────────────────
    emit!(OracleInitialized {
        oracle_config: cfg.key(),
        authority: cfg.authority,
        mint: cfg.mint,
        base_currency: params.base_currency,
        quote_currency: params.quote_currency,
    });

    Ok(())
}
