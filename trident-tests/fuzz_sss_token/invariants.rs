use anchor_lang::prelude::Pubkey;
use sss_token::state::*;

/// Invariant checks for SSS token program
/// Based on INV-T6 through INV-T27 from original fuzz tests

// ═══════════════════════════════════════════════════════════
// State Snapshots
// ═══════════════════════════════════════════════════════════

#[derive(Debug, Clone)]
pub struct StateSnapshot {
    pub stablecoin_state: Option<StablecoinState>,
    pub minter_quota: Option<MinterQuota>,
    pub roles_config: Option<RolesConfig>,
    pub blacklist_entry: Option<BlacklistEntry>,
}

impl StateSnapshot {
    pub fn new() -> Self {
        Self {
            stablecoin_state: None,
            minter_quota: None,
            roles_config: None,
            blacklist_entry: None,
        }
    }
}

// ═══════════════════════════════════════════════════════════
// Mint Invariants (INV-T6 through INV-T10)
// ═══════════════════════════════════════════════════════════

pub fn check_mint_invariants(
    pre: &StateSnapshot,
    post: &StateSnapshot,
    amount: u64,
) -> Result<(), String> {
    // INV-T6: total_supply += amount
    if let (Some(pre_s), Some(post_s)) = (&pre.stablecoin_state, &post.stablecoin_state) {
        if post_s.total_supply != pre_s.total_supply + amount {
            return Err(format!(
                "INV-T6: total_supply must increase by minted amount. Expected {}, got {}",
                pre_s.total_supply + amount,
                post_s.total_supply
            ));
        }

        // INV-T7: mint blocked while paused
        if pre_s.paused {
            return Err("INV-T7: mint must not succeed while paused".to_string());
        }
    }

    // INV-T8, INV-T9, INV-T10: minter quota checks
    if let (Some(pre_q), Some(post_q)) = (&pre.minter_quota, &post.minter_quota) {
        // INV-T8: minted tracking
        if post_q.minted != pre_q.minted + amount {
            return Err(format!(
                "INV-T8: minted must increment by amount. Expected {}, got {}",
                pre_q.minted + amount,
                post_q.minted
            ));
        }

        // INV-T9: minted <= quota (when quota > 0)
        if post_q.quota > 0 && post_q.minted > post_q.quota {
            return Err(format!(
                "INV-T9: minted ({}) must never exceed quota ({})",
                post_q.minted, post_q.quota
            ));
        }

        // INV-T10: inactive minter cannot mint
        if !pre_q.active {
            return Err("INV-T10: inactive minter must not mint".to_string());
        }
    }

    Ok(())
}

// ═══════════════════════════════════════════════════════════
// Burn Invariants (INV-T11 through INV-T13)
// ═══════════════════════════════════════════════════════════

pub fn check_burn_invariants(
    pre: &StateSnapshot,
    post: &StateSnapshot,
    amount: u64,
) -> Result<(), String> {
    if let (Some(pre_s), Some(post_s)) = (&pre.stablecoin_state, &post.stablecoin_state) {
        // INV-T11: total_supply -= amount
        let expected = pre_s.total_supply.saturating_sub(amount);
        if post_s.total_supply != expected {
            return Err(format!(
                "INV-T11: total_supply must decrease by burned amount. Expected {}, got {}",
                expected, post_s.total_supply
            ));
        }

        // INV-T12: no underflow
        if post_s.total_supply > pre_s.total_supply {
            return Err("INV-T12: total_supply must not increase on burn".to_string());
        }

        // INV-T13: blocked while paused
        if pre_s.paused {
            return Err("INV-T13: burn must not succeed while paused".to_string());
        }
    }

    Ok(())
}

// ═══════════════════════════════════════════════════════════
// Pause Invariants (INV-T14 through INV-T15)
// ═══════════════════════════════════════════════════════════

pub fn check_pause_invariants(
    pre: &StateSnapshot,
    post: &StateSnapshot,
) -> Result<(), String> {
    if let Some(post_s) = &post.stablecoin_state {
        // INV-T14: paused = true after pause
        if !post_s.paused {
            return Err("INV-T14: paused must be true after pause".to_string());
        }
    }

    if let Some(pre_s) = &pre.stablecoin_state {
        // INV-T15: cannot double-pause
        if pre_s.paused {
            return Err("INV-T15: pause must not succeed when already paused".to_string());
        }
    }

    Ok(())
}

// ═══════════════════════════════════════════════════════════
// Unpause Invariants (INV-T16 through INV-T17)
// ═══════════════════════════════════════════════════════════

pub fn check_unpause_invariants(
    pre: &StateSnapshot,
    post: &StateSnapshot,
) -> Result<(), String> {
    if let Some(post_s) = &post.stablecoin_state {
        // INV-T16: paused = false after unpause
        if post_s.paused {
            return Err("INV-T16: paused must be false after unpause".to_string());
        }
    }

    if let Some(pre_s) = &pre.stablecoin_state {
        // INV-T17: cannot unpause when not paused
        if !pre_s.paused {
            return Err("INV-T17: unpause must not succeed when not paused".to_string());
        }
    }

    Ok(())
}

// ═══════════════════════════════════════════════════════════
// Add Minter Invariants (INV-T18 through INV-T20)
// ═══════════════════════════════════════════════════════════

pub fn check_add_minter_invariants(
    post: &StateSnapshot,
    quota: u64,
) -> Result<(), String> {
    if let Some(q) = &post.minter_quota {
        // INV-T18: minted starts at 0
        if q.minted != 0 {
            return Err(format!(
                "INV-T18: new minter starts with minted = 0, got {}",
                q.minted
            ));
        }

        // INV-T19: quota matches
        if q.quota != quota {
            return Err(format!(
                "INV-T19: quota must match requested. Expected {}, got {}",
                quota, q.quota
            ));
        }

        // INV-T20: active
        if !q.active {
            return Err("INV-T20: new minter must be active".to_string());
        }
    }

    Ok(())
}

// ═══════════════════════════════════════════════════════════
// Update Minter Invariants (INV-T21 through INV-T22)
// ═══════════════════════════════════════════════════════════

pub fn check_update_minter_invariants(
    pre: &StateSnapshot,
    post: &StateSnapshot,
    quota: u64,
    active: bool,
    reset_minted: bool,
) -> Result<(), String> {
    if let Some(post_q) = &post.minter_quota {
        if post_q.quota != quota {
            return Err(format!(
                "Quota mismatch. Expected {}, got {}",
                quota, post_q.quota
            ));
        }

        if post_q.active != active {
            return Err(format!(
                "Active flag mismatch. Expected {}, got {}",
                active, post_q.active
            ));
        }

        // INV-T21: minted = 0 after reset
        if reset_minted {
            if post_q.minted != 0 {
                return Err(format!(
                    "INV-T21: minted must be 0 after reset, got {}",
                    post_q.minted
                ));
            }
        }
        // INV-T22: minted unchanged when reset=false
        else if let Some(pre_q) = &pre.minter_quota {
            if post_q.minted != pre_q.minted {
                return Err(format!(
                    "INV-T22: minted unchanged when reset=false. Expected {}, got {}",
                    pre_q.minted, post_q.minted
                ));
            }
        }
    }

    Ok(())
}

// ═══════════════════════════════════════════════════════════
// Transfer Authority Invariants (INV-T23 through INV-T24)
// ═══════════════════════════════════════════════════════════

pub fn check_transfer_authority_invariants(
    pre: &StateSnapshot,
    post: &StateSnapshot,
) -> Result<(), String> {
    if let (Some(pre_r), Some(post_r)) = (&pre.roles_config, &post.roles_config) {
        // INV-T23: master never default
        if post_r.master_authority == Pubkey::default() {
            return Err("INV-T23: master_authority must never be default".to_string());
        }

        // INV-T24: completed transfer
        if pre_r.pending_master.is_some()
            && post_r.pending_master.is_none()
            && pre_r.master_authority != post_r.master_authority
        {
            if post_r.master_authority != pre_r.pending_master.unwrap() {
                return Err(format!(
                    "INV-T24: new master must be the pending master. Expected {:?}, got {:?}",
                    pre_r.pending_master.unwrap(),
                    post_r.master_authority
                ));
            }
        }
    }

    Ok(())
}

// ═══════════════════════════════════════════════════════════
// Blacklist Invariants (INV-T26 through INV-T27)
// ═══════════════════════════════════════════════════════════

pub fn check_blacklist_invariants(post: &StateSnapshot) -> Result<(), String> {
    if let Some(entry) = &post.blacklist_entry {
        // INV-T26: reason <= 128 bytes
        if entry.reason.len() > 128 {
            return Err(format!(
                "INV-T26: reason must be <= 128 bytes, got {}",
                entry.reason.len()
            ));
        }

        // INV-T27: timestamp set
        if entry.timestamp == 0 {
            return Err("INV-T27: blacklist timestamp must be set".to_string());
        }
    }

    Ok(())
}

// ═══════════════════════════════════════════════════════════
// Freeze/Thaw Invariants (INV-T25)
// ═══════════════════════════════════════════════════════════

pub fn check_freeze_invariants(pre: &StateSnapshot) -> Result<(), String> {
    if let Some(pre_s) = &pre.stablecoin_state {
        // INV-T25: freeze blocked while paused
        if pre_s.paused {
            return Err("INV-T25: freeze must not succeed while paused".to_string());
        }
    }

    Ok(())
}

pub fn check_thaw_invariants(pre: &StateSnapshot) -> Result<(), String> {
    if let Some(pre_s) = &pre.stablecoin_state {
        // Thaw also blocked while paused
        if pre_s.paused {
            return Err("Thaw must not succeed while paused".to_string());
        }
    }

    Ok(())
}
