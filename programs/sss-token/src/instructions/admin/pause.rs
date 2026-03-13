use crate::{
    errors::SssError,
    events::PauseStateChanged,
    state::{RolesConfig, StablecoinState},
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Pause<'info> {
    pub pauser: Signer<'info>,

    #[account(
        mut,
        seeds = [b"stablecoin_state", stablecoin_state.mint.as_ref()],
        bump = stablecoin_state.bump,
    )]
    pub stablecoin_state: Account<'info, StablecoinState>,

    #[account(seeds = [b"roles_config", stablecoin_state.mint.as_ref()], bump = roles_config.bump)]
    pub roles_config: Account<'info, RolesConfig>,
}

pub fn handler(ctx: Context<Pause>, reason: Option<String>) -> Result<()> {
    require!(
        ctx.accounts.pauser.key() == ctx.accounts.roles_config.pauser
            || ctx.accounts.pauser.key() == ctx.accounts.roles_config.master_authority,
        SssError::NotPauser
    );

    require!(
        !ctx.accounts.stablecoin_state.paused,
        SssError::AlreadyPaused
    );

    ctx.accounts.stablecoin_state.paused = true;

    emit!(PauseStateChanged {
        mint: ctx.accounts.stablecoin_state.mint,
        paused: true,
        reason,
        authority: ctx.accounts.pauser.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
