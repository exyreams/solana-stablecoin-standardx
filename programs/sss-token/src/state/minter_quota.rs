use anchor_lang::prelude::*;

/// Per-minter quota account. One PDA per (mint, minter) pair.
/// Seeds: ["minter_quota", mint, minter_pubkey]
#[account]
#[derive(Default)]
pub struct MinterQuota {
    /// The mint this quota applies to.
    pub mint: Pubkey,
    /// The minter keypair this quota belongs to.
    pub minter: Pubkey,
    /// Maximum tokens this minter can mint in a rolling period.
    /// 0 = unlimited.
    pub quota: u64,
    /// Total amount minted so far (resets on update_minter call).
    pub minted: u64,
    /// Whether this minter is currently active.
    pub active: bool,
    /// PDA bump.
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
