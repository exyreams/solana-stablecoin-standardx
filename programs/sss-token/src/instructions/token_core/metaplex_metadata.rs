use anchor_lang::prelude::*;
use mpl_token_metadata::{
    instructions::CreateV1CpiBuilder,
    types::{PrintSupply, TokenStandard},
};

use crate::{errors::SssError, state::StablecoinState};

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MetaplexMetadataConfig {
    pub name: String,
    pub symbol: String,
    pub uri: String,
}

#[derive(Accounts)]
pub struct MetaplexMetadata<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// The mint keypair must sign — Metaplex requirement for Token-2022 mints
    /// when the mint authority is a PDA.
    #[account(mut, signer)]
    pub mint: Signer<'info>,

    #[account(
        seeds = [b"stablecoin_state", mint.key().as_ref()],
        bump = stablecoin_state.bump,
    )]
    pub stablecoin_state: Account<'info, StablecoinState>,

    /// CHECK: Metaplex metadata account PDA, created by Metaplex program
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    /// CHECK: Metaplex Token Metadata program
    #[account(address = mpl_token_metadata::ID)]
    pub token_metadata_program: UncheckedAccount<'info>,

    /// CHECK: Sysvar Instructions account required by Metaplex CPI
    #[account(address = anchor_lang::solana_program::sysvar::instructions::ID)]
    pub sysvar_instructions: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<MetaplexMetadata>, config: MetaplexMetadataConfig) -> Result<()> {
    require!(config.name.len() <= 32, SssError::NameTooLong);
    require!(config.symbol.len() <= 10, SssError::SymbolTooLong);
    require!(config.uri.len() <= 200, SssError::UriTooLong);

    // Metaplex requires Token-2022 mints to NOT have MintCloseAuthority enabled.
    // If the mint was initialized with that extension, disable it before calling this.

    CreateV1CpiBuilder::new(&ctx.accounts.token_metadata_program.to_account_info())
        .metadata(&ctx.accounts.metadata.to_account_info())
        .mint(&ctx.accounts.mint.to_account_info(), true)
        .authority(&ctx.accounts.stablecoin_state.to_account_info())
        .payer(&ctx.accounts.authority.to_account_info())
        .update_authority(&ctx.accounts.stablecoin_state.to_account_info(), false)
        .sysvar_instructions(&ctx.accounts.sysvar_instructions.to_account_info())
        .system_program(&ctx.accounts.system_program.to_account_info())
        .name(config.name)
        .symbol(config.symbol)
        .uri(config.uri)
        .seller_fee_basis_points(0)
        .token_standard(TokenStandard::Fungible)
        .print_supply(PrintSupply::Zero)
        .is_mutable(true)
        .invoke_signed(&[&[
            b"stablecoin_state",
            ctx.accounts.mint.key().as_ref(),
            &[ctx.accounts.stablecoin_state.bump],
        ]])?;

    Ok(())
}
