use anchor_lang::prelude::*;

#[error_code]
pub enum SssError {
    // ── Auth ────────────────────────────────────────────────────────────────
    #[msg("Caller is not the master authority")]
    Unauthorized,
    #[msg("Caller is not the designated minter")]
    NotMinter,
    #[msg("Caller is not the designated burner")]
    NotBurner,
    #[msg("Caller is not the designated pauser")]
    NotPauser,
    #[msg("Caller is not the designated blacklister")]
    NotBlacklister,
    #[msg("Caller is not the designated seizer")]
    NotSeizer,

    // ── State ────────────────────────────────────────────────────────────────
    #[msg("Stablecoin is paused — minting and burning are disabled")]
    Paused,
    #[msg("Stablecoin is already paused")]
    AlreadyPaused,
    #[msg("Stablecoin is not paused")]
    NotPaused,
    #[msg("Minter is inactive")]
    MinterInactive,
    #[msg("Mint amount exceeds minter quota")]
    QuotaExceeded,
    #[msg("Pending master authority has not accepted")]
    NoPendingMaster,
    #[msg("Caller is not the pending master authority")]
    NotPendingMaster,

    // ── SSS-2 ────────────────────────────────────────────────────────────────
    #[msg("SSS-2 compliance module not enabled on this mint")]
    ComplianceNotEnabled,
    #[msg("Address is already on the blacklist")]
    AlreadyBlacklisted,
    #[msg("Address is not on the blacklist")]
    NotBlacklisted,
    #[msg("Target account is blacklisted and cannot receive transfers")]
    BlacklistedAccount,

    // ── SSS-3 ────────────────────────────────────────────────────────────────
    #[msg("Requested feature is not enabled on this mint")]
    FeatureNotEnabled,
    #[msg("Invalid ElGamal public key")]
    InvalidElGamalPubkey,

    // ── Validation ───────────────────────────────────────────────────────────
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Name too long — maximum 32 characters")]
    NameTooLong,
    #[msg("Symbol too long — maximum 10 characters")]
    SymbolTooLong,
    #[msg("URI too long — maximum 200 characters")]
    UriTooLong,
    #[msg("Cannot close mint: supply must be zero")]
    SupplyNotZero,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("transfer_hook_program_id is required when enable_transfer_hook = true")]
    MissingTransferHookProgram,
    #[msg("Invalid mint address")]
    InvalidMint,
}
