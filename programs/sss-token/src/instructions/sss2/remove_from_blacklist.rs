use crate::{
    errors::SssError,
    events::RemovedFromBlacklist,
    state::{BlacklistEntry, RolesConfig, StablecoinState},
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct RemoveFromBlacklist<'info> {
    #[account(mut)]
    pub blacklister: Signer<'info>,

    #[account(seeds = [b"stablecoin_state", stablecoin_state.mint.as_ref()], bump = stablecoin_state.bump)]
    pub stablecoin_state: Account<'info, StablecoinState>,

    #[account(seeds = [b"roles_config", stablecoin_state.mint.as_ref()], bump = roles_config.bump)]
    pub roles_config: Account<'info, RolesConfig>,

    /// CHECK: the address being removed.
    pub target: UncheckedAccount<'info>,

    /// Close the blacklist entry PDA (rent returned to blacklister).
    #[account(
        mut,
        close = blacklister,
        seeds = [BlacklistEntry::SEED, stablecoin_state.mint.as_ref(), target.key().as_ref()],
        bump = blacklist_entry.bump,
    )]
    pub blacklist_entry: Account<'info, BlacklistEntry>,
}

pub fn handler(ctx: Context<RemoveFromBlacklist>) -> Result<()> {
    let state = &ctx.accounts.stablecoin_state;
    let roles = &ctx.accounts.roles_config;

    require!(state.enable_transfer_hook, SssError::ComplianceNotEnabled);
    require!(
        ctx.accounts.blacklister.key() == roles.blacklister
            || ctx.accounts.blacklister.key() == roles.master_authority,
        SssError::NotBlacklister
    );

    emit!(RemovedFromBlacklist {
        mint: state.mint,
        address: ctx.accounts.target.key(),
        blacklister: ctx.accounts.blacklister.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    // Account closed via `close = blacklister` constraint above.
    Ok(())
}
