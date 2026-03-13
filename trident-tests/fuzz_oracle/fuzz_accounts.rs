use trident_fuzz::fuzzing::*;

/// Storage for all account addresses used in fuzz testing.
#[derive(Default)]
#[allow(dead_code)]
pub struct AccountAddresses {
    pub authority: AddressStorage,
    pub mint: AddressStorage,
    pub oracle_config: AddressStorage,
    pub price_feed_entry: AddressStorage,
    pub cranker: AddressStorage,
    pub caller: AddressStorage,
}
