use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::Token2022,
    // Alias SPL `ThawAccount` to avoid conflict with the Accounts struct of the same name.
    token_interface::{
        thaw_account as spl_thaw, Mint, ThawAccount as SplThawAccount, TokenAccount,
    },
};

use crate::{
    errors::SssError,
    events::AccountThawed,
    state::{RolesConfig, StablecoinState},
};

#[derive(Accounts)]
pub struct ThawAccount<'info> {
    pub authority: Signer<'info>,

    #[account(seeds = [b"stablecoin_state", mint.key().as_ref()], bump = stablecoin_state.bump)]
    pub stablecoin_state: Account<'info, StablecoinState>,

    #[account(seeds = [b"roles_config", mint.key().as_ref()], bump = roles_config.bump)]
    pub roles_config: Account<'info, RolesConfig>,

    #[account(mut)]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(mut, token::mint = mint)]
    pub target_account: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Program<'info, Token2022>,
}

pub fn handler(ctx: Context<ThawAccount>) -> Result<()> {
    let state = &ctx.accounts.stablecoin_state;
    let roles = &ctx.accounts.roles_config;

    require!(
        ctx.accounts.authority.key() == roles.master_authority
            || ctx.accounts.authority.key() == roles.pauser,
        SssError::Unauthorized
    );

    let mint_key = ctx.accounts.mint.key();
    let bump = state.bump;
    let signer_seeds: &[&[&[u8]]] = &[&[b"stablecoin_state", mint_key.as_ref(), &[bump]]];

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        SplThawAccount {
            account: ctx.accounts.target_account.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            authority: ctx.accounts.stablecoin_state.to_account_info(),
        },
        signer_seeds,
    );
    spl_thaw(cpi_ctx)?;

    emit!(AccountThawed {
        mint: ctx.accounts.mint.key(),
        account: ctx.accounts.target_account.key(),
        authority: ctx.accounts.authority.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
