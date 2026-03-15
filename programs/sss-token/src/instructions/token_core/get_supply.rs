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

    /// Supply is read directly from the mint account — accurate even if tokens
    /// were burned directly via Token-2022 outside this program.
    #[account(
        constraint = mint.key() == stablecoin_state.mint @ SssError::InvalidMint,
    )]
    pub mint: InterfaceAccount<'info, Mint>,
}

/// View-only instruction — returns the current total supply from the mint account.
pub fn handler(ctx: Context<GetSupply>) -> Result<u64> {
    Ok(ctx.accounts.mint.supply)
}
