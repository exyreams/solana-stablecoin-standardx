use crate::errors::OracleError;
use anchor_lang::prelude::*;

// ── Constants ──────────────────────────────────────────────

/// 9-decimal fixed-point precision: 1.000 000 000
pub const PRECISION: u64 = 1_000_000_000;

/// Basis-point denominator: 10 000 = 100 %
pub const BPS_DENOMINATOR: u64 = 10_000;

// ── Arithmetic helpers ─────────────────────────────────────

/// Multiply two 9-decimal fixed-point values.
/// `result = (a × b) / PRECISION`
pub fn fp_mul(a: u64, b: u64) -> Result<u64> {
    let r = (a as u128)
        .checked_mul(b as u128)
        .ok_or(OracleError::MathOverflow)?
        .checked_div(PRECISION as u128)
        .ok_or(OracleError::MathOverflow)?;
    require!(r <= u64::MAX as u128, OracleError::MathOverflow);
    Ok(r as u64)
}

/// Divide two 9-decimal fixed-point values.
/// `result = (a × PRECISION) / b`
pub fn fp_div(a: u64, b: u64) -> Result<u64> {
    require!(b > 0, OracleError::MathOverflow);
    let r = (a as u128)
        .checked_mul(PRECISION as u128)
        .ok_or(OracleError::MathOverflow)?
        .checked_div(b as u128)
        .ok_or(OracleError::MathOverflow)?;
    require!(r <= u64::MAX as u128, OracleError::MathOverflow);
    Ok(r as u64)
}

/// Apply a signed basis-point adjustment.
///
/// `result = price × (10 000 + bps) / 10 000`
///
/// *  `+50` → price × 1.005   (half-percent premium)
/// *  `-30` → price × 0.997   (0.3 % discount)
pub fn apply_bps(price: u64, bps: i16) -> Result<u64> {
    let factor = (BPS_DENOMINATOR as i64)
        .checked_add(bps as i64)
        .ok_or(OracleError::MathOverflow)?;
    require!(factor >= 0, OracleError::InvalidParameter);

    let r = (price as u128)
        .checked_mul(factor as u128)
        .ok_or(OracleError::MathOverflow)?
        .checked_div(BPS_DENOMINATOR as u128)
        .ok_or(OracleError::MathOverflow)?;
    require!(r <= u64::MAX as u128, OracleError::MathOverflow);
    Ok(r as u64)
}

/// Deviation between two prices expressed in basis points.
///
/// `|a − b| × 10 000 / max(a, b)`
pub fn deviation_bps(a: u64, b: u64) -> Result<u16> {
    if a == 0 && b == 0 {
        return Ok(0);
    }
    let diff = if a > b { a - b } else { b - a };
    let max_val = core::cmp::max(a, b);

    let bps = (diff as u128)
        .checked_mul(BPS_DENOMINATOR as u128)
        .ok_or(OracleError::MathOverflow)?
        .checked_div(max_val as u128)
        .ok_or(OracleError::MathOverflow)?;

    Ok(if bps > u16::MAX as u128 {
        u16::MAX
    } else {
        bps as u16
    })
}

/// Returns `true` when the confidence / price ratio is ≤ `max_bps`.
pub fn confidence_within_range(price: u64, confidence: u64, max_bps: u16) -> Result<bool> {
    if price == 0 {
        return Ok(false);
    }
    let conf_bps = (confidence as u128)
        .checked_mul(BPS_DENOMINATOR as u128)
        .ok_or(OracleError::MathOverflow)?
        .checked_div(price as u128)
        .ok_or(OracleError::MathOverflow)?;
    Ok(conf_bps <= max_bps as u128)
}
