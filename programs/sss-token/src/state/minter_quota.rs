use anchor_lang::prelude::*;

/// Per-minter quota account. One PDA per (mint, minter) pair.
/// Seeds: ["minter_quota", mint, minter_pubkey]
#[account]
#[derive(Default)]
pub struct MinterQuota {
    pub mint: Pubkey,
    pub minter: Pubkey,
    /// Maximum tokens this minter can mint. 0 = unlimited.
    pub quota: u64,
    /// Running total minted (resets on update_minter call).
    pub minted: u64,
    pub active: bool,
    pub bump: u8,
}

impl MinterQuota {
    pub const LEN: usize = 8  // discriminator
        + 32                  // mint
        + 32                  // minter
        + 8                   // quota
        + 8                   // minted
        + 1                   // active
        + 1; // bump

    pub const SEED: &'static [u8] = b"minter_quota";
}
