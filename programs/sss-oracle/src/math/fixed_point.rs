use crate::errors::OracleError;
use anchor_lang::prelude::*;

/// 9-decimal fixed-point precision.
pub const PRECISION: u64 = 1_000_000_000;
/// Basis-point denominator: 10 000 = 100%.
pub const BPS_DENOMINATOR: u64 = 10_000;

/// `(a × b) / PRECISION`
pub fn fp_mul(a: u64, b: u64) -> Result<u64> {
    let r = (a as u128)
        .checked_mul(b as u128)
        .ok_or(OracleError::MathOverflow)?
        .checked_div(PRECISION as u128)
        .ok_or(OracleError::MathOverflow)?;
    require!(r <= u64::MAX as u128, OracleError::MathOverflow);
    Ok(r as u64)
}

/// `(a × PRECISION) / b`
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

/// `price × (10_000 + bps) / 10_000`
/// +50 bps → ×1.005 (premium), −30 bps → ×0.997 (discount).
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

/// `|a − b| × 10_000 / max(a, b)` expressed in basis points.
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

/// Returns `true` when `confidence / price ≤ max_bps`.
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
