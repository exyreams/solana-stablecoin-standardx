//! Instruction handlers organized by category.
//!
//! ## Structure
//! - `core/` - Core SSS-1 operations (initialize, mint, burn, supply)
//! - `account/` - Account management (freeze, thaw)
//! - `admin/` - Administrative operations (pause, roles, authority transfer)
//! - `minter/` - Minter management (add, remove, update quotas)
//! - `sss2/` - SSS-2 compliance features (blacklist, seize)
//! - `sss3/` - SSS-3 privacy features (confidential transfers, allowlists)

#![allow(ambiguous_glob_reexports)]

pub mod account;
pub mod admin;
pub mod minter;
pub mod sss2;
pub mod sss3;
pub mod token_core;

pub use account::*;
pub use admin::*;
pub use minter::*;
pub use sss2::*;
pub use sss3::*;
pub use token_core::*;
