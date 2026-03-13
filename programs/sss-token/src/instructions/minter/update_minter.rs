use crate::{
    events::MinterUpdated,
    state::{MinterQuota, RolesConfig, StablecoinState},
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UpdateMinter<'info> {
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"stablecoin_state", stablecoin_state.mint.as_ref()],
        bump = stablecoin_state.bump,
    )]
    pub stablecoin_state: Account<'info, StablecoinState>,

    #[account(
        seeds = [b"roles_config", stablecoin_state.mint.as_ref()],
        bump = roles_config.bump,
        constraint = roles_config.master_authority == authority.key(),
    )]
    pub roles_config: Account<'info, RolesConfig>,

    /// CHECK: The minter wallet whose quota is being updated.
    pub minter: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [MinterQuota::SEED, stablecoin_state.mint.as_ref(), minter.key().as_ref()],
        bump = minter_quota.bump,
    )]
    pub minter_quota: Account<'info, MinterQuota>,
}

pub fn handler(
    ctx: Context<UpdateMinter>,
    quota: u64,
    active: bool,
    reset_minted: bool,
) -> Result<()> {
    let q = &mut ctx.accounts.minter_quota;
    let previous_quota = q.quota;
    let previous_minted = q.minted;

    q.quota = quota;
    q.active = active;

    if reset_minted {
        q.minted = 0;
    }

    emit!(MinterUpdated {
        mint: ctx.accounts.stablecoin_state.mint,
        minter: ctx.accounts.minter.key(),
        new_quota: quota,
        previous_quota,
        minted_reset: reset_minted,
        previous_minted,
        active,
        authority: ctx.accounts.authority.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
