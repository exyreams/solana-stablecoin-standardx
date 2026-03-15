use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::Token2022,
    // Alias the SPL `Burn` struct to avoid conflict with the `Burn<'info>` Accounts struct.
    token_interface::{burn as spl_burn, Burn as SplBurn, Mint, TokenAccount},
};

use crate::{
    errors::SssError,
    events::TokensBurned,
    state::{RolesConfig, StablecoinState},
};

#[derive(Accounts)]
pub struct Burn<'info> {
    pub burner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"stablecoin_state", mint.key().as_ref()],
        bump = stablecoin_state.bump,
    )]
    pub stablecoin_state: Account<'info, StablecoinState>,

    #[account(
        seeds = [b"roles_config", mint.key().as_ref()],
        bump = roles_config.bump,
    )]
    pub roles_config: Account<'info, RolesConfig>,

    #[account(mut)]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(mut, token::mint = mint)]
    pub from_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Program<'info, Token2022>,
}

pub fn handler(ctx: Context<Burn>, amount: u64) -> Result<()> {
    require!(amount > 0, SssError::ZeroAmount);

    let state = &mut ctx.accounts.stablecoin_state;
    let roles = &ctx.accounts.roles_config;

    require!(!state.paused, SssError::Paused);
    require!(
        ctx.accounts.burner.key() == roles.burner
            || ctx.accounts.burner.key() == roles.master_authority,
        SssError::NotBurner
    );

    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        SplBurn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.from_token_account.to_account_info(),
            authority: ctx.accounts.burner.to_account_info(),
        },
    );
    spl_burn(cpi_ctx, amount)?;

    // Sync total_supply from the actual mint — stays accurate even if tokens
    // were previously burned directly via Token-2022 outside this program.
    ctx.accounts.mint.reload()?;
    state.total_supply = ctx.accounts.mint.supply;

    emit!(TokensBurned {
        mint: ctx.accounts.mint.key(),
        from: ctx.accounts.from_token_account.key(),
        amount,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
