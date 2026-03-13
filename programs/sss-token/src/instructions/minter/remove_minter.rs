use crate::{
    errors::SssError,
    events::MinterRemoved,
    state::{MinterQuota, RolesConfig, StablecoinState},
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct RemoveMinter<'info> {
    /// Must be master authority.
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"stablecoin_state", stablecoin_state.mint.as_ref()],
        bump = stablecoin_state.bump,
    )]
    pub stablecoin_state: Account<'info, StablecoinState>,

    #[account(
        seeds = [b"roles_config", stablecoin_state.mint.as_ref()],
        bump = roles_config.bump,
    )]
    pub roles_config: Account<'info, RolesConfig>,

    /// CHECK: the minter being removed.
    pub minter: UncheckedAccount<'info>,

    /// Close the minter quota PDA (rent returned to authority).
    #[account(
        mut,
        close = authority,
        seeds = [MinterQuota::SEED, stablecoin_state.mint.as_ref(), minter.key().as_ref()],
        bump = minter_quota.bump,
    )]
    pub minter_quota: Account<'info, MinterQuota>,
}

pub fn handler(ctx: Context<RemoveMinter>) -> Result<()> {
    require!(
        ctx.accounts.authority.key() == ctx.accounts.roles_config.master_authority,
        SssError::Unauthorized
    );

    let mint = ctx.accounts.stablecoin_state.mint;
    let minter_key = ctx.accounts.minter.key();
    let total_minted = ctx.accounts.minter_quota.minted;

    emit!(MinterRemoved {
        mint,
        minter: minter_key,
        total_minted,
        authority: ctx.accounts.authority.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    // Account closed via `close = authority` constraint above.
    Ok(())
}
