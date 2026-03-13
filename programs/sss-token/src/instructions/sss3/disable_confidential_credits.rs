use anchor_lang::{prelude::*, solana_program::program::invoke};
use anchor_spl::token_2022::Token2022;
use anchor_spl::token_interface::TokenAccount;
use spl_token_2022::extension::confidential_transfer;

use crate::{errors::SssError, events::ConfidentialCreditsDisabled, state::StablecoinState};

/// Disable confidential credits for a token account.
/// Prevents the account from receiving confidential transfers.
/// Must be called by the token account owner.
#[derive(Accounts)]
pub struct DisableConfidentialCredits<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        constraint = token_account.owner == owner.key() @ SssError::Unauthorized,
        constraint = token_account.mint == stablecoin_state.mint @ SssError::InvalidMint,
    )]
    pub token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        seeds = [b"stablecoin_state", stablecoin_state.mint.as_ref()],
        bump = stablecoin_state.bump,
        constraint = stablecoin_state.enable_confidential_transfers @ SssError::FeatureNotEnabled,
    )]
    pub stablecoin_state: Account<'info, StablecoinState>,

    pub token_program: Program<'info, Token2022>,
}

pub fn handler(ctx: Context<DisableConfidentialCredits>) -> Result<()> {
    let token_account_key = ctx.accounts.token_account.key();
    let owner_key = ctx.accounts.owner.key();
    let token_program_id = ctx.accounts.token_program.key();

    let ix = confidential_transfer::instruction::disable_confidential_credits(
        &token_program_id,
        &token_account_key,
        &owner_key,
        &[], // no multisig signers
    )?;

    invoke(
        &ix,
        &[
            ctx.accounts.token_account.to_account_info(),
            ctx.accounts.owner.to_account_info(),
        ],
    )?;

    let clock = Clock::get()?;
    emit!(ConfidentialCreditsDisabled {
        token_account: token_account_key,
        owner: owner_key,
        mint: ctx.accounts.stablecoin_state.mint,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
