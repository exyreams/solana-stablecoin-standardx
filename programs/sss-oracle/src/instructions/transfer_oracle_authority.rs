use crate::{
    errors::OracleError,
    events::{
        OracleAuthorityTransferCancelled, OracleAuthorityTransferCompleted,
        OracleAuthorityTransferInitiated,
    },
    state::OracleConfig,
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct TransferOracleAuthority<'info> {
    pub caller: Signer<'info>,

    #[account(mut)]
    pub oracle_config: Account<'info, OracleConfig>,
}

/// Two-step transfer. Step 1: current authority calls with Some(pubkey).
/// Cancel: current authority calls with None. Step 2: pending authority calls to accept.
pub fn handler(ctx: Context<TransferOracleAuthority>, new_authority: Option<Pubkey>) -> Result<()> {
    let cfg = &mut ctx.accounts.oracle_config;
    let caller = ctx.accounts.caller.key();
    let clock = Clock::get()?;

    if caller == cfg.authority {
        match new_authority {
            Some(proposed) => {
                cfg.pending_authority = Some(proposed);
                emit!(OracleAuthorityTransferInitiated {
                    oracle_config: cfg.key(),
                    current_authority: caller,
                    pending_authority: proposed,
                    timestamp: clock.unix_timestamp,
                });
            }
            None => {
                let was_pending = cfg.pending_authority;
                cfg.pending_authority = None;
                if let Some(was) = was_pending {
                    emit!(OracleAuthorityTransferCancelled {
                        oracle_config: cfg.key(),
                        cancelled_by: caller,
                        was_pending: was,
                        timestamp: clock.unix_timestamp,
                    });
                }
            }
        }
    } else if cfg.pending_authority == Some(caller) {
        cfg.authority = caller;
        cfg.pending_authority = None;
        emit!(OracleAuthorityTransferCompleted {
            oracle_config: cfg.key(),
            new_authority: caller,
            timestamp: clock.unix_timestamp,
        });
    } else {
        return err!(OracleError::NotPendingAuthority);
    }

    Ok(())
}
