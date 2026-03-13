use crate::{
    errors::SssError,
    events::{AuthorityTransferCompleted, AuthorityTransferInitiated},
    state::{RolesConfig, StablecoinState},
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct TransferAuthority<'info> {
    pub caller: Signer<'info>,

    #[account(seeds = [b"stablecoin_state", stablecoin_state.mint.as_ref()], bump = stablecoin_state.bump)]
    pub stablecoin_state: Account<'info, StablecoinState>,

    #[account(
        mut,
        seeds = [b"roles_config", stablecoin_state.mint.as_ref()],
        bump = roles_config.bump,
    )]
    pub roles_config: Account<'info, RolesConfig>,
}

/// Two-step authority transfer with cancel support.
///
/// **Step 1 — Initiate:** Current master calls with `new_master = Some(pubkey)`.
///   Sets `pending_master`.
///
/// **Cancel:** Current master calls with `new_master = None`.
///   Clears `pending_master`.
///
/// **Step 2 — Accept:** Pending master calls (any `new_master` value).
///   Finalizes the transfer.
pub fn handler(ctx: Context<TransferAuthority>, new_master: Option<Pubkey>) -> Result<()> {
    let roles = &mut ctx.accounts.roles_config;
    let caller = ctx.accounts.caller.key();
    let mint = ctx.accounts.stablecoin_state.mint;
    let clock = Clock::get()?;

    if caller == roles.master_authority {
        match new_master {
            Some(proposed) => {
                // Step 1: Initiate transfer
                roles.pending_master = Some(proposed);
                emit!(AuthorityTransferInitiated {
                    mint,
                    current_master: caller,
                    pending_master: proposed,
                    timestamp: clock.unix_timestamp,
                });
            }
            None => {
                // Cancel: Clear pending transfer
                roles.pending_master = None;
                // Optionally emit a cancellation event here
            }
        }
    } else if roles.pending_master == Some(caller) {
        // Step 2: Accept
        roles.master_authority = caller;
        roles.pending_master = None;
        emit!(AuthorityTransferCompleted {
            mint,
            new_master: caller,
            timestamp: clock.unix_timestamp,
        });
    } else {
        return err!(SssError::NotPendingMaster);
    }

    Ok(())
}
