# SSS-2: Compliant Stablecoin Standard

**Status:** Final
**Category:** Compliance Layer (extends SSS-1)

---

## Summary

SSS-2 is the **regulated stablecoin** standard for USDC/USDT-class tokens where regulators expect:

- **On-chain blacklist enforcement** — every transfer is checked via transfer hook
- **Token seizure capability** — permanent delegate allows pulling tokens from any account, including blacklisted accounts
- **Proactive compliance** — transfers are rejected at the protocol level, not just flagged

SSS-2 is a strict superset of SSS-1. All SSS-1 instructions and features are available plus the compliance module.

---

## Token-2022 Extensions Added (vs SSS-1)

| Extension | Purpose | Authority |
|---|---|---|
| `PermanentDelegate` | Allows seizing tokens from any account without owner signature | PDA (`stablecoin_state`) |
| `TransferHook` | Every transfer invokes the `transfer-hook` program for blacklist checks | PDA (`stablecoin_state`) |
| `DefaultAccountState` | Optionally freeze new token accounts by default | PDA (`stablecoin_state`) |

All extension authorities are set to the `stablecoin_state` PDA, consistent with SSS-1.

---

## Transfer Hook Program

**Program ID:** Separate program deployed alongside `sss-token`.

The `transfer-hook` program runs on **every token transfer**. It checks whether the source or destination wallet owner has an active `BlacklistEntry` PDA under the `sss-token` program. If either exists, the transfer fails — unless the transfer is a permanent delegate (seize) operation.

### How It Works

1. Token-2022 invokes the transfer hook via the SPL Transfer Hook Interface discriminator
2. The hook's `fallback` function parses the SPL instruction and routes to the handler
3. The handler compares the transfer authority (index 3) against the `stablecoin_state` PDA (index 8)
4. **If they match**, this is a permanent delegate (seize) operation — blacklist checks are **skipped** and the transfer succeeds
5. **If they don't match**, the handler checks two blacklist entry PDAs:
   - Source: `["blacklist", mint, source_token_account_owner]`
   - Destination: `["blacklist", mint, dest_token_account_owner]`
6. A blacklist entry is considered **active** only if `lamports > 0 && owner == sss_token_program`. If either PDA meets this condition, the transfer is rejected.

> **Note:** Checking both `lamports > 0` and `owner == sss_token_program` prevents a griefing attack where an attacker injects SOL into a closed blacklist PDA address to cause a false positive. A PDA with lamports but the wrong owner (e.g. System Program after closure) is not treated as an active blacklist entry.

### Error Codes

| Error | Description |
|---|---|
| `SourceBlacklisted` | Sender's wallet owner is on the blacklist |
| `DestinationBlacklisted` | Recipient's wallet owner is on the blacklist |

### ExtraAccountMetaList

The transfer hook uses an `ExtraAccountMetaList` PDA to tell Token-2022 which additional accounts must be resolved for every transfer:

| Index | Account | Resolution |
|---|---|---|
| 5 | `sss_token_program` | Fixed pubkey |
| 6 | Source blacklist entry | External PDA: `sss_token_program["blacklist", mint, source_owner]` |
| 7 | Dest blacklist entry | External PDA: `sss_token_program["blacklist", mint, dest_owner]` |
| 8 | `stablecoin_state` | External PDA: `sss_token_program["stablecoin_state", mint]` |

The owner is read from the token account data at byte offset 32 (the `owner` field in Token-2022's `Account` struct), not from the authority/delegate passed at index 3. This ensures the actual wallet owner is always checked, even when a delegate initiates the transfer.

The `stablecoin_state` PDA at index 8 is used to identify permanent delegate operations. When the authority at index 3 matches this PDA, the transfer is a seize operation and blacklist checks are bypassed.

### Initialization

The `ExtraAccountMetaList` must be initialized once after the mint is created:

```bash
# After sss-token init --preset sss-2
sss-token hook init --mint <MINT_ADDRESS>
```

> **Security:** The `initialize_extra_account_meta_list` instruction requires the payer to be the `master_authority`. The instruction verifies the `roles_config` PDA derivation and ownership, and reads `master_authority` from account data. This prevents front-running attacks where a malicious actor initializes the `ExtraAccountMetaList` with an incorrect `sss_token_program`, which would break blacklist enforcement for all transfers.

---

## Additional Accounts

### `BlacklistEntry` PDA

Seeds: `["blacklist", mint, address]` — owned by the `sss-token` program.

| Field | Type | Description |
|---|---|---|
| `mint` | `Pubkey` | The mint this entry applies to |
| `address` | `Pubkey` | The blacklisted wallet |
| `reason` | `String` | Reason string (max **128 bytes**, not characters) |
| `timestamp` | `i64` | Unix timestamp of blacklisting |
| `bump` | `u8` | PDA bump seed |

**An address is blacklisted if and only if its `BlacklistEntry` PDA exists, has `lamports > 0`, and is owned by `sss_token_program`.** Closing the PDA removes the address from the blacklist and reclaims rent.

> **Note on reason field:** The reason is truncated to 128 bytes at the UTF-8 character boundary. Multi-byte characters (emoji, CJK, etc.) are handled safely — the string is never split mid-character.

---

## Additional Instructions (SSS-2 only)

| Instruction | Auth | Description |
|---|---|---|
| `add_to_blacklist` | blacklister / master | Creates `BlacklistEntry` PDA |
| `remove_from_blacklist` | blacklister / master | Closes `BlacklistEntry` PDA (reclaims rent) |
| `seize` | seizer / master | Transfers tokens via permanent delegate (amount > 0) |
| `initialize_extra_account_meta_list` | `master_authority` | Sets up the transfer hook's account resolution (called once) |

All three `sss-token` instructions **check feature flags** and fail with `ComplianceNotEnabled` if the corresponding extension was not enabled during initialization:

- `add_to_blacklist` / `remove_from_blacklist` require `enable_transfer_hook = true`
- `seize` requires `enable_permanent_delegate = true`

The `seize` instruction enforces `amount > 0` and fails with `ZeroAmount` otherwise.

---

## Additional Roles (SSS-2)

| Role | Description |
|---|---|
| `blacklister` | Can add/remove blacklist entries |
| `seizer` | Can seize tokens into a treasury account |

Both roles default to the deployer at initialization and can be reassigned via `update_roles`.

---

## Additional Events (SSS-2)

| Event | Emitted By |
|---|---|
| `AddedToBlacklist` | `add_to_blacklist` (includes reason, blacklister, timestamp) |
| `RemovedFromBlacklist` | `remove_from_blacklist` |
| `TokensSeized` | `seize` (includes from, to, amount, seizer) |

---

## Design Decisions

### Seize Does Not Require Blacklisting

The `seize` instruction does not check whether the target account is blacklisted. Seizure may target accounts that are not on the blacklist (e.g., court orders, regulatory directives targeting specific transactions). Blacklisting and seizure are independent compliance tools. If an operator wants to blacklist-then-seize, they issue two separate instructions.

### Seize Bypasses Blacklist in Transfer Hook

When the transfer hook detects that the transfer authority is the `stablecoin_state` PDA (permanent delegate), it skips all blacklist checks and allows the transfer. This is necessary because `seize` uses `transfer_checked`, which triggers the hook. Without this bypass, seizing from a blacklisted account would fail — defeating the purpose of the compliance workflow.

The bypass is safe because:
- Only the `stablecoin_state` PDA can act as permanent delegate
- The PDA only signs transfers when invoked through the `seize` instruction
- The `seize` instruction enforces its own role-based access control (seizer / master_authority)

### Seize Operates During Pause

The `seize` instruction does not check the global `paused` flag. During a security incident, the operator may need to pause minting/burning while still moving funds to a treasury. Seizure must remain operational.

### Blacklist Checks Actual Owner, Not Delegate

The transfer hook resolves blacklist PDAs using the token account's `owner` field (byte offset 32 in account data), not the `authority` passed at index 3 of the transfer instruction. This prevents blacklist evasion via delegate accounts.

### Transfer Hook Is Read-Only

The transfer hook handler only reads blacklist PDA lamports/ownership and compares pubkeys — it never modifies state. This means direct invocation of the hook (outside of Token-2022) is harmless. No caller verification is needed in the current design.

### Blacklist Entry Validity Requires Owner Check

The transfer hook validates blacklist entries by checking both `lamports > 0` and `owner == sss_token_program`. Checking lamports alone is insufficient: after a `remove_from_blacklist` instruction closes a PDA and reclaims rent, an attacker could re-inject SOL into that address to make it appear as an active blacklist entry again. Requiring `sss_token_program` ownership prevents this — a re-griefed address will be owned by the System Program, not `sss_token_program`, and will not trigger a blacklist rejection.

---

## Initialization

```bash
sss-token init --preset sss-2 \
  --name "Compliant Dollar" \
  --symbol "CUSD" \
  --decimals 6 \
  --transfer-hook-program <HOOK_PROGRAM_ID>
```

```typescript
const stable = await SolanaStablecoin.create(connection, {
  preset: Presets.SSS_2,
  name: 'Compliant Dollar',
  symbol: 'CUSD',
  decimals: 6,
  authority: adminKeypair,
  transferHookProgramId: hookProgramId,
});
```

---

## Compliance Workflow

```
1. Sanctions screening identifies address X

2. Blacklist the address:
   sss-token blacklist add <X> --reason "OFAC SDN match"
   → Creates BlacklistEntry PDA on-chain (owned by sss_token_program)
   → Emits AddedToBlacklist event

3. All transfers to/from X now fail automatically
   → Transfer hook checks lamports > 0 && owner == sss_token_program on BlacklistEntry PDA
   → Rejects with SourceBlacklisted or DestinationBlacklisted

4. Seize tokens (works even though X is blacklisted):
   sss-token seize <X-token-account> --to <treasury>
   → Permanent delegate transfers tokens without owner signature
   → Transfer hook detects stablecoin_state PDA as authority, skips blacklist check
   → Emits TokensSeized event

5. If address is cleared:
   sss-token blacklist remove <X>
   → Closes BlacklistEntry PDA, reclaims rent
   → Emits RemovedFromBlacklist event
   → Transfers to/from X resume immediately
```

---

## Preset Configuration

SSS-2 preset sets these config flags:

```rust
StablecoinConfig {
    enable_permanent_delegate: true,
    enable_transfer_hook: true,
    default_account_frozen: false,  // optional: true for allowlist model
    transfer_hook_program_id: Some(hook_program_id),
    // SSS-3 features disabled
    enable_confidential_transfers: false,
    confidential_transfer_auto_approve: false,
    auditor_elgamal_pubkey: None,
    // ...base fields
}
```