use crate::{
    errors::SssError,
    events::AddedToBlacklist,
    state::{BlacklistEntry, RolesConfig, StablecoinState},
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(reason: String)]
pub struct AddToBlacklist<'info> {
    #[account(mut)]
    pub blacklister: Signer<'info>,

    #[account(seeds = [b"stablecoin_state", stablecoin_state.mint.as_ref()], bump = stablecoin_state.bump)]
    pub stablecoin_state: Account<'info, StablecoinState>,

    #[account(seeds = [b"roles_config", stablecoin_state.mint.as_ref()], bump = roles_config.bump)]
    pub roles_config: Account<'info, RolesConfig>,

    /// CHECK: the address being blacklisted.
    pub target: UncheckedAccount<'info>,

    /// Blacklist entry PDA — created by this call.
    #[account(
        init,
        payer = blacklister,
        space = BlacklistEntry::LEN,
        seeds = [BlacklistEntry::SEED, stablecoin_state.mint.as_ref(), target.key().as_ref()],
        bump,
    )]
    pub blacklist_entry: Account<'info, BlacklistEntry>,

    pub system_program: Program<'info, System>,
}

/// Truncate a string to fit within `max_bytes` without splitting a
/// multi-byte UTF-8 character.  The original code used `.chars().take(128)`
/// which counts *characters*, not bytes — a 128-character string of 4-byte
/// emoji would be 512 bytes and exceed the 128-byte allocation.
fn truncate_to_bytes(s: &str, max_bytes: usize) -> String {
    if s.len() <= max_bytes {
        return s.to_string();
    }
    // Walk character boundaries until adding the next char would exceed the limit.
    let mut end = 0;
    for c in s.chars() {
        let next = end + c.len_utf8();
        if next > max_bytes {
            break;
        }
        end = next;
    }
    s[..end].to_string()
}

pub fn handler(ctx: Context<AddToBlacklist>, reason: String) -> Result<()> {
    let state = &ctx.accounts.stablecoin_state;
    let roles = &ctx.accounts.roles_config;

    require!(state.enable_transfer_hook, SssError::ComplianceNotEnabled);
    require!(
        ctx.accounts.blacklister.key() == roles.blacklister
            || ctx.accounts.blacklister.key() == roles.master_authority,
        SssError::NotBlacklister
    );

    let clock = Clock::get()?;
    let entry = &mut ctx.accounts.blacklist_entry;
    entry.mint = state.mint;
    entry.address = ctx.accounts.target.key();
    // Truncate by bytes (not characters) to guarantee the serialized
    // string fits within the 128-byte allocation in BlacklistEntry::LEN.
    entry.reason = truncate_to_bytes(&reason, 128);
    entry.timestamp = clock.unix_timestamp;
    entry.bump = ctx.bumps.blacklist_entry;

    emit!(AddedToBlacklist {
        mint: state.mint,
        address: ctx.accounts.target.key(),
        reason: entry.reason.clone(),
        blacklister: ctx.accounts.blacklister.key(),
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
