use crate::{
    errors::SssError,
    events::MinterAdded,
    state::{MinterQuota, RolesConfig, StablecoinState},
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct AddMinter<'info> {
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

    /// CHECK: the minter being added.
    pub minter: UncheckedAccount<'info>,

    /// Minter quota PDA — created here.
    #[account(
        init,
        payer = authority,
        space = MinterQuota::LEN,
        seeds = [MinterQuota::SEED, stablecoin_state.mint.as_ref(), minter.key().as_ref()],
        bump,
    )]
    pub minter_quota: Account<'info, MinterQuota>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<AddMinter>, quota: u64) -> Result<()> {
    require!(
        ctx.accounts.authority.key() == ctx.accounts.roles_config.master_authority,
        SssError::Unauthorized
    );

    let mint = ctx.accounts.stablecoin_state.mint;
    let minter_key = ctx.accounts.minter.key();

    let q = &mut ctx.accounts.minter_quota;
    q.mint = mint;
    q.minter = minter_key;
    q.quota = quota;
    q.minted = 0;
    q.active = true;
    q.bump = ctx.bumps.minter_quota;

    emit!(MinterAdded {
        mint,
        minter: minter_key,
        quota,
        authority: ctx.accounts.authority.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
