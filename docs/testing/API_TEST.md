# SSS API Testing Guide (Complete Verification)

This comprehensive guide walks through testing all SSS functionality using the API with example requests and expected responses.

**Prerequisites**: Docker containers running (`docker compose up -d`), API base URL: `http://localhost:3000`

---

## Table of Contents

14. Phase 13: Cleanup & Close Mint
15. [Phase 14: Hybrid Signing (Minter Wallet Signing)](#phase-14-hybrid-signing-minter-wallet-signing)
16. [Complete API Reference](#complete-api-reference)
16. [Testing Checklist](#testing-checklist)
17. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### 1. Environment Setup
Verify `.env` has all required variables:
```env
SOLANA_RPC_URL=https://api.devnet.solana.com
STABLECOIN_MINT=8BsWy9Z5PdXMwz6gcHEgDZicD5rFSEvyxGrUnyddgzF3
AUTHORITY_SECRET_KEY=[1,2,3,...]  # JSON array of bytes
DATABASE_URL=file:./db/dev.db
REDIS_URL=redis://localhost:6379
PORT=3000
LOG_LEVEL=info
```

### 2. Services Running
```bash
docker compose up -d
docker logs -f sss-backend  # Monitor logs
```

### 3. Test Wallet
Have a Solana wallet with devnet SOL for testing transactions.

---

## Phase 0: Authentication

Before performing most operations, you must login to get a JWT.

### 0.1 Login
```http
POST /admin/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "admin",
  "password": "securepassword"
}
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1...",
  "role": "ADMIN"
}
```

**Important**: Include this token in the header of all subsequent requests:
`Authorization: Bearer <token>`

---

## Phase 1: Initialization (Create New Stablecoin)

### 0.1 Create Stablecoin (SSS-2 Example)
```http
POST /create-stablecoin
```

**Request Body:**
```json
{
  "preset": "sss2",
  "name": "USD Black",
  "symbol": "USDb",
  "decimals": 6,
  "uri": "https://pastebin.com/raw/SjTJzhvy",
  "extensions": {
    "permanentDelegate": true,
    "transferHook": true,
    "defaultFrozen": false,
    "confidential": false
  },
  "roles": {
    "minter": "6rqcaPUEdcyAp8u3bw8xeMKtSRYB7jxXt1xb51YWbYmP"
  },
  "oracle": {
    "enabled": false
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "mintAddress": "8BsWy9Z5PdXMwz6gcHEgDZicD5rFSEvyxGrUnyddgzF3",
  "name": "USD Black",
  "symbol": "USDb",
  "decimals": 6
}
```

**Note**: This endpoint creates a new stablecoin on-chain. The backend uses the `AUTHORITY_SECRET_KEY` from environment to sign transactions. For SSS-2, the transfer hook is automatically initialized.

### 0.2 Create Stablecoin (SSS-1 Example)
```http
POST /create-stablecoin
```

**Request Body:**
```json
{
  "preset": "sss1",
  "name": "Simple Dollar",
  "symbol": "SDOL",
  "decimals": 6,
  "uri": ""
}
```

**Expected Response:**
```json
{
  "success": true,
  "mintAddress": "NewMintAddress123...",
  "preset": "sss1",
  "name": "Simple Dollar",
  "symbol": "SDOL",
  "decimals": 6
}
```

### 0.3 Create Stablecoin (SSS-3 Example)
```http
POST /create-stablecoin
```

**Request Body:**
```json
{
  "preset": "sss3",
  "name": "Private Dollar",
  "symbol": "PDOL",
  "decimals": 6,
  "extensions": {
    "confidential": true
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "mintAddress": "NewMintAddress456...",
  "preset": "sss3",
  "name": "Private Dollar",
  "symbol": "PDOL",
  "decimals": 6
}
```

---

## Phase 1: Health & Initial Status

### 1.1 Service Health Check
```http
GET /health
```

**Expected Response:**
```json
{
  "status": "ok",
  "service": "sss-backend"
}
```

### 1.2 Check Initial Status
```http
GET /admin/status
```

**Expected Response:**
```json
{
  "status": {
    "version": 1,
    "mint": "8BsWy9Z5PdXMwz6gcHEgDZicD5rFSEvyxGrUnyddgzF3",
    "name": "USD Black",
    "symbol": "USDb",
    "decimals": 6,
    "uri": "https://pastebin.com/raw/SjTJzhvy",
    "paused": false,
    "totalSupply": "0",
    "enablePermanentDelegate": true,
    "enableTransferHook": true,
    "defaultAccountFrozen": false,
    "enableConfidentialTransfers": false,
    "confidentialTransferAutoApprove": false
  },
  "metadata": {
    "name": "USD Black",
    "symbol": "USDb",
    "uri": "https://pastebin.com/raw/SjTJzhvy",
    "decimals": 6
  },
  "roles": {
    "masterAuthority": "6rqcaPUEdcyAp8u3bw8xeMKtSRYB7jxXt1xb51YWbYmP",
    "burner": "6rqcaPUEdcyAp8u3bw8xeMKtSRYB7jxXt1xb51YWbYmP",
    "pauser": "6rqcaPUEdcyAp8u3bw8xeMKtSRYB7jxXt1xb51YWbYmP",
    "blacklister": "6rqcaPUEdcyAp8u3bw8xeMKtSRYB7jxXt1xb51YWbYmP",
    "seizer": "6rqcaPUEdcyAp8u3bw8xeMKtSRYB7jxXt1xb51YWbYmP"
  }
}
```

### 1.3 On-Chain Status (Raw Data)
```http
GET /admin/on-chain-status
```

**Expected Response:**
```json
{
  "stateExists": true,
  "rolesExists": true,
  "stateSize": 213,
  "rolesSize": 169,
  "slot": 12345
}
```

### 1.4 Check Total Supply
```http
GET /admin/supply
```

**Expected Response:**
```json
{
  "supply": "0"
}
```

---

## Phase 2: Role Management

### 2.1 View Current Roles
```http
GET /admin/status
```
Check the `roles` section (shown in Phase 1.2 above).

### 2.2 Update Roles
```http
PUT /admin/roles
```

**Request Body:**
```json
{
  "burner": "6rqcaPUEdcyAp8u3bw8xeMKtSRYB7jxXt1xb51YWbYmP",
  "pauser": "7sXy8Z6QeYNxz7hdHFhEZjdE6sFTFwFzxHsVozeehAnQ",
  "blacklister": "8tYz9A7ReZOy8ieFGiGaFkeF7tGUGxGay9tWpaffiBoR",
  "seizer": "9uZa0B8SfPz9jgGHjHbGlgG8uHVHyHbz0uXqbgggjCpS"
}
```

**Expected Response:**
```json
{
  "success": true,
  "signature": "5Xj2K3mN4pQ6rS7tU8vW9xY0zA1bC2dE3fG4hH5iJ6kL7mM8nN9oP0qR1sS2tT3uU4vV5wW6xX7yY8zZ9aA0bB1"
}
```

### 2.3 Authority Transfer (CLI Only)

⚠️ **Note**: Authority transfer requires keypair coordination and should be done via CLI, not API.

**Why?** The backend uses a single `AUTHORITY_SECRET_KEY` from environment. The new authority needs their own keypair to accept the transfer.

**CLI Commands:**
```bash
# Step 1: Current authority initiates
sss-token admin transfer-authority <NEW_MASTER_PUBKEY>

# Step 2: New authority accepts (using their keypair)
sss-token admin accept-authority --keypair <NEW_MASTER_KEYPAIR>
```

**Skip this step for API testing.**

---

## Phase 3: Minter Management

### 3.1 List Minters
```http
GET /admin/minters
```

**Expected Response (initially empty):**
```json
[]
```

### 3.2 Add Minter
```http
POST /admin/minters
```

**Request Body:**
```json
{
  "address": "6rqcaPUEdcyAp8u3bw8xeMKtSRYB7jxXt1xb51YWbYmP",
  "quota": "1000000000"
}
```
**Note**: Set quota to `"0"` for unlimited minting.

**Expected Response:**
```json
{
  "success": true,
  "signature": "3Yh1J2kK3lL4mM5nN6oO7pP8qQ9rR0sS1tT2uU3vV4wW5xX6yY7zZ8aA9bB0cC1dD2eE3fF4gG5hH6iI7jJ8kK9"
}
```

### 3.3 Verify Minter Added
```http
GET /admin/minters
```

**Expected Response:**
```json
[
  {
    "mint": "8BsWy9Z5PdXMwz6gcHEgDZicD5rFSEvyxGrUnyddgzF3",
    "minter": "6rqcaPUEdcyAp8u3bw8xeMKtSRYB7jxXt1xb51YWbYmP",
    "quota": "1000000000",
    "minted": "0",
    "active": true
  }
]
```

### 3.4 Update Minter
```http
PUT /admin/minters/6rqcaPUEdcyAp8u3bw8xeMKtSRYB7jxXt1xb51YWbYmP
```

**Request Body:**
```json
{
  "quota": "2000000000",
  "active": true,
  "resetMinted": false
}
```

**Expected Response:**
```json
{
  "success": true,
  "signature": "4Zi2K3lL4mM5nN6oO7pP8qQ9rR0sS1tT2uU3vV4wW5xX6yY7zZ8aA9bB0cC1dD2eE3fF4gG5hH6iI7jJ8kK9lL0"
}
```

### 3.5 Remove Minter (Optional)
```http
DELETE /admin/minters/6rqcaPUEdcyAp8u3bw8xeMKtSRYB7jxXt1xb51YWbYmP
```

**Expected Response:**
```json
{
  "success": true,
  "signature": "5Aj3L4mM5nN6oO7pP8qQ9rR0sS1tT2uU3vV4wW5xX6yY7zZ8aA9bB0cC1dD2eE3fF4gG5hH6iI7jJ8kK9lL0mM1"
}
```

---

## Phase 4: Mint & Burn Operations (Admin Flow)

The Admin flow uses the backend authority's signature and processes requests via a server-side queue.

### 4.1 Request Mint (Admin)
```http
POST /mint-burn/mint
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "recipient": "6rqcaPUEdcyAp8u3bw8xeMKtSRYB7jxXt1xb51YWbYmP",
  "amount": "1000000000",
  "mintAddress": "8BsWy9Z5PdXMwz6gcHEgDZicD5rFSEvyxGrUnyddgzF3",
  "minter": "6rqcaPUEdcyAp8u3bw8xeMKtSRYB7jxXt1xb51YWbYmP"
}
```
**Note**: Amount in base units (6 decimals: 1000000000 = 1000 USDb)

**Expected Response:**
```json
{
  "success": true,
  "id": "cm5x8y9z0a1b2c3d4e5f6g7h8",
  "status": "PENDING"
}
```
**Note**: Processed by background worker. Monitor logs for completion.

### 4.2 Verify Supply Increased
```http
GET /admin/supply
```

**Expected Response:**
```json
{
  "supply": "1000000000"
}
```

### 4.3 Check Minter Quota Usage
```http
GET /admin/minters
```

**Expected Response:**
```json
[
  {
    "mint": "8BsWy9Z5PdXMwz6gcHEgDZicD5rFSEvyxGrUnyddgzF3",
    "minter": "6rqcaPUEdcyAp8u3bw8xeMKtSRYB7jxXt1xb51YWbYmP",
    "quota": "2000000000",
    "minted": "1000000000",
    "active": true
  }
]
```

### 4.4 Request Burn
```http
POST /mint-burn/burn
```

**Request Body:**
```json
{
  "fromTokenAccount": "TokenAccountAddress123...",
  "amount": "100000000"
}
```
**Note**: 100 USDb = 100000000 base units

**Expected Response:**
```json
{
  "success": true,
  "id": "cm5x9z0a1b2c3d4e5f6g7h8i9",
  "status": "PENDING"
}
```

### 4.5 Verify Supply Decreased
```http
GET /admin/supply
```

**Expected Response:**
```json
{
  "supply": "900000000"
}
```

---

## Phase 5: Compliance - Pause/Unpause

### 5.1 Pause Protocol
```http
POST /compliance/pause
```

**Request Body:**
```json
{
  "reason": "Testing pause functionality"
}
```

**Expected Response:**
```json
{
  "success": true,
  "signature": "6Bk4M5nN6oO7pP8qQ9rR0sS1tT2uU3vV4wW5xX6yY7zZ8aA9bB0cC1dD2eE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2"
}
```

### 5.2 Verify Paused State
```http
GET /admin/status
```

**Expected Response (check `paused` field):**
```json
{
  "status": {
    "paused": true,
    ...
  }
}
```

### 5.3 Try Minting While Paused
```http
POST /mint-burn/mint
```

**Request Body:**
```json
{
  "recipient": "6rqcaPUEdcyAp8u3bw8xeMKtSRYB7jxXt1xb51YWbYmP",
  "amount": "100000000"
}
```

**Expected Response (should fail):**
```json
{
  "error": "Protocol is paused"
}
```

### 5.4 Unpause Protocol
```http
POST /compliance/unpause
```

**Request Body:**
```json
{
  "reason": "Testing complete"
}
```

**Expected Response:**
```json
{
  "success": true,
  "signature": "7Cl5N6oO7pP8qQ9rR0sS1tT2uU3vV4wW5xX6yY7zZ8aA9bB0cC1dD2eE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3"
}
```

### 5.5 Verify Unpaused
```http
GET /admin/status
```

**Expected Response:**
```json
{
  "status": {
    "paused": false,
    ...
  }
}
```

---

## Phase 6: Compliance - Freeze/Thaw (SSS-1)

These actions immediately restrict or restore transferability for a specific token account.

### 6.1 Freeze Account
```http
POST /compliance/freeze
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "address": "TokenAccountAddress123...",
  "reason": "Testing freeze"
}
```

**Expected Response:**
```json
{
  "success": true,
  "signature": "8Dm6O7pP8qQ9rR0sS1tT2uU3vV4wW5xX6yY7zZ8aA9bB0cC1dD2eE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4"
}
```

### 6.2 Verify Rejection
Attempt to send tokens from the frozen account using a wallet or CLI. It should fail with an error similar to:
`Error: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x11` (Frozen Account).

### 6.3 Thaw Account
```http
POST /compliance/thaw
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "address": "TokenAccountAddress123...",
  "reason": "Testing complete"
}
```

**Expected Response:**
```json
{
  "success": true,
  "signature": "9En7P8qQ9rR0sS1tT2uU3vV4wW5xX6yY7zZ8aA9bB0cC1dD2eE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5"
}
```

### 6.4 Verify Restoration
Attempt the transfer again. It should now succeed.

---

## Phase 7: Compliance — Digital Identity Blacklist (SSS-2)

Blacklisting is protocol-level. Transfers to/from blacklisted addresses are blocked by the Transfer Hook program.

### 7.1 Initialize Transfer Hook (One-time)
```http
POST /admin/hook/initialize
Authorization: Bearer <admin_token>
```

**Expected Response:**
```json
{
  "success": true,
  "signature": "1Fo8Q9rR0sS1tT2uU3vV4wW5xX6yY7zZ8aA9bB0cC1dD2eE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6"
}
```
**Note**: Required before blacklist enforcement works. Only needs to be called once.

### 7.2 Add to Blacklist
```http
POST /compliance/blacklist
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "address": "AddressToBlacklist123...",
  "reason": "Testing blacklist"
}
```

**Expected Response:**
```json
{
  "success": true,
  "signature": "2Gp9R0sS1tT2uU3vV4wW5xX6yY7zZ8aA9bB0cC1dD2eE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7"
}
```

### 7.3 Check Blacklist Status
```http
GET /compliance/blacklist/AddressToBlacklist123...
```

**Expected Response:**
```json
{
  "blacklisted": true,
  "entry": {
    "reason": "Testing blacklist",
    "timestamp": "1704067200"
  }
}
```

### 7.4 Try Transfer to/from Blacklisted Address
Attempt on-chain transfer - should fail at transfer hook with "Address is blacklisted" error.

### 7.5 Remove from Blacklist
```http
DELETE /compliance/blacklist/AddressToBlacklist123...
```

**Expected Response:**
```json
{
  "success": true,
  "signature": "3Hq0S1tT2uU3vV4wW5xX6yY7zZ8aA9bB0cC1dD2eE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8"
}
```

### 7.6 Verify Removal
```http
GET /compliance/blacklist/AddressToBlacklist123...
```

**Expected Response:**
```json
{
  "blacklisted": false
}
```

---

## Phase 8: Compliance - Seize (SSS-2)

### 8.1 Seize Tokens
```http
POST /compliance/seize
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "fromTokenAccount": "BlacklistedTokenAccount123...",
  "toTokenAccount": "TreasuryTokenAccount456...",
  "amount": "500000000",
  "reason": "Asset recovery"
}
```
**Note**: Uses permanent delegate to move tokens. Amount is 500 USDb (500000000 base units).

**Expected Response:**
```json
{
  "success": true,
  "signature": "4Ir1T2uU3vV4wW5xX6yY7zZ8aA9bB0cC1dD2eE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9"
}
```

### 8.2 Verify Balances
Check both token accounts on-chain - tokens should be moved from source to destination.

---

## Phase 9: Privacy Operations (SSS-3)

### 9.1 Approve Confidential Transfers
```http
POST /privacy/approve
```

**Request Body:**
```json
{
  "tokenAccount": "TokenAccountAddress123...",
  "mintAddress": "Optional_Mint_Address",
  "reason": "Enable privacy"
}
```

**Expected Response:**
```json
{
  "success": true,
  "signature": "5Js2U3vV4wW5xX6yY7zZ8aA9bB0cC1dD2eE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0"
}
```

### 9.2 Enable Confidential Credits
```http
POST /privacy/enable-credits
```

**Request Body:**
```json
{
  "tokenAccount": "TokenAccountAddress123...",
  "mintAddress": "Optional_Mint_Address",
  "reason": "Enable credits"
}
```

**Expected Response:**
```json
{
  "success": true,
  "signature": "6Kt3V4wW5xX6yY7zZ8aA9bB0cC1dD2eE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1"
}
```

### 9.3 Disable Confidential Credits
```http
POST /privacy/disable-credits
```

**Request Body:**
```json
{
  "tokenAccount": "TokenAccountAddress123...",
  "mintAddress": "Optional_Mint_Address",
  "reason": "Disable credits"
}
```

**Expected Response:**
```json
{
  "success": true,
  "signature": "7Lu4W5xX6yY7zZ8aA9bB0cC1dD2eE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2"
}
```

---

## Phase 10: Oracle Integration

### 10.1 Initialize Oracle
```http
POST /admin/oracle/initialize
```

**Request Body:**
```json
{
  "baseCurrency": "USD",
  "quoteCurrency": "USD",
  "aggregationMethod": "median",
  "maxStalenessSeconds": 3600,
  "mintPremiumBps": 10,
  "redeemDiscountBps": 10
}
```

**Expected Response:**
```json
{
  "success": true,
  "signature": "8Mv5X6yY7zZ8aA9bB0cC1dD2eE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3"
}
```

### 10.2 Check Oracle Status
```http
GET /admin/oracle/status
```

**Expected Response:**
```json
{
  "status": {
    "mint": "8BsWy9Z5PdXMwz6gcHEgDZicD5rFSEvyxGrUnyddgzF3",
    "authority": "6rqcaPUEdcyAp8u3bw8xeMKtSRYB7jxXt1xb51YWbYmP",
    "baseCurrency": "USD",
    "quoteCurrency": "USD",
    "aggregationMethod": "median",
    "maxStalenessSeconds": 3600,
    "mintPremiumBps": 10,
    "redeemDiscountBps": 10,
    "manualPrice": "0",
    "manualPriceActive": false,
    "lastAggregatedPrice": "0",
    "lastAggregatedConfidence": "0"
  },
  "feeds": []
}
```

### 10.3 View Oracle Activity (Logs)
```http
GET /admin/oracle/activity?limit=10
```

**Expected Response**:
Unified log of on-chain events (`PriceAggregated`) and backend admin logs.
```json
{
  "entries": [
    {
      "id": "...",
      "type": "ORACLE_FEED_ADD",
      "name": "ORACLE_FEED_ADD",
      "data": { "reason": "Label: SOL/USD, Idx: 0", "address": "6rqc..." },
      "timestamp": "2024-03-12T...",
      "signature": "..."
    }
  ]
}
```

### 10.4 Add Price Feed
```http
POST /admin/oracle/feeds
```

**Request Body:**
```json
{
  "feedIndex": 0,
  "feedType": "manual",
  "label": "Manual Feed 1",
  "weight": 100
}
```

**Expected Response:**
```json
{
  "success": true,
  "signature": "9Nw6Y7zZ8aA9bB0cC1dD2eE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ4"
}
```

### 10.5 Get Single Feed
```http
GET /admin/oracle/feeds/0
```

**Expected Response:**
```json
{
  "feedIndex": 0,
  "feedType": "manual",
  "label": "Manual Feed 1",
  "weight": 100,
  "lastPrice": "0",
  "lastConfidence": "0",
  "lastUpdateTimestamp": 0,
  "active": true
}
```

### 10.6 Crank Feed (Update Price)
```http
POST /admin/oracle/crank
```

**Request Body:**
```json
{
  "feedIndex": 0,
  "price": 1.00
}
```
**Note**: Price as float (1.00 = 1_000_000 in 6-decimal fixed-point)

**Expected Response:**
```json
{
  "success": true,
  "signature": "1Ox7Z8aA9bB0cC1dD2eE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ4aA5"
}
```

### 10.7 Aggregate Prices
```http
POST /admin/oracle/aggregate
```

**Request Body:**
```json
{
  "feedAccounts": ["FeedPDA1...", "FeedPDA2..."]
}
```

**Expected Response:**
```json
{
  "success": true,
  "signature": "2Py8A9bB0cC1dD2eE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ4aA5bB6"
}
```

### 10.8 Get Mint Price
```http
GET /admin/oracle/price/mint
```

**Expected Response:**
```json
{
  "signature": "3Qz9B0cC1dD2eE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ4aA5bB6cC7"
}
```

### 10.9 Get Redeem Price
```http
GET /admin/oracle/price/redeem
```

**Expected Response:**
```json
{
  "signature": "4Ra0C1dD2eE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ4aA5bB6cC7dD8"
}
```

### 10.10 Set Manual Price Override
```http
POST /admin/oracle/manual-price
```

**Request Body:**
```json
{
  "price": 1.05,
  "active": true
}
```
**Note**: When active, manual price overrides aggregated price.

**Expected Response:**
```json
{
  "success": true,
  "signature": "5Sb1D2eE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ4aA5bB6cC7dD8eE9"
}
```

### 10.11 Update Oracle Config
```http
PUT /admin/oracle/config
```

**Request Body:**
```json
{
  "maxStalenessSeconds": 7200,
  "aggregationMethod": "mean",
  "mintPremiumBps": 20,
  "redeemDiscountBps": 15
}
```

**Expected Response:**
```json
{
  "success": true,
  "signature": "6Tc2E3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ4aA5bB6cC7dD8eE9fF0"
}
```

### 10.12 Remove Price Feed
```http
DELETE /admin/oracle/feeds/0
```

**Expected Response:**
```json
{
  "success": true,
  "signature": "7Ud3F4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ4aA5bB6cC7dD8eE9fF0gG1"
}
```

### 10.13 Oracle Authority Transfer (CLI Only)

⚠️ **Note**: Similar to main authority transfer, oracle authority transfer requires keypair coordination and should be done via CLI.

**CLI Commands:**
```bash
# Step 1: Current oracle authority initiates
sss-token oracle transfer-authority <NEW_ORACLE_AUTHORITY>

# Step 2: New authority accepts
sss-token oracle accept-authority --keypair <NEW_ORACLE_KEYPAIR>
```

**Skip this step for API testing.**

### 10.14 Close Oracle
```http
DELETE /admin/oracle/close
```
**Note**: All feeds must be removed first.

**Expected Response:**
```json
{
  "success": true,
  "signature": "8Ve4G5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ4aA5bB6cC7dD8eE9fF0gG1hH2"
}
```

---

## Phase 11: Audit Logs

### 11.1 View Audit Trail
```http
GET /compliance/audit?limit=100
```

**Expected Response:**
```json
{
  "events": [
    {
      "id": "evt_123",
      "timestamp": "2026-03-09T10:30:00Z",
      "eventType": "TokensMinted",
      "signature": "5Xj2K3mN4pQ6rS7tU8vW9xY0zA1bC2dE3fG4hH5iJ6kL7mM8nN9oP0qR1sS2tT3uU4vV5wW6xX7yY8zZ9aA0bB1",
      "data": {
        "recipient": "6rqcaPUEdcyAp8u3bw8xeMKtSRYB7jxXt1xb51YWbYmP",
        "amount": "1000000000",
        "minter": "6rqcaPUEdcyAp8u3bw8xeMKtSRYB7jxXt1xb51YWbYmP"
      }
    },
    {
      "id": "evt_124",
      "timestamp": "2026-03-09T10:35:00Z",
      "eventType": "AccountFrozen",
      "signature": "8Dm6O7pP8qQ9rR0sS1tT2uU3vV4wW5xX6yY7zZ8aA9bB0cC1dD2eE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4",
      "data": {
        "account": "TokenAccountAddress123...",
        "reason": "Testing freeze"
      }
    },
    {
      "id": "evt_125",
      "timestamp": "2026-03-09T10:40:00Z",
      "eventType": "AddressBlacklisted",
      "signature": "2Gp9R0sS1tT2uU3vV4wW5xX6yY7zZ8aA9bB0cC1dD2eE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7",
      "data": {
        "address": "AddressToBlacklist123...",
        "reason": "Testing blacklist"
      }
    }
  ],
  "total": 3,
  "limit": 100
}
```

### 11.2 Filter by Event Type
```http
GET /compliance/audit?limit=50&eventType=TokensMinted
```

**Expected Response:**
```json
{
  "events": [
    {
      "id": "evt_123",
      "eventType": "TokensMinted",
      ...
    }
  ],
  "total": 1,
  "limit": 50
}
```

---

## Phase 12: Webhooks

### 12.1 Subscribe to All Events
```http
POST /webhooks/subscribe
```

**Request Body:**
```json
{
  "url": "https://your-webhook-endpoint.com/sss-events",
  "events": ["*"]
}
```

**Expected Response:**
```json
{
  "success": true,
  "subscriptionId": "sub_abc123def456",
  "url": "https://your-webhook-endpoint.com/sss-events",
  "events": ["*"]
}
```

### 12.2 Subscribe to Specific Events
```http
POST /webhooks/subscribe
```

**Request Body:**
```json
{
  "url": "https://your-webhook-endpoint.com/compliance",
  "events": ["AccountFrozen", "AccountThawed", "AddressBlacklisted", "AddressRemovedFromBlacklist"]
}
```

**Expected Response:**
```json
{
  "success": true,
  "subscriptionId": "sub_ghi789jkl012",
  "url": "https://your-webhook-endpoint.com/compliance",
  "events": ["AccountFrozen", "AccountThawed", "AddressBlacklisted", "AddressRemovedFromBlacklist"]
}
```

### 12.3 Test Webhook Dispatch (Internal)
```http
POST /webhooks/dispatch
```

**Request Body:**
```json
{
  "event": "TokensMinted",
  "data": {
    "recipient": "6rqcaPUEdcyAp8u3bw8xeMKtSRYB7jxXt1xb51YWbYmP",
    "amount": "1000000000",
    "signature": "5Xj2K3mN4pQ6rS7tU8vW9xY0zA1bC2dE3fG4hH5iJ6kL7mM8nN9oP0qR1sS2tT3uU4vV5wW6xX7yY8zZ9aA0bB1"
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "dispatched": 2,
  "subscriptions": ["sub_abc123def456", "sub_ghi789jkl012"]
}
```

**Webhook Payload (sent to subscribed URLs):**
```json
{
  "event": "TokensMinted",
  "timestamp": "2026-03-09T10:30:00Z",
  "data": {
    "recipient": "6rqcaPUEdcyAp8u3bw8xeMKtSRYB7jxXt1xb51YWbYmP",
    "amount": "1000000000",
    "signature": "5Xj2K3mN4pQ6rS7tU8vW9xY0zA1bC2dE3fG4hH5iJ6kL7mM8nN9oP0qR1sS2tT3uU4vV5wW6xX7yY8zZ9aA0bB1"
  }
}
```

### 12.4 Unsubscribe
```http
DELETE /webhooks/subscribe/sub_abc123def456
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Subscription removed"
}
```

---

## Phase 13: Analytics

### 13.1 Get Analytics Metrics
```http
GET /analytics?mint=8BsWy9Z5PdXMwz6gcHEgDZicD5rFSEvyxGrUnyddgzF3
```

**Expected Response:**
```json
{
  "mint": "8BsWy9Z5PdXMwz6gcHEgDZicD5rFSEvyxGrUnyddgzF3",
  "metrics": {
    "totalSupply": "1000000000",
    "activeHolders": 50,
    "transfers24h": 120,
    "mint24h": "100000000",
    "burn24h": "50000000"
  },
  "topHolders": [...],
  "history": [...]
}
```

---

## Phase 14: Dashboard

### 14.1 Get Dashboard Summary
```http
GET /dashboard/summary?mint=8BsWy9Z5PdXMwz6gcHEgDZicD5rFSEvyxGrUnyddgzF3
```

**Expected Response:**
```json
{
  "summary": {
    "name": "USD Black",
    "symbol": "USDb",
    "totalSupply": "1000000000",
    "change24h": "5.5"
  },
  "recentActivity": [...],
  "trajectory": [...]
}
```

---

## Phase 15: Cleanup & Close Mint

### 15.1 Verify Zero Supply
```http
GET /admin/supply
```

**Expected Response:**
```json
{
  "supply": "0"
}
```
**Note**: If supply is not zero, burn remaining tokens first.

### 13.2 Close Mint (Permanent)
```http
DELETE /admin/close-mint
```
**⚠️ WARNING**: This is irreversible. Mint cannot be reopened.

**Expected Response:**
```json
{
  "success": true,
  "signature": "9Wf5H6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ4aA5bB6cC7dD8eE9fF0gG1hH2iI3"
}
```

### 13.3 Verify Mint Closed
```http
GET /admin/status
```

**Expected Response (should fail):**
```json
{
  "error": "Mint account closed"
}
```

---

## Complete API Reference

| # | Method | Path | Description | Phase |
|---|--------|------|-------------|-------|
| 1 | GET | `/health` | Service health check | 1 |
| 2 | POST | `/create-stablecoin` | Create new stablecoin | 0 |
| 3 | GET | `/list-stablecoins` | List all created stablecoins | 0 |
| 4 | GET | `/get-stablecoin/:mintAddress` | Get specific stablecoin | 0 |
| 5 | GET | `/admin/status` | High-level state, metadata, roles | 1 |
| 6 | GET | `/admin/on-chain-status` | Raw blockchain account data | 1 |
| 7 | GET | `/admin/supply` | Canonical on-chain total supply | 1 |
| 8 | PUT | `/admin/roles` | Update role assignments | 2 |
| 9 | POST | `/admin/authority/transfer` | Initiate master authority transfer (CLI only) | 2 |
| 10 | POST | `/admin/authority/accept` | Accept master authority transfer (CLI only) | 2 |
| 11 | GET | `/admin/minters` | List all minters | 3 |
| 12 | POST | `/admin/minters` | Add minter | 3 |
| 13 | PUT | `/admin/minters/:address` | Update minter | 3 |
| 14 | DELETE | `/admin/minters/:address` | Remove minter | 3 |
| 15 | POST | `/mint-burn/mint` | Queue mint request | 4 |
| 16 | POST | `/mint-burn/burn` | Queue burn request | 4 |
| 17 | POST | `/compliance/pause` | Pause protocol | 5 |
| 18 | POST | `/compliance/unpause` | Unpause protocol | 5 |
| 19 | POST | `/compliance/freeze` | Freeze token account | 6 |
| 20 | POST | `/compliance/thaw` | Thaw token account | 6 |
| 21 | POST | `/admin/hook/initialize` | Initialize transfer hook (SSS-2) | 7 |
| 22 | POST | `/compliance/blacklist` | Add to blacklist | 7 |
| 23 | GET | `/compliance/blacklist/:address` | Check blacklist status | 7 |
| 24 | DELETE | `/compliance/blacklist/:address` | Remove from blacklist | 7 |
| 25 | POST | `/compliance/seize` | Seize tokens via permanent delegate | 8 |
| 26 | POST | `/privacy/approve` | Approve confidential transfers | 9 |
| 27 | POST | `/privacy/enable-credits` | Enable confidential credits | 9 |
| 28 | POST | `/privacy/disable-credits` | Disable confidential credits | 9 |
| 29 | POST | `/admin/oracle/initialize` | Initialize oracle | 10 |
| 30 | GET | `/admin/oracle/status` | Oracle config + all feeds | 10 |
| 31 | GET | `/admin/oracle/activity` | Unified event + audit logs | 10 |
| 32 | GET | `/admin/oracle/feeds/:index` | Single feed by index | 10 |
| 33 | POST | `/admin/oracle/feeds` | Add price feed | 10 |
| 34 | DELETE | `/admin/oracle/feeds/:index` | Remove feed | 10 |
| 35 | POST | `/admin/oracle/crank` | Manually crank feed | 10 |
| 36 | POST | `/admin/oracle/aggregate` | Aggregate all feeds | 10 |
| 37 | GET | `/admin/oracle/price/mint` | Get mint price | 10 |
| 38 | GET | `/admin/oracle/price/redeem` | Get redeem price | 10 |
| 39 | POST | `/admin/oracle/manual-price` | Set manual price override | 10 |
| 40 | PUT | `/admin/oracle/config` | Update oracle config | 10 |
| 41 | GET | `/compliance/audit` | Audit trail | 11 |
| 42 | POST | `/webhooks/subscribe` | Subscribe to events | 12 |
| 43 | DELETE | `/webhooks/subscribe/:id` | Unsubscribe | 12 |
| 44 | POST | `/webhooks/dispatch` | Internal: trigger event dispatch | 12 |
| 45 | GET | `/analytics` | Analytics metrics | 13 |
| 46 | GET | `/dashboard/summary` | Dashboard summary | 14 |
| 47 | DELETE | `/admin/close-mint` | Permanently close mint | 15 |

**Total Endpoints**: 47 (45 public + 2 CLI-only authority transfers)

---

## Testing Checklist

### Initial Setup
- [ ] Docker containers running (`docker compose up -d`)
- [ ] Environment variables configured in `.env`
- [ ] Test wallet funded with devnet SOL
- [ ] API accessible at `http://localhost:3001`

### Core Functionality (SSS-1)
- [ ] Health check passes
- [ ] Status endpoint returns correct data
- [ ] Roles can be updated
- [ ] Minters can be added/updated/removed
- [ ] Mint operations work and update supply
- [ ] Burn operations work and decrease supply
- [ ] Pause/unpause prevents/allows operations
- [ ] Freeze/thaw blocks/allows transfers

### Compliance (SSS-2)
- [ ] Transfer hook initialized
- [ ] Addresses can be blacklisted
- [ ] Blacklisted addresses cannot transfer
- [ ] Addresses can be removed from blacklist
- [ ] Tokens can be seized via permanent delegate

### Privacy (SSS-3)
- [ ] Confidential transfers can be approved
- [ ] Confidential credits can be enabled/disabled

### Oracle Integration
- [ ] Oracle can be initialized
- [ ] Price feeds can be added/removed
- [ ] Feeds can be cranked (price updates)
- [ ] Prices can be aggregated
- [ ] Mint/redeem prices calculated correctly
- [ ] Manual price override works
- [ ] Oracle config can be updated
- [ ] Oracle can be closed

### Monitoring & Integration
- [ ] Audit logs capture all events
- [ ] Webhooks can be subscribed/unsubscribed
- [ ] Webhook events are dispatched correctly
- [ ] Analytics metrics return data
- [ ] Dashboard summary returns data

### Cleanup
- [ ] Mint can be closed when supply is zero

---

## Troubleshooting

### Common Issues

#### 1. "Account not found" errors
**Cause**: PDA accounts not initialized or wrong program ID.

**Solution**:
- Verify program IDs in `Anchor.toml` match deployed programs
- Check if initialization steps were completed (e.g., transfer hook, oracle)
- Ensure correct network (localnet vs devnet)

#### 2. "Insufficient funds" errors
**Cause**: Authority wallet lacks SOL for transaction fees.

**Solution**:
```bash
# Devnet
solana airdrop 2 <AUTHORITY_PUBKEY> --url devnet

# Localnet
solana airdrop 10 <AUTHORITY_PUBKEY> --url localhost
```

#### 3. Mint/burn operations stuck in PENDING
**Cause**: Background worker not processing queue.

**Solution**:
- Check Docker logs: `docker logs -f sss-backend`
- Verify Redis is running: `docker ps | grep redis`
- Check BullMQ dashboard if available
- Restart services: `docker compose restart`

#### 4. "Protocol is paused" errors
**Cause**: Protocol was paused and not unpaused.

**Solution**:
```http
POST /compliance/unpause
Body: { "reason": "Resume operations" }
```

#### 5. Transfer hook not enforcing blacklist
**Cause**: Transfer hook not initialized or not attached to mint.

**Solution**:
```http
POST /admin/hook/initialize
```
Only needs to be called once per mint.

#### 6. Oracle price returns zero
**Cause**: No feeds added or feeds not cranked.

**Solution**:
1. Add at least one feed: `POST /admin/oracle/feeds`
2. Crank the feed: `POST /admin/oracle/crank`
3. Aggregate prices: `POST /admin/oracle/aggregate`

#### 7. "Quota exceeded" on mint
**Cause**: Minter has reached their quota limit.

**Solution**:
```http
PUT /admin/minters/<MINTER_ADDRESS>
Body: { "quota": "5000000000", "resetMinted": true }
```

#### 8. Authority transfer fails
**Cause**: Using API instead of CLI, or wrong keypair.

**Solution**: Use CLI for authority transfers:
```bash
# Step 1: Current authority
sss-token admin transfer-authority <NEW_MASTER>

# Step 2: New authority (with their keypair)
sss-token admin accept-authority --keypair <NEW_KEYPAIR>
```

#### 9. Webhook not receiving events
**Cause**: Subscription not active or URL unreachable.

**Solution**:
- Verify subscription: Check response from `POST /webhooks/subscribe`
- Test URL accessibility from Docker container
- Check webhook endpoint logs for incoming requests
- Use ngrok or similar for local testing: `ngrok http 3000`

#### 10. "Cannot close mint" error
**Cause**: Total supply is not zero.

**Solution**:
1. Check supply: `GET /admin/supply`
2. Burn remaining tokens: `POST /mint-burn/burn`
3. Wait for burn to complete
4. Retry close: `DELETE /admin/close-mint`

---

## Notes

### Fixed-Point Format
The system uses a mixed-precision model to balance protocol accuracy with storage efficiency:
- **Inputs (Crank/Manual Override)**: Processed at **9-decimal** precision (standard for Solana oracles). $1.00 = `1_000_000_000`.
- **On-Chain Storage & Dashboard**: Aggregated prices are stored at **6-decimal** precision (standard for stablecoins like USDC). $1.00 = `1_000_000`.
- **API**: Accepts floats (e.g., `1.05`) and automatically scales to the 9-decimal program expectation.

### Basis Points (BPS)
Premium and discount are in basis points:
- `10 bps` = `0.10%` = `0.001` multiplier
- `100 bps` = `1.00%` = `0.01` multiplier
- `1000 bps` = `10.00%` = `0.10` multiplier

### Queued Operations
Mint and burn operations are queued and processed asynchronously:
1. API returns immediately with job ID and `PENDING` status
2. Background worker processes the queue
3. Monitor logs for completion: `docker logs -f sss-backend`
4. Check supply to verify: `GET /admin/supply`

### Two-Step Authority Transfers
Authority transfers require two steps to prevent accidental lockout:
1. Current authority initiates transfer
2. New authority accepts transfer (proves they control the keypair)

This applies to both main authority and oracle authority.

### Blacklist vs Whitelist
The system uses a blacklist model (not whitelist):
- Default: All addresses can transfer (implicit whitelist)
- Blacklist: Create PDA to block specific addresses
- "Whitelisting" = removing from blacklist (restoring default behavior)

This matches industry standards (USDC, USDT) and is more efficient.

---

## Phase 16: Hybrid Signing (Minter Wallet Signing)

Hybrid signing allows Minters to sign transactions with their own wallets (e.g., Phantom) while the backend prepares the transaction details.

### 16.1 Get Authorized Mints for Wallet
Minters use this to find which tokens they can interact with.
```http
GET /admin/minter-status/YourWalletAddress
Authorization: Bearer <minter_token>
```

### 16.2 Prepare Mint Transaction
Returns a serialized transaction for the minter to sign.
```http
POST /mint-burn/prepare-mint
Authorization: Bearer <minter_token>
```

**Request Body:**
```json
{
  "recipient": "Recipient_Wallet_Address",
  "amount": "1000000",
  "mintAddress": "Mint_Address",
  "minter": "Your_Connected_Wallet_Address"
}
```

**Response:**
```json
{
  "transaction": "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAED6rqcaPUEdcyAp..."
}
```

**Workflow**:
1. Client calls `/prepare-mint`.
2. Backend returns a base64 encoded transaction (with `recentBlockhash` and `feePayer` set to the minter).
3. Client signs and sends the transaction to the blockchain.
4. Backend Indexer automatically detects the `TokensMinted` event and updates the history.

### 16.3 Prepare Burn Transaction
Same as mint, but for burning tokens.
```http
POST /mint-burn/prepare-burn
Authorization: Bearer <minter_token>
```

**Request Body:**
```json
{
  "fromTokenAccount": "Your_Token_Account_Address",
  "amount": "500000",
  "mintAddress": "Mint_Address",
  "minter": "Your_Connected_Wallet_Address"
}
```

**Response:**
```json
{
  "transaction": "..."
}
```

## Phase 17: Privacy Stats & Accounts

### 17.1 Get Privacy Stats
```http
GET /privacy/stats?mintAddress=MintAddress
Authorization: Bearer <token>
```

**Expected Response**:
```json
{
  "extensionActive": true,
  "approvedCount": 5,
  "creditsEnabledCount": 3
}
```

### 17.2 Get Approved Privacy Accounts
```http
GET /privacy/accounts?mintAddress=MintAddress
Authorization: Bearer <token>
```

**Expected Response**: Returns an array of approved accounts with their credit status.

## Phase 18: Token Account Insights

### 18.1 Get Account Balance & Decimals
```http
GET /accounts/TokenAccountAddress/balance
Authorization: Bearer <token>
```

**Expected Response**:
```json
{
  "amount": "1000000",
  "decimals": 6,
  "uiAmountString": "1.00"
}
```

---

**End of API Testing Guide**

For SDK usage, see `docs/SDK.md`.  
For CLI usage, see `README.md` and `docs/OPERATIONS.md`.  
For architecture details, see `docs/ARCHITECTURE.md`.
