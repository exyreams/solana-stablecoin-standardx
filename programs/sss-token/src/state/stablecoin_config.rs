use anchor_lang::prelude::*;

/// Central configuration stored on-chain for the stablecoin.
/// Initialized once; most fields are immutable after init (except paused/total_supply).
///
/// **Note on `total_supply`:** This field is synced with the actual `mint.supply`
/// after every mint/burn operation through this program.  If tokens are burned
/// directly via Token-2022 (bypassing this program), the value may be temporarily
/// stale until the next program-mediated mint or burn.  Use the `get_supply`
/// instruction (which reads directly from the mint account) for the canonical value.
#[account]
#[derive(Default)]
pub struct StablecoinState {
    /// Schema version for future state migrations.
    pub version: u8,
    /// The mint address this config governs.
    pub mint: Pubkey,
    /// Human-readable name (e.g. "My Stablecoin").
    pub name: String,
    /// Ticker symbol (e.g. "MYUSD").
    pub symbol: String,
    /// Number of decimal places.
    pub decimals: u8,
    /// Token-2022 metadata URI.
    pub uri: String,

    // ── SSS-2 feature flags (set at init, immutable after) ──────────────
    /// Whether the permanent delegate extension is enabled (SSS-2).
    pub enable_permanent_delegate: bool,
    /// Whether the transfer hook extension is enabled (SSS-2).
    pub enable_transfer_hook: bool,
    /// Whether newly created token accounts start frozen (SSS-2).
    pub default_account_frozen: bool,

    // ── SSS-3 feature flags (set at init, immutable after) ──────────────
    /// Whether confidential transfers are enabled (SSS-3).
    pub enable_confidential_transfers: bool,
    /// Whether new accounts are auto-approved for confidential transfers (SSS-3).
    pub confidential_transfer_auto_approve: bool,

    // ── Runtime state ────────────────────────────────────────────────────
    /// Whether minting/burning is paused globally.
    pub paused: bool,
    /// Total supply tracking — synced with `mint.supply` after every program
    /// mint/burn.  For the canonical value, read directly from the mint account.
    pub total_supply: u64,
    /// PDA bump.
    pub bump: u8,
}

impl StablecoinState {
    /// Current schema version.  Increment this when the account layout changes.
    pub const CURRENT_VERSION: u8 = 1;

    /// Account discriminator + fields.
    /// String fields: name (max 32), symbol (max 10), uri (max 200).
    pub const LEN: usize = 8   // discriminator
        + 1                    // version
        + 32                   // mint
        + 4 + 32               // name (len prefix + max 32 bytes)
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

    /// Check if this is an SSS-3 (privacy-enabled) stablecoin.
    pub fn is_sss3(&self) -> bool {
        self.enable_confidential_transfers
    }

    /// Check if this is an SSS-2 (compliance-enabled) stablecoin.
    pub fn is_sss2(&self) -> bool {
        self.enable_permanent_delegate && self.enable_transfer_hook
    }

    /// Check if this is a minimal SSS-1 stablecoin.
    pub fn is_sss1(&self) -> bool {
        !self.is_sss2() && !self.is_sss3()
    }
}
