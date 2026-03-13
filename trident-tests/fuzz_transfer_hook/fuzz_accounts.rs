use trident_fuzz::fuzzing::*;

/// Storage for all account addresses used in fuzz testing.
#[derive(Default)]
#[allow(dead_code)]
pub struct AccountAddresses {
    pub payer: AddressStorage,
    pub extra_account_meta_list: AddressStorage,
    pub mint: AddressStorage,
    pub sss_token_program: AddressStorage,
    pub roles_config: AddressStorage,
    pub source_token: AddressStorage,
    pub destination_token: AddressStorage,
    pub authority: AddressStorage,
    pub source_blacklist_entry: AddressStorage,
    pub destination_blacklist_entry: AddressStorage,
    pub stablecoin_state: AddressStorage,
}
