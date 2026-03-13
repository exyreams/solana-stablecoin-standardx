use crate::errors::HookError;
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount};

/// Transfer hook execution — called by Token-2022 on every transfer involving
/// the associated mint.
///
/// # Caller Verification
///
/// This handler does not explicitly verify that the caller is Token-2022.
/// Any account can invoke this instruction directly.  This is safe because
/// the handler is purely read-only: it checks whether blacklist PDAs exist
/// and either succeeds or returns an error.  No state is modified, so a
/// direct call has no side effects beyond consuming compute.
///
/// # Permanent Delegate Bypass
///
/// When the transfer authority (index 3) matches the stablecoin_state PDA
/// (index 8), this is a permanent delegate operation (seize).  Blacklist
/// checks are skipped because the operator may need to seize tokens FROM
/// a blacklisted account.  The seize instruction in the sss-token program
/// enforces its own role-based access control (seizer / master_authority).
///
/// # Blacklist Detection
///
/// A wallet is considered blacklisted when its BlacklistEntry PDA:
///   1. Has `lamports > 0` (account exists on-chain), **AND**
///   2. Is owned by the sss-token program (legitimate entry, not griefed).
///
/// This two-condition check prevents a griefing attack where an adversary
/// sends SOL to a closed blacklist PDA address.  After closure the PDA is
/// owned by the system program, so the ownership check correctly identifies
/// it as *not* blacklisted.
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

    /// The sss-token program (index 5, extra account #0).
    /// Needed so Token-2022 can derive blacklist PDAs owned by sss-token.
    /// Also used as the reference key for ownership checks on blacklist entries.
    /// CHECK: Resolved from the fixed pubkey stored in ExtraAccountMetaList.
    pub sss_token_program: UncheckedAccount<'info>,

    /// Blacklist entry PDA for the source wallet owner (index 6, extra account #1).
    /// Derived as PDA of sss-token: ["blacklist", mint, source_owner].
    /// CHECK: We check lamports AND ownership — see module doc for rationale.
    pub source_blacklist_entry: UncheckedAccount<'info>,

    /// Blacklist entry PDA for the destination wallet owner (index 7, extra account #2).
    /// Derived as PDA of sss-token: ["blacklist", mint, dest_owner].
    /// CHECK: We check lamports AND ownership — see module doc for rationale.
    pub destination_blacklist_entry: UncheckedAccount<'info>,

    /// The stablecoin_state PDA (index 8, extra account #3).
    /// Used to identify permanent delegate (seize) operations.
    /// If authority == stablecoin_state, blacklist checks are skipped.
    /// CHECK: Resolved from ExtraAccountMetaList as external PDA of sss-token.
    pub stablecoin_state: UncheckedAccount<'info>,
}

/// Returns `true` when the blacklist PDA represents a legitimate,
/// active blacklist entry:
///   - The account has lamports (it exists on-chain).
///   - The account is owned by the sss-token program (not the system program
///     or any other program that might hold lamports at this address).
#[inline]
fn is_blacklisted(entry: &UncheckedAccount, sss_program_key: &Pubkey) -> bool {
    entry.lamports() > 0 && entry.owner == sss_program_key
}

pub fn execute_handler(ctx: Context<Execute>, _amount: u64) -> Result<()> {
    let authority_key = ctx.accounts.authority.key();
    let stablecoin_state_key = ctx.accounts.stablecoin_state.key();

    // If the transfer authority is the stablecoin_state PDA, this is a
    // permanent delegate operation (seize).  Seizure must bypass blacklist
    // checks — the operator may need to seize FROM a blacklisted account.
    // The seize instruction already enforces its own role-based access
    // control (seizer / master_authority), so this is safe.
    if authority_key == stablecoin_state_key {
        return Ok(());
    }

    let sss_program_key = ctx.accounts.sss_token_program.key();

    // Check both lamports AND ownership to prevent griefing.
    // See module-level doc comment for full rationale.
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
