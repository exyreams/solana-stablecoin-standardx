use crate::errors::HookError;
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount};

/// Transfer hook — called by Token-2022 on every transfer involving the associated mint.
///
/// Caller verification: this handler does not verify the caller is Token-2022.
/// It is safe because the handler is purely read-only — no state is modified,
/// so a direct call has no side effects beyond consuming compute.
///
/// Permanent delegate bypass: when the transfer authority (index 3) matches the
/// stablecoin_state PDA (index 8), this is a seize operation. Blacklist checks
/// are skipped because the operator may need to seize FROM a blacklisted account.
/// The seize instruction enforces its own role-based access control.
///
/// Blacklist detection: a wallet is blacklisted when its BlacklistEntry PDA has
/// `lamports > 0` AND is owned by the sss-token program. The ownership check
/// prevents a griefing attack where an adversary sends SOL to a closed blacklist
/// PDA address — after closure the PDA is owned by the system program, so the
/// check correctly identifies it as not blacklisted.
#[derive(Accounts)]
pub struct Execute<'info> {
    /// Source token account (index 0).
    pub source_token: Box<InterfaceAccount<'info, TokenAccount>>,
    /// Mint (index 1).
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    /// Destination token account (index 2).
    pub destination_token: Box<InterfaceAccount<'info, TokenAccount>>,
    /// Source token account authority — owner or delegate (index 3).
    /// Used to detect permanent delegate (seize) operations.
    /// CHECK: Passed by Token-2022 runtime.
    pub authority: UncheckedAccount<'info>,
    /// ExtraAccountMetaList PDA (index 4).
    /// CHECK: Validated by the Token-2022 runtime before calling this hook.
    pub extra_account_meta_list: UncheckedAccount<'info>,
    /// sss-token program (index 5, extra #0).
    /// Reference key for ownership checks on blacklist entries.
    /// CHECK: Resolved from the fixed pubkey stored in ExtraAccountMetaList.
    pub sss_token_program: UncheckedAccount<'info>,
    /// Blacklist entry PDA for the source wallet owner (index 6, extra #1).
    /// PDA of sss-token: ["blacklist", mint, source_owner].
    /// CHECK: We check lamports AND ownership — see module doc for rationale.
    pub source_blacklist_entry: UncheckedAccount<'info>,
    /// Blacklist entry PDA for the destination wallet owner (index 7, extra #2).
    /// PDA of sss-token: ["blacklist", mint, dest_owner].
    /// CHECK: We check lamports AND ownership — see module doc for rationale.
    pub destination_blacklist_entry: UncheckedAccount<'info>,
    /// stablecoin_state PDA (index 8, extra #3).
    /// If authority == stablecoin_state, blacklist checks are skipped (seize).
    /// CHECK: Resolved from ExtraAccountMetaList as external PDA of sss-token.
    pub stablecoin_state: UncheckedAccount<'info>,
}

/// Returns `true` when the blacklist PDA is a legitimate active entry:
/// account has lamports (exists) AND is owned by the sss-token program.
#[inline]
fn is_blacklisted(entry: &UncheckedAccount, sss_program_key: &Pubkey) -> bool {
    entry.lamports() > 0 && entry.owner == sss_program_key
}

pub fn execute_handler(ctx: Context<Execute>, _amount: u64) -> Result<()> {
    let authority_key = ctx.accounts.authority.key();
    let stablecoin_state_key = ctx.accounts.stablecoin_state.key();

    // Permanent delegate (seize) — skip blacklist checks.
    if authority_key == stablecoin_state_key {
        return Ok(());
    }

    let sss_program_key = ctx.accounts.sss_token_program.key();

    require!(
        !is_blacklisted(&ctx.accounts.source_blacklist_entry, &sss_program_key),
        HookError::SourceBlacklisted
    );

    require!(
        !is_blacklisted(&ctx.accounts.destination_blacklist_entry, &sss_program_key),
        HookError::DestinationBlacklisted
    );

    Ok(())
}
