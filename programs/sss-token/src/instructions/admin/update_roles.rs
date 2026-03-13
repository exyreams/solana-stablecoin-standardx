use crate::{
    errors::SssError,
    events::RolesUpdated,
    state::{RolesConfig, StablecoinState},
};
use anchor_lang::prelude::*;

/// Caller passes only the fields they want to change; None = keep existing.
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct RolesUpdate {
    pub burner: Option<Pubkey>,
    pub pauser: Option<Pubkey>,
    pub blacklister: Option<Pubkey>,
    pub seizer: Option<Pubkey>,
}

#[derive(Accounts)]
pub struct UpdateRoles<'info> {
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"stablecoin_state", stablecoin_state.mint.as_ref()],
        bump = stablecoin_state.bump,
    )]
    pub stablecoin_state: Account<'info, StablecoinState>,

    #[account(
        mut,
        seeds = [b"roles_config", stablecoin_state.mint.as_ref()],
        bump = roles_config.bump,
    )]
    pub roles_config: Account<'info, RolesConfig>,
}

pub fn handler(ctx: Context<UpdateRoles>, new_roles: RolesUpdate) -> Result<()> {
    require!(
        ctx.accounts.authority.key() == ctx.accounts.roles_config.master_authority,
        SssError::Unauthorized
    );

    let roles = &mut ctx.accounts.roles_config;

    if let Some(b) = new_roles.burner {
        roles.burner = b;
    }
    if let Some(p) = new_roles.pauser {
        roles.pauser = p;
    }
    if let Some(b) = new_roles.blacklister {
        roles.blacklister = b;
    }
    if let Some(s) = new_roles.seizer {
        roles.seizer = s;
    }

    emit!(RolesUpdated {
        mint: ctx.accounts.stablecoin_state.mint,
        updated_by: ctx.accounts.authority.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
