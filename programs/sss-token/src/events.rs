use anchor_lang::prelude::*;

/// Emitted when a new stablecoin is initialized.
#[event]
pub struct StablecoinInitialized {
    pub mint: Pubkey,
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub enable_permanent_delegate: bool,
    pub enable_transfer_hook: bool,
    pub enable_confidential_transfers: bool,
    pub master_authority: Pubkey,
    pub timestamp: i64,
}

/// Emitted when on-mint Token-2022 metadata is written via initialize_metadata.
#[event]
pub struct MetadataInitialized {
    pub mint: Pubkey,
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub authority: Pubkey,
    pub timestamp: i64,
}

/// Emitted when tokens are minted.
#[event]
pub struct TokensMinted {
    pub mint: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub minter: Pubkey,
    pub timestamp: i64,
}

/// Emitted when tokens are burned.
#[event]
pub struct TokensBurned {
    pub mint: Pubkey,
    pub from: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

/// Emitted when a token account is frozen.
#[event]
pub struct AccountFrozen {
    pub mint: Pubkey,
    pub account: Pubkey,
    pub authority: Pubkey,
    pub timestamp: i64,
}

/// Emitted when a token account is thawed.
#[event]
pub struct AccountThawed {
    pub mint: Pubkey,
    pub account: Pubkey,
    pub authority: Pubkey,
    pub timestamp: i64,
}

/// Emitted when minting/burning is paused or unpaused.
#[event]
pub struct PauseStateChanged {
    pub mint: Pubkey,
    pub paused: bool,
    pub reason: Option<String>,
    pub authority: Pubkey,
    pub timestamp: i64,
}

/// Emitted when roles are updated.
#[event]
pub struct RolesUpdated {
    pub mint: Pubkey,
    pub updated_by: Pubkey,
    pub timestamp: i64,
}

/// Emitted when master authority transfer is initiated.
#[event]
pub struct AuthorityTransferInitiated {
    pub mint: Pubkey,
    pub current_master: Pubkey,
    pub pending_master: Pubkey,
    pub timestamp: i64,
}

/// Emitted when master authority transfer is accepted.
#[event]
pub struct AuthorityTransferCompleted {
    pub mint: Pubkey,
    pub new_master: Pubkey,
    pub timestamp: i64,
}

// ── Minter Lifecycle Events ──────────────────────────────────────────────────

/// Emitted when a new minter is added.
#[event]
pub struct MinterAdded {
    pub mint: Pubkey,
    pub minter: Pubkey,
    pub quota: u64,
    pub authority: Pubkey,
    pub timestamp: i64,
}

/// Emitted when a minter is removed.
#[event]
pub struct MinterRemoved {
    pub mint: Pubkey,
    pub minter: Pubkey,
    /// Total tokens minted by this minter before removal — useful for auditing.
    pub total_minted: u64,
    pub authority: Pubkey,
    pub timestamp: i64,
}

/// Emitted when a minter's configuration is updated.
#[event]
pub struct MinterUpdated {
    pub mint: Pubkey,
    pub minter: Pubkey,
    pub new_quota: u64,
    pub previous_quota: u64,
    pub minted_reset: bool,
    pub previous_minted: u64,
    pub active: bool,
    pub authority: Pubkey,
    pub timestamp: i64,
}

// ── SSS-2 Events ─────────────────────────────────────────────────────────────

/// Emitted when an address is added to the blacklist.
#[event]
pub struct AddedToBlacklist {
    pub mint: Pubkey,
    pub address: Pubkey,
    pub reason: String,
    pub blacklister: Pubkey,
    pub timestamp: i64,
}

/// Emitted when an address is removed from the blacklist.
#[event]
pub struct RemovedFromBlacklist {
    pub mint: Pubkey,
    pub address: Pubkey,
    pub blacklister: Pubkey,
    pub timestamp: i64,
}

/// Emitted when tokens are seized via permanent delegate.
#[event]
pub struct TokensSeized {
    pub mint: Pubkey,
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
    pub seizer: Pubkey,
    pub timestamp: i64,
}

// ── SSS-3 Events ─────────────────────────────────────────────────────────────

/// Emitted when an account is approved for confidential transfers.
#[event]
pub struct AccountApprovedForConfidentialTransfer {
    pub token_account: Pubkey,
    pub mint: Pubkey,
    pub authority: Pubkey,
    pub timestamp: i64,
}

/// Emitted when confidential credits are enabled for an account.
#[event]
pub struct ConfidentialCreditsEnabled {
    pub token_account: Pubkey,
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub timestamp: i64,
}

/// Emitted when confidential credits are disabled for an account.
#[event]
pub struct ConfidentialCreditsDisabled {
    pub token_account: Pubkey,
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub timestamp: i64,
}

// ── Mint Lifecycle ───────────────────────────────────────────────────────────

/// Emitted when a mint is permanently closed.
#[event]
pub struct MintClosed {
    pub mint: Pubkey,
    pub authority: Pubkey,
    pub timestamp: i64,
}
