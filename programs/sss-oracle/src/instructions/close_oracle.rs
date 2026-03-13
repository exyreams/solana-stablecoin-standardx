use crate::errors::OracleError;
use crate::events::OracleClosed;
use crate::state::OracleConfig;
use anchor_lang::prelude::*;

// ── Accounts ───────────────────────────────────────────────

#[derive(Accounts)]
pub struct CloseOracle<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        close = authority,
        has_one = authority   @ OracleError::Unauthorized,
        constraint = oracle_config.feed_count == 0
            @ OracleError::ActiveFeedsExist,
    )]
    pub oracle_config: Account<'info, OracleConfig>,

    pub system_program: Program<'info, System>,
}

// ── Handler ────────────────────────────────────────────────

pub fn handler(ctx: Context<CloseOracle>) -> Result<()> {
    emit!(OracleClosed {
        oracle_config: ctx.accounts.oracle_config.key(),
        authority: ctx.accounts.authority.key(),
    });

    // The `close = authority` constraint handles lamport transfer.
    Ok(())
}
