# SSS-1: Minimal Stablecoin Standard

**Status:** Final
**Category:** Base Layer

---

## Summary

SSS-1 is the minimal viable stablecoin on Solana. It provides:

- Token-2022 mint with PDA-controlled `freeze_authority` and `mint_authority`
- On-chain metadata (name, symbol, URI) — immutable after initialization
- Role-based access control (master, burner, pauser)
- Per-minter quotas via individual PDA accounts
- Global pause / unpause
- Two-step authority transfer
- Permanent mint closure when supply reaches zero

SSS-1 is suitable for **internal tokens, DAO treasuries, and ecosystem settlement**. Compliance is **reactive** — operators can freeze accounts after the fact.

---

## Token-2022 Extensions Used

| Extension | Purpose | Authority | Notes |
|---|---|---|---|
| `MintCloseAuthority` | Allow closing the mint if supply is zero | PDA (`stablecoin_state`) | Optional (default: disabled for Metaplex compatibility) |

**Note on Metadata:** Token-2022 on-mint metadata extensions (`MetadataPointer`, `TokenMetadata`) have been replaced with Metaplex Token Metadata for better wallet and explorer compatibility. Metadata is stored in the `StablecoinState` PDA as the canonical source, and Metaplex metadata is used for display purposes.

All extension authorities are set to the `stablecoin_state` PDA. No external keypair retains privileged access to the mint after initialization.

---

## On-Chain Accounts

### `StablecoinState` PDA

Seeds: `["stablecoin_state", mint]`

This PDA serves as the mint authority and freeze authority for the Token-2022 mint. Optionally, it can also serve as the mint close authority (if enabled).

| Field | Type | Description |
|---|---|---|
| `version` | `u8` | Schema version (currently `1`) for future state migrations |
| `mint` | `Pubkey` | The mint address |
| `name` | `String` | Token name (max 32 bytes) |
| `symbol` | `String` | Token symbol (max 10 bytes) |
| `decimals` | `u8` | Decimal places |
| `uri` | `String` | Metadata URI (max 200 bytes) |
| `enable_mint_close_authority` | `bool` | Whether MintCloseAuthority extension is enabled (default: `false` for Metaplex compatibility) |
| `enable_permanent_delegate` | `bool` | `false` for SSS-1 |
| `enable_transfer_hook` | `bool` | `false` for SSS-1 |
| `default_account_frozen` | `bool` | `false` for SSS-1 |
| `enable_confidential_transfers` | `bool` | `false` for SSS-1 |
| `confidential_transfer_auto_approve` | `bool` | `false` for SSS-1 |
| `paused` | `bool` | Global pause flag |
| `total_supply` | `u64` | Synced with `mint.supply` after every program mint/burn |
| `bump` | `u8` | PDA bump seed |

**Note on `version`:** The version field enables future state migrations. When the account layout changes, `CURRENT_VERSION` is incremented and migration logic can distinguish old accounts from new ones.

**Note on `total_supply`:** This field is synced with the actual `mint.supply` after every mint/burn operation through this program. If tokens are burned directly via Token-2022 (bypassing this program), the value may be temporarily stale. The `get_supply` instruction reads directly from the mint account for the canonical value.

**Note on `enable_mint_close_authority`:** This field controls whether the MintCloseAuthority extension is enabled. It defaults to `false` because Metaplex Token Metadata is incompatible with MintCloseAuthority. If you need to close the mint later, set this to `true` during initialization, but you won't be able to use Metaplex metadata for wallet display.

### `RolesConfig` PDA

Seeds: `["roles_config", mint]`

| Role | Description |
|---|---|
| `master_authority` | Full control; can update all roles, add/remove minters |
| `pending_master` | Pending new master (two-step transfer pattern) |
| `burner` | Can call `burn` instruction |
| `pauser` | Can call `pause` / `unpause`, `freeze_account` / `thaw_account` |
| `blacklister` | SSS-2 only — set but unused in SSS-1 |
| `seizer` | SSS-2 only — set but unused in SSS-1 |

At initialization, all roles default to the deployer's keypair.

### `MinterQuota` PDA

Seeds: `["minter_quota", mint, minter_pubkey]`

One PDA per authorized minter. Created via `add_minter`, closed via `remove_minter`.

| Field | Type | Description |
|---|---|---|
| `mint` | `Pubkey` | The mint this quota applies to |
| `minter` | `Pubkey` | The minter's wallet address |
| `quota` | `u64` | Maximum tokens this minter can mint (`0` = unlimited) |
| `minted` | `u64` | Running total of tokens minted |
| `active` | `bool` | Whether this minter is currently active |
| `bump` | `u8` | PDA bump seed |

---

## Instructions

### Core Operations

| Instruction | Auth Required | Description |
|---|---|---|
| `initialize` | payer (becomes master) | Create mint + state + roles with config |
| `mint` | minter (via quota PDA) | Mint tokens to a recipient (quota checked, amount > 0) |
| `burn` | burner / master | Burn tokens from caller's token account (amount > 0) |
| `get_supply` | none | Returns canonical supply from mint account |
| `close_mint` | master | Permanently close mint + state + roles (supply must be zero) |

### Account Management

| Instruction | Auth Required | Description |
|---|---|---|
| `freeze_account` | master / pauser | Freeze a token account |
| `thaw_account` | master / pauser | Thaw a frozen token account |

### Admin Operations

| Instruction | Auth Required | Description |
|---|---|---|
| `pause` | pauser / master | Disable mint + burn globally (fails if already paused) |
| `unpause` | pauser / master | Re-enable mint + burn (fails if not paused) |
| `update_roles` | master | Change burner, pauser, blacklister, seizer assignments |
| `transfer_authority` | master → pending | Two-step master authority transfer |

### Minter Management

| Instruction | Auth Required | Description |
|---|---|---|
| `add_minter` | master | Create `MinterQuota` PDA for a new minter |
| `remove_minter` | master | Close `MinterQuota` PDA (reclaims rent) |
| `update_minter` | master | Set quota, active flag, optionally reset minted counter |

`update_minter` accepts three parameters: `quota: u64`, `active: bool`, `reset_minted: bool`. When `reset_minted` is `true`, the minter's accumulated `minted` counter resets to zero.

---

## Input Validation

All amount-based instructions enforce `amount > 0`:

| Instruction | Guard |
|---|---|
| `mint` | `ZeroAmount` if amount is 0 |
| `burn` | `ZeroAmount` if amount is 0 |

Pause and unpause are idempotency-protected:

| Instruction | Guard |
|---|---|
| `pause` | `AlreadyPaused` if already paused |
| `unpause` | `NotPaused` if not paused |

---

## Events

Every state-changing instruction emits an event for off-chain indexing.

| Event | Emitted By |
|---|---|
| `StablecoinInitialized` | `initialize` |
| `TokensMinted` | `mint` |
| `TokensBurned` | `burn` |
| `AccountFrozen` | `freeze_account` |
| `AccountThawed` | `thaw_account` |
| `PauseStateChanged` | `pause` / `unpause` |
| `RolesUpdated` | `update_roles` |
| `AuthorityTransferInitiated` | `transfer_authority` (step 1) |
| `AuthorityTransferCompleted` | `transfer_authority` (step 2) |
| `MinterAdded` | `add_minter` |
| `MinterRemoved` | `remove_minter` (includes `total_minted` for audit) |
| `MinterUpdated` | `update_minter` (includes previous/new quota, reset flag) |
| `MintClosed` | `close_mint` |

---

## Initialization Parameters

```rust
pub struct StablecoinConfig {
    pub name: String,                          // max 32 bytes
    pub symbol: String,                        // max 10 bytes
    pub uri: String,                           // max 200 bytes
    pub decimals: u8,
    pub enable_permanent_delegate: bool,       // false for SSS-1
    pub enable_transfer_hook: bool,            // false for SSS-1
    pub default_account_frozen: bool,          // false for SSS-1
    pub transfer_hook_program_id: Option<Pubkey>, // None for SSS-1
    pub enable_confidential_transfers: bool,   // false for SSS-1
    pub confidential_transfer_auto_approve: bool, // false for SSS-1
    pub auditor_elgamal_pubkey: Option<[u8; 32]>, // None for SSS-1
}
```

---

## Design Decisions

### PDA as Sole Authority

The `stablecoin_state` PDA is the mint authority, freeze authority, mint close authority, metadata pointer authority, and metadata update authority. After initialization, no EOA (externally owned account) retains any privileged access to the Token-2022 mint. All privileged operations go through the program's instruction handlers, which enforce role-based access control.

### Immutable Metadata

Token name, symbol, and URI cannot be changed after initialization. Metadata is stored in the `StablecoinState` PDA as the canonical source of truth. This ensures brand identity immutability for stablecoins.

### Wallet Display Compatibility

For tokens to display properly in wallets (Phantom, Solflare, etc.) and explorers (Solscan, Solana FM), you should initialize Metaplex Token Metadata after creating your stablecoin:

```typescript
const metadataPda = await stablecoin.initializeMetaplexMetadata(
  {
    name: "My Dollar",
    symbol: "MYDOL",
    uri: "https://arweave.net/metadata.json",
    sellerFeeBasisPoints: 0,
  },
  mintKeypair
);
```

>[!IMPORTANT]
> - The mint keypair must sign the Metaplex metadata transaction (Metaplex requirement for Token-2022 mints with PDA authority)
> - Metaplex metadata is incompatible with `MintCloseAuthority`. The default config has `enableMintCloseAuthority: false` for Metaplex compatibility
> - If you need mint close authority, set `enableMintCloseAuthority: true` during initialization, but you won't be able to use Metaplex metadata
> - Cost: ~0.002 SOL for Metaplex metadata account creation

See the [SDK documentation](./SDK.md#metaplex-metadata-wallet-display) for complete details.


### Supply Sync

Rather than maintaining an independent supply counter (which can desynchronize if tokens are burned directly via Token-2022), the program syncs `total_supply` from the actual `mint.supply` after every program-mediated mint or burn. The `get_supply` instruction reads directly from the mint account.

### Pause Scope

`pause` only blocks `mint` and `burn`. Freeze, thaw, and role management remain operational during a pause so operators can respond to incidents. Pause and unpause are idempotent — calling `pause` when already paused returns `AlreadyPaused`, and calling `unpause` when not paused returns `NotPaused`. This prevents duplicate events that would confuse off-chain indexers.

### Zero-Amount Guards

`mint` and `burn` reject zero-amount operations. This prevents event spam, wasted compute units, and misleading audit trails. The minter's `minted` counter is only incremented for actual token operations.

### State Versioning

`StablecoinState` includes a `version` field set to `CURRENT_VERSION` (currently `1`) at initialization. This enables future state migrations — new program versions can detect old accounts and apply migration logic without breaking existing deployments.

### Mint Closure

The `close_mint` instruction permanently destroys the mint, `stablecoin_state`, and `roles_config` accounts, reclaiming all rent to the master authority. This is irreversible and requires zero supply. Operators should remove all `MinterQuota` PDAs via `remove_minter` before closing, as orphaned quota PDAs will have their rent stuck permanently.

---

## Quick Start

```bash
sss-token init --preset sss-1 --name "My Dollar" --symbol "MYDOL" --decimals 6
```

```typescript
const stable = await SolanaStablecoin.create(connection, {
  preset: Presets.SSS_1,
  name: 'My Dollar',
  symbol: 'MYDOL',
  decimals: 6,
  authority: adminKeypair,
});
```