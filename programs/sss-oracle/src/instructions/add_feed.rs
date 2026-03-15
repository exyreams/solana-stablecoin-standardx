use crate::errors::OracleError;
use crate::events::FeedAdded;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct AddFeedParams {
    /// Index in 0..MAX_FEEDS-1 — used as part of the PDA seed.
    pub feed_index: u8,
    /// Source type (see FEED_TYPE_* constants).
    pub feed_type: u8,
    /// On-chain feed address. Pubkey::default() for manual/API.
    pub feed_address: Pubkey,
    pub label: String,
    /// Weight for weighted-mean (bps; 10 000 = 1.0×).
    pub weight: u16,
    /// 0 → use global max_staleness_seconds.
    pub max_staleness_override: i64,
}

#[derive(Accounts)]
#[instruction(params: AddFeedParams)]
pub struct AddFeed<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority @ OracleError::Unauthorized,
    )]
    pub oracle_config: Account<'info, OracleConfig>,

    #[account(
        init,
        payer = authority,
        space = 8 + PriceFeedEntry::INIT_SPACE,
        seeds = [PRICE_FEED_SEED, oracle_config.key().as_ref(), &[params.feed_index]],
        bump,
    )]
    pub price_feed_entry: Account<'info, PriceFeedEntry>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<AddFeed>, params: AddFeedParams) -> Result<()> {
    let cfg = &mut ctx.accounts.oracle_config;

    require!(!cfg.paused, OracleError::OraclePaused);
    require!(
        params.feed_index < MAX_FEEDS,
        OracleError::FeedIndexOutOfBounds
    );
    require!(cfg.feed_count < MAX_FEEDS, OracleError::MaxFeedsReached);
    require!(
        params.label.len() <= MAX_FEED_LABEL_LEN,
        OracleError::FeedLabelTooLong
    );
    require!(params.feed_type <= 4, OracleError::InvalidParameter);
    require!(params.weight > 0, OracleError::InvalidParameter);

    let feed = &mut ctx.accounts.price_feed_entry;
    feed.oracle_config = cfg.key();
    feed.feed_index = params.feed_index;
    feed.feed_type = params.feed_type;
    feed.feed_address = params.feed_address;
    feed.label = params.label.clone();
    feed.last_price = 0;
    feed.last_confidence = 0;
    feed.last_timestamp = 0;
    feed.weight = params.weight;
    feed.enabled = true;
    feed.max_staleness_override = params.max_staleness_override;
    feed.bump = ctx.bumps.price_feed_entry;
    feed.reserved = [0u8; 32];

    cfg.feed_count = cfg
        .feed_count
        .checked_add(1)
        .ok_or(OracleError::MathOverflow)?;

    emit!(FeedAdded {
        oracle_config: cfg.key(),
        feed_entry: feed.key(),
        feed_index: params.feed_index,
        feed_type: params.feed_type,
        label: params.label,
    });

    Ok(())
}
