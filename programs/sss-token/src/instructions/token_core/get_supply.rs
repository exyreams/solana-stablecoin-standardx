use anchor_lang::prelude::*;
use anchor_spl::token_interface::Mint;

use crate::{errors::SssError, state::StablecoinState};

#[derive(Accounts)]
pub struct GetSupply<'info> {
    #[account(
        seeds = [b"stablecoin_state", stablecoin_state.mint.as_ref()],
        bump = stablecoin_state.bump,
    )]
    pub stablecoin_state: Account<'info, StablecoinState>,

    /// The mint account — supply is read directly from on-chain data
    /// rather than the program-tracked counter, ensuring accuracy even
    /// if tokens were burned directly via Token-2022.
    #[account(
        constraint = mint.key() == stablecoin_state.mint @ SssError::InvalidMint,
    )]
    pub mint: InterfaceAccount<'info, Mint>,
}

/// Returns the current total supply by reading the actual mint account.
/// This is a view-only instruction that doesn't modify state.
pub fn handler(ctx: Context<GetSupply>) -> Result<u64> {
    Ok(ctx.accounts.mint.supply)
}
