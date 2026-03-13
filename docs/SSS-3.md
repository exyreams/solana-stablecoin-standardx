# SSS-3: Private Stablecoin Standard

**Status:** Final
**Category:** Privacy Layer (extends SSS-1)

---

## Summary

SSS-3 adds **privacy-preserving confidential transfers** to the base stablecoin using Token-2022's `ConfidentialTransferMint` extension. Transfer amounts are encrypted with ElGamal encryption and validated with zero-knowledge proofs. An optional auditor can decrypt all confidential transfer amounts for regulatory compliance.

SSS-3 is a strict superset of SSS-1. All SSS-1 instructions and features are available plus the privacy module. SSS-3 can also be combined with SSS-2 compliance features by enabling both feature sets at initialization.

---

## Token-2022 Extensions Added (vs SSS-1)

| Extension | Purpose | Authority |
|---|---|---|
| `ConfidentialTransferMint` | Enables encrypted transfer amounts at the mint level | PDA (`stablecoin_state`) |

The confidential transfer authority is set to the `stablecoin_state` PDA, consistent with SSS-1. The PDA controls account approval when auto-approve is disabled.

---

## How It Works

1. At initialization, `enable_confidential_transfers = true` adds the `ConfidentialTransferMint` extension to the mint
2. The `stablecoin_state` PDA is registered as the confidential transfer authority
3. Token accounts must be **approved** for confidential transfers (either automatically or by the authority)
4. Account owners **enable confidential credits** on their token accounts to receive encrypted transfers
5. Clients generate zero-knowledge proofs client-side and submit confidential transfers via Token-2022

---

## Configuration at Initialization

Confidential transfer parameters are set during `initialize` via `StablecoinConfig`. There is no separate configuration instruction — all settings are fixed at mint creation.

| Config Field | Type | Description |
|---|---|---|
| `enable_confidential_transfers` | `bool` | Enables the `ConfidentialTransferMint` extension |
| `confidential_transfer_auto_approve` | `bool` | If `true`, new accounts are automatically approved for confidential transfers |
| `auditor_elgamal_pubkey` | `Option<[u8; 32]>` | Optional auditor ElGamal public key — if set, the auditor can decrypt all confidential transfer amounts |

These fields are stored in `StablecoinState` and are **immutable after initialization**.

---

## Instructions (SSS-3 only)

### `approve_account`

Approves a token account for confidential transfers. Required when `confidential_transfer_auto_approve = false`.

| Field | Detail |
|---|---|
| **Auth** | `master_authority` (triggers the instruction) |
| **CPI Signer** | `stablecoin_state` PDA (confidential transfer authority) |
| **Guard** | `enable_confidential_transfers` must be `true` |

The master authority calls this instruction, and the PDA signs the CPI to Token-2022's `confidential_transfer::approve_account`.

### `enable_confidential_credits`

Allows a token account to **receive** confidential transfers.

| Field | Detail |
|---|---|
| **Auth** | Token account owner |
| **Guard** | `enable_confidential_transfers` must be `true` |
| **Guard** | Caller must be the token account owner |

### `disable_confidential_credits`

Prevents a token account from **receiving** confidential transfers.

| Field | Detail |
|---|---|
| **Auth** | Token account owner |
| **Guard** | `enable_confidential_transfers` must be `true` |
| **Guard** | Caller must be the token account owner |

---

## Instruction Summary Table

| Instruction | Auth Required | Description |
|---|---|---|
| `approve_account` | master | Approve a token account for confidential transfers (PDA signs CPI) |
| `enable_confidential_credits` | account owner | Allow receiving confidential transfers |
| `disable_confidential_credits` | account owner | Stop receiving confidential transfers |

All three instructions check the `enable_confidential_transfers` feature flag and fail with `FeatureNotEnabled` if confidential transfers were not enabled during initialization.

---

## Events (SSS-3)

| Event | Emitted By | Fields |
|---|---|---|
| `AccountApprovedForConfidentialTransfer` | `approve_account` | `token_account`, `mint`, `authority`, `timestamp` |
| `ConfidentialCreditsEnabled` | `enable_confidential_credits` | `token_account`, `owner`, `mint`, `timestamp` |
| `ConfidentialCreditsDisabled` | `disable_confidential_credits` | `token_account`, `owner`, `mint`, `timestamp` |

---

## State

SSS-3 does not introduce any new PDA accounts. It adds two fields to `StablecoinState`:

| Field | Type | Description |
|---|---|---|
| `enable_confidential_transfers` | `bool` | Whether the `ConfidentialTransferMint` extension is active |
| `confidential_transfer_auto_approve` | `bool` | Whether new accounts are auto-approved |

The `StablecoinState` exposes a helper method:

```rust
pub fn is_sss3(&self) -> bool {
    self.enable_confidential_transfers
}
```

---

## Error Codes (SSS-3)

| Error | Description |
|---|---|
| `FeatureNotEnabled` | Confidential transfers not enabled on this mint |
| `InvalidElGamalPubkey` | Invalid auditor ElGamal public key |

---

## Design Decisions

### Configuration at Init, Not After

All confidential transfer parameters (`auto_approve`, `auditor_elgamal_pubkey`) are set during `initialize` and stored in the `ConfidentialTransferMint` extension. There is no `configure_confidential_transfer` instruction — the extension state is fixed at mint creation. This matches the pattern used for all other Token-2022 extensions in the SSS standard (permanent delegate, transfer hook, etc.).

### PDA as Confidential Transfer Authority

The `stablecoin_state` PDA is the confidential transfer authority. When `auto_approve` is disabled, only the PDA can approve accounts — and it does so via the `approve_account` instruction, gated by the `master_authority` role. This keeps the authority pattern consistent across all SSS layers.

### Owner Controls Credits, Authority Controls Approval

Account **approval** (whether an account is allowed to participate in confidential transfers) is controlled by the authority (master). Account **credits** (whether an account accepts incoming confidential transfers) are controlled by the account owner. This separation allows operators to gate participation while giving users control over their own receive settings.

### Confidential Transfers Are Token-2022 Native

The actual confidential transfer execution (encrypting amounts, generating proofs, submitting transfers) is handled by Token-2022's native `ConfidentialTransfer` instruction set. The SSS program only manages the mint-level configuration and per-account approval/credits. Clients interact with Token-2022 directly for the transfer itself.

### Combinable with SSS-2

SSS-3 can be combined with SSS-2 by enabling both feature sets at initialization:

```rust
StablecoinConfig {
    enable_permanent_delegate: true,       // SSS-2
    enable_transfer_hook: true,            // SSS-2
    enable_confidential_transfers: true,   // SSS-3
    // ...
}
```

This creates a stablecoin with both compliance enforcement (blacklist, seizure) and privacy features (encrypted amounts). The transfer hook still runs on confidential transfers, enforcing blacklist checks on the sender and receiver even though the amount is hidden.

---

## Comparison with Other Standards

| Feature | SSS-1 | SSS-2 | SSS-3 |
|---|---|---|---|
| Basic mint/burn | ✅ | ✅ | ✅ |
| Freeze accounts | ✅ | ✅ | ✅ |
| Per-minter quotas | ✅ | ✅ | ✅ |
| Pause/unpause | ✅ | ✅ | ✅ |
| Two-step authority transfer | ✅ | ✅ | ✅ |
| Close mint | ✅ | ✅ | ✅ |
| State versioning | ✅ | ✅ | ✅ |
| Zero-amount guards | ✅ | ✅ | ✅ |
| Blacklist enforcement | ❌ | ✅ | ❌* |
| Token seizure | ❌ | ✅ | ❌* |
| Seize from blacklisted | ❌ | ✅ | ❌* |
| Confidential transfers | ❌ | ❌ | ✅ |
| Encrypted balances | ❌ | ❌ | ✅ |
| Account approval for CT | ❌ | ❌ | ✅ |
| Auditor access | ❌ | ❌ | ✅ |

*Can be enabled by combining with SSS-2 features at initialization.

---

## Initialization

```bash
sss-token init --preset sss-3 \
  --name "Private Dollar" \
  --symbol "PVTUSD" \
  --decimals 6 \
  --auto-approve false \
  --auditor-elgamal-pubkey <AUDITOR_ELGAMAL_PUBKEY>
```

```typescript
const stable = await SolanaStablecoin.create(connection, {
  preset: Presets.SSS_3,
  name: 'Private Dollar',
  symbol: 'PVTUSD',
  decimals: 6,
  authority: adminKeypair,
  confidentialTransferAutoApprove: false,
  auditorElGamalPubkey: auditorPubkeyBytes, // Optional [u8; 32]
});
```

---

## Preset Configuration

SSS-3 preset sets these config flags:

```rust
StablecoinConfig {
    // SSS-3 features
    enable_confidential_transfers: true,
    confidential_transfer_auto_approve: false,  // or true for open access
    auditor_elgamal_pubkey: Some(auditor_bytes), // or None for no auditor
    // SSS-2 features disabled (unless hybrid)
    enable_permanent_delegate: false,
    enable_transfer_hook: false,
    default_account_frozen: false,
    transfer_hook_program_id: None,
    // ...base fields
}
```

---

## Workflow

```
1. Initialize SSS-3 mint with auto_approve = false:
   sss-token init --preset sss-3 --name "Private Dollar" --symbol "PVTUSD" --decimals 6
   → Creates mint with ConfidentialTransferMint extension
   → PDA is confidential transfer authority

2. Approve a token account for confidential transfers:
   sss-token privacy approve <TOKEN_ACCOUNT>
   → Master authority triggers, PDA signs CPI
   → Emits AccountApprovedForConfidentialTransfer

3. Account owner enables confidential credits:
   sss-token privacy enable-credits <TOKEN_ACCOUNT>
   → Account can now receive confidential transfers
   → Emits ConfidentialCreditsEnabled

4. Perform confidential transfer (via Token-2022 directly):
   → Client generates ElGamal ciphertext + ZK proof
   → Submits confidential_transfer instruction to Token-2022
   → Amount is encrypted; only sender, receiver, and auditor can decrypt

5. Optionally disable credits:
   sss-token privacy disable-credits <TOKEN_ACCOUNT>
   → Account stops receiving confidential transfers
   → Emits ConfidentialCreditsDisabled
```

---

## Security Considerations

### Cryptographic Assumptions

- **ElGamal Encryption**: Security relies on the discrete logarithm problem
- **Zero-Knowledge Proofs**: Token-2022 uses range proofs to validate amounts without revealing them
- **Key Management**: Users must securely manage their ElGamal keypairs — lost keys mean lost access to encrypted balances

### Privacy Limitations

1. **Transaction graph is public**: Sender and receiver addresses are visible on-chain
2. **Timing is public**: Transaction timestamps are observable
3. **Amount ranges**: Range proofs reveal that amounts are within valid range (non-negative, no overflow)
4. **Auditor access**: If configured, the auditor can decrypt all confidential transfer amounts

### Operational Considerations

1. **Client-side computation**: Zero-knowledge proof generation requires client-side computation
2. **Higher transaction cost**: Confidential transfers consume more compute units than regular transfers
3. **Tooling maturity**: Token-2022 confidential transfer tooling is still evolving
4. **Balance recovery**: If a user loses their ElGamal private key, encrypted balances cannot be recovered