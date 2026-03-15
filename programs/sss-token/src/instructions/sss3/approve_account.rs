use anchor_lang::{prelude::*, solana_program::program::invoke_signed};
use anchor_spl::token_2022::Token2022;
use anchor_spl::token_interface::{Mint, TokenAccount};
use spl_token_2022::extension::confidential_transfer;

use crate::{
    errors::SssError,
    events::AccountApprovedForConfidentialTransfer,
    state::{RolesConfig, StablecoinState},
};

/// Approve a token account for confidential transfers.
/// The stablecoin_state PDA is the CT authority — it signs the CPI.
/// The master_authority triggers this instruction when auto_approve is disabled.
#[derive(Accounts)]
pub struct ApproveAccount<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        constraint = token_account.mint == stablecoin_state.mint @ SssError::InvalidMint,
    )]
    pub token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        seeds = [b"stablecoin_state", mint.key().as_ref()],
        bump = stablecoin_state.bump,
        constraint = stablecoin_state.mint == mint.key() @ SssError::InvalidMint,
        constraint = stablecoin_state.enable_confidential_transfers @ SssError::FeatureNotEnabled,
    )]
    pub stablecoin_state: Account<'info, StablecoinState>,

    #[account(
        seeds = [b"roles_config", mint.key().as_ref()],
        bump = roles_config.bump,
        constraint = roles_config.master_authority == authority.key() @ SssError::Unauthorized,
    )]
    pub roles_config: Account<'info, RolesConfig>,

    pub token_program: Program<'info, Token2022>,
}

pub fn handler(ctx: Context<ApproveAccount>) -> Result<()> {
    let token_account_key = ctx.accounts.token_account.key();
    let authority_key = ctx.accounts.authority.key();
    let mint_key = ctx.accounts.mint.key();
    let token_program_id = ctx.accounts.token_program.key();

    let bump = ctx.accounts.stablecoin_state.bump;
    let signer_seeds: &[&[&[u8]]] = &[&[b"stablecoin_state", mint_key.as_ref(), &[bump]]];

    let ix = confidential_transfer::instruction::approve_account(
        &token_program_id,
        &token_account_key,
        &mint_key,
        &ctx.accounts.stablecoin_state.key(),
        &[], // no multisig signers
    )?;

    invoke_signed(
        &ix,
        &[
            ctx.accounts.token_account.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.stablecoin_state.to_account_info(),
        ],
        signer_seeds,
    )?;

    emit!(AccountApprovedForConfidentialTransfer {
        token_account: token_account_key,
        mint: mint_key,
        authority: authority_key,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
