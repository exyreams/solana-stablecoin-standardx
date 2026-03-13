# Solana Stablecoin Standard - Submission

> Complete implementation of the Solana Stablecoin Standard with SSS-1, SSS-2, SSS-3 presets, Oracle integration, full SDK, CLI, Web Dashboard, and Backend Services

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Anchor](https://img.shields.io/badge/Anchor-0.32.1-blueviolet)](https://www.anchor-lang.com/)
[![Solana](https://img.shields.io/badge/Solana-1.18+-9945FF)](https://solana.com/)

**Submitted by:** [@exyreams](https://github.com/exyreams)  
**Repository:** https://github.com/exyreams/solana-stablecoin-standard  

**Devnet Program IDs:**

- `sss_token`  
  - Program ID: `GQp6UgyhLZP6zXRf24JH2BiwuoSAfYZruJ3WUPkqgj8X`  
  - Devnet: https://explorer.solana.com/address/GQp6UgyhLZP6zXRf24JH2BiwuoSAfYZruJ3WUPkqgj8X?cluster=devnet  

- `transfer_hook`  
  - Program ID: `HPksBobjquMqBfnCgpqBQDkomJ4HmGB1AbvJnemNBEig`  
  - Devnet: https://explorer.solana.com/address/HPksBobjquMqBfnCgpqBQDkomJ4HmGB1AbvJnemNBEig?cluster=devnet  

- `sss_oracle`  
  - Program ID: `7nFqXZae9mzYP7LefmCe9C1V2zzPbrY3nLR9WVGorQee`  
  - Devnet: https://explorer.solana.com/address/7nFqXZae9mzYP7LefmCe9C1V2zzPbrY3nLR9WVGorQee?cluster=devnet  

---

## Summary

We've built a production-ready, modular stablecoin framework for Solana that goes beyond the bounty requirements. This is not just an SDK—it's a complete ecosystem for building, deploying, and managing stablecoins at scale.


### Key Achievements

✅ **All Required Deliverables** - SSS-1, SSS-2, SDK, CLI, Backend Services, Documentation  
✅ **All Bonus Features** - SSS-3 Privacy, Oracle Integration, Interactive TUI, Web Dashboard  
✅ **Production-Ready** - Comprehensive testing, security best practices, audit trails  
✅ **Developer Experience** - Intuitive APIs, extensive examples, detailed documentation  
✅ **Operational Excellence** - Docker deployment, monitoring, compliance automation

---

## What We Built

### Three Standards, One Unified SDK

| Standard | Description | Use Case | Status |
|----------|-------------|----------|--------|
| **SSS-1** | Minimal Stablecoin | Internal tokens, DAO treasuries, ecosystem settlement | ✅ Complete |
| **SSS-2** | Compliant Stablecoin | Regulated stablecoins (USDC/USDT-class) with on-chain blacklist | ✅ Complete |
| **SSS-3** | Private Stablecoin | Privacy-preserving stablecoins with confidential transfers | ✅ Complete (Bonus) |

### Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│  Applications Layer                                      │
│  Web Dashboard · CLI (40+ commands) · Backend Services   │
├──────────────────────────────────────────────────────────┤
│  Standard Presets                                        │
│  SSS-1: Minimal · SSS-2: Compliant · SSS-3: Private      │
├──────────────────────────────────────────────────────────┤
│  Modules Layer                                           │
│  Compliance · Privacy · Oracle · Role Management          │
├──────────────────────────────────────────────────────────┤
│  Core Infrastructure                                     │
│  3 Anchor Programs · TypeScript SDK · Token-2022         │
└──────────────────────────────────────────────────────────┘
```

---

## Gallery

### Web Dashboard (React + Vite)

| Dashboard | Token Info | Analytics |
|-----------|------------|-----------|
| <img src="https://github.com/user-attachments/assets/43c458c1-54bd-42e8-81d8-22feb5a6becd" width="300" alt="Dashboard" /> | <img src="https://github.com/user-attachments/assets/17a20476-e378-40bf-9991-517e25704989" width="300" alt="Token Info" /> | <img src="https://github.com/user-attachments/assets/ecdae693-57e0-40c9-b072-545deb9599a7" width="300" alt="Analytics" /> |
| **Audit Logs** | **Mint Tokens** | **Burn Tokens** |
| <img src="https://github.com/user-attachments/assets/62c8f0bb-6bd6-408e-acdd-9231f7f59d8d" width="300" alt="Audit Logs" /> | <img src="https://github.com/user-attachments/assets/1c140212-28cd-4442-b35f-655f3367f25c" width="300" alt="Mint" /> | <img src="https://github.com/user-attachments/assets/af09de5e-17bd-47d7-9759-abe938d35040" width="300" alt="Burn" /> |
| **Account Mgmt** | **Blacklist (SSS-2)** | **Privacy (SSS-3)** |
| <img src="https://github.com/user-attachments/assets/0f620e7e-e3a8-439d-816b-be3a691186f8" width="300" alt="Accounts" /> | <img src="https://github.com/user-attachments/assets/7e86ed17-f6c3-4adc-8298-63eeb693253c" width="300" alt="Blacklist" /> | <img src="https://github.com/user-attachments/assets/1c38855b-b813-4465-8878-7dd15597a562" width="300" alt="Privacy" /> |
| **Minters** | **Roles** | **Oracle** |
| <img src="https://github.com/user-attachments/assets/52e37c68-5840-414c-a09c-7fd4d5478d50" width="300" alt="Minters" /> | <img src="https://github.com/user-attachments/assets/3a314d9a-3997-41f9-a73c-038322d7fc16" width="300" alt="Roles" /> | <img src="https://github.com/user-attachments/assets/f928cd3b-4fe1-4c1f-9885-69dc211f8bbc" width="300" alt="Oracle" /> |

### CLI (40+ Commands) & Terminal UI

| Init & Status | Minting & Compliance | Oracle & TUI |
|---------------|----------------------|--------------|
| <img src="https://github.com/user-attachments/assets/d83d106e-1756-4cac-9171-229628df419d" width="300" alt="Init" /> | <img src="https://github.com/user-attachments/assets/d3b5d076-8ab2-4423-9ff0-bd84964ec3dc" width="300" alt="Mint" /> | <img src="https://github.com/user-attachments/assets/a15c837a-c3ca-44a4-a4b7-5a11c9f15aab" width="300" alt="Oracle" /> |
| **Status Display** | **Blacklist Mgmt** | **Price Feeds** |
| <img src="https://github.com/user-attachments/assets/19e23dee-e96b-4288-8c05-1483600386c0" width="300" alt="Status" /> | <img src="https://github.com/user-attachments/assets/7192c408-1660-4730-9c80-e91281f7ae8f" width="300" alt="Compliance" /> | <img src="https://github.com/user-attachments/assets/77f3ca09-23b3-4943-a4da-b62cc2063273" width="300" alt="Feeds" /> |
| **Minter Mgmt** | **Aggregation** | **TUI Menu** |
| <img src="https://github.com/user-attachments/assets/a13704da-0cba-4d62-b9df-305d3e7b5804" width="300" alt="Minters" /> | <img src="https://github.com/user-attachments/assets/d4f47536-91a5-4545-b9e8-dfb91821a7d2" width="300" alt="Aggregate" /> | <img src="https://github.com/user-attachments/assets/0994bd4b-a407-4e8a-ad34-272b85997b50" width="300" alt="TUI Menu" /> |
| **TUI Dashboard** | | |
| <img src="https://github.com/user-attachments/assets/5652a5b7-b7c9-4161-80c3-74d9e72c19aa" width="300" alt="TUI Dashboard" /> | | |

---

## Core Deliverables

### 1. On-Chain Programs (Anchor/Rust)

#### `sss-token` - Main Stablecoin Program
- **21 instructions** covering all token lifecycle operations
- Role-based access control (6 roles: master, minter, burner, pauser, blacklister, seizer)
- Per-minter quota enforcement with unlimited option
- Global pause/unpause circuit breaker
- SSS-2 blacklist management with on-chain reasons
- SSS-3 confidential transfer approval
- Two-step authority transfer for security
- Metaplex metadata integration for wallet display
- **32 on-chain events** for complete audit trail

**Key Features:**
- PDA-based security (no EOA retains privileged access)
- Feature gating (SSS-2/SSS-3 ops fail gracefully on SSS-1 mints)
- Zero-copy deserialization for performance
- Comprehensive error handling (30+ custom errors)

#### `transfer-hook` - SSS-2 Blacklist Enforcement
- **2 instructions** for hook initialization and execution
- Enforced by Token-2022 runtime (unforgeable)
- Checks both source and destination against blacklist
- ExtraAccountMetaList for automatic account resolution
- Zero performance overhead when no blacklist entries exist

#### `sss-oracle` - Multi-Source Price Feeds
- **11 instructions** for oracle lifecycle management
- Support for 5 feed types (Switchboard, Pyth, Chainlink, Manual, API)
- 3 aggregation methods (Median, Mean, Weighted Mean)
- Circuit breaker protection (max price change threshold)
- Staleness checks and confidence intervals
- Mint premium and redeem discount spreads
- Manual price override capability
- Per-feed weights and staleness overrides

---

### 2. TypeScript SDK (`@stbr/sss-token-sdk`)

A comprehensive SDK with intuitive APIs for all stablecoin operations.

**Core Features:**
- Factory methods for creating and loading stablecoins
- Preset system (SSS-1, SSS-2, SSS-3) with custom config support
- Modular architecture (Core, Compliance, Privacy, Oracle)
- Transaction preparation for frontend integration
- Complete PDA derivation utilities
- Type-safe interfaces with full TypeScript support

**Module Breakdown:**

```typescript
// Core SDK
SolanaStablecoin
  ├─ create() / load()              // Factory methods
  ├─ mintTokens() / burn()          // Token operations
  ├─ freeze() / thaw()              // Account management
  ├─ pause() / unpause()            // Circuit breaker
  ├─ updateRoles()                  // Role management
  ├─ addMinter() / removeMinter()   // Minter management
  └─ getStatus() / getRoles()       // Query methods

// Compliance Module (SSS-2)
stablecoin.compliance
  ├─ blacklistAdd() / blacklistRemove()
  ├─ isBlacklisted() / getBlacklistEntry()
  ├─ seize()
  └─ initializeHook()

// Privacy Module (SSS-3)
stablecoin.privacy
  ├─ approveAccount()
  ├─ enableCredits()
  └─ disableCredits()

// Oracle Module
stablecoin.oracle
  ├─ initialize() / updateConfig()
  ├─ addFeed() / removeFeed()
  ├─ crankFeed() / aggregate()
  └─ getMintPrice() / getRedeemPrice()
```

**Example Usage:**

```typescript
import { SolanaStablecoin, Presets } from '@stbr/sss-token-sdk';

// Create SSS-2 compliant stablecoin
const { stablecoin } = await SolanaStablecoin.create(connection, {
  preset: Presets.SSS_2,
  name: 'My USD Coin',
  symbol: 'MYUSD',
  authority: adminKeypair,
});

// Mint tokens
await stablecoin.mintTokens({
  recipient: userPubkey,
  amount: 1000_000000n,
});

// Blacklist management
await stablecoin.compliance.blacklistAdd(
  suspiciousAddress,
  'OFAC sanctions match',
  blacklisterKeypair
);
```

---

### 3. Command-Line Interface (`@stbr/sss-token-cli`)

A production-grade CLI with 40+ commands for complete stablecoin administration.

**Command Groups:**

```bash
# Core Operations (8 commands)
sss-token init              # Initialize new stablecoin
sss-token mint              # Mint tokens
sss-token burn              # Burn tokens
sss-token freeze            # Freeze account
sss-token thaw              # Thaw account
sss-token pause             # Pause operations
sss-token unpause           # Resume operations
sss-token close-mint        # Permanently close mint

# Minter Management (4 commands)
sss-token minters list      # List all minters
sss-token minters add       # Add new minter
sss-token minters remove    # Remove minter
sss-token minters update    # Update minter quota/status

# Role Management (4 commands)
sss-token roles show        # Display role assignments
sss-token roles update      # Update roles
sss-token roles transfer    # Initiate authority transfer
sss-token roles accept      # Accept authority transfer

# Information & Queries (4 commands)
sss-token status            # Comprehensive status
sss-token supply            # Total supply
sss-token holders           # List token holders
sss-token audit-log         # Transaction history

# Compliance - SSS-2 (5 commands)
sss-token blacklist add     # Add to blacklist
sss-token blacklist remove  # Remove from blacklist
sss-token blacklist check   # Check blacklist status
sss-token seize             # Seize tokens
sss-token hook init         # Initialize transfer hook

# Privacy - SSS-3 (3 commands)
sss-token privacy approve           # Approve account
sss-token privacy enable-credits    # Enable confidential credits
sss-token privacy disable-credits   # Disable confidential credits

# Oracle Management (12 commands)
sss-token oracle init               # Initialize oracle
sss-token oracle status             # Oracle status
sss-token oracle update             # Update config
sss-token oracle close              # Close oracle
sss-token oracle add-feed           # Add price feed
sss-token oracle remove-feed        # Remove feed
sss-token oracle list-feeds         # List all feeds
sss-token oracle crank              # Update feed price
sss-token oracle aggregate          # Aggregate prices
sss-token oracle mint-price         # Get mint price
sss-token oracle redeem-price       # Get redeem price
sss-token oracle set-manual-price   # Set manual override

# Interactive UI (1 command)
sss-token tui               # Launch terminal UI
```

**Key Features:**
- Preset-based initialization (SSS-1, SSS-2, SSS-3)
- Custom configuration via TOML/JSON files
- Environment variable support
- Rich terminal output with tables and colors
- Comprehensive error messages
- Transaction confirmation links
- Auto-completion support

---

### 4. Backend Services (Node.js + Express)

Production-ready backend infrastructure with Docker deployment.

**Service Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│  API Gateway (Express)                                  │
│  REST endpoints with authentication & rate limiting     │
└────┬────────────────────────────────────────────┬───────┘
     │                                            │
┌────┴─────────────────┐              ┌──────────┴────────┐
│  Mint/Burn Service   │              │  Compliance Svc   │
│  Queue-based minting │              │  Blacklist mgmt   │
└──────────────────────┘              └───────────────────┘
                 │                              │
┌────────────────┴──────────────────────────────┴─────────┐
│  Event Indexer (WebSocket)                              │
│  Real-time blockchain event indexing                    │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────┐
│  PostgreSQL Database (Drizzle ORM)                      │
│  Events, minters, blacklist, audit logs                 │
└─────────────────────────────────────────────────────────┘
```

**Core Services:**

1. **Mint/Burn Service**
   - Queue-based processing for high throughput
   - Automatic retry with exponential backoff
   - Transaction confirmation tracking
   - Per-minter rate limiting

2. **Compliance Service**
   - Blacklist management API
   - Sanctions screening integration points
   - Transaction monitoring
   - Audit trail export (CSV, JSON)

3. **Event Indexer**
   - Real-time WebSocket subscription to program logs
   - Parses and stores all 32 event types
   - Maintains off-chain state for fast queries
   - Webhook notifications

4. **Webhook Service**
   - Configurable event notifications
   - Retry logic with exponential backoff
   - HMAC signature verification
   - Event filtering by type

**API Endpoints:**

```
POST   /api/mint              # Queue mint operation
POST   /api/burn              # Queue burn operation
GET    /api/status            # Token status
GET    /api/supply            # Total supply
GET    /api/holders           # Token holders
GET    /api/minters           # List minters
POST   /api/blacklist         # Add to blacklist
DELETE /api/blacklist/:addr   # Remove from blacklist
GET    /api/audit-log         # Audit trail
POST   /api/webhooks          # Register webhook
GET    /api/health            # Health check
```

**Deployment:**

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

**Environment Configuration:**
- Solana RPC endpoint
- Database connection
- Redis for queue
- API keys and secrets
- Webhook URLs

---

## Bonus Features

### 1. SSS-3 Private Stablecoin (Experimental)

Complete implementation of privacy-preserving stablecoins using Token-2022 confidential transfers.

**Features:**
- Confidential transfer extension integration
- Account approval workflow
- Enable/disable confidential credits
- ElGamal encryption for transfer amounts
- Optional auditor support
- Auto-approve configuration

**Use Cases:**
- Privacy-preserving payments
- Confidential treasury management
- Anonymous donations
- Private payroll systems

**SDK Example:**

```typescript
// Create SSS-3 private stablecoin
const { stablecoin } = await SolanaStablecoin.create(connection, {
  preset: Presets.SSS_3,
  name: 'Private Dollar',
  symbol: 'PDOL',
  authority: adminKeypair,
  auditorElGamalPubkey: auditorKey,
});

// Approve account for confidential transfers
await stablecoin.privacy.approveAccount(userTokenAccount);

// Enable receiving confidential transfers
await stablecoin.privacy.enableCredits(userTokenAccount);
```

---

### 2. Oracle Integration for Non-USD Pegs

Multi-source price feed aggregation for stablecoins pegged to EUR, BRL, Gold, CPI, or any asset.

**Supported Feed Types:**
- Switchboard (decentralized oracle network)
- Pyth Network (high-frequency price feeds)
- Chainlink (industry-standard oracles)
- Manual (operator-controlled)
- API (custom REST endpoints)

**Aggregation Methods:**
- Median (resistant to outliers)
- Mean (simple average)
- Weighted Mean (feed-specific weights)

**Quality Gates:**
- Staleness checks (max age per feed)
- Confidence intervals (price uncertainty)
- Deviation threshold (feed agreement)
- Circuit breaker (max price change)

**Example: EUR Stablecoin**

```typescript
// Initialize oracle for EUR/USD
await stablecoin.oracle.initialize({
  baseCurrency: 'EUR',
  quoteCurrency: 'USD',
  maxStalenessSeconds: 300,
  aggregationMethod: AggregationMethod.Median,
  minFeedsRequired: 2,
  maxPriceChangeBps: 1000, // 10% circuit breaker
  mintPremiumBps: 50,      // 0.5% premium
  redeemDiscountBps: 50,   // 0.5% discount
});

// Add Switchboard feed
await stablecoin.oracle.addFeed({
  feedIndex: 0,
  feedType: FeedType.Switchboard,
  feedAddress: switchboardFeedPubkey,
  label: 'Switchboard EUR/USD',
  weight: 10000,
});

// Add Pyth feed
await stablecoin.oracle.addFeed({
  feedIndex: 1,
  feedType: FeedType.Pyth,
  feedAddress: pythFeedPubkey,
  label: 'Pyth EUR/USD',
  weight: 10000,
});

// Crank feeds (update prices)
await stablecoin.oracle.crankFeed({
  feedIndex: 0,
  price: 1_100_000_000n,      // 1.10 EUR/USD
  confidence: 1_000_000n,     // 0.001 confidence
});

// Aggregate prices
await stablecoin.oracle.aggregate(feedPdas);

// Get mint/redeem prices
const mintPrice = await stablecoin.oracle.getMintPrice();
const redeemPrice = await stablecoin.oracle.getRedeemPrice();
```

**Use Cases:**
- EUR-pegged stablecoins (EURS)
- BRL-pegged stablecoins (BRLS)
- Gold-backed tokens (XAUS)
- CPI-indexed stablecoins
- Multi-currency baskets

---

### 3. Interactive Terminal UI (TUI)

Real-time monitoring dashboard built with React for the terminal (using `ink`).

**Features:**
- Live token information and supply tracking
- Role assignments table
- Minters table with quota usage bars
- Supply history chart (ASCII art)
- Activity log (last 20 events)
- Auto-refresh every 5 seconds
- Keyboard shortcuts (r: refresh, q: quit)

**Launch:**

```bash
sss-token tui
```

**Display Sections:**
1. Token Info (name, symbol, supply, status)
2. Extensions Status (permanent delegate, transfer hook, etc.)
3. Role Assignments (master, burner, pauser, etc.)
4. Minters (quota usage with progress bars)
5. Recent Activity (real-time event stream)

---

### 4. Web Dashboard (React + Vite)

Complete web interface for managing stablecoins with wallet integration.

**Pages:**

1. **Dashboard** - Overview with key metrics and quick actions
2. **Token Info** - Detailed configuration and status
3. **Analytics** - Supply charts, holder distribution, concentration analysis
4. **Audit Logs** - Complete transaction history with filtering
5. **Mint/Burn** - Token operations with quota tracking
6. **Account Management** - Search, freeze, thaw accounts
7. **Blacklist** (SSS-2) - Add/remove addresses with reasons
8. **Privacy** (SSS-3) - Confidential transfer management
9. **Minters** - Add, remove, update minters
10. **Roles** - Update role assignments
11. **Oracle** - Price feed management and monitoring

**Tech Stack:**
- React 18 with TypeScript
- Vite for fast builds
- Solana Wallet Adapter (Phantom, Solflare, etc.)
- shadcn/ui components
- Recharts for data visualization
- TanStack Query for data fetching
- Tailwind CSS for styling

**Features:**
- Wallet connection (Phantom, Solflare, Backpack, etc.)
- Real-time updates via WebSocket
- Transaction confirmation toasts
- Responsive design (mobile-friendly)
- Dark mode support
- Export audit logs (CSV, JSON)

**Deployment:**

```bash
cd packages/web
pnpm install
pnpm dev          # Development server
pnpm build        # Production build
pnpm preview      # Preview production build
```

---

## Technical Highlights

### 1. Security & Best Practices

**PDA-Based Security:**
- All state accounts use Program Derived Addresses
- No EOA retains privileged access after initialization
- Unforgeable signatures (only program can sign)
- Deterministic addresses for clients

**Role Separation:**
```
Master Authority (Hardware Wallet)
  ├─ Update roles, transfer authority, close mint
  └─ Cannot: Mint, burn, blacklist (requires delegation)

Minter (Hot Wallet / Backend)
  ├─ Mint tokens up to quota
  └─ Cannot: Burn, freeze, blacklist, change roles

Burner (Hot Wallet / Backend)
  ├─ Burn tokens from any account
  └─ Cannot: Mint, freeze, blacklist, change roles

Pauser (Operations Team)
  ├─ Pause/unpause globally
  └─ Cannot: Mint, burn, blacklist, change roles

Blacklister (Compliance Officer)
  ├─ Add/remove from blacklist
  └─ Cannot: Mint, burn, seize, change roles

Seizer (Compliance Officer)
  ├─ Seize tokens from blacklisted accounts
  └─ Cannot: Mint, burn, blacklist, change roles
```

**Two-Step Authority Transfer:**
- Prevents accidental lockout
- Pending master must explicitly accept
- Works for both token and oracle authority

**Feature Gating:**
- SSS-2 instructions fail gracefully on SSS-1 mints
- SSS-3 instructions fail gracefully on non-SSS-3 mints
- Clear error messages for unsupported operations

---

### 2. Performance Optimizations

**Zero-Copy Deserialization:**
- Uses `bytemuck` for efficient account parsing
- No heap allocations for account data
- Minimal compute unit usage

**Efficient PDA Derivation:**
- Cached bump seeds where possible
- Minimal seed data (only required fields)
- Optimized for common operations

**Account Size Optimization:**
```
StablecoinState:    256 bytes
RolesConfig:        256 bytes
MinterQuota:        128 bytes per minter
BlacklistEntry:     128 bytes per address
OracleConfig:       512 bytes
PriceFeedEntry:     256 bytes per feed
```

**Cost Estimates (at 0.000005 SOL/byte):**
- Initialize SSS-1: ~0.003 SOL
- Initialize SSS-2: ~0.004 SOL (+ hook)
- Add minter: ~0.0006 SOL
- Blacklist address: ~0.0006 SOL
- Initialize oracle: ~0.003 SOL

---

### 3. Comprehensive Event System

**32 On-Chain Events** covering all operations:

**Token Operations (8 events):**
- TokensMinted, TokensBurned
- AccountFrozen, AccountThawed
- Paused, Unpaused
- MintClosed
- MetaplexMetadataInitialized

**Role Management (3 events):**
- RolesUpdated
- AuthorityTransferInitiated
- AuthorityTransferred

**Minter Management (3 events):**
- MinterAdded
- MinterRemoved
- MinterUpdated

**Compliance - SSS-2 (3 events):**
- AddedToBlacklist
- RemovedFromBlacklist
- TokensSeized

**Privacy - SSS-3 (3 events):**
- AccountApproved
- CreditsEnabled
- CreditsDisabled

**Oracle (12 events):**
- OracleInitialized, OracleConfigUpdated, OracleClosed
- OracleAuthorityTransferInitiated, OracleAuthorityTransferred
- FeedAdded, FeedRemoved, FeedCranked
- ManualPriceSet
- PriceAggregated, MintPriceCalculated, RedeemPriceCalculated

**Benefits:**
- Complete audit trail
- Real-time monitoring
- Webhook notifications
- Compliance reporting
- Debugging and troubleshooting

---

### 4. Modular Architecture

**Layer Separation:**

```
Layer 4 — Applications
  ├─ Web Dashboard (React + Vite)
  ├─ CLI (40+ commands)
  ├─ Backend Services (Node.js + Express)
  └─ Custom Applications (via SDK)

Layer 3 — Standard Presets
  ├─ SSS-1: Minimal (basic stablecoin)
  ├─ SSS-2: Compliant (regulated stablecoin)
  └─ SSS-3: Private (confidential stablecoin)

Layer 2 — Modules
  ├─ Compliance Module (blacklist, seize)
  ├─ Privacy Module (confidential transfers)
  ├─ Oracle Module (price feeds)
  └─ Role Management (RBAC)

Layer 1 — Core Infrastructure
  ├─ sss-token program (21 instructions)
  ├─ transfer-hook program (2 instructions)
  ├─ sss-oracle program (11 instructions)
  └─ TypeScript SDK
```

**Benefits:**
- Easy to understand and maintain
- Clear separation of concerns
- Testable in isolation
- Extensible for future features

---

---

## Testing & Quality

### Test Coverage

**Anchor Integration Tests:**
- 50+ test cases covering all instructions
- SSS-1, SSS-2, SSS-3 preset tests
- Oracle integration tests
- Error condition tests
- Edge case validation

**SDK Tests:**
- Unit tests for all SDK methods
- Integration tests with localnet
- Preset configuration tests
- PDA derivation tests

**CLI Tests:**
- Command execution tests
- Configuration management tests
- Output formatting tests
- Error handling tests

**Fuzz Tests (Trident):**
- Property-based testing
- Random input generation
- Invariant checking
- Security vulnerability detection

### Quality Assurance

**Code Quality:**
- Biome linting (zero warnings)
- TypeScript strict mode
- Rust clippy checks
- Comprehensive error handling

**Security:**
- PDA-based access control
- Role separation
- Two-step authority transfer
- Feature gating
- Input validation

**Documentation:**
- Inline code comments
- API reference documentation
- Architecture documentation
- Operator runbooks
- Compliance guides

---

## Documentation

### Complete Documentation Suite

**Standard Specifications:**
- [SSS-1: Minimal Stablecoin](./docs/SSS-1.md) - Basic stablecoin specification
- [SSS-2: Compliant Stablecoin](./docs/SSS-2.md) - Regulated stablecoin specification
- [SSS-3: Private Stablecoin](./docs/SSS-3.md) - Privacy-preserving stablecoin specification
- [SSS-Oracle: Oracle Integration](./docs/SSS-Oracle.md) - Multi-source price feed specification

**Developer Guides:**
- [Architecture](./docs/ARCHITECTURE.md) - Layer model, data flows, security model (50+ pages)
- [SDK Reference](./docs/SDK.md) - Complete TypeScript SDK API documentation (1500+ lines)
- [CLI Reference](./docs/CLI.md) - Command-line interface usage guide (1900+ lines)
- [API Reference](./docs/API.md) - Backend service API documentation

**Operational Guides:**
- [Operations Guide](./docs/OPERATIONS.md) - Operator runbook for production deployments
- [Compliance Guide](./docs/COMPLIANCE.md) - Regulatory considerations and audit trails

**Testing Guides:**
- [API Testing Guide](./docs/testing/API_TEST.md) - Step-by-step API verification
- [CLI Testing Guide](./docs/testing/CLI_TEST.md) - Phase-by-phase CLI verification

**Project Documentation:**
- [README.md](./README.md) - Project overview and quick start
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) - Community standards
- [SECURITY.md](./SECURITY.md) - Security policy and reporting