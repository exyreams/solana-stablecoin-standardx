use crate::errors::OracleError;
use anchor_lang::prelude::*;

#[derive(Clone, Copy)]
pub struct FeedDataPoint {
    pub price: u64,
    pub confidence: u64,
    /// Weight in basis points (10 000 = 1.0×).
    pub weight: u16,
}

/// Median of a mutable slice (sorted in-place).
pub fn compute_median(prices: &mut [u64]) -> Result<u64> {
    require!(!prices.is_empty(), OracleError::InsufficientFeeds);
    prices.sort_unstable();
    let len = prices.len();
    if len % 2 == 0 {
        let mid = len / 2;
        let sum = (prices[mid - 1] as u128)
            .checked_add(prices[mid] as u128)
            .ok_or(OracleError::MathOverflow)?;
        Ok((sum / 2) as u64)
    } else {
        Ok(prices[len / 2])
    }
}

pub fn compute_mean(prices: &[u64]) -> Result<u64> {
    require!(!prices.is_empty(), OracleError::InsufficientFeeds);
    let mut sum: u128 = 0;
    for &p in prices {
        sum = sum
            .checked_add(p as u128)
            .ok_or(OracleError::MathOverflow)?;
    }
    Ok((sum / prices.len() as u128) as u64)
}

/// `Σ(price_i × weight_i) / Σ(weight_i)`
pub fn compute_weighted_mean(data: &[FeedDataPoint]) -> Result<u64> {
    require!(!data.is_empty(), OracleError::InsufficientFeeds);
    let mut weighted_sum: u128 = 0;
    let mut total_weight: u128 = 0;
    for d in data {
        let w = d.weight as u128;
        weighted_sum = weighted_sum
            .checked_add(
                (d.price as u128)
                    .checked_mul(w)
                    .ok_or(OracleError::MathOverflow)?,
            )
            .ok_or(OracleError::MathOverflow)?;
        total_weight = total_weight
            .checked_add(w)
            .ok_or(OracleError::MathOverflow)?;
    }
    require!(total_weight > 0, OracleError::InsufficientFeeds);
    Ok((weighted_sum / total_weight) as u64)
}

/// Root-mean-square of individual confidence values.
pub fn compute_aggregate_confidence(data: &[FeedDataPoint]) -> Result<u64> {
    if data.is_empty() {
        return Ok(0);
    }
    let mut sum_sq: u128 = 0;
    for d in data {
        let c = d.confidence as u128;
        sum_sq = sum_sq
            .checked_add(c.checked_mul(c).ok_or(OracleError::MathOverflow)?)
            .ok_or(OracleError::MathOverflow)?;
    }
    Ok(isqrt(sum_sq / data.len() as u128) as u64)
}

/// Returns `true` when every pair of prices is within `threshold_bps` of each other.
pub fn check_deviation(prices: &[u64], threshold_bps: u16) -> Result<bool> {
    if prices.len() <= 1 {
        return Ok(true);
    }
    let threshold = threshold_bps as u128;
    for i in 0..prices.len() {
        for j in (i + 1)..prices.len() {
            let a = prices[i] as u128;
            let b = prices[j] as u128;
            if a == 0 && b == 0 {
                continue;
            }
            let diff = if a > b { a - b } else { b - a };
            let max_val = core::cmp::max(a, b);
            if diff * 10_000 / max_val > threshold {
                return Ok(false);
            }
        }
    }
    Ok(true)
}

/// Integer square root via Newton's method.
fn isqrt(n: u128) -> u128 {
    if n == 0 {
        return 0;
    }
    let mut x = n;
    let mut y = (x + 1) / 2;
    while y < x {
        x = y;
        y = (x + n / x) / 2;
    }
    x
}
