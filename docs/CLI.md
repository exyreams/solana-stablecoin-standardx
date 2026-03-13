# SSS Token Command-Line Interface (CLI)

The `sss-token` CLI is the comprehensive administration tool for managing Solana Stablecoin Standard (SSS) tokens. It provides full control over token lifecycle, compliance operations, oracle price feeds, and privacy features.

---

## Table of Contents

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Global Options](#global-options)
4. [Command Reference](#command-reference)
   - [Core Operations](#core-operations)
   - [Minter Management](#minter-management)
   - [Role Management](#role-management)
   - [Information & Queries](#information--queries)
   - [Compliance (SSS-2)](#compliance-sss-2)
   - [Privacy (SSS-3)](#privacy-sss-3)
   - [Oracle Management](#oracle-management)
   - [Terminal UI](#terminal-ui)
5. [Presets](#presets)
6. [Custom Configuration](#custom-configuration)
7. [Environment Variables](#environment-variables)
8. [Examples](#examples)

---

## Installation

### From Source

```bash
# Clone the repository
git clone https://github.com/exyreams/solana-stablecoin-standard.git
cd solana-stablecoin-standard

# Install dependencies
pnpm install

# Build all packages including CLI
pnpm build

# Link CLI globally (optional)
cd packages/cli
pnpm link --global
```

### From npm

```bash
npm install -g @stbr/sss-token-cli
# or
pnpm add -g @stbr/sss-token-cli
```

### Verify Installation

```bash
sss-token --version
# Output: 0.1.0

sss-token --help
```

---

## Configuration

The CLI can be configured through command-line options, environment variables, or a combination of both.

### Priority Order

1. Command-line flags (highest priority)
2. Environment variables
3. Default values

### Quick Setup

```bash
# Set your default RPC endpoint
export SOLANA_RPC_URL="https://api.devnet.solana.com"

# Set your keypair path
export SOLANA_KEYPAIR_PATH="~/.config/solana/id.json"

# Set your stablecoin mint (after initialization)
export STABLECOIN_MINT="YourMintAddress..."
```

---

## Global Options

These options are available for all commands:

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--url <url>` | `-u` | Solana RPC endpoint URL | `https://api.devnet.solana.com` |
| `--keypair <path>` | `-k` | Path to authority keypair JSON file | `~/.config/solana/id.json` |
| `--mint <address>` | `-m` | Stablecoin mint public key | `$STABLECOIN_MINT` |
| `--version` | `-V` | Display CLI version | — |
| `--help` | `-h` | Display help information | — |

### Examples

```bash
# Use custom RPC endpoint
sss-token -u https://api.mainnet-beta.solana.com status

# Use specific keypair
sss-token -k ~/keys/admin.json status

# Combine options
sss-token -u https://my-rpc.com -k ~/admin.json -m Mint123... status
```

---

## Command Reference

### Core Operations

#### `init`

Initialize a new stablecoin mint with the specified configuration.

```bash
sss-token init [options]
```

**Options:**

| Option | Required | Description | Default |
|--------|----------|-------------|---------|
| `--name <name>` | ✅ | Token name (max 32 bytes) | — |
| `--symbol <symbol>` | ✅ | Token symbol (max 10 bytes) | — |
| `--preset <preset>` | ❌ | Preset configuration: `sss-1`, `sss-2`, `sss-3` | `sss-1` |
| `--decimals <n>` | ❌ | Decimal places | `6` |
| `--uri <uri>` | ❌ | Metadata JSON URI (max 200 bytes) | `""` |
| `--custom <file>` | ❌ | Path to custom TOML/JSON config | — |
| `--transfer-hook-program <id>` | ❌ | Transfer hook program ID (required for SSS-2) | — |
| `--auto-approve` | ❌ | Auto-approve confidential transfers (SSS-3) | `false` |
| `--auditor-elgamal-pubkey <hex>` | ❌ | Auditor ElGamal public key (SSS-3) | — |

**Examples:**

```bash
# Initialize minimal SSS-1 stablecoin
sss-token init --name "US Dollar Coin" --symbol "USDC" --decimals 6

# Initialize compliant SSS-2 stablecoin
sss-token init \
  --name "Regulated Dollar" \
  --symbol "RGUSD" \
  --preset sss-2 \
  --transfer-hook-program F8wwXWp8JUKVrDPwFCpG2NrheV3X7KKatoDuiYeBigkf

# Initialize private SSS-3 stablecoin with auto-approval
sss-token init \
  --name "Private Dollar" \
  --symbol "PUSD" \
  --preset sss-3 \
  --auto-approve

# Initialize from custom configuration file
sss-token init --custom ./my-stablecoin.toml --name "Custom Coin" --symbol "CUST"
```

**Output:**

```
✓ Stablecoin initialized!
┌────────┬──────────────────────────────────────────────────┐
│ Field  │ Value                                            │
├────────┼──────────────────────────────────────────────────┤
│ Mint   │ 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU     │
│ Name   │ US Dollar Coin                                   │
│ Symbol │ USDC                                             │
│ Preset │ SSS-1 (Minimal)                                  │
└────────┴──────────────────────────────────────────────────┘

Set this as your default mint:
  export STABLECOIN_MINT=7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
```

---

#### `mint`

Mint new tokens to a recipient wallet.

```bash
sss-token mint <recipient> <amount>
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `recipient` | Recipient wallet address (PublicKey) |
| `amount` | Amount to mint in token units (e.g., `1000.50`) |

**Examples:**

```bash
# Mint 1000 tokens to a wallet
sss-token mint 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM 1000

# Mint with explicit mint address
sss-token -m Mint123... mint RecipientPubkey 500.25
```

**Output:**

```
✓ Minted 1000 USDC
TX: https://explorer.solana.com/tx/5wH...?cluster=devnet
```

---

#### `burn`

Burn tokens from a token account. Requires burner role or master authority.

```bash
sss-token burn <amount> --from <tokenAccount>
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `amount` | Amount to burn in token units |

**Options:**

| Option | Required | Description |
|--------|----------|-------------|
| `--from <tokenAccount>` | ✅ | Token account to burn from |

**Examples:**

```bash
# Burn 500 tokens from a token account
sss-token burn 500 --from 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU

# Burn fractional amounts
sss-token burn 100.50 --from TokenAccountPubkey
```

**Output:**

```
✓ Burned 500 USDC
TX: https://explorer.solana.com/tx/3kJ...?cluster=devnet
```

---

#### `freeze`

Freeze a token account to prevent all transfers.

```bash
sss-token freeze <tokenAccount>
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `tokenAccount` | Token account address to freeze |

**Examples:**

```bash
sss-token freeze 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

**Output:**

```
✓ Account frozen: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
TX: https://explorer.solana.com/tx/2xY...?cluster=devnet
```

---

#### `thaw`

Thaw (unfreeze) a previously frozen token account.

```bash
sss-token thaw <tokenAccount>
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `tokenAccount` | Token account address to thaw |

**Examples:**

```bash
sss-token thaw 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

**Output:**

```
✓ Account thawed: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
TX: https://explorer.solana.com/tx/4pK...?cluster=devnet
```

---

#### `pause`

Globally pause all minting and burning operations.

```bash
sss-token pause [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--reason <reason>` | Reason for pausing (stored in logs) |

**Examples:**

```bash
# Pause without reason
sss-token pause

# Pause with reason
sss-token pause --reason "Emergency maintenance"
```

**Output:**

```
✓ Stablecoin paused — minting and burning disabled
TX: https://explorer.solana.com/tx/1mN...?cluster=devnet
```

---

#### `unpause`

Resume minting and burning operations after a pause.

```bash
sss-token unpause
```

**Examples:**

```bash
sss-token unpause
```

**Output:**

```
✓ Stablecoin unpaused — minting and burning resumed
TX: https://explorer.solana.com/tx/6tR...?cluster=devnet
```

---

#### `close-mint`

Permanently close the mint and reclaim all rent. **This action is irreversible.**

```bash
sss-token close-mint [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--force` | Skip confirmation prompt |

**Prerequisites:**

- Total supply must be zero (all tokens burned)
- All MinterQuota PDAs should be removed first
- Requires master authority

**Examples:**

```bash
# Interactive confirmation
sss-token close-mint

# Skip confirmation (use with caution)
sss-token close-mint --force
```

**Output:**

```
⚠️  This is IRREVERSIBLE. The mint, state, and roles will be permanently destroyed.
   All MinterQuota PDAs should be removed first via "minters remove".
   Run with --force to skip this warning.

Type "CLOSE" to confirm: CLOSE
✓ Mint permanently closed
✓ All rent reclaimed to master authority
TX: https://explorer.solana.com/tx/8kL...?cluster=devnet
```

---

#### `metadata init`

Initialize Metaplex metadata for wallet display (Phantom, Solflare, etc.).

```bash
sss-token metadata init [options]
```

**Options:**

| Option | Required | Description |
|--------|----------|-------------|
| `--name <name>` | ✅ | Token display name |
| `--symbol <symbol>` | ✅ | Token symbol |
| `--uri <uri>` | ✅ | Metadata JSON URI (Arweave, IPFS, etc.) |
| `--mint-keypair <path>` | ✅ | Path to mint keypair JSON |
| `--seller-fee <bps>` | ❌ | Seller fee basis points (default: 0) |

**Examples:**

```bash
sss-token metadata init \
  --name "US Dollar Coin" \
  --symbol "USDC" \
  --uri "https://arweave.net/abc123..." \
  --mint-keypair ./mint-keypair.json
```

**Output:**

```
✓ Metaplex metadata initialized successfully!

Metadata Details:
────────────────────────────────────────────────────────────
Name:          US Dollar Coin
Symbol:        USDC
URI:           https://arweave.net/abc123...
Metadata PDA:  3xYz...
────────────────────────────────────────────────────────────

✓ Your token will now display in wallets (Phantom, Solflare, etc.)
  Note: It may take a few minutes for wallets to index the metadata.

⚠ Important: Keep your mint keypair secure!
  The mint keypair was required for this one-time metadata creation.
```

---

### Minter Management

#### `minters list`

List all registered minters and their quota information.

```bash
sss-token minters list
```

**Output:**

```
┌──────────────────────────────────────────────────┬────────────┬────────────┬──────────┐
│ Minter                                           │ Status     │ Quota      │ Minted   │
├──────────────────────────────────────────────────┼────────────┼────────────┼──────────┤
│ 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM     │ 🟢 Active  │ 1,000,000  │ 250,000  │
│ 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU     │ 🟢 Active  │ Unlimited  │ 50,000   │
│ HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH     │ 🔴 Inactive│ 500,000    │ 500,000  │
└──────────────────────────────────────────────────┴────────────┴────────────┴──────────┘
```

---

#### `minters add`

Register a new minter with an optional quota.

```bash
sss-token minters add <minterAddress> [options]
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `minterAddress` | Public key of the new minter |

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--quota <amount>` | Maximum tokens this minter can mint (0 = unlimited) | `0` |

**Examples:**

```bash
# Add minter with unlimited quota
sss-token minters add 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM

# Add minter with 1 million token quota
sss-token minters add 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM --quota 1000000
```

**Output:**

```
✓ Minter added: 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM
✓ Quota: 1,000,000 USDC
TX: https://explorer.solana.com/tx/7hJ...?cluster=devnet
```

---

#### `minters remove`

Remove a minter and reclaim rent from the MinterQuota PDA.

```bash
sss-token minters remove <minterAddress>
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `minterAddress` | Public key of the minter to remove |

**Examples:**

```bash
sss-token minters remove 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM
```

**Output:**

```
✓ Minter removed: 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM
✓ MinterQuota PDA closed, rent reclaimed
TX: https://explorer.solana.com/tx/9pQ...?cluster=devnet
```

---

#### `minters update`

Update a minter's quota, status, or reset their minted counter.

```bash
sss-token minters update <minterAddress> [options]
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `minterAddress` | Public key of the minter to update |

**Options:**

| Option | Required | Description |
|--------|----------|-------------|
| `--quota <amount>` | ✅ | New quota (0 = unlimited) |
| `--active` | ❌ | Set minter as active (default) |
| `--no-active` | ❌ | Set minter as inactive |
| `--reset-minted` | ❌ | Reset minted counter to zero |

**Examples:**

```bash
# Update quota only
sss-token minters update MinterPubkey --quota 2000000

# Deactivate minter
sss-token minters update MinterPubkey --quota 1000000 --no-active

# Reset minted counter and increase quota
sss-token minters update MinterPubkey --quota 5000000 --reset-minted
```

**Output:**

```
✓ Minter updated: 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM
✓ Quota: 2,000,000
✓ Active: true
TX: https://explorer.solana.com/tx/2kM...?cluster=devnet
```

---

### Role Management

#### `roles show`

Display current role assignments for the stablecoin.

```bash
sss-token roles show
```

**Output:**

```
┌────────────────────┬──────────────────────────────────────────────────┐
│ Role               │ Address                                          │
├────────────────────┼──────────────────────────────────────────────────┤
│ Master Authority   │ 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM     │
│ Pending Master     │ (none)                                           │
│ Burner             │ 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM     │
│ Pauser             │ 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM     │
│ Blacklister (SSS-2)│ 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM     │
│ Seizer (SSS-2)     │ 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM     │
└────────────────────┴──────────────────────────────────────────────────┘
```

---

#### `roles update`

Update role assignments. Requires master authority.

```bash
sss-token roles update [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--burner <address>` | New burner address |
| `--pauser <address>` | New pauser address |
| `--blacklister <address>` | New blacklister address (SSS-2) |
| `--seizer <address>` | New seizer address (SSS-2) |

**Examples:**

```bash
# Update single role
sss-token roles update --pauser NewPauserPubkey

# Update multiple roles
sss-token roles update \
  --burner BurnerPubkey \
  --pauser PauserPubkey \
  --blacklister BlacklisterPubkey
```

**Output:**

```
✓ Roles updated
✓ pauser: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
✓ burner: HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH
TX: https://explorer.solana.com/tx/3nL...?cluster=devnet
```

---

#### `roles transfer`

Initiate a two-step master authority transfer. This is step 1 of 2.

```bash
sss-token roles transfer <newMaster>
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `newMaster` | Public key of the new master authority |

**Examples:**

```bash
sss-token roles transfer NewMasterPubkey
```

**Output:**

```
✓ Authority transfer initiated → NewMasterPubkey
✓ The new master must call "sss-token roles accept" to complete the transfer
TX: https://explorer.solana.com/tx/5tP...?cluster=devnet
```

---

#### `roles accept`

Accept a pending master authority transfer. This is step 2 of 2.

```bash
sss-token roles accept
```

**Note:** Must be signed by the keypair of the pending master.

**Examples:**

```bash
sss-token -k ~/new-master.json roles accept
```

**Output:**

```
✓ Authority transfer accepted — you are now the master authority
TX: https://explorer.solana.com/tx/7uQ...?cluster=devnet
```

---

### Information & Queries

#### `status`

Display comprehensive stablecoin status, configuration, and role assignments.

```bash
sss-token status
```

**Output:**

```
📊 Token Info
┌─────────────────┬──────────────────────────────────────────────────┐
│ Field           │ Value                                            │
├─────────────────┼──────────────────────────────────────────────────┤
│ Mint            │ 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU     │
│ Name            │ US Dollar Coin                                   │
│ Symbol          │ USDC                                             │
│ Decimals        │ 6                                                │
│ Version         │ 1                                                │
│ Preset          │ SSS-2 (Compliant)                                │
│ Total Supply    │ 1,250,000 USDC                                   │
│ Paused          │ 🟢 NO                                            │
└─────────────────┴──────────────────────────────────────────────────┘

🔧 Extensions
┌─────────────────────────┬────────────┐
│ Extension               │ Status     │
├─────────────────────────┼────────────┤
│ Permanent Delegate      │ ✅ Enabled │
│ Transfer Hook           │ ✅ Enabled │
│ Default Frozen          │ ❌ Disabled│
│ Confidential Transfers  │ ❌ Disabled│
│ CT Auto-Approve         │ ❌ Disabled│
└─────────────────────────┴────────────┘

👤 Roles
┌────────────────────┬──────────────────────────────────────────────────┐
│ Role               │ Address                                          │
├────────────────────┼──────────────────────────────────────────────────┤
│ Master Authority   │ 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM     │
│ Pending Master     │ (none)                                           │
│ Burner             │ 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM     │
│ Pauser             │ 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM     │
│ Blacklister        │ 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM     │
│ Seizer             │ 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM     │
└────────────────────┴──────────────────────────────────────────────────┘
```

---

#### `supply`

Display the current total supply directly from the mint account.

```bash
sss-token supply
```

**Output:**

```
✓ Total supply: 1,250,000 USDC
```

---

#### `holders`

List all token holders with their balances.

```bash
sss-token holders [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--min-balance <amount>` | Minimum balance filter | `0` |

**Examples:**

```bash
# List all holders
sss-token holders

# List holders with at least 1000 tokens
sss-token holders --min-balance 1000
```

**Output:**

```
✓ Found 15 holder(s)
┌──────────────────────────────────────────────────┬──────────────────────────────────────────────────┬────────────┬─────────┐
│ Owner                                            │ Token Account                                    │ Balance    │ State   │
├──────────────────────────────────────────────────┼──────────────────────────────────────────────────┼────────────┼─────────┤
│ 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM     │ 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU     │ 500,000    │ active  │
│ HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH     │ 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU     │ 250,000    │ active  │
│ 3xYz4567890123456789012345678901234567890123     │ 8yLMn0987654321098765432109876543210987654321     │ 100,000    │ frozen  │
└──────────────────────────────────────────────────┴──────────────────────────────────────────────────┴────────────┴─────────┘
```

---

#### `audit-log`

Display recent transactions for audit purposes.

```bash
sss-token audit-log [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--action <type>` | Filter by action type: `mint`, `burn`, `freeze`, `blacklist`, `seize`, `pause` | — |
| `--limit <n>` | Maximum transactions to display | `50` |

**Examples:**

```bash
# Show last 50 transactions
sss-token audit-log

# Show only mint transactions
sss-token audit-log --action mint

# Show last 100 burn transactions
sss-token audit-log --action burn --limit 100
```

**Output:**

```
✓ Found 12 transaction(s) matching "mint"
┌────────────────────────────┬──────────────────────────┬──────────┐
│ Signature                  │ Time                     │ Status   │
├────────────────────────────┼──────────────────────────┼──────────┤
│ 5wHxyz...                  │ 2024-01-15T10:30:45.000Z │ ✅ OK    │
│ 3kJabc...                  │ 2024-01-15T09:15:22.000Z │ ✅ OK    │
│ 7mNdef...                  │ 2024-01-14T16:45:10.000Z │ ❌ FAILED│
└────────────────────────────┴──────────────────────────┴──────────┘
```

---

### Compliance (SSS-2)

These commands require SSS-2 preset (Compliant) features to be enabled.

#### `blacklist add`

Add an address to the on-chain blacklist.

```bash
sss-token blacklist add <address> --reason <reason>
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `address` | Wallet address to blacklist |

**Options:**

| Option | Required | Description |
|--------|----------|-------------|
| `--reason <reason>` | ✅ | Reason for blacklisting (stored on-chain) |

**Examples:**

```bash
sss-token blacklist add SuspiciousPubkey --reason "OFAC SDN match"

sss-token blacklist add WalletPubkey --reason "Fraud investigation - Case #12345"
```

**Output:**

```
✓ Address blacklisted: SuspiciousPubkey
✓ Reason: OFAC SDN match
TX: https://explorer.solana.com/tx/4pK...?cluster=devnet
```

---

#### `blacklist remove`

Remove an address from the blacklist.

```bash
sss-token blacklist remove <address>
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `address` | Wallet address to remove from blacklist |

**Examples:**

```bash
sss-token blacklist remove ClearedPubkey
```

**Output:**

```
✓ Address removed from blacklist: ClearedPubkey
TX: https://explorer.solana.com/tx/6tR...?cluster=devnet
```

---

#### `blacklist check`

Check if an address is currently blacklisted.

```bash
sss-token blacklist check <address>
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `address` | Wallet address to check |

**Examples:**

```bash
# Check blacklisted address
sss-token blacklist check SuspiciousPubkey

# Check clean address
sss-token blacklist check CleanPubkey
```

**Output (Blacklisted):**

```
┌─────────┬──────────────────────────────────────────────────┐
│ Field   │ Value                                            │
├─────────┼──────────────────────────────────────────────────┤
│ Status  │ 🔴 BLACKLISTED                                   │
│ Address │ SuspiciousPubkey                                 │
│ Reason  │ OFAC SDN match                                   │
│ Since   │ 2024-01-15T10:30:45.000Z                         │
└─────────┴──────────────────────────────────────────────────┘
```

**Output (Not Blacklisted):**

```
✓ ✅ CleanPubkey is NOT blacklisted
```

---

#### `hook init`

Initialize the transfer hook's ExtraAccountMetaList PDA. Required once after mint creation for SSS-2.

```bash
sss-token hook init
```

**Examples:**

```bash
sss-token hook init
```

**Output:**

```
✓ Transfer hook initialized
✓ ExtraAccountMetaList PDA created — blacklist checks are now active on all transfers
TX: https://explorer.solana.com/tx/8kL...?cluster=devnet
```

---

#### `seize`

Seize tokens from an account using the permanent delegate authority. Typically used for recovering funds from blacklisted accounts.

```bash
sss-token seize <fromTokenAccount> --to <toTokenAccount> --amount <amount>
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `fromTokenAccount` | Token account to seize from |

**Options:**

| Option | Required | Description |
|--------|----------|-------------|
| `--to <tokenAccount>` | ✅ | Treasury token account to receive funds |
| `--amount <amount>` | ✅ | Amount to seize in token units |

**Examples:**

```bash
sss-token seize SuspiciousTokenAccount \
  --to TreasuryTokenAccount \
  --amount 50000
```

**Output:**

```
✓ Seized 50,000 USDC from SuspiciousTokenAccount
TX: https://explorer.solana.com/tx/9pQ...?cluster=devnet
```

---

### Privacy (SSS-3)

These commands require SSS-3 preset (Private) features to be enabled.

#### `privacy approve`

Approve a token account for confidential transfers. Requires master authority.

```bash
sss-token privacy approve <tokenAccount>
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `tokenAccount` | Token account to approve |

**Examples:**

```bash
sss-token privacy approve TokenAccountPubkey
```

**Output:**

```
✓ Account approved for confidential transfers: TokenAccountPubkey
TX: https://explorer.solana.com/tx/2kM...?cluster=devnet
```

---

#### `privacy enable-credits`

Enable receiving confidential transfers for a token account. Must be signed by account owner.

```bash
sss-token privacy enable-credits <tokenAccount>
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `tokenAccount` | Token account to enable |

**Examples:**

```bash
sss-token privacy enable-credits MyTokenAccount
```

**Output:**

```
✓ Confidential credits enabled: MyTokenAccount
TX: https://explorer.solana.com/tx/3nL...?cluster=devnet
```

---

#### `privacy disable-credits`

Disable receiving confidential transfers for a token account.

```bash
sss-token privacy disable-credits <tokenAccount>
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `tokenAccount` | Token account to disable |

**Examples:**

```bash
sss-token privacy disable-credits MyTokenAccount
```

**Output:**

```
✓ Confidential credits disabled: MyTokenAccount
TX: https://explorer.solana.com/tx/5tP...?cluster=devnet
```

---

### Oracle Management

Manage price oracles for non-USD pegged stablecoins (EUR, BRL, Gold, CPI, etc.).

#### `oracle init`

Initialize the oracle module for your stablecoin.

```bash
sss-token oracle init [options]
```

**Options:**

| Option | Required | Description | Default |
|--------|----------|-------------|---------|
| `--base <currency>` | ✅ | Base currency (e.g., EUR, BRL, XAU) | — |
| `--quote <currency>` | ✅ | Quote currency (e.g., USD) | — |
| `--staleness <seconds>` | ❌ | Maximum price staleness | `300` |
| `--confidence <bps>` | ❌ | Maximum confidence interval in basis points | `100` |
| `--method <method>` | ❌ | Aggregation method: `median`, `mean`, `weighted` | `median` |
| `--mint-premium <bps>` | ❌ | Mint premium in basis points | `0` |
| `--redeem-discount <bps>` | ❌ | Redeem discount in basis points | `0` |
| `--circuit-breaker <bps>` | ❌ | Max single-crank price change (0 = disabled) | `500` |
| `--deviation <bps>` | ❌ | Max deviation threshold (0 = disabled) | `0` |

**Examples:**

```bash
# Initialize EUR/USD oracle
sss-token oracle init --base EUR --quote USD

# Initialize with custom parameters
sss-token oracle init \
  --base BRL \
  --quote USD \
  --staleness 600 \
  --method weighted \
  --circuit-breaker 1000
```

**Output:**

```
✓ Oracle initialized: EUR/USD
✓ Aggregation: median
✓ Staleness: 300s
TX: https://explorer.solana.com/tx/7uQ...?cluster=devnet
```

---

#### `oracle status`

Display oracle configuration and current state.

```bash
sss-token oracle status
```

**Output:**

```
┌───────────────────────┬──────────────────────────────────────────────────┐
│ Field                 │ Value                                            │
├───────────────────────┼──────────────────────────────────────────────────┤
│ Currency Pair         │ EUR/USD                                          │
│ Version               │ 1                                                │
│ Authority             │ 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM     │
│ Pending Authority     │ (none)                                           │
│ Paused                │ 🟢 NO                                            │
│ Feed Count            │ 3                                                │
│ Aggregation Method    │ Median                                           │
│ Max Staleness         │ 300s                                             │
│ Max Confidence        │ 100 bps                                          │
│ Mint Premium          │ 0 bps                                            │
│ Redeem Discount       │ 0 bps                                            │
│ Max Price Change      │ 500 bps                                          │
│ Deviation Threshold   │ 0 bps                                            │
│ Last Aggregated Price │ 1085000000                                       │
│ Last Aggregation Time │ 2024-01-15T10:30:45.000Z                         │
└───────────────────────┴──────────────────────────────────────────────────┘
```

---

#### `oracle update`

Update oracle configuration parameters.

```bash
sss-token oracle update [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--staleness <seconds>` | Max staleness in seconds |
| `--confidence <bps>` | Max confidence interval in bps |
| `--method <method>` | Aggregation method: `median`, `mean`, `weighted` |
| `--mint-premium <bps>` | Mint premium in bps |
| `--redeem-discount <bps>` | Redeem discount in bps |
| `--circuit-breaker <bps>` | Max single-crank price change in bps |
| `--deviation <bps>` | Max deviation threshold in bps |
| `--pause` | Pause oracle |
| `--unpause` | Unpause oracle |

**Examples:**

```bash
# Update staleness threshold
sss-token oracle update --staleness 600

# Pause oracle
sss-token oracle update --pause

# Update multiple parameters
sss-token oracle update \
  --confidence 150 \
  --circuit-breaker 750 \
  --unpause
```

**Output:**

```
✓ Oracle config updated
TX: https://explorer.solana.com/tx/1mN...?cluster=devnet
```

---

#### `oracle add-feed`

Add a price feed source to the oracle.

```bash
sss-token oracle add-feed [options]
```

**Options:**

| Option | Required | Description | Default |
|--------|----------|-------------|---------|
| `--index <n>` | ✅ | Feed index (0-255) | — |
| `--type <type>` | ✅ | Feed type: `switchboard`, `pyth`, `chainlink`, `manual`, `api` | — |
| `--address <pubkey>` | ✅ | Feed address (PublicKey for on-chain feeds) | — |
| `--label <label>` | ❌ | Human-readable label | `""` |
| `--weight <n>` | ❌ | Weight for weighted mean aggregation | `1` |
| `--staleness <seconds>` | ❌ | Per-feed staleness override (0 = use global) | `0` |

**Examples:**

```bash
# Add Pyth feed
sss-token oracle add-feed \
  --index 0 \
  --type pyth \
  --address PythFeedPubkey \
  --label "Pyth EUR/USD"

# Add Switchboard feed with custom weight
sss-token oracle add-feed \
  --index 1 \
  --type switchboard \
  --address SwitchboardFeedPubkey \
  --label "Switchboard EUR/USD" \
  --weight 2
```

**Output:**

```
✓ Feed added: pyth at index 0
TX: https://explorer.solana.com/tx/6tR...?cluster=devnet
```

---

#### `oracle remove-feed`

Remove a price feed from the oracle.

```bash
sss-token oracle remove-feed <index>
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `index` | Feed index to remove |

**Examples:**

```bash
sss-token oracle remove-feed 1
```

**Output:**

```
✓ Feed 1 removed
TX: https://explorer.solana.com/tx/8kL...?cluster=devnet
```

---

#### `oracle feeds`

List all registered price feeds.

```bash
sss-token oracle feeds
```

**Output:**

```
┌───────┬────────────┬──────────────────────────────────────────────────┬──────────────────┬─────────┬────────┬─────────────┬──────────────────────────┐
│ Index │ Type       │ Address                                          │ Label            │ Enabled │ Weight │ Last Price  │ Last Update              │
├───────┼────────────┼──────────────────────────────────────────────────┼──────────────────┼─────────┼────────┼─────────────┼──────────────────────────┤
│ 0     │ Pyth       │ H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG     │ Pyth EUR/USD     │ 🟢 Yes  │ 1      │ 1085000000  │ 2024-01-15T10:30:45.000Z │
│ 1     │ Switchboard│ GvDMxPzN1sCj7L26YDK2HnMRXEQmQ2aemov8YBtPS7vR     │ Switchboard EUR  │ 🟢 Yes  │ 2      │ 1084500000  │ 2024-01-15T10:30:40.000Z │
│ 2     │ Manual     │ 11111111111111111111111111111111                 │ Manual Override  │ 🔴 No   │ 1      │ (none)      │ (none)                   │
└───────┴────────────┴──────────────────────────────────────────────────┴──────────────────┴─────────┴────────┴─────────────┴──────────────────────────┘
```

---

#### `oracle crank`

Push a price observation to a feed.

```bash
sss-token oracle crank <index> --price <price> [options]
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `index` | Feed index to crank |

**Options:**

| Option | Required | Description | Default |
|--------|----------|-------------|---------|
| `--price <price>` | ✅ | Price value (9-decimal fixed-point) | — |
| `--confidence <confidence>` | ❌ | Confidence interval | `0` |

**Examples:**

```bash
# Push price 1.085 (1085000000 in 9-decimal fixed-point)
sss-token oracle crank 0 --price 1085000000

# Push with confidence
sss-token oracle crank 0 --price 1085000000 --confidence 500000
```

**Output:**

```
✓ Feed 0 cranked with price 1085000000
TX: https://explorer.solana.com/tx/9pQ...?cluster=devnet
```

---

#### `oracle set-manual`

Set a manual price override. Authority only.

```bash
sss-token oracle set-manual --price <price> [options]
```

**Options:**

| Option | Required | Description | Default |
|--------|----------|-------------|---------|
| `--price <price>` | ✅ | Manual price (9-decimal fixed-point) | — |
| `--active` | ❌ | Activate manual override | `false` |
| `--no-active` | ❌ | Deactivate manual override | — |

**Examples:**

```bash
# Set and activate manual price
sss-token oracle set-manual --price 1090000000 --active

# Set but keep inactive
sss-token oracle set-manual --price 1090000000

# Deactivate manual override
sss-token oracle set-manual --price 0 --no-active
```

**Output:**

```
✓ Manual price set: 1090000000 (active)
TX: https://explorer.solana.com/tx/2kM...?cluster=devnet
```

---

#### `oracle price`

Get the current mint or redeem price.

```bash
sss-token oracle price [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--side <side>` | Price side: `mint` or `redeem` | `mint` |

**Examples:**

```bash
# Get mint price
sss-token oracle price

# Get redeem price
sss-token oracle price --side redeem
```

**Output:**

```
✓ MINT price: 1085500000
```

---

#### `oracle transfer-authority`

Initiate oracle authority transfer (step 1 of 2).

```bash
sss-token oracle transfer-authority <newAuthority>
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `newAuthority` | Public key of the new oracle authority |

**Examples:**

```bash
sss-token oracle transfer-authority NewOracleAuthorityPubkey
```

**Output:**

```
✓ Oracle authority transfer initiated → NewOracleAuthorityPubkey
✓ The new authority must call "sss-token oracle accept-authority" to complete
TX: https://explorer.solana.com/tx/3nL...?cluster=devnet
```

---

#### `oracle accept-authority`

Accept pending oracle authority transfer (step 2 of 2).

```bash
sss-token oracle accept-authority
```

**Examples:**

```bash
sss-token -k ~/new-oracle-authority.json oracle accept-authority
```

**Output:**

```
✓ Oracle authority transfer accepted — you are now the oracle authority
TX: https://explorer.solana.com/tx/5tP...?cluster=devnet
```

---

#### `oracle close`

Close the oracle and reclaim rent. All feeds must be removed first.

```bash
sss-token oracle close
```

**Examples:**

```bash
sss-token oracle close
```

**Output:**

```
✓ Oracle closed — rent reclaimed
TX: https://explorer.solana.com/tx/7uQ...?cluster=devnet
```

---

### Terminal UI

#### `tui`

Launch the interactive Terminal User Interface for real-time monitoring.

```bash
sss-token tui
```

**Requirements:**

- `blessed` and `blessed-contrib` npm packages (installed automatically)

**Features:**

- Real-time token info display
- Live supply chart
- Minter status table
- Role assignments
- Activity log
- Auto-refresh every 5 seconds

**Key Bindings:**

| Key | Action |
|-----|--------|
| `q` | Quit |
| `Ctrl+C` | Quit |
| `r` | Manual refresh |

**Examples:**

```bash
# Launch TUI with default settings
sss-token tui

# Launch TUI for specific mint
sss-token -m MintPubkey tui
```

---

## Presets

The CLI supports three standard presets that configure different feature combinations:

### SSS-1 (Minimal)

Basic stablecoin functionality without compliance or privacy features.

**Features:**
- Minting and burning
- Freeze/thaw accounts
- Global pause
- Role-based access control

**Use Case:** Simple tokens, test environments, basic issuance.

```bash
sss-token init --preset sss-1 --name "Simple Dollar" --symbol "SUSD"
```

---

### SSS-2 (Compliant)

Full regulatory compliance features including blacklist and asset seizure.

**Features:**
- All SSS-1 features
- Permanent delegate (asset seizure)
- Transfer hook (blacklist enforcement)
- On-chain blacklist PDAs

**Use Case:** Regulated stablecoins, institutional tokens, OFAC compliance.

```bash
sss-token init \
  --preset sss-2 \
  --name "Compliant Dollar" \
  --symbol "CUSD" \
  --transfer-hook-program <HOOK_PROGRAM_ID>
```

---

### SSS-3 (Private)

Privacy-enhanced tokens using confidential transfers.

**Features:**
- All SSS-1 features
- Confidential transfers (encrypted balances)
- Optional auditor key for regulatory visibility
- Auto-approve or manual approval modes

**Use Case:** Privacy-focused tokens, CBDC pilots, selective disclosure.

```bash
sss-token init \
  --preset sss-3 \
  --name "Private Dollar" \
  --symbol "PUSD" \
  --auto-approve
```

---

## Custom Configuration

Create tokens with custom feature combinations using TOML or JSON configuration files.

### TOML Configuration Example

```toml
# my-stablecoin.toml

name = "Euro Stablecoin"
symbol = "EURC"
decimals = 6
uri = "https://example.com/metadata.json"

# Extensions
enable_permanent_delegate = true
enable_transfer_hook = true
default_account_frozen = false
transfer_hook_program_id = "F8wwXWp8JUKVrDPwFCpG2NrheV3X7KKatoDuiYeBigkf"

# Privacy (optional)
enable_confidential_transfers = false
confidential_transfer_auto_approve = false
# auditor_elgamal_pubkey = "hex_encoded_pubkey"
```

### JSON Configuration Example

```json
{
  "name": "Euro Stablecoin",
  "symbol": "EURC",
  "decimals": 6,
  "uri": "https://example.com/metadata.json",
  "enable_permanent_delegate": true,
  "enable_transfer_hook": true,
  "default_account_frozen": false,
  "transfer_hook_program_id": "F8wwXWp8JUKVrDPwFCpG2NrheV3X7KKatoDuiYeBigkf",
  "enable_confidential_transfers": false,
  "confidential_transfer_auto_approve": false
}
```

### Using Custom Configuration

```bash
# TOML requires @iarna/toml package
pnpm add @iarna/toml

sss-token init --custom ./my-stablecoin.toml --name "Euro Coin" --symbol "EURC"
```

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SOLANA_RPC_URL` | Default RPC endpoint | `https://api.mainnet-beta.solana.com` |
| `SOLANA_KEYPAIR_PATH` | Default keypair path | `~/.config/solana/id.json` |
| `STABLECOIN_MINT` | Default mint address | `7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU` |

### Setting Up Environment

```bash
# Add to ~/.bashrc or ~/.zshrc
export SOLANA_RPC_URL="https://api.devnet.solana.com"
export SOLANA_KEYPAIR_PATH="~/.config/solana/id.json"
export STABLECOIN_MINT="YourMintAddress..."

# Reload shell
source ~/.bashrc
```

---

## Examples

### Complete Workflow: Creating and Managing a Compliant Stablecoin

```bash
# 1. Initialize the stablecoin
sss-token init \
  --preset sss-2 \
  --name "Regulated Dollar" \
  --symbol "RGUSD" \
  --decimals 6 \
  --transfer-hook-program F8wwXWp8JUKVrDPwFCpG2NrheV3X7KKatoDuiYeBigkf

# 2. Save the mint address
export STABLECOIN_MINT="<output_mint_address>"

# 3. Initialize transfer hook
sss-token hook init

# 4. Add Metaplex metadata for wallet display
sss-token metadata init \
  --name "Regulated Dollar" \
  --symbol "RGUSD" \
  --uri "https://arweave.net/metadata..." \
  --mint-keypair ./mint.json

# 5. Add authorized minters
sss-token minters add MinterWallet1 --quota 1000000
sss-token minters add MinterWallet2 --quota 500000

# 6. Delegate compliance roles
sss-token roles update \
  --blacklister ComplianceTeamWallet \
  --seizer TreasuryWallet

# 7. Mint initial supply
sss-token mint TreasuryWallet 100000

# 8. Check status
sss-token status
```

### Oracle Setup for EUR-Pegged Stablecoin

```bash
# 1. Initialize oracle
sss-token oracle init \
  --base EUR \
  --quote USD \
  --method median \
  --staleness 300 \
  --circuit-breaker 500

# 2. Add Pyth feed
sss-token oracle add-feed \
  --index 0 \
  --type pyth \
  --address GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU \
  --label "Pyth EUR/USD"

# 3. Add Switchboard feed
sss-token oracle add-feed \
  --index 1 \
  --type switchboard \
  --address SwitchboardFeedAddress \
  --label "Switchboard EUR/USD" \
  --weight 2

# 4. Check feeds
sss-token oracle feeds

# 5. Get current price
sss-token oracle price --side mint
```

### Emergency Operations

```bash
# Pause all operations
sss-token pause --reason "Security incident investigation"

# Blacklist suspicious address
sss-token blacklist add SuspiciousWallet --reason "Fraud - Case #789"

# Seize funds to treasury
sss-token seize SuspiciousTokenAccount \
  --to TreasuryTokenAccount \
  --amount 50000

# Resume operations
sss-token unpause
```

### Multi-sig Workflow (Authority Transfer)

```bash
# Current authority initiates transfer
sss-token -k ~/current-authority.json roles transfer NewAuthorityPubkey

# New authority accepts (different machine/person)
sss-token -k ~/new-authority.json roles accept
```

---

## Troubleshooting

### Common Errors

**"No mint address provided"**
```bash
# Solution: Provide mint via flag or environment variable
export STABLECOIN_MINT="YourMintAddress"
# or
sss-token -m YourMintAddress status
```

**"Keypair file not found"**
```bash
# Solution: Check keypair path
sss-token -k /correct/path/to/keypair.json status
```

**"Insufficient funds"**
```bash
# Solution: Fund your wallet with SOL for transaction fees
solana airdrop 2 --url devnet  # Devnet only
```

**"Program account does not exist"**
```bash
# Solution: Ensure the mint was initialized properly
sss-token status  # Verify mint exists
```

### Debug Mode

For verbose output, set the `DEBUG` environment variable:

```bash
DEBUG=* sss-token status
```

---

## Testing & Verification

To verify CLI functionality step-by-step, see:
- [CLI Testing Guide](./testing/CLI_TEST.md) — Phase-based verification manual for all commands.

---

## Support

- **Documentation:** [Unified Docs](../README.md)
- **GitHub Issues:** [exyreams/solana-stablecoin-standard/issues](https://github.com/exyreams/solana-stablecoin-standard/issues)
- **Discord:** [Superteam Community](https://discord.gg/superteam)