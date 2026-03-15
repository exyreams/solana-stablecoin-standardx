use anchor_lang::prelude::*;

/// Role-based access control stored per stablecoin.
/// Only master_authority can update this account.
#[account]
#[derive(Default)]
pub struct RolesConfig {
    pub master_authority: Pubkey,
    /// Pending new master (two-step transfer pattern).
    pub pending_master: Option<Pubkey>,
    pub burner: Pubkey,
    pub pauser: Pubkey,
    /// SSS-2: can add/remove blacklist entries.
    pub blacklister: Pubkey,
    /// SSS-2: can call seize instruction.
    pub seizer: Pubkey,
    pub bump: u8,
}

impl RolesConfig {
    pub const LEN: usize = 8   // discriminator
        + 32                   // master_authority
        + 1 + 32               // pending_master (Option<Pubkey>)
        + 32                   // burner
        + 32                   // pauser
        + 32                   // blacklister
        + 32                   // seizer
        + 1; // bump
}
