use crate::{
    errors::OracleError,
    events::{
        OracleAuthorityTransferCancelled, OracleAuthorityTransferCompleted,
        OracleAuthorityTransferInitiated,
    },
    state::OracleConfig,
};
use anchor_lang::prelude::*;

// ── Accounts ───────────────────────────────────────────────

#[derive(Accounts)]
pub struct TransferOracleAuthority<'info> {
    pub caller: Signer<'info>,

    #[account(mut)]
    pub oracle_config: Account<'info, OracleConfig>,
}

/// Two-step authority transfer with cancel support.
///
/// **Step 1 — Initiate:** Current authority calls with `new_authority = Some(pubkey)`.
///   Sets `pending_authority`.
///
/// **Cancel:** Current authority calls with `new_authority = None`.
///   Clears `pending_authority`.
///
/// **Step 2 — Accept:** Pending authority calls (any `new_authority` value).
///   Finalizes the transfer.
pub fn handler(ctx: Context<TransferOracleAuthority>, new_authority: Option<Pubkey>) -> Result<()> {
    let cfg = &mut ctx.accounts.oracle_config;
    let caller = ctx.accounts.caller.key();
    let clock = Clock::get()?;

    if caller == cfg.authority {
        match new_authority {
            Some(proposed) => {
                // Step 1: Initiate transfer
                cfg.pending_authority = Some(proposed);
                emit!(OracleAuthorityTransferInitiated {
                    oracle_config: cfg.key(),
                    current_authority: caller,
                    pending_authority: proposed,
                    timestamp: clock.unix_timestamp,
                });
            }
            None => {
                // Cancel: Clear pending transfer
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
        // Step 2: Accept
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
