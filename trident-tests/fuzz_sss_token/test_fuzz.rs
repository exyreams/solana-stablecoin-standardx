use fuzz_accounts::*;
use trident_fuzz::fuzzing::*;
mod fuzz_accounts;
mod types;
use types::*;

#[derive(FuzzTestMethods)]
struct FuzzTest {
    trident: Trident,
    fuzz_accounts: AccountAddresses,
}

#[flow_executor]
impl FuzzTest {
    fn new() -> Self {
        Self {
            trident: Trident::default(),
            fuzz_accounts: AccountAddresses::default(),
        }
    }

    #[init]
    fn start(&mut self) {
        // Accounts will be created on-demand in flows
    }

    /// Flow 1: Initialize SSS-1 (minimal) stablecoin
    #[flow]
    fn flow_initialize_sss1(&mut self) {
        let authority = self.fuzz_accounts.authority.insert(&mut self.trident, None);
        let mint = self.fuzz_accounts.mint.insert(&mut self.trident, None);
        let stablecoin_state = self.fuzz_accounts.stablecoin_state.insert(&mut self.trident, None);
        let roles_config = self.fuzz_accounts.roles_config.insert(&mut self.trident, None);

        let config = StablecoinConfig::new(
            "Minimal Stablecoin".to_string(),
            "MIN".to_string(),
            "https://example.com/minimal.json".to_string(),
            6,
            false, // enable_permanent_delegate
            false, // enable_transfer_hook
            false, // default_account_frozen
            None,  // transfer_hook_program_id
            false, // enable_confidential_transfers
            false, // confidential_transfer_auto_approve
            None,  // auditor_elgamal_pubkey
        );

        let accounts = sss_token::InitializeInstructionAccounts {
            authority,
            mint,
            stablecoin_state,
            roles_config,
        };

        let data = sss_token::InitializeInstructionData::new(config);
        let ix = sss_token::InitializeInstruction::data(data).accounts(accounts).instruction();
        
        let _ = self.trident.process_transaction(&[ix], None);
    }

    /// Flow 2: Mint tokens
    #[flow]
    fn flow_mint_tokens(&mut self) {
        let minter = self.fuzz_accounts.minter.insert(&mut self.trident, None);
        let stablecoin_state = self.fuzz_accounts.stablecoin_state.insert(&mut self.trident, None);
        let roles_config = self.fuzz_accounts.roles_config.insert(&mut self.trident, None);
        let minter_quota = self.fuzz_accounts.minter_quota.insert(&mut self.trident, None);
        let mint = self.fuzz_accounts.mint.insert(&mut self.trident, None);
        let recipient_token_account = self.fuzz_accounts.recipient_token_account.insert(&mut self.trident, None);

        let accounts = sss_token::MintInstructionAccounts {
            minter,
            stablecoin_state,
            roles_config,
            minter_quota,
            mint,
            recipient_token_account,
        };

        let data = sss_token::MintInstructionData::new(1000);
        let ix = sss_token::MintInstruction::data(data).accounts(accounts).instruction();
        
        let _ = self.trident.process_transaction(&[ix], None);
    }

    /// Flow 3: Burn tokens
    #[flow]
    fn flow_burn_tokens(&mut self) {
        let burner = self.fuzz_accounts.burner.insert(&mut self.trident, None);
        let stablecoin_state = self.fuzz_accounts.stablecoin_state.insert(&mut self.trident, None);
        let roles_config = self.fuzz_accounts.roles_config.insert(&mut self.trident, None);
        let mint = self.fuzz_accounts.mint.insert(&mut self.trident, None);
        let from_token_account = self.fuzz_accounts.source_token.insert(&mut self.trident, None);

        let accounts = sss_token::BurnInstructionAccounts {
            burner,
            stablecoin_state,
            roles_config,
            mint,
            from_token_account,
        };

        let data = sss_token::BurnInstructionData::new(500);
        let ix = sss_token::BurnInstruction::data(data).accounts(accounts).instruction();
        
        let _ = self.trident.process_transaction(&[ix], None);
    }

    /// Flow 4: Pause stablecoin
    #[flow]
    fn flow_pause(&mut self) {
        let pauser = self.fuzz_accounts.pauser.insert(&mut self.trident, None);
        let stablecoin_state = self.fuzz_accounts.stablecoin_state.insert(&mut self.trident, None);
        let roles_config = self.fuzz_accounts.roles_config.insert(&mut self.trident, None);

        let accounts = sss_token::PauseInstructionAccounts {
            pauser,
            stablecoin_state,
            roles_config,
        };

        let data = sss_token::PauseInstructionData::new(Some("Emergency pause".to_string()));
        let ix = sss_token::PauseInstruction::data(data).accounts(accounts).instruction();
        
        let _ = self.trident.process_transaction(&[ix], None);
    }

    /// Flow 5: Unpause stablecoin
    #[flow]
    fn flow_unpause(&mut self) {
        let pauser = self.fuzz_accounts.pauser.insert(&mut self.trident, None);
        let stablecoin_state = self.fuzz_accounts.stablecoin_state.insert(&mut self.trident, None);
        let roles_config = self.fuzz_accounts.roles_config.insert(&mut self.trident, None);

        let accounts = sss_token::UnpauseInstructionAccounts {
            pauser,
            stablecoin_state,
            roles_config,
        };

        let data = sss_token::UnpauseInstructionData::new();
        let ix = sss_token::UnpauseInstruction::data(data).accounts(accounts).instruction();
        
        let _ = self.trident.process_transaction(&[ix], None);
    }

    /// Flow 6: Add minter
    #[flow]
    fn flow_add_minter(&mut self) {
        let authority = self.fuzz_accounts.authority.insert(&mut self.trident, None);
        let stablecoin_state = self.fuzz_accounts.stablecoin_state.insert(&mut self.trident, None);
        let roles_config = self.fuzz_accounts.roles_config.insert(&mut self.trident, None);
        let minter = self.fuzz_accounts.minter.insert(&mut self.trident, None);
        let minter_quota = self.fuzz_accounts.minter_quota.insert(&mut self.trident, None);

        let accounts = sss_token::AddMinterInstructionAccounts {
            authority,
            stablecoin_state,
            roles_config,
            minter,
            minter_quota,
        };

        let data = sss_token::AddMinterInstructionData::new(1_000_000);
        let ix = sss_token::AddMinterInstruction::data(data).accounts(accounts).instruction();
        
        let _ = self.trident.process_transaction(&[ix], None);
    }

    /// Flow 7: Add to blacklist (SSS-2)
    #[flow]
    fn flow_add_to_blacklist(&mut self) {
        let blacklister = self.fuzz_accounts.blacklister.insert(&mut self.trident, None);
        let stablecoin_state = self.fuzz_accounts.stablecoin_state.insert(&mut self.trident, None);
        let roles_config = self.fuzz_accounts.roles_config.insert(&mut self.trident, None);
        let target = self.fuzz_accounts.target.insert(&mut self.trident, None);
        let blacklist_entry = self.fuzz_accounts.source_blacklist_entry.insert(&mut self.trident, None);

        let accounts = sss_token::AddToBlacklistInstructionAccounts {
            blacklister,
            stablecoin_state,
            roles_config,
            target,
            blacklist_entry,
        };

        let data = sss_token::AddToBlacklistInstructionData::new("Suspicious activity".to_string());
        let ix = sss_token::AddToBlacklistInstruction::data(data).accounts(accounts).instruction();
        
        let _ = self.trident.process_transaction(&[ix], None);
    }

    /// Flow 8: Freeze account
    #[flow]
    fn flow_freeze_account(&mut self) {
        let authority = self.fuzz_accounts.authority.insert(&mut self.trident, None);
        let stablecoin_state = self.fuzz_accounts.stablecoin_state.insert(&mut self.trident, None);
        let roles_config = self.fuzz_accounts.roles_config.insert(&mut self.trident, None);
        let mint = self.fuzz_accounts.mint.insert(&mut self.trident, None);
        let target_account = self.fuzz_accounts.source_token.insert(&mut self.trident, None);

        let accounts = sss_token::FreezeAccountInstructionAccounts {
            authority,
            stablecoin_state,
            roles_config,
            mint,
            target_account,
        };

        let data = sss_token::FreezeAccountInstructionData::new();
        let ix = sss_token::FreezeAccountInstruction::data(data).accounts(accounts).instruction();
        
        let _ = self.trident.process_transaction(&[ix], None);
    }
}

fn main() {
    FuzzTest::fuzz(10000, 100); // 10,000 iterations per thread, 100 threads = 1M total
}
