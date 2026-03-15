# Trident Fuzz Tests

Fuzz tests for the three SSS programs using [Trident](https://ackee.xyz/trident/docs/latest/) 0.12.0 + Honggfuzz.

## Structure

```
trident-tests/
  fuzz_sss_token/       # sss-token program (core token + SSS-2 compliance)
  fuzz_oracle/          # sss-oracle program (price feeds, aggregation)
  fuzz_transfer_hook/   # transfer-hook program (blacklist enforcement)
  Cargo.toml
  Trident.toml
```

Each target contains:
- `test_fuzz.rs` — fuzz flows
- `fuzz_accounts.rs` — account address helpers
- `types.rs` — **auto-generated**, do not edit (see below)

## Prerequisites

```bash
# Install Trident CLI
cargo install trident-cli

# Install Honggfuzz (Linux)
sudo apt-get install build-essential binutils-dev libunwind-dev libblocksruntime-dev liblzma-dev
cargo install honggfuzz

# Install Honggfuzz (macOS)
brew install honggfuzz
cargo install honggfuzz
```

## Generated Files

`types.rs` in each target is auto-generated from the program IDL. It is gitignored and must be regenerated locally before running:

```bash
cd trident-tests
trident fuzz refresh fuzz_sss_token
trident fuzz refresh fuzz_oracle
trident fuzz refresh fuzz_transfer_hook
```

Re-run `refresh` after any on-chain instruction or account changes.

## Running Fuzz Tests

```bash
cd trident-tests

# Run a target (runs until Ctrl+C)
trident fuzz run fuzz_sss_token
trident fuzz run fuzz_oracle
trident fuzz run fuzz_transfer_hook

# Run with time limit (seconds)
trident fuzz run fuzz_sss_token -- --timeout 60

# Run with more threads
trident fuzz run fuzz_sss_token -- --threads 8
```

## Debugging Crashes

Crashes are saved to `hfuzz_workspace/<target>/`. To reproduce:

```bash
trident fuzz debug fuzz_sss_token <path/to/crash/file>
```

## What Each Target Tests

**fuzz_sss_token** — mint/burn flows, quota enforcement, pause/unpause, role authorization, blacklist operations (SSS-2), freeze/thaw, authority transfer.

**fuzz_oracle** — oracle initialization, feed add/remove/crank, price aggregation, circuit breaker edge cases, manual price override, staleness checks.

**fuzz_transfer_hook** — ExtraAccountMetaList initialization, blacklist enforcement on transfers, permanent delegate bypass (seize), griefing resistance.

## Invariants (fuzz_sss_token)

See `fuzz_sss_token/invariants.rs` for the full list. Key properties:
- Supply never goes negative; total supply matches sum of token accounts
- Quota ceiling is always enforced (when quota > 0)
- Paused state blocks mint and burn
- Only authorized roles can perform privileged operations
- Blacklisted accounts cannot send or receive transfers
