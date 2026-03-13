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

    /// Flow 1: Initialize extra account meta list
    #[flow]
    fn flow_initialize(&mut self) {
        let payer = self.fuzz_accounts.payer.insert(&mut self.trident, None);
        let extra_account_meta_list = self.fuzz_accounts.extra_account_meta_list.insert(&mut self.trident, None);
        let mint = self.fuzz_accounts.mint.insert(&mut self.trident, None);
        let sss_token_program = self.fuzz_accounts.sss_token_program.insert(&mut self.trident, None);
        let roles_config = self.fuzz_accounts.roles_config.insert(&mut self.trident, None);

        let accounts = transfer_hook::InitializeExtraAccountMetaListInstructionAccounts {
            payer,
            extra_account_meta_list,
            mint,
            sss_token_program,
            roles_config,
        };

        let data = transfer_hook::InitializeExtraAccountMetaListInstructionData::new();
        let ix = transfer_hook::InitializeExtraAccountMetaListInstruction::data(data)
            .accounts(accounts)
            .instruction();
        
        let _ = self.trident.process_transaction(&[ix], None);
    }

    /// Flow 2: Execute transfer hook
    #[flow]
    fn flow_transfer_hook(&mut self) {
        let source_token = self.fuzz_accounts.source_token.insert(&mut self.trident, None);
        let mint = self.fuzz_accounts.mint.insert(&mut self.trident, None);
        let destination_token = self.fuzz_accounts.destination_token.insert(&mut self.trident, None);
        let authority = self.fuzz_accounts.authority.insert(&mut self.trident, None);
        let extra_account_meta_list = self.fuzz_accounts.extra_account_meta_list.insert(&mut self.trident, None);
        let sss_token_program = self.fuzz_accounts.sss_token_program.insert(&mut self.trident, None);
        let source_blacklist_entry = self.fuzz_accounts.source_blacklist_entry.insert(&mut self.trident, None);
        let destination_blacklist_entry = self.fuzz_accounts.destination_blacklist_entry.insert(&mut self.trident, None);
        let stablecoin_state = self.fuzz_accounts.stablecoin_state.insert(&mut self.trident, None);

        let accounts = transfer_hook::TransferHookInstructionAccounts {
            source_token,
            mint,
            destination_token,
            authority,
            extra_account_meta_list,
            sss_token_program,
            source_blacklist_entry,
            destination_blacklist_entry,
            stablecoin_state,
        };

        let data = transfer_hook::TransferHookInstructionData::new(1000);
        let ix = transfer_hook::TransferHookInstruction::data(data)
            .accounts(accounts)
            .instruction();
        
        let _ = self.trident.process_transaction(&[ix], None);
    }

    #[end]
    fn end(&mut self) {
        // Cleanup handled automatically
    }
}

fn main() {
    FuzzTest::fuzz(10000, 100); // 10,000 iterations per thread, 100 threads = 1M total
}
