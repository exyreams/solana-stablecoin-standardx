use anchor_lang::prelude::*;

/// Central configuration for the stablecoin.
/// Initialized once; most fields are immutable after init (except `paused` / `total_supply`).
///
/// `total_supply` is synced with `mint.supply` after every program-mediated mint/burn.
/// If tokens are burned directly via Token-2022 (bypassing this program), the value may
/// be stale until the next operation. Use the `get_supply` instruction for the canonical value.
#[account]
#[derive(Default)]
pub struct StablecoinState {
    pub version: u8,
    pub mint: Pubkey,
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub uri: String,
    // SSS-2 feature flags (set at init, immutable after)
    pub enable_permanent_delegate: bool,
    pub enable_transfer_hook: bool,
    pub default_account_frozen: bool,
    // SSS-3 feature flags (set at init, immutable after)
    pub enable_confidential_transfers: bool,
    pub confidential_transfer_auto_approve: bool,
    // Runtime state
    pub paused: bool,
    pub total_supply: u64,
    pub bump: u8,
}

impl StablecoinState {
    /// Increment when the account layout changes.
    pub const CURRENT_VERSION: u8 = 1;

    /// String fields: name (max 32), symbol (max 10), uri (max 200).
    pub const LEN: usize = 8   // discriminator
        + 1                    // version
        + 32                   // mint
        + 4 + 32               // name
        + 4 + 10               // symbol
        + 1                    // decimals
        + 4 + 200              // uri
        + 1                    // enable_permanent_delegate
        + 1                    // enable_transfer_hook
        + 1                    // default_account_frozen
        + 1                    // enable_confidential_transfers
        + 1                    // confidential_transfer_auto_approve
        + 1                    // paused
        + 8                    // total_supply
        + 1; // bump

    pub fn is_sss3(&self) -> bool {
        self.enable_confidential_transfers
    }

    pub fn is_sss2(&self) -> bool {
        self.enable_permanent_delegate && self.enable_transfer_hook
    }

    pub fn is_sss1(&self) -> bool {
        !self.is_sss2() && !self.is_sss3()
    }
}
