use crate::errors::OracleError;
use crate::events::OracleInitialized;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeOracleParams {
    pub base_currency: String,
    pub quote_currency: String,
    pub max_staleness_seconds: i64,
    /// 0 = disabled
    pub max_confidence_interval_bps: u16,
    /// 0 = Median, 1 = Mean, 2 = Weighted Mean
    pub aggregation_method: u8,
    pub min_feeds_required: u8,
    /// 0 = disabled
    pub deviation_threshold_bps: u16,
    /// 0 = disabled
    pub max_price_change_bps: u16,
    pub mint_premium_bps: i16,
    pub redeem_discount_bps: i16,
    pub cranker: Pubkey,
}

#[derive(Accounts)]
#[instruction(params: InitializeOracleParams)]
pub struct InitializeOracle<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

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

pub fn handler(ctx: Context<InitializeOracle>, params: InitializeOracleParams) -> Result<()> {
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

    emit!(OracleInitialized {
        oracle_config: cfg.key(),
        authority: cfg.authority,
        mint: cfg.mint,
        base_currency: params.base_currency,
        quote_currency: params.quote_currency,
    });

    Ok(())
}
