use anchor_lang::prelude::*;
use anchor_spl::token_2022::Token2022;
use anchor_spl::token_interface::Mint;

use crate::{
    errors::SssError,
    events::MintClosed,
    state::{RolesConfig, StablecoinState},
};

/// Permanently close the mint account and reclaim all rent.
///
/// Closes three accounts:
/// 1. The Token-2022 mint (via MintCloseAuthority CPI, signed by PDA)
/// 2. `stablecoin_state` PDA (via Anchor `close` constraint)
/// 3. `roles_config` PDA (via Anchor `close` constraint)
///
/// Prerequisites: total supply must be zero; all MinterQuota PDAs should be
/// removed first via `remove_minter` (orphaned quotas will be unusable with
/// rent stuck).
///
/// If the mint was initialized without MintCloseAuthority (for Metaplex
/// compatibility), this instruction will fail — the mint cannot be closed.
///
/// This is irreversible.
#[derive(Accounts)]
pub struct CloseMint<'info> {
    /// Must be master authority. Also receives all reclaimed rent.
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"stablecoin_state", mint.key().as_ref()],
        bump = stablecoin_state.bump,
        close = authority,
    )]
    pub stablecoin_state: Account<'info, StablecoinState>,

    #[account(
        mut,
        seeds = [b"roles_config", mint.key().as_ref()],
        bump = roles_config.bump,
        close = authority,
    )]
    pub roles_config: Account<'info, RolesConfig>,

    #[account(
        mut,
        constraint = mint.key() == stablecoin_state.mint @ SssError::InvalidMint,
        constraint = mint.supply == 0 @ SssError::SupplyNotZero,
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    pub token_program: Program<'info, Token2022>,
}

pub fn handler(ctx: Context<CloseMint>) -> Result<()> {
    let roles = &ctx.accounts.roles_config;

    require!(
        ctx.accounts.authority.key() == roles.master_authority,
        SssError::Unauthorized
    );

    let mint_key = ctx.accounts.mint.key();
    let authority_key = ctx.accounts.authority.key();
    let bump = ctx.accounts.stablecoin_state.bump;
    let signer_seeds: &[&[&[u8]]] = &[&[b"stablecoin_state", mint_key.as_ref(), &[bump]]];

    // stablecoin_state PDA is the MintCloseAuthority — signs via PDA seeds.
    let ix = spl_token_2022::instruction::close_account(
        &ctx.accounts.token_program.key(),
        &mint_key,
        &authority_key,
        &ctx.accounts.stablecoin_state.key(),
        &[],
    )?;

    anchor_lang::solana_program::program::invoke_signed(
        &ix,
        &[
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.stablecoin_state.to_account_info(),
        ],
        signer_seeds,
    )?;

    // Emit before Anchor closes the state accounts at end of instruction.
    emit!(MintClosed {
        mint: mint_key,
        authority: authority_key,
        timestamp: Clock::get()?.unix_timestamp,
    });

    // stablecoin_state and roles_config are closed via Anchor's `close = authority` constraint.
    Ok(())
}
