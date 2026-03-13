use anchor_lang::prelude::*;

#[error_code]
pub enum HookError {
    #[msg("Transfer blocked: source address is blacklisted")]
    SourceBlacklisted,
    #[msg("Transfer blocked: destination address is blacklisted")]
    DestinationBlacklisted,
    #[msg("Unauthorized: caller is not the stablecoin master authority")]
    InvalidAuthority,
}
