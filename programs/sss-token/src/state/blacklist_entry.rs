use anchor_lang::prelude::*;

/// One PDA per (mint, wallet) pair.
/// Existence of this account = the wallet is blacklisted.
/// Seeds: `["blacklist", mint, address]`
///
/// The transfer-hook program checks for the lamports of this PDA
/// on every transfer — zero lamports means not blacklisted.
#[account]
#[derive(Default)]
pub struct BlacklistEntry {
    /// The mint this entry belongs to.
    pub mint: Pubkey,
    /// The blacklisted wallet address.
    pub address: Pubkey,
    /// Human-readable reason (e.g. "OFAC SDN match"), max 128 bytes.
    pub reason: String,
    /// Unix timestamp when the entry was created.
    pub timestamp: i64,
    /// PDA bump seed.
    pub bump: u8,
}

impl BlacklistEntry {
    /// 8 discriminator + 32 mint + 32 address + (4 len + 128 reason) + 8 timestamp + 1 bump
    pub const LEN: usize = 8 + 32 + 32 + (4 + 128) + 8 + 1;
    pub const SEED: &'static [u8] = b"blacklist";
}
