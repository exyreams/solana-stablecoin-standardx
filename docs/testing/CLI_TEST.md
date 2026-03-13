# SSS CLI Testing Guide (Complete Verification)

This comprehensive guide provides step-by-step instructions for verifying all Solana Stablecoin Standard (SSS) functionality using the `sss-token` CLI.

**Caliber**: Production-Grade Verification  
**Target Audience**: Protocol Administrators, DevOps, Security Auditors  
**Test Address**: `Cpj1RneABzEthffn7V7iC4Jquy1ZqYpvD9HXXooPMFgi`

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase 0: Environment Setup](#phase-0-environment-setup)
3. [Phase 1: Stablecoin Initialization](#phase-1-stablecoin-initialization)
4. [Phase 2: Metadata Management](#phase-2-metadata-management)
5. [Phase 3: Role Management](#phase-3-role-management)
6. [Phase 4: Minter Management](#phase-4-minter-management)
7. [Phase 5: Supply Operations](#phase-5-supply-operations)
8. [Phase 6: Compliance - Pause/Unpause](#phase-6-compliance---pauseunpause)
9. [Phase 7: Compliance - Freeze/Thaw](#phase-7-compliance---freezethaw)
10. [Phase 8: Advanced Compliance (SSS-2)](#phase-8-advanced-compliance-sss-2)
11. [Phase 9: Oracle Integration](#phase-9-oracle-integration)
12. [Phase 10: Privacy Operations (SSS-3)](#phase-10-privacy-operations-sss-3)
13. [Phase 11: Monitoring & Information](#phase-11-monitoring--information)
14. [Phase 12: Protocol Decommissioning](#phase-12-protocol-decommissioning)
15. [Complete Command Reference](#complete-command-reference)
16. [Testing Checklist](#testing-checklist)
17. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### 1. Tooling
- **Solana CLI**: `solana --version` (1.17.x or later)
- **Node.js**: v18+ for running from source
- **pnpm**: Package manager for monorepo
- **RPC Endpoint**: Fast Devnet/Mainnet RPC (Helius, Alchemy, Triton)

### 2. Assets
- **Admin Keypair**: JSON keypair with ≥0.5 SOL for rent/fees
- **Test Wallets**: 2+ secondary addresses for recipient/seizure testing
- **Mint Keypair**: Required for Metaplex metadata initialization

### 3. Installation

#### Option A: From Source (Recommended for Testing)
```bash
git clone https://github.com/exyreams/solana-stablecoin-standard.git
cd solana-stablecoin-standard
pnpm install
pnpm build

# Run CLI from source
alias sss-token="node packages/cli/dist/index.js"
```

#### Option B: Global Install (Future)
```bash
npm install -g @stbr/sss-token-cli
```



---

## Phase 0: Environment Setup

### 0.1 Verify Solana CLI
```bash
solana --version
```
**Expected Output**: `solana-cli 3.0.x` or later

### 0.2 Check Wallet Balance
```bash
solana balance
```
**Expected Output**: Balance > 0.5 SOL (for devnet testing)

**If insufficient**:
```bash
solana airdrop 2
```

### 0.3 Verify RPC Configuration
```bash
solana config get
```
**Expected Output**:
```
Config File: /home/user/.config/solana/cli/config.yml
RPC URL: https://api.devnet.solana.com 
WebSocket URL: wss://api.devnet.solana.com/ (computed)
Keypair Path: /home/user/.config/solana/id.json 
Commitment: confirmed
```

### 0.4 Test CLI Installation
```bash
sss-token --version
```
**Expected Output**: `0.1.0`

### 0.5 Set Environment Variables

**Option A: Using .env file (Recommended)**
```bash
# Copy example file
cp packages/cli/.env.example packages/cli/.env

# Edit .env file
nano packages/cli/.env
```

Edit the values:
```env
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_KEYPAIR_PATH=~/.config/solana/id.json
STABLECOIN_MINT=  # Will be set after mint creation
```

**Option B: Export manually**
```bash
export SOLANA_RPC_URL="https://api.devnet.solana.com"
export SOLANA_KEYPAIR_PATH="~/.config/solana/id.json"
# Will be set after mint creation
# export STABLECOIN_MINT="<mint_address>"
```

---

## Phase 1: Stablecoin Initialization

### 1.1 Initialize SSS-1 (Minimal) Stablecoin
```bash
sss-token init \
  --name "Test Dollar Minimal" \
  --symbol "TDOL" \
  --preset sss-1 \
  --decimals 6
```

**Expected Output:**
```
✔ Stablecoin initialized!
┌────────┬──────────────────────────────────────────────┐
│ Field  │ Value                                        │
├────────┼──────────────────────────────────────────────┤
│ Mint   │ 2qfDMPMeK6SmyK9DPi8Pe8y1rjHJZFASDREw5K2frVag │
├────────┼──────────────────────────────────────────────┤
│ Name   │ Test Dollar Minimal                          │
├────────┼──────────────────────────────────────────────┤
│ Symbol │ TDOL                                         │
├────────┼──────────────────────────────────────────────┤
│ Preset │ SSS-1 (Minimal)                              │
└────────┴──────────────────────────────────────────────┘

Set this as your default mint:
  export STABLECOIN_MINT=2qfDMPMeK6SmyK9DPi8Pe8y1rjHJZFASDREw5K2frVag
```

**Action**: Copy and run the export command

### 1.2 Initialize SSS-2 (Compliant) Stablecoin
```bash
sss-token init \
  --name "Verification Dollar" \
  --symbol "VUSD" \
  --preset sss-2 \
  --decimals 6 \
  --transfer-hook-program HPksBobjquMqBfnCgpqBQDkomJ4HmGB1AbvJnemNBEig
```

**Expected Output:**
```
✔ Stablecoin initialized!
┌────────┬──────────────────────────────────────────────┐
│ Field  │ Value                                        │
├────────┼──────────────────────────────────────────────┤
│ Mint   │ 8BsWy9Z5PdXMwz6gcHEgDZicD5rFSEvyxGrUnyddgzF3 │
├────────┼──────────────────────────────────────────────┤
│ Name   │ Verification Dollar                          │
├────────┼──────────────────────────────────────────────┤
│ Symbol │ VUSD                                         │
├────────┼──────────────────────────────────────────────┤
│ Preset │ SSS-2 (Compliant)                            │
└────────┴──────────────────────────────────────────────┘

Set this as your default mint:
  export STABLECOIN_MINT=8BsWy9Z5PdXMwz6gcHEgDZicD5rFSEvyxGrUnyddgzF3
```

**Note**: SSS-2 requires `--transfer-hook-program` for blacklist enforcement.

**Action**: Export the mint address
```bash
export STABLECOIN_MINT=8BsWy9Z5PdXMwz6gcHEgDZicD5rFSEvyxGrUnyddgzF3
```

### 1.3 Initialize SSS-3 (Private) Stablecoin
```bash
sss-token init \
  --name "Private Dollar" \
  --symbol "PDOL" \
  --preset sss-3 \
  --decimals 6 \
  --auto-approve
```

**Expected Output**: Similar to above with `SSS-3 (Private)` preset label.

**Note**: SSS-3 enables confidential transfers. Use `--auto-approve` to automatically approve new accounts.

### 1.4 Initialize with Custom Config (Advanced)
```bash
# Create custom config file
cat > custom-config.toml <<EOF
name = "Custom Stablecoin"
symbol = "CSTB"
decimals = 9
uri = "https://arweave.net/custom"
enable_permanent_delegate = true
enable_transfer_hook = false
default_account_frozen = false
enable_confidential_transfers = false
EOF

sss-token init --custom custom-config.toml
```

**Use Case**: Fine-grained control over Token-2022 extensions.



---

## Phase 2: Metadata Management

Metaplex metadata enables wallet display (Phantom, Solflare, etc.).

### 2.1 Initialize Metaplex Metadata
```bash
sss-token metadata init \
  --name "Verification Dollar" \
  --symbol "VUSD" \
  --uri "https://pastebin.com/raw/ZHzHzyK2" \
  --mint $STABLECOIN_MINT \
  --mint-keypair ./packages/cli/mint-keypair.json
```

**Expected Output:**
```
✔ Metaplex metadata initialized successfully!

Metadata Details:
────────────────────────────────────────────────────────────
Name:          Verification Dollar
Symbol:        VUSD
URI:           https://pastebin.com/raw/ZHzHzyK2
Metadata PDA:  <METADATA_PDA_ADDRESS>
────────────────────────────────────────────────────────────

✓ Your token will now display in wallets (Phantom, Solflare, etc.)
  Note: It may take a few minutes for wallets to index the metadata.

⚠ Important: Keep your mint keypair secure!
  The mint keypair was required for this one-time metadata creation.
```

**Note**: The mint keypair is required because Metaplex metadata requires the mint authority signature. This is a one-time operation.

### 2.2 Verify Metadata (On-Chain)
```bash
solana account <METADATA_PDA_ADDRESS>
```

**Check**: Account should exist with data.

### 2.3 Test Wallet Display
1. Import token in Phantom: Settings → Manage Token List → Add Custom Token
2. Enter mint address: `$STABLECOIN_MINT`
3. Verify name, symbol, and image display correctly

---

## Phase 3: Role Management

SSS uses role-based access control (RBAC) for security.

### 3.1 View Current Roles
```bash
sss-token roles show --mint $STABLECOIN_MINT
```

**Expected Output:**
```
┌─────────────────────┬──────────────────────────────────────────────┐
│ Role                │ Address                                      │
├─────────────────────┼──────────────────────────────────────────────┤
│ Master Authority    │ 6rqcaPUEdcyAp8u3bw8xeMKtSRYB7jxXt1xb51YWbYmP │
├─────────────────────┼──────────────────────────────────────────────┤
│ Pending Master      │ (none)                                       │
├─────────────────────┼──────────────────────────────────────────────┤
│ Burner              │ 6rqcaPUEdcyAp8u3bw8xeMKtSRYB7jxXt1xb51YWbYmP │
├─────────────────────┼──────────────────────────────────────────────┤
│ Pauser              │ 6rqcaPUEdcyAp8u3bw8xeMKtSRYB7jxXt1xb51YWbYmP │
├─────────────────────┼──────────────────────────────────────────────┤
│ Blacklister (SSS-2) │ 6rqcaPUEdcyAp8u3bw8xeMKtSRYB7jxXt1xb51YWbYmP │
├─────────────────────┼──────────────────────────────────────────────┤
│ Seizer (SSS-2)      │ 6rqcaPUEdcyAp8u3bw8xeMKtSRYB7jxXt1xb51YWbYmP │
└─────────────────────┴──────────────────────────────────────────────┘
```

**Note**: By default, all roles are assigned to the master authority.

### 3.2 Update Roles (Delegation)
```bash
sss-token roles update \
  --mint $STABLECOIN_MINT \
  --burner Cpj1RneABzEthffn7V7iC4Jquy1ZqYpvD9HXXooPMFgi \
  --pauser Cpj1RneABzEthffn7V7iC4Jquy1ZqYpvD9HXXooPMFgi
```

**Expected Output:**
```
✔ Roles updated
burner: Cpj1RneABzEthffn7V7iC4Jquy1ZqYpvD9HXXooPMFgi
pauser: Cpj1RneABzEthffn7V7iC4Jquy1ZqYpvD9HXXooPMFgi

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

### 3.3 Verify Role Update
```bash
sss-token roles show --mint $STABLECOIN_MINT
```

**Check**: Burner and Pauser should now show the new address.

### 3.4 Transfer Master Authority (Step 1 of 2)
```bash
sss-token roles transfer \
  --mint $STABLECOIN_MINT \
  Cpj1RneABzEthffn7V7iC4Jquy1ZqYpvD9HXXooPMFgi
```

**Expected Output:**
```
✔ Authority transfer initiated → Cpj1RneABzEthffn7V7iC4Jquy1ZqYpvD9HXXooPMFgi
The new master must call "sss-token roles accept" to complete the transfer

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

**Note**: This is a two-step process to prevent accidental lockout.

### 3.5 Accept Master Authority (Step 2 of 2)
```bash
# Switch to new authority keypair
sss-token roles accept \
  --mint $STABLECOIN_MINT \
  --keypair /path/to/new/authority/keypair.json
```

**Expected Output:**
```
✔ Authority transfer accepted — you are now the master authority

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

**For Testing**: Skip this step unless you have the new authority's keypair.



---

## Phase 4: Minter Management

Minters are authorized addresses that can mint tokens, each with an optional quota.

### 4.1 List Minters (Initially Empty)
```bash
sss-token minters list --mint $STABLECOIN_MINT
```

**Expected Output:**
```
✔ No minters registered
```

### 4.2 Add Minter with Quota
```bash
sss-token minters add \
  --mint $STABLECOIN_MINT \
  Cpj1RneABzEthffn7V7iC4Jquy1ZqYpvD9HXXooPMFgi \
  --quota 5000000
```

**Expected Output:**
```
✔ Minter added: Cpj1RneABzEthffn7V7iC4Jquy1ZqYpvD9HXXooPMFgi
Quota: 5000000 VUSD

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

**Note**: Quota is in token units (not lamports). `5000000` = 5 million VUSD.

### 4.3 Add Minter with Unlimited Quota
```bash
sss-token minters add \
  --mint $STABLECOIN_MINT \
  7sXy8Z6QeYNxz7hdHFhEZjdE6sFTFwFzxHsVozeehAnQ \
  --quota 0
```

**Expected Output:**
```
✔ Minter added: 7sXy8Z6QeYNxz7hdHFhEZjdE6sFTFwFzxHsVozeehAnQ
Quota: Unlimited

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

**Note**: `--quota 0` means unlimited minting.

### 4.4 List All Minters
```bash
sss-token minters list --mint $STABLECOIN_MINT
```

**Expected Output:**
```
┌──────────────────────────────────────────────┬────────────┬───────────┬────────┐
│ Minter                                       │ Status     │ Quota     │ Minted │
├──────────────────────────────────────────────┼────────────┼───────────┼────────┤
│ Cpj1RneABzEthffn7V7iC4Jquy1ZqYpvD9HXXooPMFgi │ 🟢 Active  │ 5,000,000 │ 0      │
├──────────────────────────────────────────────┼────────────┼───────────┼────────┤
│ 7sXy8Z6QeYNxz7hdHFhEZjdE6sFTFwFzxHsVozeehAnQ │ 🟢 Active  │ Unlimited │ 0      │
└──────────────────────────────────────────────┴────────────┴───────────┴────────┘
```

### 4.5 Update Minter Quota
```bash
sss-token minters update \
  --mint $STABLECOIN_MINT \
  Cpj1RneABzEthffn7V7iC4Jquy1ZqYpvD9HXXooPMFgi \
  --quota 10000000 \
  --active
```

**Expected Output:**
```
✔ Minter updated: Cpj1RneABzEthffn7V7iC4Jquy1ZqYpvD9HXXooPMFgi
Quota: 10000000
Active: true

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

### 4.6 Deactivate Minter (Without Removing)
```bash
sss-token minters update \
  --mint $STABLECOIN_MINT \
  7sXy8Z6QeYNxz7hdHFhEZjdE6sFTFwFzxHsVozeehAnQ \
  --quota 0 \
  --no-active
```

**Expected Output:**
```
✔ Minter updated: 7sXy8Z6QeYNxz7hdHFhEZjdE6sFTFwFzxHsVozeehAnQ
Quota: 0
Active: false

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

**Note**: Inactive minters cannot mint tokens but their PDA remains on-chain.

### 4.7 Reset Minted Counter
```bash
sss-token minters update \
  --mint $STABLECOIN_MINT \
  Cpj1RneABzEthffn7V7iC4Jquy1ZqYpvD9HXXooPMFgi \
  --quota 10000000 \
  --active \
  --reset-minted
```

**Expected Output:**
```
✔ Minter updated: Cpj1RneABzEthffn7V7iC4Jquy1ZqYpvD9HXXooPMFgi
Quota: 10000000
Active: true
Minted counter reset to 0

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

**Use Case**: Reset quota usage without changing the limit.

### 4.8 Remove Minter (Close PDA)
```bash
sss-token minters remove \
  --mint $STABLECOIN_MINT \
  7sXy8Z6QeYNxz7hdHFhEZjdE6sFTFwFzxHsVozeehAnQ
```

**Expected Output:**
```
✔ Minter removed: 7sXy8Z6QeYNxz7hdHFhEZjdE6sFTFwFzxHsVozeehAnQ
MinterQuota PDA closed, rent reclaimed

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

**Note**: Closes the PDA and reclaims rent (~0.002 SOL).



---

## Phase 5: Supply Operations

### 5.1 Check Initial Supply
```bash
sss-token supply --mint $STABLECOIN_MINT
```

**Expected Output:**
```
✔ Total supply: 0 VUSD
```

### 5.2 Mint Tokens to Test Address
```bash
sss-token mint \
  --mint $STABLECOIN_MINT \
  Cpj1RneABzEthffn7V7iC4Jquy1ZqYpvD9HXXooPMFgi \
  1000.50
```

**Expected Output:**
```
✔ Minted 1000.50 VUSD

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

**Note**: Amount is in token units (1000.50 VUSD = 1000500000 lamports with 6 decimals).

### 5.3 Verify Supply Increased
```bash
sss-token supply --mint $STABLECOIN_MINT
```

**Expected Output:**
```
✔ Total supply: 1,000.50 VUSD
```

### 5.4 Mint Additional Tokens
```bash
sss-token mint \
  --mint $STABLECOIN_MINT \
  Cpj1RneABzEthffn7V7iC4Jquy1ZqYpvD9HXXooPMFgi \
  2500
```

**Expected Output:**
```
✔ Minted 2500 VUSD

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

### 5.5 Check Updated Supply
```bash
sss-token supply --mint $STABLECOIN_MINT
```

**Expected Output:**
```
✔ Total supply: 3,500.50 VUSD
```

### 5.6 View Token Holders
```bash
sss-token holders --mint $STABLECOIN_MINT
```

**Expected Output:**
```
✔ Found 1 holder(s)
┌──────────────────────────────────────────────┬──────────────────────────────────────────────┬──────────┬────────┐
│ Owner                                        │ Token Account                                │ Balance  │ State  │
├──────────────────────────────────────────────┼──────────────────────────────────────────────┼──────────┼────────┤
│ Cpj1RneABzEthffn7V7iC4Jquy1ZqYpvD9HXXooPMFgi │ <TOKEN_ACCOUNT_ADDRESS>                      │ 3500.50  │ active │
└──────────────────────────────────────────────┴──────────────────────────────────────────────┴──────────┴────────┘
```

**Action**: Copy the token account address for burn operations.

### 5.7 Burn Tokens
```bash
sss-token burn \
  --mint $STABLECOIN_MINT \
  500 \
  --from <TOKEN_ACCOUNT_ADDRESS>
```

**Expected Output:**
```
✔ Burned 500 VUSD

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

### 5.8 Verify Supply Decreased
```bash
sss-token supply --mint $STABLECOIN_MINT
```

**Expected Output:**
```
✔ Total supply: 3,000.50 VUSD
```

### 5.9 Test Quota Enforcement
```bash
# Try to mint beyond quota (if minter has 5M quota and already minted 3000.50)
sss-token mint \
  --mint $STABLECOIN_MINT \
  Cpj1RneABzEthffn7V7iC4Jquy1ZqYpvD9HXXooPMFgi \
  6000000
```

**Expected Behavior**: 
- If total minted (3000.50 + 6000000) exceeds quota → Error: "Quota exceeded"
- If within quota → Success

### 5.10 Check Minter Quota Usage
```bash
sss-token minters list --mint $STABLECOIN_MINT
```

**Expected Output:**
```
┌──────────────────────────────────────────────┬────────────┬───────────┬──────────┐
│ Minter                                       │ Status     │ Quota     │ Minted   │
├──────────────────────────────────────────────┼────────────┼───────────┼──────────┤
│ Cpj1RneABzEthffn7V7iC4Jquy1ZqYpvD9HXXooPMFgi │ 🟢 Active  │ 10,000,000│ 3,000.50 │
└──────────────────────────────────────────────┴────────────┴───────────┴──────────┘
```

**Check**: Minted column should reflect total minted by this minter.



---

## Phase 6: Compliance - Pause/Unpause

Global pause stops all minting and burning operations.

### 6.1 Check Current Status
```bash
sss-token status --mint $STABLECOIN_MINT
```

**Check**: Look for `Paused` field in Token Info section.

**Expected**: `Paused: 🟢 NO`

### 6.2 Pause Protocol
```bash
sss-token pause \
  --mint $STABLECOIN_MINT \
  --reason "Security audit in progress"
```

**Expected Output:**
```
✔ Stablecoin paused — minting and burning disabled

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

### 6.3 Verify Paused State
```bash
sss-token status --mint $STABLECOIN_MINT
```

**Expected**: `Paused: 🔴 YES`

### 6.4 Test Mint While Paused (Should Fail)
```bash
sss-token mint \
  --mint $STABLECOIN_MINT \
  Cpj1RneABzEthffn7V7iC4Jquy1ZqYpvD9HXXooPMFgi \
  100
```

**Expected Output:**
```
✖ Mint failed
Error: Protocol is paused
```

### 6.5 Test Burn While Paused (Should Fail)
```bash
sss-token burn \
  --mint $STABLECOIN_MINT \
  50 \
  --from <TOKEN_ACCOUNT_ADDRESS>
```

**Expected Output:**
```
✖ Burn failed
Error: Protocol is paused
```

### 6.6 Unpause Protocol
```bash
sss-token unpause --mint $STABLECOIN_MINT
```

**Expected Output:**
```
✔ Stablecoin unpaused — minting and burning resumed

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

### 6.7 Verify Unpaused State
```bash
sss-token status --mint $STABLECOIN_MINT
```

**Expected**: `Paused: 🟢 NO`

### 6.8 Test Mint After Unpause (Should Succeed)
```bash
sss-token mint \
  --mint $STABLECOIN_MINT \
  Cpj1RneABzEthffn7V7iC4Jquy1ZqYpvD9HXXooPMFgi \
  100
```

**Expected Output:**
```
✔ Minted 100 VUSD

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

---

## Phase 7: Compliance - Freeze/Thaw

Account-level freeze prevents transfers from a specific token account.

### 7.1 Get Token Account Address
```bash
sss-token holders --mint $STABLECOIN_MINT
```

**Action**: Copy the token account address for the test wallet.

### 7.2 Freeze Token Account
```bash
sss-token freeze \
  --mint $STABLECOIN_MINT \
  <TOKEN_ACCOUNT_ADDRESS>
```

**Expected Output:**
```
✔ Account frozen: <TOKEN_ACCOUNT_ADDRESS>

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

### 7.3 Verify Frozen State
```bash
sss-token holders --mint $STABLECOIN_MINT
```

**Expected Output:**
```
┌──────────────────────────────────────────────┬──────────────────────────────────────────────┬──────────┬────────┐
│ Owner                                        │ Token Account                                │ Balance  │ State  │
├──────────────────────────────────────────────┼──────────────────────────────────────────────┼──────────┼────────┤
│ Cpj1RneABzEthffn7V7iC4Jquy1ZqYpvD9HXXooPMFgi │ <TOKEN_ACCOUNT_ADDRESS>                      │ 3100.50  │ frozen │
└──────────────────────────────────────────────┴──────────────────────────────────────────────┴──────────┴────────┘
```

**Check**: State should show `frozen`.

### 7.4 Test Transfer While Frozen (Manual)
Using a wallet (Phantom, Solflare), attempt to send tokens from the frozen account.

**Expected**: Transaction fails with error: "Account is frozen"

### 7.5 Thaw Token Account
```bash
sss-token thaw \
  --mint $STABLECOIN_MINT \
  <TOKEN_ACCOUNT_ADDRESS>
```

**Expected Output:**
```
✔ Account thawed: <TOKEN_ACCOUNT_ADDRESS>

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

### 7.6 Verify Thawed State
```bash
sss-token holders --mint $STABLECOIN_MINT
```

**Expected**: State should show `active`.

### 7.7 Test Transfer After Thaw (Manual)
Using a wallet, attempt to send tokens from the account.

**Expected**: Transaction succeeds.


---

## Phase 8: Advanced Compliance (SSS-2)

SSS-2 adds permanent delegate, transfer hooks, and on-chain blacklist enforcement.

### 8.1 Initialize Transfer Hook (One-Time)
```bash
sss-token hook init --mint $STABLECOIN_MINT
```

**Expected Output:**
```
✔ Transfer hook initialized
ExtraAccountMetaList PDA created — blacklist checks are now active on all transfers

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

**Note**: This must be called once after mint creation for SSS-2. It creates the PDA that stores extra accounts needed for transfer hook validation.

### 8.2 Verify Hook Initialization
```bash
sss-token status --mint $STABLECOIN_MINT
```

**Check**: `Transfer Hook: ✅ Enabled`

### 8.3 Add Address to Blacklist
```bash
sss-token blacklist add \
  --mint $STABLECOIN_MINT \
  7sXy8Z6QeYNxz7hdHFhEZjdE6sFTFwFzxHsVozeehAnQ \
  --reason "Suspected fraudulent activity"
```

**Expected Output:**
```
✔ Address blacklisted: 7sXy8Z6QeYNxz7hdHFhEZjdE6sFTFwFzxHsVozeehAnQ
Reason: Suspected fraudulent activity

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

### 8.4 Check Blacklist Status
```bash
sss-token blacklist check \
  --mint $STABLECOIN_MINT \
  7sXy8Z6QeYNxz7hdHFhEZjdE6sFTFwFzxHsVozeehAnQ
```

**Expected Output:**
```
┌───────────┬──────────────────────────────────────────────┐
│ Field     │ Value                                        │
├───────────┼──────────────────────────────────────────────┤
│ Status    │ 🔴 BLACKLISTED                               │
├───────────┼──────────────────────────────────────────────┤
│ Address   │ 7sXy8Z6QeYNxz7hdHFhEZjdE6sFTFwFzxHsVozeehAnQ │
├───────────┼──────────────────────────────────────────────┤
│ Reason    │ Suspected fraudulent activity                │
├───────────┼──────────────────────────────────────────────┤
│ Since     │ 2026-03-13T10:30:00.000Z                     │
└───────────┴──────────────────────────────────────────────┘
```

### 8.5 Test Transfer to Blacklisted Address (Should Fail)
Attempt to mint or transfer tokens to the blacklisted address:

```bash
sss-token mint \
  --mint $STABLECOIN_MINT \
  7sXy8Z6QeYNxz7hdHFhEZjdE6sFTFwFzxHsVozeehAnQ \
  100
```

**Expected Output:**
```
✖ Mint failed
Error: Address is blacklisted
```

**Note**: The transfer hook intercepts the transaction and rejects it on-chain.

### 8.6 Check Non-Blacklisted Address
```bash
sss-token blacklist check \
  --mint $STABLECOIN_MINT \
  Cpj1RneABzEthffn7V7iC4Jquy1ZqYpvD9HXXooPMFgi
```

**Expected Output:**
```
✔ Cpj1RneABzEthffn7V7iC4Jquy1ZqYpvD9HXXooPMFgi is NOT blacklisted
```

### 8.7 Remove Address from Blacklist
```bash
sss-token blacklist remove \
  --mint $STABLECOIN_MINT \
  7sXy8Z6QeYNxz7hdHFhEZjdE6sFTFwFzxHsVozeehAnQ
```

**Expected Output:**
```
✔ Address removed from blacklist: 7sXy8Z6QeYNxz7hdHFhEZjdE6sFTFwFzxHsVozeehAnQ

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

### 8.8 Verify Removal
```bash
sss-token blacklist check \
  --mint $STABLECOIN_MINT \
  7sXy8Z6QeYNxz7hdHFhEZjdE6sFTFwFzxHsVozeehAnQ
```

**Expected Output:**
```
✔ 7sXy8Z6QeYNxz7hdHFhEZjdE6sFTFwFzxHsVozeehAnQ is NOT blacklisted
```

### 8.9 Test Transfer After Removal (Should Succeed)
```bash
sss-token mint \
  --mint $STABLECOIN_MINT \
  7sXy8Z6QeYNxz7hdHFhEZjdE6sFTFwFzxHsVozeehAnQ \
  100
```

**Expected Output:**
```
✔ Minted 100 VUSD

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

### 8.10 Asset Seizure via Permanent Delegate
First, blacklist an address and mint tokens to it:

```bash
# Blacklist address
sss-token blacklist add \
  --mint $STABLECOIN_MINT \
  7sXy8Z6QeYNxz7hdHFhEZjdE6sFTFwFzxHsVozeehAnQ \
  --reason "Asset recovery required"

# Get the token account address for the blacklisted owner
sss-token holders --mint $STABLECOIN_MINT --min-balance 0
```

**Action**: Copy the token account address for `7sXy8Z6QeYNxz7hdHFhEZjdE6sFTFwFzxHsVozeehAnQ`.

```bash
# Seize tokens to treasury
sss-token seize \
  --mint $STABLECOIN_MINT \
  <BLACKLISTED_TOKEN_ACCOUNT> \
  --to <TREASURY_TOKEN_ACCOUNT> \
  --amount 100
```

**Expected Output:**
```
✔ Seized 100 VUSD from <BLACKLISTED_TOKEN_ACCOUNT>

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

**Note**: Uses the permanent delegate extension to move tokens without owner signature.

### 8.11 Verify Seizure
```bash
sss-token holders --mint $STABLECOIN_MINT
```

**Check**: 
- Blacklisted account balance decreased by 100
- Treasury account balance increased by 100


---

## Phase 9: Oracle Integration

Oracle enables non-USD pegs (EUR, BRL, CPI-indexed stablecoins).

### 9.1 Initialize Oracle
```bash
sss-token oracle init \
  --mint $STABLECOIN_MINT \
  --base EUR \
  --quote USD \
  --staleness 3600 \
  --confidence 100 \
  --method median \
  --mint-premium 10 \
  --redeem-discount 10 \
  --circuit-breaker 500 \
  --deviation 0
```

**Expected Output:**
```
✔ Oracle initialized: EUR/USD
Aggregation: median
Staleness: 3600s

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

**Parameters**:
- `--staleness`: Max age of price data (seconds)
- `--confidence`: Max confidence interval (bps)
- `--method`: median, mean, or weighted
- `--mint-premium`: Premium charged on minting (bps)
- `--redeem-discount`: Discount on redemption (bps)
- `--circuit-breaker`: Max single-crank price change (bps, 0=disabled)
- `--deviation`: Max deviation threshold (bps, 0=disabled)

### 9.2 Check Oracle Status
```bash
sss-token oracle status --mint $STABLECOIN_MINT
```

**Expected Output:**
```
┌──────────────────────────┬──────────────────────────────────────────────┐
│ Field                    │ Value                                        │
├──────────────────────────┼──────────────────────────────────────────────┤
│ Currency Pair            │ EUR/USD                                      │
├──────────────────────────┼──────────────────────────────────────────────┤
│ Version                  │ 1                                            │
├──────────────────────────┼──────────────────────────────────────────────┤
│ Authority                │ 6rqcaPUEdcyAp8u3bw8xeMKtSRYB7jxXt1xb51YWbYmP │
├──────────────────────────┼──────────────────────────────────────────────┤
│ Pending Authority        │ (none)                                       │
├──────────────────────────┼──────────────────────────────────────────────┤
│ Paused                   │ 🟢 NO                                        │
├──────────────────────────┼──────────────────────────────────────────────┤
│ Feed Count               │ 0                                            │
├──────────────────────────┼──────────────────────────────────────────────┤
│ Aggregation Method       │ Median                                       │
├──────────────────────────┼──────────────────────────────────────────────┤
│ Max Staleness            │ 3600s                                        │
├──────────────────────────┼──────────────────────────────────────────────┤
│ Max Confidence           │ 100 bps                                      │
├──────────────────────────┼──────────────────────────────────────────────┤
│ Mint Premium             │ 10 bps                                       │
├──────────────────────────┼──────────────────────────────────────────────┤
│ Redeem Discount          │ 10 bps                                       │
├──────────────────────────┼──────────────────────────────────────────────┤
│ Max Price Change         │ 500 bps                                      │
├──────────────────────────┼──────────────────────────────────────────────┤
│ Deviation Threshold      │ 0 bps                                        │
├──────────────────────────┼──────────────────────────────────────────────┤
│ Last Aggregated Price    │ (none)                                       │
├──────────────────────────┼──────────────────────────────────────────────┤
│ Last Aggregation Time    │ (none)                                       │
└──────────────────────────┴──────────────────────────────────────────────┘
```

### 9.3 Add Manual Feed (For Testing)
```bash
sss-token oracle add-feed \
  --mint $STABLECOIN_MINT \
  --index 0 \
  --type manual \
  --address 11111111111111111111111111111111
```

**Expected Output:**
```
✔ Feed added: manual at index 0

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

**Note**: Manual feeds are useful for testing. For production, use Pyth, Switchboard, or Chainlink.

### 9.4 List All Feeds
```bash
sss-token oracle feeds --mint $STABLECOIN_MINT
```

**Expected Output:**
```
┌───────┬────────┬──────────────────────────────────┬────────────┬─────────┬────────┬────────────┬─────────────┐
│ Index │ Type   │ Address                          │ Label      │ Enabled │ Weight │ Last Price │ Last Update │
├───────┼────────┼──────────────────────────────────┼────────────┼─────────┼────────┼────────────┼─────────────┤
│ 0     │ Manual │ 11111111111111111111111111111111 │ (no label) │ 🟢 Yes  │ 1      │ (none)     │ (none)      │
└───────┴────────┴──────────────────────────────────┴────────────┴─────────┴────────┴────────────┴─────────────┘
```

### 9.5 Crank Manual Feed (Push Price)
```bash
# Push EUR/USD price of 1.085 (in 9-decimal fixed-point: 1085000000)
sss-token oracle crank \
  --mint $STABLECOIN_MINT \
  0 \
  --price 1085000000 \
  --confidence 1000000
```

**Expected Output:**
```
✔ Feed 0 cranked with price 1085000000

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

**Note**: Price format is 9-decimal fixed-point (1.085 = 1_085_000_000).

### 9.5 Crank Manual Feed (Push Price)
```bash
# Push EUR/USD price of 1.085 (in 9-decimal fixed-point: 1085000000)
sss-token oracle crank \
  --mint $STABLECOIN_MINT \
  0 \
  --price 1085000000 \
  --confidence 1000000
```

**Expected Output:**
```
✔ Feed 0 cranked with price 1085000000

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

**Note**: Price format is 9-decimal fixed-point (1.085 = 1_085_000_000).

### 9.6 Verify Feed Update
```bash
sss-token oracle feeds --mint $STABLECOIN_MINT
```

**Check**: Feed 0 should show `Last Price: 1085000000` and recent timestamp.

### 9.7 Get Mint Price
```bash
sss-token oracle price --mint $STABLECOIN_MINT --side mint
```

**Expected Output:**
```
✔ MINT price: 1085000000
```

**Note**: Includes mint premium (10 bps = 0.1%).

### 9.8 Get Redeem Price
```bash
sss-token oracle price --mint $STABLECOIN_MINT --side redeem
```

**Expected Output:**
```
✔ REDEEM price: 1085000000
```

**Note**: Includes redeem discount (10 bps = 0.1%).

### 9.9 Set Manual Price Override
```bash
sss-token oracle set-manual \
  --mint $STABLECOIN_MINT \
  --price 1090000000 \
  --active
```

**Expected Output:**
```
✔ Manual price set: 1090000000 (active)

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

**Note**: When active, manual price overrides aggregated feed prices.

### 9.10 Update Oracle Config
```bash
sss-token oracle update \
  --mint $STABLECOIN_MINT \
  --staleness 7200 \
  --method mean \
  --mint-premium 20
```

**Expected Output:**
```
✔ Oracle config updated

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

### 9.11 Pause Oracle
```bash
sss-token oracle update --mint $STABLECOIN_MINT --pause
```

**Expected Output:**
```
✔ Oracle config updated

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

### 9.12 Unpause Oracle
```bash
sss-token oracle update --mint $STABLECOIN_MINT --unpause
```

### 9.13 Remove Feed
```bash
sss-token oracle remove-feed --mint $STABLECOIN_MINT 0
```

**Expected Output:**
```
✔ Feed 0 removed

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

### 9.14 Transfer Oracle Authority (Step 1 of 2)
```bash
sss-token oracle transfer-authority \
  --mint $STABLECOIN_MINT \
  Cpj1RneABzEthffn7V7iC4Jquy1ZqYpvD9HXXooPMFgi
```

**Expected Output:**
```
✔ Oracle authority transfer initiated → Cpj1RneABzEthffn7V7iC4Jquy1ZqYpvD9HXXooPMFgi
The new authority must call "sss-token oracle accept-authority" to complete

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

### 9.15 Accept Oracle Authority (Step 2 of 2)
```bash
sss-token oracle accept-authority \
  --mint $STABLECOIN_MINT \
  --keypair /path/to/new/oracle/authority.json
```

**For Testing**: Skip unless you have the new authority's keypair.

### 9.16 Close Oracle
```bash
# Remove all feeds first
sss-token oracle remove-feed --mint $STABLECOIN_MINT 0

# Close oracle
sss-token oracle close --mint $STABLECOIN_MINT
```

**Expected Output:**
```
✔ Oracle closed — rent reclaimed

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

**Note**: All feeds must be removed before closing.


---

## Phase 10: Privacy Operations (SSS-3)

SSS-3 enables confidential transfers using Token-2022's confidential transfer extension.

**Note**: Requires SSS-3 preset during initialization.

### 10.1 Approve Account for Confidential Transfers
```bash
sss-token privacy approve \
  --mint $STABLECOIN_MINT \
  <TOKEN_ACCOUNT_ADDRESS>
```

**Expected Output:**
```
✔ Account approved for confidential transfers: <TOKEN_ACCOUNT_ADDRESS>

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

**Note**: Master authority must approve accounts before they can use confidential transfers.

### 10.2 Enable Confidential Credits (Account Owner)
```bash
sss-token privacy enable-credits \
  --mint $STABLECOIN_MINT \
  <TOKEN_ACCOUNT_ADDRESS> \
  --keypair /path/to/account/owner/keypair.json
```

**Expected Output:**
```
✔ Confidential credits enabled: <TOKEN_ACCOUNT_ADDRESS>

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

**Note**: Account owner must enable credits to receive confidential transfers.

### 10.3 Disable Confidential Credits
```bash
sss-token privacy disable-credits \
  --mint $STABLECOIN_MINT \
  <TOKEN_ACCOUNT_ADDRESS> \
  --keypair /path/to/account/owner/keypair.json
```

**Expected Output:**
```
✔ Confidential credits disabled: <TOKEN_ACCOUNT_ADDRESS>

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

**Note**: Disabling prevents receiving new confidential transfers.

---

## Phase 11: Monitoring & Information

### 11.1 View Complete Status
```bash
sss-token status --mint $STABLECOIN_MINT
```

**Expected Output**: Comprehensive status including:
- Token Info (mint, name, symbol, decimals, version, preset, supply, paused)
- Extensions (permanent delegate, transfer hook, default frozen, confidential transfers, CT auto-approve)
- Roles (master authority, pending master, burner, pauser, blacklister, seizer)

### 11.2 Check Total Supply
```bash
sss-token supply --mint $STABLECOIN_MINT
```

**Expected Output:**
```
✔ Total supply: 3,100.50 VUSD
```

### 11.3 List All Token Holders
```bash
sss-token holders --mint $STABLECOIN_MINT
```

**Expected Output**: Table with owner, token account, balance, and state for all holders.

### 11.4 Filter Holders by Minimum Balance
```bash
sss-token holders --mint $STABLECOIN_MINT --min-balance 1000
```

**Expected Output**: Only holders with balance ≥ 1000 tokens.

### 11.5 View Audit Log (Recent Transactions)
```bash
sss-token audit-log --mint $STABLECOIN_MINT --limit 20
```

**Expected Output:**
```
┌──────────────────────────────┬──────────────────────────┬──────────┬──────┐
│ Signature                    │ Time                     │ Status   │ Memo │
├──────────────────────────────┼──────────────────────────┼──────────┼──────┤
│ 5Xj2K3mN4pQ6rS7tU8vW9xY0z... │ 2026-03-13T10:30:00.000Z │ ✅ OK    │      │
├──────────────────────────────┼──────────────────────────┼──────────┼──────┤
│ 3Yh1J2kK3lL4mM5nN6oO7pP8q... │ 2026-03-13T10:25:00.000Z │ ✅ OK    │      │
└──────────────────────────────┴──────────────────────────┴──────────┴──────┘
```

### 11.6 Filter Audit Log by Action
```bash
sss-token audit-log \
  --mint $STABLECOIN_MINT \
  --action mint \
  --limit 10
```

**Expected Output**: Only transactions containing "mint" in logs.

**Supported Actions**: mint, burn, freeze, blacklist, seize, pause

### 11.7 Launch Terminal UI (TUI)
```bash
sss-token tui --mint $STABLECOIN_MINT
```

**Expected**: Interactive dashboard showing:
- Real-time supply metrics
- Minter activity
- Recent transactions
- Supply charts

**Controls**:
- `q` or `Ctrl+C`: Exit
- Arrow keys: Navigate
- `r`: Refresh data

**Note**: TUI provides a real-time monitoring interface for operators.

---

## Phase 12: Protocol Decommissioning

**⚠️ WARNING**: These operations are IRREVERSIBLE. Use with extreme caution.

### 12.1 Pre-Decommission Checklist
```bash
# 1. Check current supply
sss-token supply --mint $STABLECOIN_MINT

# 2. List all holders
sss-token holders --mint $STABLECOIN_MINT

# 3. List all minters
sss-token minters list --mint $STABLECOIN_MINT

# 4. Check status
sss-token status --mint $STABLECOIN_MINT
```

### 12.2 Burn All Outstanding Supply
```bash
# For each holder, burn their tokens
sss-token burn \
  --mint $STABLECOIN_MINT \
  <AMOUNT> \
  --from <TOKEN_ACCOUNT>
```

**Repeat** for all token accounts until supply = 0.

### 12.3 Verify Zero Supply
```bash
sss-token supply --mint $STABLECOIN_MINT
```

**Expected Output:**
```
✔ Total supply: 0 VUSD
```

**CRITICAL**: Supply MUST be zero before closing mint.

### 12.4 Remove All Minters
```bash
sss-token minters remove \
  --mint $STABLECOIN_MINT \
  Cpj1RneABzEthffn7V7iC4Jquy1ZqYpvD9HXXooPMFgi
```

**Repeat** for all minters.

### 12.5 Verify No Minters
```bash
sss-token minters list --mint $STABLECOIN_MINT
```

**Expected Output:**
```
✔ No minters registered
```

### 12.6 Close Oracle (If Initialized)
```bash
# Remove all feeds first
sss-token oracle feeds --mint $STABLECOIN_MINT
# For each feed:
sss-token oracle remove-feed --mint $STABLECOIN_MINT <INDEX>

# Close oracle
sss-token oracle close --mint $STABLECOIN_MINT
```

### 12.7 Close Mint (IRREVERSIBLE)
```bash
sss-token close-mint --mint $STABLECOIN_MINT --force
```

**Expected Output:**
```
✔ Mint permanently closed
All rent reclaimed to master authority

Transaction: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

**Without --force** (Interactive Confirmation):
```bash
sss-token close-mint --mint $STABLECOIN_MINT
```

**Prompt:**
```
⚠️  This is IRREVERSIBLE. The mint, state, and roles will be permanently destroyed.
   All MinterQuota PDAs should be removed first via "minters remove".
   Run with --force to skip this warning.

Type "CLOSE" to confirm: 
```

**Type**: `CLOSE` and press Enter.

### 12.8 Verify Mint Closed
```bash
sss-token status --mint $STABLECOIN_MINT
```

**Expected Output:**
```
✖ Status fetch failed
Error: Account does not exist
```

**Or check on-chain**:
```bash
solana account $STABLECOIN_MINT
```

**Expected**: Account not found or closed.

### 12.9 Rent Reclamation Summary
After closing:
- Mint account: ~0.002 SOL
- State PDA: ~0.002 SOL
- Roles PDA: ~0.002 SOL
- Each MinterQuota PDA: ~0.002 SOL
- Oracle (if used): ~0.005 SOL
- Each Feed PDA: ~0.002 SOL

**Total Reclaimed**: ~0.01-0.05 SOL depending on configuration.


---

## Complete Command Reference

### Global Options
```bash
sss-token [command] \
  --url <RPC_URL> \
  --keypair <KEYPAIR_PATH> \
  --mint <MINT_ADDRESS>
```

**Environment Variables**:
- `SOLANA_RPC_URL`: Default RPC endpoint
- `SOLANA_KEYPAIR_PATH`: Default keypair path
- `STABLECOIN_MINT`: Default mint address

### Core Operations

| Command | Description | Example |
|---------|-------------|---------|
| `init` | Initialize new stablecoin | `sss-token init --name "USD" --symbol "USD" --preset sss-2` |
| `mint <recipient> <amount>` | Mint tokens | `sss-token mint Cpj1Rne... 1000` |
| `burn <amount> --from <account>` | Burn tokens | `sss-token burn 500 --from TokenAcc...` |
| `pause [--reason]` | Pause protocol | `sss-token pause --reason "Audit"` |
| `unpause` | Unpause protocol | `sss-token unpause` |
| `freeze <account>` | Freeze token account | `sss-token freeze TokenAcc...` |
| `thaw <account>` | Thaw token account | `sss-token thaw TokenAcc...` |
| `close-mint [--force]` | Close mint permanently | `sss-token close-mint --force` |

### Metadata

| Command | Description | Example |
|---------|-------------|---------|
| `metadata init` | Initialize Metaplex metadata | `sss-token metadata init --name "USD" --symbol "USD" --uri "https://..." --mint-keypair ./mint.json` |

### Role Management

| Command | Description | Example |
|---------|-------------|---------|
| `roles show` | Display current roles | `sss-token roles show` |
| `roles update` | Update role assignments | `sss-token roles update --burner Addr... --pauser Addr...` |
| `roles transfer <newMaster>` | Initiate authority transfer | `sss-token roles transfer Addr...` |
| `roles accept` | Accept authority transfer | `sss-token roles accept` |

### Minter Management

| Command | Description | Example |
|---------|-------------|---------|
| `minters list` | List all minters | `sss-token minters list` |
| `minters add <address> --quota <amount>` | Add minter | `sss-token minters add Addr... --quota 5000000` |
| `minters update <address>` | Update minter | `sss-token minters update Addr... --quota 10000000 --active` |
| `minters remove <address>` | Remove minter | `sss-token minters remove Addr...` |

### Compliance (SSS-2)

| Command | Description | Example |
|---------|-------------|---------|
| `hook init` | Initialize transfer hook | `sss-token hook init` |
| `blacklist add <address> --reason <text>` | Add to blacklist | `sss-token blacklist add Addr... --reason "Fraud"` |
| `blacklist check <address>` | Check blacklist status | `sss-token blacklist check Addr...` |
| `blacklist remove <address>` | Remove from blacklist | `sss-token blacklist remove Addr...` |
| `seize <from> --to <to> --amount <amt>` | Seize tokens | `sss-token seize TokenAcc... --to Treasury... --amount 500` |

### Oracle

| Command | Description | Example |
|---------|-------------|---------|
| `oracle init` | Initialize oracle | `sss-token oracle init --base EUR --quote USD` |
| `oracle status` | Show oracle config | `sss-token oracle status` |
| `oracle update` | Update oracle config | `sss-token oracle update --staleness 7200` |
| `oracle add-feed` | Add price feed | `sss-token oracle add-feed --index 0 --type manual --address 1111...` |
| `oracle remove-feed <index>` | Remove feed | `sss-token oracle remove-feed 0` |
| `oracle feeds` | List all feeds | `sss-token oracle feeds` |
| `oracle crank <index> --price <price>` | Push price to feed | `sss-token oracle crank 0 --price 1085000000` |
| `oracle set-manual --price <price>` | Set manual override | `sss-token oracle set-manual --price 1090000000 --active` |
| `oracle price [--side mint\|redeem]` | Get current price | `sss-token oracle price --side mint` |
| `oracle transfer-authority <addr>` | Transfer oracle authority | `sss-token oracle transfer-authority Addr...` |
| `oracle accept-authority` | Accept oracle authority | `sss-token oracle accept-authority` |
| `oracle close` | Close oracle | `sss-token oracle close` |

### Privacy (SSS-3)

| Command | Description | Example |
|---------|-------------|---------|
| `privacy approve <account>` | Approve confidential transfers | `sss-token privacy approve TokenAcc...` |
| `privacy enable-credits <account>` | Enable confidential credits | `sss-token privacy enable-credits TokenAcc...` |
| `privacy disable-credits <account>` | Disable confidential credits | `sss-token privacy disable-credits TokenAcc...` |

### Information & Monitoring

| Command | Description | Example |
|---------|-------------|---------|
| `status` | Show complete status | `sss-token status` |
| `supply` | Show total supply | `sss-token supply` |
| `holders [--min-balance <amt>]` | List token holders | `sss-token holders --min-balance 1000` |
| `audit-log [--action <type>] [--limit <n>]` | View transaction history | `sss-token audit-log --action mint --limit 20` |
| `tui` | Launch terminal UI | `sss-token tui` |

**Total Commands**: 40+


---

## Testing Checklist

### Phase 0: Environment Setup
- [ ] Solana CLI installed and configured
- [ ] Wallet funded with ≥0.5 SOL
- [ ] RPC endpoint accessible
- [ ] CLI version verified (`sss-token --version`)
- [ ] Environment variables set

### Phase 1: Initialization
- [ ] SSS-1 stablecoin created successfully
- [ ] SSS-2 stablecoin created with transfer hook
- [ ] SSS-3 stablecoin created with confidential transfers
- [ ] Custom config initialization tested
- [ ] Mint address exported to environment

### Phase 2: Metadata
- [ ] Metaplex metadata initialized
- [ ] Metadata PDA created on-chain
- [ ] Token displays in wallet (Phantom/Solflare)
- [ ] Name, symbol, and URI correct

### Phase 3: Role Management
- [ ] Current roles displayed correctly
- [ ] Roles updated successfully (burner, pauser, etc.)
- [ ] Role updates verified
- [ ] Authority transfer initiated (optional)
- [ ] Authority transfer accepted (optional)

### Phase 4: Minter Management
- [ ] Minter added with quota
- [ ] Minter added with unlimited quota
- [ ] All minters listed correctly
- [ ] Minter quota updated
- [ ] Minter deactivated
- [ ] Minted counter reset
- [ ] Minter removed and PDA closed

### Phase 5: Supply Operations
- [ ] Initial supply is zero
- [ ] Tokens minted successfully
- [ ] Supply increased correctly
- [ ] Token holders listed
- [ ] Tokens burned successfully
- [ ] Supply decreased correctly
- [ ] Quota enforcement tested
- [ ] Minter quota usage tracked

### Phase 6: Pause/Unpause
- [ ] Protocol paused successfully
- [ ] Paused state verified
- [ ] Mint fails while paused
- [ ] Burn fails while paused
- [ ] Protocol unpaused successfully
- [ ] Mint succeeds after unpause

### Phase 7: Freeze/Thaw
- [ ] Token account frozen
- [ ] Frozen state verified in holders list
- [ ] Transfer fails while frozen (manual test)
- [ ] Token account thawed
- [ ] Transfer succeeds after thaw (manual test)

### Phase 8: Advanced Compliance (SSS-2)
- [ ] Transfer hook initialized
- [ ] Hook initialization verified
- [ ] Address added to blacklist
- [ ] Blacklist status checked
- [ ] Transfer to blacklisted address fails
- [ ] Non-blacklisted address verified
- [ ] Address removed from blacklist
- [ ] Transfer succeeds after removal
- [ ] Tokens seized via permanent delegate
- [ ] Seizure verified in holders list

### Phase 9: Oracle Integration
- [ ] Oracle initialized with EUR/USD pair
- [ ] Oracle status displayed correctly
- [ ] Manual feed added
- [ ] Pyth feed added (optional)
- [ ] All feeds listed
- [ ] Manual feed cranked with price
- [ ] Feed update verified
- [ ] Mint price retrieved
- [ ] Redeem price retrieved
- [ ] Manual price override set
- [ ] Oracle config updated
- [ ] Oracle paused/unpaused
- [ ] Feed removed
- [ ] Oracle authority transferred (optional)
- [ ] Oracle closed

### Phase 10: Privacy (SSS-3)
- [ ] Account approved for confidential transfers
- [ ] Confidential credits enabled
- [ ] Confidential credits disabled

### Phase 11: Monitoring
- [ ] Complete status displayed
- [ ] Total supply checked
- [ ] All holders listed
- [ ] Holders filtered by balance
- [ ] Audit log viewed
- [ ] Audit log filtered by action
- [ ] TUI launched and navigated

### Phase 12: Decommissioning
- [ ] Pre-decommission checklist completed
- [ ] All supply burned
- [ ] Zero supply verified
- [ ] All minters removed
- [ ] No minters verified
- [ ] Oracle closed (if used)
- [ ] Mint closed permanently
- [ ] Mint closure verified
- [ ] Rent reclaimed

**Total Test Cases**: 100+


---

## Troubleshooting

### Common Issues

#### 1. "No mint address provided"
**Cause**: `STABLECOIN_MINT` environment variable not set or `--mint` flag missing.

**Solution**:
```bash
export STABLECOIN_MINT=<your_mint_address>
# Or use --mint flag
sss-token status --mint <your_mint_address>
```

#### 2. "Insufficient funds" / "Insufficient SOL"
**Cause**: Authority wallet lacks SOL for transaction fees and rent.

**Solution**:
```bash
# Check balance
solana balance

# Airdrop on devnet
solana airdrop 2

# On mainnet, transfer SOL to the wallet
```

**Rent Requirements**:
- Mint initialization: ~0.05 SOL
- Each MinterQuota PDA: ~0.002 SOL
- Oracle initialization: ~0.005 SOL
- Each Feed PDA: ~0.002 SOL

#### 3. "Protocol is paused"
**Cause**: Protocol was paused and not unpaused.

**Solution**:
```bash
sss-token unpause --mint $STABLECOIN_MINT
```

#### 4. "Quota exceeded"
**Cause**: Minter has reached their minting quota.

**Solution**:
```bash
# Increase quota
sss-token minters update <MINTER_ADDR> --quota 20000000 --active

# Or reset minted counter
sss-token minters update <MINTER_ADDR> --quota 10000000 --active --reset-minted
```

#### 5. "Account is frozen"
**Cause**: Token account is frozen.

**Solution**:
```bash
sss-token thaw --mint $STABLECOIN_MINT <TOKEN_ACCOUNT>
```

#### 6. "Address is blacklisted"
**Cause**: Transfer hook detected blacklisted address.

**Solution**:
```bash
# Check blacklist status
sss-token blacklist check --mint $STABLECOIN_MINT <ADDRESS>

# Remove from blacklist if appropriate
sss-token blacklist remove --mint $STABLECOIN_MINT <ADDRESS>
```


#### 7. "Transfer hook not initialized"
**Cause**: SSS-2 transfer hook ExtraAccountMetaList PDA not created.

**Solution**:
```bash
sss-token hook init --mint $STABLECOIN_MINT
```

**Note**: This is required once after SSS-2 mint creation.

#### 8. "Mint keypair does not match"
**Cause**: Wrong mint keypair provided for metadata initialization.

**Solution**:
- Ensure the mint keypair file matches the mint address
- The mint keypair is generated during `sss-token init` and saved to `./packages/cli/mint-keypair.json`

#### 9. "Account does not exist"
**Cause**: Trying to operate on a closed or non-existent account.

**Solution**:
- Verify the mint address is correct
- Check if the mint was closed
- Ensure you're on the correct network (devnet vs mainnet)

#### 10. "Manual feeds must be active"
**Cause**: Oracle feed is disabled or not cranked.

**Solution**:
```bash
# Check feed status
sss-token oracle feeds --mint $STABLECOIN_MINT

# Crank the feed
sss-token oracle crank --mint $STABLECOIN_MINT <INDEX> --price <PRICE>
```

#### 11. "Cannot close mint - supply not zero"
**Cause**: Attempting to close mint with outstanding supply.

**Solution**:
```bash
# Check supply
sss-token supply --mint $STABLECOIN_MINT

# Burn all tokens
sss-token holders --mint $STABLECOIN_MINT
# For each holder:
sss-token burn <AMOUNT> --from <TOKEN_ACCOUNT>
```

#### 12. RPC Rate Limiting
**Cause**: Too many requests to public RPC endpoint.

**Solution**:
- Use a private RPC endpoint (Helius, Alchemy, Triton)
- Add delays between commands
- Use `--url` flag with premium RPC

```bash
export SOLANA_RPC_URL="https://your-premium-rpc.com"
```

#### 13. "bigint: Failed to load bindings"
**Cause**: Native bindings warning (non-critical).

**Solution**: This is a warning, not an error. The CLI falls back to pure JS. To suppress:
```bash
npm rebuild
```

#### 14. Transaction Simulation Failed
**Cause**: Various on-chain errors.

**Solution**:
- Check program logs in Solana Explorer
- Verify all prerequisites are met (e.g., hook initialized for SSS-2)
- Ensure sufficient SOL for rent and fees
- Check if protocol is paused

#### 15. "Authority mismatch"
**Cause**: Wrong keypair used for operation.

**Solution**:
- Verify you're using the correct authority keypair
- Check current roles: `sss-token roles show`
- Use `--keypair` flag to specify correct keypair


---

## Notes

### Fixed-Point Format (Oracle Prices)
The oracle system uses **9-decimal fixed-point** format for price inputs:
- `1.00` = `1_000_000_000`
- `1.085` = `1_085_000_000`
- `0.95` = `950_000_000`

**Why 9 decimals?** Standard for Solana oracles (Pyth, Switchboard). On-chain storage uses 6 decimals for efficiency.

### Basis Points (BPS)
Premium and discount are expressed in basis points:
- `10 bps` = `0.10%` = `0.001` multiplier
- `100 bps` = `1.00%` = `0.01` multiplier
- `1000 bps` = `10.00%` = `0.10` multiplier

### Token Amounts
CLI accepts human-readable amounts (e.g., `1000.50`), automatically converting to lamports based on decimals:
- 6 decimals: `1000.50` → `1000500000` lamports
- 9 decimals: `1000.50` → `1000500000000` lamports

### Two-Step Authority Transfers
Both main authority and oracle authority use two-step transfers:
1. **Step 1**: Current authority initiates transfer
2. **Step 2**: New authority accepts transfer

This prevents accidental lockout if the new authority address is incorrect.

### Blacklist vs Whitelist
SSS uses a **blacklist model** (not whitelist):
- **Default**: All addresses can transfer (implicit whitelist)
- **Blacklist**: Create PDA to block specific addresses
- **"Whitelisting"**: Remove from blacklist (restore default)

This matches industry standards (USDC, USDT) and is more gas-efficient.

### Rent Reclamation
Closing accounts reclaims rent:
- Mint account: ~0.002 SOL
- State PDA: ~0.002 SOL
- Roles PDA: ~0.002 SOL
- MinterQuota PDA: ~0.002 SOL each
- Oracle Config: ~0.005 SOL
- Feed PDA: ~0.002 SOL each

**Total**: ~0.01-0.05 SOL depending on configuration.

### Program IDs
Default program IDs (devnet):
- **sss-token**: `7nFqXZae9mzYP7LefmCe9C1V2zzPbrY3nLR9WVGorQee`
- **transfer-hook**: `HPksBobjquMqBfnCgpqBQDkomJ4HmGB1AbvJnemNBEig`
- **sss-oracle**: `GQp6UgyhLZP6zXRf24JH2BiwuoSAfYZruJ3WUPkqgj8X`

Check `Anchor.toml` for current program IDs.

### Metadata URI Format
The metadata URI should point to a JSON file with this structure:
```json
{
  "name": "Verification Dollar",
  "symbol": "VUSD",
  "description": "A compliant stablecoin for testing",
  "image": "https://arweave.net/image.png",
  "external_url": "https://your-project.com",
  "attributes": []
}
```

Host on Arweave, IPFS, or any permanent storage.

---

## Best Practices

### 1. Environment Management
```bash
# Create separate environments
export DEVNET_MINT="..."
export MAINNET_MINT="..."

# Use aliases
alias sss-devnet="sss-token --url https://api.devnet.solana.com"
alias sss-mainnet="sss-token --url https://api.mainnet-beta.solana.com"
```

### 2. Keypair Security
- **Never** commit keypairs to version control
- Use hardware wallets for mainnet
- Store keypairs in secure locations (`~/.config/solana/`)
- Use different keypairs for different roles

### 3. Testing Workflow
1. Test on **localnet** first (solana-test-validator)
2. Deploy to **devnet** for integration testing
3. Audit and security review
4. Deploy to **mainnet** with production keys

### 4. Monitoring
- Use `sss-token tui` for real-time monitoring
- Set up alerts for:
  - Quota approaching limits
  - Blacklist additions
  - Large mints/burns
  - Authority changes

### 5. Backup & Recovery
- Keep backups of:
  - Mint keypair (for metadata updates)
  - Authority keypairs
  - Program IDs
  - Mint addresses
- Document all role assignments
- Maintain audit trail of all operations

### 6. Compliance
- Document all blacklist additions with reasons
- Maintain records of seizures
- Regular audits of minter quotas
- Monitor for suspicious activity

---

## Additional Resources

### Documentation
- [SSS-1 Specification](../SSS-1.md)
- [SSS-2 Specification](../SSS-2.md)
- [SSS-3 Specification](../SSS-3.md)
- [Oracle Integration](../SSS-Oracle.md)
- [SDK Reference](../SDK.md)
- [API Reference](../API.md)
- [Architecture](../ARCHITECTURE.md)
- [Operations Guide](../OPERATIONS.md)

### External Resources
- [Solana Documentation](https://docs.solana.com/)
- [Token-2022 Guide](https://spl.solana.com/token-2022)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Pyth Network](https://pyth.network/)
- [Metaplex Metadata](https://docs.metaplex.com/)

### Support
- GitHub Issues: https://github.com/exyreams/solana-stablecoin-standard/issues
- Discord: [Join Community]
- Documentation: https://github.com/exyreams/solana-stablecoin-standard/tree/main/docs

---

## Appendix: Test Address Reference

Throughout this guide, we use the following test address:
- **Primary Test Address**: `Cpj1RneABzEthffn7V7iC4Jquy1ZqYpvD9HXXooPMFgi`

Additional test addresses for multi-party scenarios:
- **Secondary Address**: `7sXy8Z6QeYNxz7hdHFhEZjdE6sFTFwFzxHsVozeehAnQ`
- **Treasury Address**: `8tYz9A7ReZOy8ieFGiGaFkeF7tGUGxGay9tWpaffiBoR`

**Note**: These are example addresses. Replace with your actual test wallet addresses.

---

© 2026 Solana Stablecoin Standard | [Back to Documentation](../README.md)
