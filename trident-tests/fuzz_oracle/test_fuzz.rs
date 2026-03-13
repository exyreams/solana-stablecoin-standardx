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

    /// Flow 1: Initialize oracle for EUR/USD
    #[flow]
    fn flow_initialize_oracle_eur_usd(&mut self) {
        let authority = self.fuzz_accounts.authority.insert(&mut self.trident, None);
        let mint = self.fuzz_accounts.mint.insert(&mut self.trident, None);
        let oracle_config = self.fuzz_accounts.oracle_config.insert(&mut self.trident, None);
        let cranker = self.fuzz_accounts.cranker.insert(&mut self.trident, None);

        let params = InitializeOracleParams::new(
            "EUR".to_string(),
            "USD".to_string(),
            300,
            100,
            0,
            1,
            50,
            500,
            10,
            10,
            cranker,
        );

        let accounts = sss_oracle::InitializeOracleInstructionAccounts {
            authority,
            mint,
            oracle_config,
        };

        let data = sss_oracle::InitializeOracleInstructionData::new(params);
        let ix = sss_oracle::InitializeOracleInstruction::data(data).accounts(accounts).instruction();
        
        let _ = self.trident.process_transaction(&[ix], None);
    }

    /// Flow 2: Add price feed
    #[flow]
    fn flow_add_feed(&mut self) {
        let authority = self.fuzz_accounts.authority.insert(&mut self.trident, None);
        let oracle_config = self.fuzz_accounts.oracle_config.insert(&mut self.trident, None);
        let price_feed_entry = self.fuzz_accounts.price_feed_entry.insert(&mut self.trident, None);

        let feed_address = Pubkey::new_unique();
        let params = AddFeedParams::new(
            0,
            0,
            feed_address,
            "Pyth EUR/USD".to_string(),
            100,
            300,
        );

        let accounts = sss_oracle::AddFeedInstructionAccounts {
            authority,
            oracle_config,
            price_feed_entry,
        };

        let data = sss_oracle::AddFeedInstructionData::new(params);
        let ix = sss_oracle::AddFeedInstruction::data(data).accounts(accounts).instruction();
        
        let _ = self.trident.process_transaction(&[ix], None);
    }

    /// Flow 3: Crank feed
    #[flow]
    fn flow_crank_feed(&mut self) {
        let cranker = self.fuzz_accounts.cranker.insert(&mut self.trident, None);
        let oracle_config = self.fuzz_accounts.oracle_config.insert(&mut self.trident, None);
        let price_feed_entry = self.fuzz_accounts.price_feed_entry.insert(&mut self.trident, None);

        let accounts = sss_oracle::CrankFeedInstructionAccounts {
            cranker,
            oracle_config,
            price_feed_entry,
        };

        let data = sss_oracle::CrankFeedInstructionData::new(1_100_000_000, 1_000_000);
        let ix = sss_oracle::CrankFeedInstruction::data(data).accounts(accounts).instruction();
        
        let _ = self.trident.process_transaction(&[ix], None);
    }

    /// Flow 4: Aggregate prices
    #[flow]
    fn flow_aggregate(&mut self) {
        let cranker = self.fuzz_accounts.cranker.insert(&mut self.trident, None);
        let oracle_config = self.fuzz_accounts.oracle_config.insert(&mut self.trident, None);

        let accounts = sss_oracle::AggregateInstructionAccounts {
            cranker,
            oracle_config,
        };

        let data = sss_oracle::AggregateInstructionData::new();
        let ix = sss_oracle::AggregateInstruction::data(data).accounts(accounts).instruction();
        
        let _ = self.trident.process_transaction(&[ix], None);
    }

    /// Flow 5: Get mint price
    #[flow]
    fn flow_get_mint_price(&mut self) {
        let oracle_config = self.fuzz_accounts.oracle_config.insert(&mut self.trident, None);

        let accounts = sss_oracle::GetMintPriceInstructionAccounts {
            oracle_config,
        };

        let data = sss_oracle::GetMintPriceInstructionData::new();
        let ix = sss_oracle::GetMintPriceInstruction::data(data).accounts(accounts).instruction();
        
        let _ = self.trident.process_transaction(&[ix], None);
    }

    /// Flow 6: Set manual price
    #[flow]
    fn flow_set_manual_price(&mut self) {
        let authority = self.fuzz_accounts.authority.insert(&mut self.trident, None);
        let oracle_config = self.fuzz_accounts.oracle_config.insert(&mut self.trident, None);

        let accounts = sss_oracle::SetManualPriceInstructionAccounts {
            authority,
            oracle_config,
        };

        let data = sss_oracle::SetManualPriceInstructionData::new(1_050_000_000, true);
        let ix = sss_oracle::SetManualPriceInstruction::data(data).accounts(accounts).instruction();
        
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
