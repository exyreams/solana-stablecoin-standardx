# Trident Fuzz Testing Guide

This directory contains fuzz tests for the Solana Stablecoin Standard programs using the Trident fuzzing framework.

## About Trident

Trident is a Rust-based fuzzing framework for Solana programs that helps discover edge cases, vulnerabilities, and invariant violations through property-based testing. It generates random inputs to test program behavior under various conditions.

## Prerequisites

### Install Trident

```bash
cargo install trident-cli
```

### Install Honggfuzz (Fuzzing Engine)

```bash
# Ubuntu/Debian
sudo apt-get install build-essential binutils-dev libunwind-dev libblocksruntime-dev liblzma-dev

# macOS
brew install honggfuzz

# Install Honggfuzz via cargo
cargo install honggfuzz
```

### Verify Installation

```bash
trident --version
```

## Project Structure

```
trident-tests/
├── fuzz_tests/
│   ├── fuzz_sss_token/       # Fuzz tests for sss-token program
│   │   ├── test_fuzz.rs      # Main fuzz test logic
│   │   └── accounts_snapshots.rs
│   ├── fuzz_oracle/          # Fuzz tests for sss-oracle program
│   │   ├── test_fuzz.rs
│   │   └── accounts_snapshots.rs
│   └── fuzz_transfer_hook/   # Fuzz tests for transfer-hook program
│       ├── test_fuzz.rs
│       └── accounts_snapshots.rs
├── Cargo.toml
└── README.md (this file)
```

## Running Fuzz Tests

### Test SSS-Token Program

```bash
cd trident-tests
trident fuzz run fuzz_sss_token
```

**What it tests:**
- Minting with random amounts and quotas
- Burning with random amounts
- Role management operations
- Authority transfer scenarios
- Blacklist operations (SSS-2)
- Token seizure (SSS-2)
- Confidential transfer approval (SSS-3)
- Pause/unpause functionality
- State consistency and invariants

### Test Oracle Program

```bash
cd trident-tests
trident fuzz run fuzz_oracle
```

**What it tests:**
- Oracle initialization with random parameters
- Price feed management (add, remove, crank)
- Price aggregation with random feed values
- Circuit breaker edge cases
- Staleness checks with random timestamps
- Manual price override scenarios
- Authority transfer
- Pause/unpause functionality

### Test Transfer Hook Program

```bash
cd trident-tests
trident fuzz run fuzz_transfer_hook
```

**What it tests:**
- Transfer validation with random blacklist states
- Source and destination blacklist checks
- Permanent delegate bypass scenarios
- ExtraAccountMetaList initialization
- Edge cases in account resolution

## Fuzz Test Configuration

### Duration

By default, fuzz tests run indefinitely until stopped with `Ctrl+C`. To run for a specific duration:

```bash
# Run for 60 seconds
trident fuzz run fuzz_sss_token -- --timeout 60

# Run for 1000 iterations
trident fuzz run fuzz_sss_token -- --iterations 1000
```

### Threads

Control the number of fuzzing threads:

```bash
# Use 4 threads
trident fuzz run fuzz_sss_token -- --threads 4
```

### Verbosity

Increase output verbosity:

```bash
# Verbose output
trident fuzz run fuzz_sss_token -- --verbose

# Very verbose output
trident fuzz run fuzz_sss_token -- -vv
```

## Understanding Results

### Successful Run

```
Fuzzing fuzz_sss_token...
Iterations: 1000000
Crashes: 0
Unique crashes: 0
Coverage: 85.3%
Time: 27s
```

### Crash Found

If a crash is found, Trident will:
1. Save the crashing input to `hfuzz_workspace/fuzz_sss_token/crashes/`
2. Display the crash details
3. Provide a reproducible test case

Example crash output:
```
CRASH FOUND!
Input: [0x12, 0x34, 0x56, ...]
Saved to: hfuzz_workspace/fuzz_sss_token/crashes/crash_001.fuzz
```

### Reproducing Crashes

```bash
# Reproduce a specific crash
trident fuzz run-debug fuzz_sss_token hfuzz_workspace/fuzz_sss_token/crashes/crash_001.fuzz
```

## Invariants Tested

### SSS-Token Program

1. **Supply Consistency**
   - Total supply always equals sum of all token accounts
   - Minting increases supply, burning decreases supply
   - Supply never goes negative

2. **Quota Enforcement**
   - Minted amount never exceeds quota (unless quota = 0)
   - Inactive minters cannot mint
   - Quota updates are atomic

3. **Authorization**
   - Only authorized roles can perform operations
   - Master authority required for role updates
   - Minter role required for minting
   - Burner role required for burning

4. **State Transitions**
   - Pause blocks minting and burning
   - Unpause requires prior pause
   - Authority transfer requires two steps
   - Blacklist operations require SSS-2 enabled

5. **Blacklist Enforcement (SSS-2)**
   - Blacklisted addresses cannot transfer
   - Blacklist entries are immutable once created
   - Removal closes the PDA

### Oracle Program

1. **Price Bounds**
   - Prices are always positive
   - Confidence intervals are reasonable
   - Aggregated prices are within feed ranges

2. **Circuit Breaker**
   - Price changes exceeding threshold are rejected
   - First crank always passes (no reference)
   - Manual price bypasses circuit breaker

3. **Feed Management**
   - Feed count never exceeds MAX_FEEDS (16)
   - Disabled feeds are skipped in aggregation
   - Stale feeds are rejected

4. **Aggregation Correctness**
   - Median is always the middle value
   - Mean is the arithmetic average
   - Weighted mean respects feed weights
   - Insufficient feeds cause failure

### Transfer Hook Program

1. **Blacklist Enforcement**
   - Transfers from blacklisted source fail
   - Transfers to blacklisted destination fail
   - Non-blacklisted transfers succeed
   - Permanent delegate bypasses blacklist

2. **Account Resolution**
   - ExtraAccountMetaList is correctly initialized
   - Required accounts are always present
   - PDA derivation is deterministic

## Best Practices

### 1. Run Regularly

Run fuzz tests regularly during development:

```bash
# Quick smoke test (10 seconds, ~500k iterations)
trident fuzz run fuzz_sss_token -- --timeout 10

# Standard test (1 minute, ~2M iterations)
trident fuzz run fuzz_sss_token -- --timeout 60

# Thorough test (5 minutes, ~10M iterations)
trident fuzz run fuzz_sss_token -- --timeout 300

# Deep test (1 hour, ~130M iterations)
trident fuzz run fuzz_sss_token -- --timeout 3600

# Overnight run (8 hours, ~1B iterations)
trident fuzz run fuzz_sss_token -- --timeout 28800
```

### 2. Test After Changes

Always run fuzz tests after making changes to:
- Instruction handlers
- State transitions
- Authorization logic
- Arithmetic operations

### 3. Investigate All Crashes

Every crash is a potential bug:
1. Reproduce the crash
2. Analyze the input
3. Fix the underlying issue
4. Add a regression test

### 4. Monitor Coverage

Aim for high code coverage:
- 80%+ is good
- 90%+ is excellent
- 95%+ is outstanding

### 5. Use Continuous Integration

Integrate fuzz testing into CI/CD:

```yaml
# .github/workflows/fuzz.yml
name: Fuzz Tests
on: [push, pull_request]
jobs:
  fuzz:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install Trident
        run: cargo install trident-cli
      - name: Run Fuzz Tests
        run: |
          cd trident-tests
          trident fuzz run fuzz_sss_token -- --timeout 300
          trident fuzz run fuzz_oracle -- --timeout 300
          trident fuzz run fuzz_transfer_hook -- --timeout 300
```

## Troubleshooting

### Compilation Errors

```bash
# Clean and rebuild
cd trident-tests
cargo clean
trident fuzz build
```

### Honggfuzz Not Found

```bash
# Reinstall honggfuzz
cargo install honggfuzz --force
```

### Low Coverage

If coverage is low:
1. Check if all code paths are reachable
2. Add more diverse fuzz inputs
3. Review instruction handlers for dead code

### Slow Fuzzing

If fuzzing is slow:
1. Increase thread count: `--threads 8`
2. Reduce complexity of fuzz inputs
3. Use a faster machine

## Advanced Usage

### Custom Fuzz Targets

Create custom fuzz targets in `fuzz_tests/`:

```rust
// fuzz_tests/fuzz_custom/test_fuzz.rs
use trident_client::fuzzing::*;

#[derive(Arbitrary, Debug)]
pub struct FuzzData {
    pub amount: u64,
    pub recipient: AccountId,
}

pub fn fuzz_iteration(fuzz_data: FuzzData) {
    // Your fuzz logic here
}
```

### Corpus Management

Save interesting inputs for regression testing:

```bash
# Export corpus
cp -r hfuzz_workspace/fuzz_sss_token/input corpus/

# Import corpus
cp -r corpus/* hfuzz_workspace/fuzz_sss_token/input/
```

### Differential Fuzzing

Compare behavior across implementations:

```rust
pub fn fuzz_iteration(fuzz_data: FuzzData) {
    let result_v1 = old_implementation(fuzz_data);
    let result_v2 = new_implementation(fuzz_data);
    assert_eq!(result_v1, result_v2);
}
```

## Resources

- **Trident Documentation**: https://ackee.xyz/trident/docs/latest/
- **Honggfuzz**: https://github.com/google/honggfuzz
- **Fuzzing Best Practices**: https://github.com/google/fuzzing
- **Solana Security**: https://docs.solana.com/developing/on-chain-programs/developing-rust#security

## Support

For issues or questions:
- GitHub Issues: [Project Issues]
- Discord: [Project Discord]
- Documentation: [Project Docs]

---

**Happy Fuzzing! 🐛🔍**
