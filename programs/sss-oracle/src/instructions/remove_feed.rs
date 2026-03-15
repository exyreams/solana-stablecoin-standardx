use crate::errors::OracleError;
use crate::events::FeedRemoved;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(feed_index: u8)]
pub struct RemoveFeed<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority @ OracleError::Unauthorized,
    )]
    pub oracle_config: Account<'info, OracleConfig>,

    #[account(
        mut,
        close = authority,
        seeds = [PRICE_FEED_SEED, oracle_config.key().as_ref(), &[feed_index]],
        bump = price_feed_entry.bump,
        constraint = price_feed_entry.oracle_config == oracle_config.key()
            @ OracleError::InvalidFeedAccount,
    )]
    pub price_feed_entry: Account<'info, PriceFeedEntry>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<RemoveFeed>, feed_index: u8) -> Result<()> {
    let cfg = &mut ctx.accounts.oracle_config;
    cfg.feed_count = cfg
        .feed_count
        .checked_sub(1)
        .ok_or(OracleError::FeedCountUnderflow)?;

    emit!(FeedRemoved {
        oracle_config: cfg.key(),
        feed_index,
    });

    Ok(())
}
