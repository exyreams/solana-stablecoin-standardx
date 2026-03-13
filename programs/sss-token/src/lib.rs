use anchor_lang::prelude::*;

pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

pub use instructions::*;

pub use instructions::{
    account::{freeze_account::FreezeAccount, thaw_account::ThawAccount},
    admin::{
        pause::Pause, transfer_authority::TransferAuthority, unpause::Unpause,
        update_roles::UpdateRoles,
    },
    minter::{add_minter::AddMinter, remove_minter::RemoveMinter, update_minter::UpdateMinter},
    sss2::{
        add_to_blacklist::AddToBlacklist, remove_from_blacklist::RemoveFromBlacklist, seize::Seize,
    },
    sss3::{
        approve_account::ApproveAccount, disable_confidential_credits::DisableConfidentialCredits,
        enable_confidential_credits::EnableConfidentialCredits,
    },
    token_core::{
        burn::Burn, close_mint::CloseMint, get_supply::GetSupply, initialize::Initialize,
        metaplex_metadata::MetaplexMetadata, mint::MintTokens,
    },
};

declare_id!("GQp6UgyhLZP6zXRf24JH2BiwuoSAfYZruJ3WUPkqgj8X");

#[program]
pub mod sss_token {
    use super::*;

    // ── Core ─────────────────────────────────────────────────────────────────

    pub fn initialize(ctx: Context<Initialize>, config: StablecoinConfig) -> Result<()> {
        instructions::token_core::initialize::handler(ctx, config)
    }

    /// Create Metaplex Token Metadata for wallet and explorer compatibility.
    ///
    /// Must be called in a **separate transaction** after `initialize`.
    /// This creates a Metaplex metadata PDA that wallets like Phantom can read.
    ///
    /// **IMPORTANT:** The mint keypair must sign this transaction. Call this
    /// immediately after `initialize` before discarding the mint keypair.
    ///
    /// **NOTE:** The mint must be initialized WITHOUT `enable_mint_close_authority`
    /// for Metaplex compatibility. Metaplex Token Metadata does not support
    /// Token-2022 mints with close authority.
    ///
    /// Can only be called once — Metaplex rejects duplicate metadata creation.
    pub fn metaplex_metadata(
        ctx: Context<MetaplexMetadata>,
        config: MetaplexMetadataConfig,
    ) -> Result<()> {
        instructions::token_core::metaplex_metadata::handler(ctx, config)
    }

    pub fn mint(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        instructions::token_core::mint::handler(ctx, amount)
    }

    pub fn burn(ctx: Context<Burn>, amount: u64) -> Result<()> {
        instructions::token_core::burn::handler(ctx, amount)
    }

    pub fn get_supply(ctx: Context<GetSupply>) -> Result<u64> {
        instructions::token_core::get_supply::handler(ctx)
    }

    pub fn close_mint(ctx: Context<CloseMint>) -> Result<()> {
        instructions::token_core::close_mint::handler(ctx)
    }

    // ── Account ───────────────────────────────────────────────────────────────

    pub fn freeze_account(ctx: Context<FreezeAccount>) -> Result<()> {
        instructions::account::freeze_account::handler(ctx)
    }

    pub fn thaw_account(ctx: Context<ThawAccount>) -> Result<()> {
        instructions::account::thaw_account::handler(ctx)
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    pub fn pause(ctx: Context<Pause>, reason: Option<String>) -> Result<()> {
        instructions::admin::pause::handler(ctx, reason)
    }

    pub fn unpause(ctx: Context<Unpause>) -> Result<()> {
        instructions::admin::unpause::handler(ctx)
    }

    pub fn update_roles(ctx: Context<UpdateRoles>, new_roles: RolesUpdate) -> Result<()> {
        instructions::admin::update_roles::handler(ctx, new_roles)
    }

    pub fn transfer_authority(
        ctx: Context<TransferAuthority>,
        new_master: Option<Pubkey>,
    ) -> Result<()> {
        instructions::admin::transfer_authority::handler(ctx, new_master)
    }

    // ── Minter ────────────────────────────────────────────────────────────────

    pub fn add_minter(ctx: Context<AddMinter>, quota: u64) -> Result<()> {
        instructions::minter::add_minter::handler(ctx, quota)
    }

    pub fn remove_minter(ctx: Context<RemoveMinter>) -> Result<()> {
        instructions::minter::remove_minter::handler(ctx)
    }

    pub fn update_minter(
        ctx: Context<UpdateMinter>,
        quota: u64,
        active: bool,
        reset_minted: bool,
    ) -> Result<()> {
        instructions::minter::update_minter::handler(ctx, quota, active, reset_minted)
    }

    // ── SSS-2 ─────────────────────────────────────────────────────────────────

    pub fn add_to_blacklist(ctx: Context<AddToBlacklist>, reason: String) -> Result<()> {
        instructions::sss2::add_to_blacklist::handler(ctx, reason)
    }

    pub fn remove_from_blacklist(ctx: Context<RemoveFromBlacklist>) -> Result<()> {
        instructions::sss2::remove_from_blacklist::handler(ctx)
    }

    pub fn seize<'info>(ctx: Context<'_, '_, '_, 'info, Seize<'info>>, amount: u64) -> Result<()> {
        instructions::sss2::seize::handler(ctx, amount)
    }

    // ── SSS-3 ─────────────────────────────────────────────────────────────────

    pub fn approve_account(ctx: Context<ApproveAccount>) -> Result<()> {
        instructions::sss3::approve_account::handler(ctx)
    }

    pub fn enable_confidential_credits(ctx: Context<EnableConfidentialCredits>) -> Result<()> {
        instructions::sss3::enable_confidential_credits::handler(ctx)
    }

    pub fn disable_confidential_credits(ctx: Context<DisableConfidentialCredits>) -> Result<()> {
        instructions::sss3::disable_confidential_credits::handler(ctx)
    }
}

pub use instructions::admin::update_roles::RolesUpdate;
pub use instructions::token_core::initialize::StablecoinConfig;
pub use instructions::token_core::metaplex_metadata::MetaplexMetadataConfig;
