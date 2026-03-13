# TypeScript SDK Complete Reference

Complete API reference for the Solana Stablecoin Standard TypeScript SDK.

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Core SDK](#core-sdk)
4. [Compliance Module (SSS-2)](#compliance-module-sss-2)
5. [Privacy Module (SSS-3)](#privacy-module-sss-3)
6. [Oracle Module](#oracle-module)
7. [Types Reference](#types-reference)
8. [PDA Utilities](#pda-utilities)
9. [Error Handling](#error-handling)

---

## Installation

```bash
npm install @stbr/sss-token-sdk
# or
yarn add @stbr/sss-token-sdk
# or
pnpm add @stbr/sss-token-sdk
```

## Quick Start

```typescript
import { Connection, Keypair } from '@solana/web3.js';
import { SolanaStablecoin, Presets } from '@stbr/sss-token-sdk';

const connection = new Connection('https://api.devnet.solana.com');
const authority = Keypair.generate();

// Create a new SSS-2 compliant stablecoin
const stablecoin = await SolanaStablecoin.create(connection, {
  preset: Presets.SSS_2,
  name: 'My USD Coin',
  symbol: 'MYUSD',
  decimals: 6,
  authority,
});

// Mint tokens
await stablecoin.mintTokens({
  recipient: recipientPublicKey,
  amount: 1000_000000n, // 1000 tokens with 6 decimals
});
```

---

## Core SDK

### SolanaStablecoin Class

The main entry point for interacting with stablecoins.


#### Factory Methods

##### `SolanaStablecoin.create()`

Create a new stablecoin with preset or custom configuration.

```typescript
static async create(
  connection: Connection,
  options: CreateOptions & {
    authority: Keypair;
    mintKeypair?: Keypair;
    programId?: PublicKey;
    oracleProgramId?: PublicKey;
  }
): Promise<{ stablecoin: SolanaStablecoin; signature: string }>
```

**Parameters:**
- `connection` - Solana RPC connection
- `options.preset` - Preset configuration (SSS_1, SSS_2, or SSS_3)
- `options.name` - Token name (e.g., "My Dollar")
- `options.symbol` - Token symbol (e.g., "MYDOL")
- `options.decimals` - Token decimals (default: 6)
- `options.uri` - Metadata URI (optional, stored in StablecoinState PDA)
- `options.authority` - Master authority keypair
- `options.programId` - Custom program ID (optional)
- `options.oracleProgramId` - Custom oracle program ID (optional)
- `options.transferHookProgramId` - Transfer hook program ID (SSS-2)
- `options.auditorElGamalPubkey` - Auditor public key (SSS-3)

>[!NOTE]
>**Note on Metadata:** Metadata is stored in the `StablecoinState` PDA as the canonical source of truth. For wallet and explorer display compatibility (Phantom, Solflare, Solscan, etc.), use `initializeMetaplexMetadata()` after token creation (see Metaplex Metadata section below).

**Preset-specific options:**
- `options.enablePermanentDelegate` - Enable permanent delegate (SSS-2)
- `options.enableTransferHook` - Enable transfer hook (SSS-2)
- `options.defaultAccountFrozen` - Freeze accounts by default (SSS-2)
- `options.enableConfidentialTransfers` - Enable confidential transfers (SSS-3)
- `options.confidentialTransferAutoApprove` - Auto-approve confidential accounts (SSS-3)

**Example:**
```typescript
// SSS-1: Minimal stablecoin
const { stablecoin, signature } = await SolanaStablecoin.create(connection, {
  preset: Presets.SSS_1,
  name: 'Simple Dollar',
  symbol: 'SDOL',
  authority: adminKeypair,
});

// SSS-2: Compliant stablecoin with blacklist
const { stablecoin, signature } = await SolanaStablecoin.create(connection, {
  preset: Presets.SSS_2,
  name: 'Compliant USD',
  symbol: 'CUSD',
  authority: adminKeypair,
  transferHookProgramId: hookProgramId,
});

// SSS-3: Private stablecoin
const { stablecoin, signature } = await SolanaStablecoin.create(connection, {
  preset: Presets.SSS_3,
  name: 'Private Dollar',
  symbol: 'PDOL',
  authority: adminKeypair,
  auditorElGamalPubkey: auditorKey,
});

// Custom configuration
const { stablecoin, signature } = await SolanaStablecoin.create(connection, {
  name: 'Custom Token',
  symbol: 'CUST',
  enablePermanentDelegate: true,
  enableTransferHook: false,
  authority: adminKeypair,
});
```


##### `SolanaStablecoin.load()`

Load an existing stablecoin by mint address.

```typescript
static async load(
  connection: Connection,
  mint: PublicKey,
  authority: Keypair,
  options?: {
    programId?: PublicKey;
    transferHookProgramId?: PublicKey;
    oracleProgramId?: PublicKey;
  }
): Promise<SolanaStablecoin>
```

**Example:**
```typescript
const stablecoin = await SolanaStablecoin.load(
  connection,
  mintPublicKey,
  authorityKeypair,
  {
    transferHookProgramId: customHookId, // optional
    oracleProgramId: customOracleId,     // optional
  }
);
```

---

#### Core Operations

##### `mintTokens()`

Mint tokens to a recipient. Creates the recipient's ATA if needed.

```typescript
async mintTokens(options: {
  recipient: PublicKey;
  amount: bigint;
  minter?: Keypair;
}): Promise<string>
```

**Example:**
```typescript
const txSignature = await stablecoin.mintTokens({
  recipient: userPublicKey,
  amount: 1000_000000n, // 1000 tokens (6 decimals)
  minter: minterKeypair, // optional, defaults to authority
});
```

##### `burn()`

Burn tokens from a token account.

```typescript
async burn(options: {
  fromTokenAccount: PublicKey;
  amount: bigint;
  burner?: Keypair;
}): Promise<string>
```

**Example:**
```typescript
await stablecoin.burn({
  fromTokenAccount: userTokenAccount,
  amount: 500_000000n,
  burner: burnerKeypair, // optional, defaults to authority
});
```

##### `freeze()` / `thaw()`

Freeze or unfreeze a token account.

```typescript
async freeze(tokenAccount: PublicKey): Promise<string>
async thaw(tokenAccount: PublicKey): Promise<string>
```

**Example:**
```typescript
await stablecoin.freeze(suspiciousAccount);
await stablecoin.thaw(suspiciousAccount);
```

##### `pause()` / `unpause()`

Global circuit breaker for minting and burning.

```typescript
async pause(reason?: string): Promise<string>
async unpause(): Promise<string>
```

**Example:**
```typescript
await stablecoin.pause('Security incident detected');
await stablecoin.unpause();
```

##### `closeMint()`

Permanently close the mint and reclaim rent. Supply must be zero.

```typescript
async closeMint(): Promise<string>
```

**Example:**
```typescript
await stablecoin.closeMint();
```


---

#### Role Management

##### `updateRoles()`

Update role assignments. Only master authority can call this.

```typescript
async updateRoles(updates: RolesUpdate): Promise<string>

interface RolesUpdate {
  burner?: PublicKey;
  pauser?: PublicKey;
  blacklister?: PublicKey;  // SSS-2 only
  seizer?: PublicKey;       // SSS-2 only
}
```

**Example:**
```typescript
await stablecoin.updateRoles({
  burner: newBurnerPubkey,
  pauser: newPauserPubkey,
  blacklister: complianceOfficerPubkey,
});
```

##### `transferAuthority()` / `acceptAuthority()`

Two-step master authority transfer to prevent accidental lockout.

```typescript
async transferAuthority(newMaster: PublicKey): Promise<string>
async acceptAuthority(): Promise<string>
```

**Example:**
```typescript
// Step 1: Current master initiates transfer
await stablecoin.transferAuthority(newMasterPubkey);

// Step 2: New master accepts (using new authority keypair)
const newStablecoin = await SolanaStablecoin.load(
  connection,
  mint,
  newMasterKeypair
);
await newStablecoin.acceptAuthority();
```

---

#### Minter Management

##### `addMinter()`

Register a new minter with a quota.

```typescript
async addMinter(minter: PublicKey, quota: bigint): Promise<string>
```

**Example:**
```typescript
await stablecoin.addMinter(
  minterPubkey,
  10_000_000_000000n // 10M tokens quota
);
```

##### `removeMinter()`

Remove a minter and reclaim rent.

```typescript
async removeMinter(minter: PublicKey): Promise<string>
```

##### `updateMinter()`

Update minter quota, active status, or reset minted counter.

```typescript
async updateMinter(options: MinterUpdateOptions): Promise<string>

interface MinterUpdateOptions {
  minter: PublicKey;
  quota: bigint;
  active: boolean;
  resetMinted?: boolean;
}
```

**Example:**
```typescript
await stablecoin.updateMinter({
  minter: minterPubkey,
  quota: 20_000_000_000000n,
  active: true,
  resetMinted: true, // reset minted counter to 0
});
```


---

#### Query Methods

##### `getStatus()`

Fetch the stablecoin configuration and status.

```typescript
async getStatus(): Promise<StablecoinStatus>

interface StablecoinStatus {
  version: number;
  mint: PublicKey;
  name: string;
  symbol: string;
  decimals: number;
  uri: string;
  paused: boolean;
  totalSupply: bigint;
  enablePermanentDelegate: boolean;
  enableTransferHook: boolean;
  defaultAccountFrozen: boolean;
  enableConfidentialTransfers: boolean;
  confidentialTransferAutoApprove: boolean;
}
```

**Example:**
```typescript
const status = await stablecoin.getStatus();
console.log(`${status.name} (${status.symbol})`);
console.log(`Supply: ${status.totalSupply}`);
console.log(`Paused: ${status.paused}`);
```

##### `getRoles()`

Fetch current role assignments.

```typescript
async getRoles(): Promise<RolesStatus>

interface RolesStatus {
  masterAuthority: PublicKey;
  pendingMaster: PublicKey | null;
  burner: PublicKey;
  pauser: PublicKey;
  blacklister: PublicKey;
  seizer: PublicKey;
}
```

**Example:**
```typescript
const roles = await stablecoin.getRoles();
console.log('Master:', roles.masterAuthority.toBase58());
console.log('Burner:', roles.burner.toBase58());
```

##### `getMinters()`

Fetch all registered minters with their quotas.

```typescript
async getMinters(): Promise<MinterQuotaInfo[]>

interface MinterQuotaInfo {
  mint: PublicKey;
  minter: PublicKey;
  quota: bigint;
  minted: bigint;
  active: boolean;
}
```

**Example:**
```typescript
const minters = await stablecoin.getMinters();
for (const m of minters) {
  console.log(`${m.minter.toBase58()}: ${m.minted}/${m.quota}`);
}
```

##### `getTotalSupply()`

Get the canonical total supply from the mint account.

```typescript
async getTotalSupply(): Promise<bigint>
```

**Example:**
```typescript
const supply = await stablecoin.getTotalSupply();
console.log(`Total supply: ${supply}`);
```

---

##### `getMetadata()`

Retrieve token metadata from the StablecoinState PDA.

```typescript
async getMetadata(): Promise<{
  name: string;
  symbol: string;
  uri: string;
  decimals: number;
}>
```

**Note:** Due to Solana runtime limitations, Token-2022 metadata cannot be initialized via CPI. This method retrieves metadata from the `StablecoinState` PDA, which is the canonical source. For wallet display compatibility, use Metaplex metadata (see below).

**Example:**
```typescript
const metadata = await stablecoin.getMetadata();
console.log(`Token: ${metadata.name} (${metadata.symbol})`);
console.log(`Decimals: ${metadata.decimals}`);
console.log(`URI: ${metadata.uri}`);
```

---

### Metaplex Metadata (Wallet Display)

##### `initializeMetaplexMetadata()`

Initialize Metaplex Token Metadata for wallet and explorer display. This makes your token visible in all Solana wallets (Phantom, Solflare, etc.) and explorers (Solscan, Solana FM).

```typescript
async initializeMetaplexMetadata(
  options: {
    name: string;
    symbol: string;
    uri: string;
    sellerFeeBasisPoints?: number;
  },
  mintKeypair: Keypair
): Promise<PublicKey>
```

**Parameters:**
- `options.name` - Token name (max 32 bytes, e.g., "My Stablecoin")
- `options.symbol` - Token symbol (max 10 bytes, e.g., "MYUSD")
- `options.uri` - Metadata JSON URI (Arweave, IPFS, or HTTPS)
- `options.sellerFeeBasisPoints` - Royalty fee in basis points (default: 0, stablecoins don't need royalties)
- `mintKeypair` - The mint keypair (required to sign)

**Returns:** The Metaplex metadata PDA address

**Important Notes:**
- The mint keypair must sign this transaction (Metaplex requirement for Token-2022 mints with PDA authority)
- Metaplex metadata is incompatible with MintCloseAuthority. If you initialized your token with `enableMintCloseAuthority: true`, this will fail
- Default config has `enableMintCloseAuthority: false` for Metaplex compatibility

**Example:**
```typescript
// After creating your stablecoin
const metadataPda = await stablecoin.initializeMetaplexMetadata(
  {
    name: "My Stablecoin",
    symbol: "MYUSD",
    uri: "https://arweave.net/...",
    sellerFeeBasisPoints: 0,
  },
  mintKeypair
);

console.log("Metadata created at:", metadataPda.toBase58());
console.log("Your token will now display in wallets!");
```

**Metadata JSON Format:**
```json
{
  "name": "My Stablecoin",
  "symbol": "MYUSD",
  "description": "A compliant stablecoin on Solana",
  "image": "https://example.com/logo.png"
}
```

**Cost:** ~0.002 SOL per token for Metaplex metadata account creation.

---

## Compliance Module (SSS-2)

The compliance module provides blacklist management and token seizure capabilities for SSS-2 stablecoins.

Access via: `stablecoin.compliance`


### Blacklist Management

##### `blacklistAdd()`

Add an address to the on-chain blacklist.

```typescript
async blacklistAdd(
  address: PublicKey,
  reason: string,
  blacklister: Keypair
): Promise<string>
```

**Example:**
```typescript
await stablecoin.compliance.blacklistAdd(
  suspiciousAddress,
  'OFAC sanctions match',
  blacklisterKeypair
);
```

##### `blacklistRemove()`

Remove an address from the blacklist.

```typescript
async blacklistRemove(
  address: PublicKey,
  blacklister: Keypair
): Promise<string>
```

**Example:**
```typescript
await stablecoin.compliance.blacklistRemove(
  addressToUnblock,
  blacklisterKeypair
);
```

##### `isBlacklisted()`

Check if an address is currently blacklisted.

```typescript
async isBlacklisted(address: PublicKey): Promise<boolean>
```

**Example:**
```typescript
const blocked = await stablecoin.compliance.isBlacklisted(userAddress);
if (blocked) {
  console.log('Address is blacklisted');
}
```

##### `getBlacklistEntry()`

Fetch full blacklist entry details.

```typescript
async getBlacklistEntry(address: PublicKey): Promise<BlacklistEntry | null>

interface BlacklistEntry {
  mint: PublicKey;
  address: PublicKey;
  reason: string;
  timestamp: bigint;
}
```

**Example:**
```typescript
const entry = await stablecoin.compliance.getBlacklistEntry(address);
if (entry) {
  console.log(`Blacklisted: ${entry.reason}`);
  console.log(`Since: ${new Date(Number(entry.timestamp) * 1000)}`);
}
```

### Token Seizure

##### `seize()`

Seize tokens from an account via permanent delegate.

```typescript
async seize(options: {
  fromTokenAccount: PublicKey;
  toTokenAccount: PublicKey;
  amount: bigint;
  seizer: Keypair;
}): Promise<string>
```

**Example:**
```typescript
await stablecoin.compliance.seize({
  fromTokenAccount: blacklistedAccount,
  toTokenAccount: treasuryAccount,
  amount: 1000_000000n,
  seizer: seizerKeypair,
});
```

### Transfer Hook

##### `initializeHook()`

Initialize the transfer hook for SSS-2 stablecoins. Must be called once after mint creation.

```typescript
async initializeHook(): Promise<string>
```

**Example:**
```typescript
// After creating SSS-2 stablecoin
await stablecoin.compliance.initializeHook();
```

---

## Privacy Module (SSS-3)

The privacy module manages confidential transfer capabilities for SSS-3 stablecoins.

Access via: `stablecoin.privacy`


##### `approveAccount()`

Approve a token account for confidential transfers. Required when auto-approve is disabled.

```typescript
async approveAccount(tokenAccount: PublicKey): Promise<string>
```

**Example:**
```typescript
await stablecoin.privacy.approveAccount(userTokenAccount);
```

##### `enableCredits()`

Enable receiving confidential transfers for a token account. Must be called by the account owner.

```typescript
async enableCredits(tokenAccount: PublicKey): Promise<string>
```

**Example:**
```typescript
await stablecoin.privacy.enableCredits(myTokenAccount);
```

##### `disableCredits()`

Disable receiving confidential transfers for a token account.

```typescript
async disableCredits(tokenAccount: PublicKey): Promise<string>
```

**Example:**
```typescript
await stablecoin.privacy.disableCredits(myTokenAccount);
```

---

## Oracle Module

The oracle module provides multi-source price feed aggregation for non-USD pegged stablecoins.

Access via: `stablecoin.oracle`

### Oracle Lifecycle

##### `initialize()`

Initialize oracle configuration for a mint.

```typescript
async initialize(options: OracleInitializeOptions): Promise<string>

interface OracleInitializeOptions {
  baseCurrency: string;              // e.g., "EUR", "BRL"
  quoteCurrency: string;             // e.g., "USD"
  maxStalenessSeconds?: number;      // default: 300
  maxConfidenceIntervalBps?: number; // default: 500
  aggregationMethod?: AggregationMethod; // default: Median
  minFeedsRequired?: number;         // default: 1
  deviationThresholdBps?: number;    // default: 0 (disabled)
  maxPriceChangeBps?: number;        // default: 1000 (10%)
  mintPremiumBps?: number;           // default: 0
  redeemDiscountBps?: number;        // default: 0
  cranker?: PublicKey;               // default: authority
}

enum AggregationMethod {
  Median = 0,
  Mean = 1,
  WeightedMean = 2,
}
```

**Example:**
```typescript
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
```


##### `updateConfig()`

Update oracle configuration parameters.

```typescript
async updateConfig(options: OracleUpdateConfigOptions): Promise<string>

interface OracleUpdateConfigOptions {
  maxStalenessSeconds?: number;
  maxConfidenceIntervalBps?: number;
  aggregationMethod?: AggregationMethod;
  minFeedsRequired?: number;
  deviationThresholdBps?: number;
  maxPriceChangeBps?: number;
  mintPremiumBps?: number;
  redeemDiscountBps?: number;
  cranker?: PublicKey;
  paused?: boolean;
}
```

**Example:**
```typescript
await stablecoin.oracle.updateConfig({
  maxStalenessSeconds: 600,
  mintPremiumBps: 100, // increase to 1%
  paused: false,
});
```

##### `transferAuthority()` / `acceptAuthority()`

Two-step oracle authority transfer.

```typescript
async transferAuthority(newAuthority: PublicKey): Promise<string>
async acceptAuthority(): Promise<string>
```

**Example:**
```typescript
// Step 1: Initiate transfer
await stablecoin.oracle.transferAuthority(newAuthorityPubkey);

// Step 2: Accept (with new authority)
const newStablecoin = await SolanaStablecoin.load(
  connection,
  mint,
  newAuthorityKeypair
);
await newStablecoin.oracle.acceptAuthority();
```

##### `close()`

Close the oracle and reclaim rent. All feeds must be removed first.

```typescript
async close(): Promise<string>
```

**Example:**
```typescript
await stablecoin.oracle.close();
```

### Feed Management

##### `addFeed()`

Register a new price feed.

```typescript
async addFeed(options: AddFeedOptions): Promise<string>

interface AddFeedOptions {
  feedIndex: number;
  feedType: FeedType;
  feedAddress?: PublicKey;
  label: string;
  weight?: number;              // default: 10000 (1.0x)
  maxStalenessOverride?: number; // default: 0 (use global)
}

enum FeedType {
  Switchboard = 0,
  Pyth = 1,
  Chainlink = 2,
  Manual = 3,
  API = 4,
}
```

**Example:**
```typescript
await stablecoin.oracle.addFeed({
  feedIndex: 0,
  feedType: FeedType.Switchboard,
  feedAddress: switchboardFeedPubkey,
  label: 'Switchboard EUR/USD',
  weight: 10000,
});

await stablecoin.oracle.addFeed({
  feedIndex: 1,
  feedType: FeedType.Pyth,
  feedAddress: pythFeedPubkey,
  label: 'Pyth EUR/USD',
  weight: 10000,
});
```


##### `removeFeed()`

Remove a price feed and reclaim rent.

```typescript
async removeFeed(feedIndex: number): Promise<string>
```

**Example:**
```typescript
await stablecoin.oracle.removeFeed(0);
```

##### `crankFeed()`

Push a new price observation to a feed. Includes circuit breaker protection.

```typescript
async crankFeed(options: CrankFeedOptions): Promise<string>

interface CrankFeedOptions {
  feedIndex: number;
  price: bigint;        // 9-decimal fixed point
  confidence: bigint;   // 9-decimal fixed point
  cranker?: Keypair;    // default: authority
}
```

**Example:**
```typescript
await stablecoin.oracle.crankFeed({
  feedIndex: 0,
  price: 1_100_000_000n,      // 1.10 EUR/USD
  confidence: 1_000_000n,     // 0.001 confidence interval
  cranker: crankerKeypair,
});
```

### Price Operations

##### `setManualPrice()`

Set manual price override. Works even while paused.

```typescript
async setManualPrice(price: bigint, active: boolean): Promise<string>
```

**Example:**
```typescript
// Set manual price and activate
await stablecoin.oracle.setManualPrice(
  1_100_000_000n, // 1.10 EUR/USD
  true
);

// Deactivate manual price (use feed aggregation)
await stablecoin.oracle.setManualPrice(0n, false);
```

##### `aggregate()`

Aggregate prices from all enabled feeds.

```typescript
async aggregate(feedAccounts: PublicKey[]): Promise<string>
```

**Example:**
```typescript
const feeds = await stablecoin.oracle.getFeeds();
const feedPdas = feeds.map(f => 
  derivePriceFeedEntry(mint, f.feedIndex, oracleProgramId)[0]
);

await stablecoin.oracle.aggregate(feedPdas);
```

##### `getMintPrice()`

Get the mint price (aggregated price + premium).

```typescript
async getMintPrice(): Promise<string>
```

**Example:**
```typescript
await stablecoin.oracle.getMintPrice();
// Price is emitted in event and returned via return data
```

##### `getRedeemPrice()`

Get the redeem price (aggregated price - discount).

```typescript
async getRedeemPrice(): Promise<string>
```

**Example:**
```typescript
await stablecoin.oracle.getRedeemPrice();
// Price is emitted in event and returned via return data
```


### Oracle Query Methods

##### `getStatus()`

Fetch oracle configuration and status.

```typescript
async getStatus(): Promise<OracleStatus>

interface OracleStatus {
  version: number;
  authority: PublicKey;
  pendingAuthority: PublicKey | null;
  cranker: PublicKey;
  mint: PublicKey;
  baseCurrency: string;
  quoteCurrency: string;
  maxStalenessSeconds: number;
  maxConfidenceIntervalBps: number;
  aggregationMethod: number;
  minFeedsRequired: number;
  deviationThresholdBps: number;
  maxPriceChangeBps: number;
  mintPremiumBps: number;
  redeemDiscountBps: number;
  manualPrice: bigint;
  manualPriceActive: boolean;
  lastAggregatedPrice: bigint;
  lastAggregatedConfidence: bigint;
  lastAggregatedTimestamp: number;
  feedCount: number;
  paused: boolean;
}
```

**Example:**
```typescript
const oracleStatus = await stablecoin.oracle.getStatus();
console.log(`${oracleStatus.baseCurrency}/${oracleStatus.quoteCurrency}`);
console.log(`Last price: ${oracleStatus.lastAggregatedPrice}`);
console.log(`Feeds: ${oracleStatus.feedCount}`);
```

##### `getFeeds()`

Fetch all price feeds for the oracle.

```typescript
async getFeeds(): Promise<PriceFeedInfo[]>

interface PriceFeedInfo {
  oracleConfig: PublicKey;
  feedIndex: number;
  feedType: number;
  feedAddress: PublicKey;
  label: string;
  lastPrice: bigint;
  lastConfidence: bigint;
  lastTimestamp: number;
  weight: number;
  enabled: boolean;
  maxStalenessOverride: number;
}
```

**Example:**
```typescript
const feeds = await stablecoin.oracle.getFeeds();
for (const feed of feeds) {
  console.log(`${feed.label}: ${feed.lastPrice} (${feed.enabled ? 'active' : 'disabled'})`);
}
```

##### `getFeed()`

Fetch a specific feed by index.

```typescript
async getFeed(feedIndex: number): Promise<PriceFeedInfo | null>
```

**Example:**
```typescript
const feed = await stablecoin.oracle.getFeed(0);
if (feed) {
  console.log(`Feed 0: ${feed.label}`);
  console.log(`Last update: ${new Date(feed.lastTimestamp * 1000)}`);
}
```

---

## Types Reference

### Presets

```typescript
import { Presets, SSS_1, SSS_2, SSS_3 } from '@stbr/sss-token-sdk';

// SSS-1: Minimal stablecoin
const sss1 = Presets.SSS_1;
// or
import { SSS_1 } from '@stbr/sss-token-sdk';

// SSS-2: Compliant stablecoin
const sss2 = Presets.SSS_2;

// SSS-3: Private stablecoin
const sss3 = Presets.SSS_3;
```


### Enums

```typescript
// Aggregation methods for oracle
enum AggregationMethod {
  Median = 0,        // Median of all valid feeds
  Mean = 1,          // Arithmetic mean
  WeightedMean = 2,  // Weighted by feed.weight
}

// Price feed types
enum FeedType {
  Switchboard = 0,
  Pyth = 1,
  Chainlink = 2,
  Manual = 3,
  API = 4,
}
```

---

## PDA Utilities

Helper functions for deriving Program Derived Addresses.

```typescript
import {
  deriveStablecoinState,
  deriveRolesConfig,
  deriveMinterQuota,
  deriveBlacklistEntry,
  deriveExtraAccountMetaList,
  deriveOracleConfig,
  derivePriceFeedEntry,
} from '@stbr/sss-token-sdk';
```

### sss-token PDAs

```typescript
// Main stablecoin state
const [statePda, bump] = deriveStablecoinState(mint, programId);

// Role assignments
const [rolesPda] = deriveRolesConfig(mint, programId);

// Minter quota
const [quotaPda] = deriveMinterQuota(mint, minterPubkey, programId);

// Blacklist entry (SSS-2)
const [blacklistPda] = deriveBlacklistEntry(mint, address, programId);

// Transfer hook metadata (SSS-2)
const [hookPda] = deriveExtraAccountMetaList(mint, hookProgramId);
```

### sss-oracle PDAs

```typescript
// Oracle configuration
const [oraclePda] = deriveOracleConfig(mint, oracleProgramId);

// Price feed entry
const [feedPda] = derivePriceFeedEntry(mint, feedIndex, oracleProgramId);
```

---

## Error Handling

All SDK methods return promises that may reject with Anchor errors.

```typescript
try {
  await stablecoin.mintTokens({
    recipient: userPubkey,
    amount: 1000_000000n,
  });
} catch (error) {
  if (error.message.includes('QuotaExceeded')) {
    console.error('Minter quota exceeded');
  } else if (error.message.includes('Paused')) {
    console.error('Stablecoin is paused');
  } else {
    console.error('Mint failed:', error);
  }
}
```

### Common Errors

**sss-token errors:**
- `Unauthorized` - Caller lacks required role
- `QuotaExceeded` - Minter exceeded quota
- `Paused` / `NotPaused` - Invalid pause state
- `AlreadyPaused` - Attempted to pause when already paused
- `ZeroAmount` - Amount must be > 0
- `SupplyNotZero` - Cannot close mint with non-zero supply
- `ComplianceNotEnabled` - SSS-2 instruction on non-SSS-2 mint
- `FeatureNotEnabled` - SSS-3 instruction on non-SSS-3 mint

**sss-oracle errors:**
- `InvalidPrice` - Price is zero or invalid
- `StalePrice` - Feed price is too old
- `ConfidenceTooHigh` - Confidence interval exceeds threshold
- `InsufficientFeeds` - Not enough valid feeds for aggregation
- `DeviationTooHigh` - Feed prices deviate too much
- `CircuitBreakerTriggered` - Price change exceeds max_price_change_bps
- `OraclePaused` - Oracle is paused


---

## Complete Examples

### Example 1: SSS-1 Minimal Stablecoin

```typescript
import { Connection, Keypair } from '@solana/web3.js';
import { SolanaStablecoin, Presets } from '@stbr/sss-token-sdk';

const connection = new Connection('https://api.devnet.solana.com');
const authority = Keypair.generate();

// Create SSS-1 stablecoin
const stablecoin = await SolanaStablecoin.create(connection, {
  preset: Presets.SSS_1,
  name: 'Simple Dollar',
  symbol: 'SDOL',
  decimals: 6,
  authority,
});

// Add a minter
await stablecoin.addMinter(
  minterPubkey,
  10_000_000_000000n // 10M quota
);

// Mint tokens
await stablecoin.mintTokens({
  recipient: userPubkey,
  amount: 1000_000000n,
});

// Check supply
const supply = await stablecoin.getTotalSupply();
console.log(`Total supply: ${supply}`);
```

### Example 2: SSS-2 Compliant Stablecoin with Blacklist

```typescript
import { SolanaStablecoin, Presets } from '@stbr/sss-token-sdk';

// Create SSS-2 stablecoin
const stablecoin = await SolanaStablecoin.create(connection, {
  preset: Presets.SSS_2,
  name: 'Compliant USD',
  symbol: 'CUSD',
  authority,
  transferHookProgramId: hookProgramId,
});

// Initialize transfer hook
await stablecoin.compliance.initializeHook();

// Add to blacklist
await stablecoin.compliance.blacklistAdd(
  suspiciousAddress,
  'OFAC sanctions',
  blacklisterKeypair
);

// Check if blacklisted
const isBlocked = await stablecoin.compliance.isBlacklisted(suspiciousAddress);
console.log('Blocked:', isBlocked); // true

// Seize tokens from blacklisted account
await stablecoin.compliance.seize({
  fromTokenAccount: blacklistedTokenAccount,
  toTokenAccount: treasuryAccount,
  amount: 1000_000000n,
  seizer: seizerKeypair,
});

// Remove from blacklist
await stablecoin.compliance.blacklistRemove(
  suspiciousAddress,
  blacklisterKeypair
);
```

### Example 3: SSS-3 Private Stablecoin

```typescript
import { SolanaStablecoin, Presets } from '@stbr/sss-token-sdk';

// Create SSS-3 stablecoin
const stablecoin = await SolanaStablecoin.create(connection, {
  preset: Presets.SSS_3,
  name: 'Private Dollar',
  symbol: 'PDOL',
  authority,
  auditorElGamalPubkey: auditorPublicKey,
});

// Approve account for confidential transfers
await stablecoin.privacy.approveAccount(userTokenAccount);

// Enable receiving confidential transfers
await stablecoin.privacy.enableCredits(userTokenAccount);

// User can now send/receive confidential transfers
// (actual confidential transfer execution is via Token-2022 directly)
```


### Example 4: Oracle Integration for EUR Stablecoin

```typescript
import { SolanaStablecoin, Presets, AggregationMethod, FeedType } from '@stbr/sss-token-sdk';

// Create EUR-pegged stablecoin
const stablecoin = await SolanaStablecoin.create(connection, {
  preset: Presets.SSS_1,
  name: 'Euro Stablecoin',
  symbol: 'EURS',
  authority,
});

// Initialize oracle
await stablecoin.oracle.initialize({
  baseCurrency: 'EUR',
  quoteCurrency: 'USD',
  maxStalenessSeconds: 300,
  aggregationMethod: AggregationMethod.Median,
  minFeedsRequired: 2,
  maxPriceChangeBps: 1000,  // 10% circuit breaker
  mintPremiumBps: 50,       // 0.5% premium
  redeemDiscountBps: 50,    // 0.5% discount
});

// Add Switchboard feed
await stablecoin.oracle.addFeed({
  feedIndex: 0,
  feedType: FeedType.Switchboard,
  feedAddress: switchboardEurUsdFeed,
  label: 'Switchboard EUR/USD',
  weight: 10000,
});

// Add Pyth feed
await stablecoin.oracle.addFeed({
  feedIndex: 1,
  feedType: FeedType.Pyth,
  feedAddress: pythEurUsdFeed,
  label: 'Pyth EUR/USD',
  weight: 10000,
});

// Crank feeds (update prices)
await stablecoin.oracle.crankFeed({
  feedIndex: 0,
  price: 1_100_000_000n,      // 1.10 EUR/USD
  confidence: 1_000_000n,
  cranker: crankerKeypair,
});

await stablecoin.oracle.crankFeed({
  feedIndex: 1,
  price: 1_105_000_000n,      // 1.105 EUR/USD
  confidence: 2_000_000n,
  cranker: crankerKeypair,
});

// Aggregate prices
const feeds = await stablecoin.oracle.getFeeds();
const feedPdas = feeds.map(f => 
  derivePriceFeedEntry(stablecoin.mint, f.feedIndex, oracleProgramId)[0]
);
await stablecoin.oracle.aggregate(feedPdas);

// Get mint/redeem prices
await stablecoin.oracle.getMintPrice();   // Aggregated + premium
await stablecoin.oracle.getRedeemPrice(); // Aggregated - discount

// Check oracle status
const oracleStatus = await stablecoin.oracle.getStatus();
console.log(`Last aggregated: ${oracleStatus.lastAggregatedPrice}`);
console.log(`Feeds: ${oracleStatus.feedCount}`);
```

### Example 5: Role Management and Authority Transfer

```typescript
import { SolanaStablecoin } from '@stbr/sss-token-sdk';

// Load existing stablecoin
const stablecoin = await SolanaStablecoin.load(
  connection,
  mintPubkey,
  currentAuthority
);

// Update roles
await stablecoin.updateRoles({
  burner: newBurnerPubkey,
  pauser: newPauserPubkey,
  blacklister: complianceOfficerPubkey,
  seizer: complianceOfficerPubkey,
});

// Check current roles
const roles = await stablecoin.getRoles();
console.log('Master:', roles.masterAuthority.toBase58());
console.log('Burner:', roles.burner.toBase58());

// Initiate authority transfer
await stablecoin.transferAuthority(newMasterPubkey);

// New master accepts
const newStablecoin = await SolanaStablecoin.load(
  connection,
  mintPubkey,
  newMasterKeypair
);
await newStablecoin.acceptAuthority();

// Verify transfer
const updatedRoles = await newStablecoin.getRoles();
console.log('New master:', updatedRoles.masterAuthority.toBase58());
```

---

## Best Practices

### 1. Use Presets for Standard Configurations

```typescript
// Good: Use presets for standard use cases
const stablecoin = await SolanaStablecoin.create(connection, {
  preset: Presets.SSS_2,
  name: 'My USD',
  symbol: 'MYUSD',
  authority,
});

// Only use custom config when you need non-standard combinations
```

### 2. Always Initialize Transfer Hook for SSS-2

```typescript
// After creating SSS-2 stablecoin
await stablecoin.compliance.initializeHook();
// This must be done before any transfers can occur
```

### 3. Handle Errors Gracefully

```typescript
try {
  await stablecoin.mintTokens({ recipient, amount });
} catch (error) {
  // Check for specific errors
  if (error.message.includes('QuotaExceeded')) {
    // Handle quota exceeded
  } else if (error.message.includes('Paused')) {
    // Handle paused state
  }
}
```

### 4. Use BigInt for Token Amounts

```typescript
// Good: Use BigInt with proper decimals
const amount = 1000_000000n; // 1000 tokens with 6 decimals

// Bad: Using regular numbers can cause precision issues
const amount = 1000000000; // May lose precision
```

### 5. Query State Before Operations

```typescript
// Check if paused before minting
const status = await stablecoin.getStatus();
if (status.paused) {
  console.log('Cannot mint: stablecoin is paused');
  return;
}

await stablecoin.mintTokens({ recipient, amount });
```

### 6. Aggregate Oracle Prices Regularly

```typescript
// Set up periodic aggregation for oracle-based stablecoins
setInterval(async () => {
  const feeds = await stablecoin.oracle.getFeeds();
  const feedPdas = feeds.map(f => 
    derivePriceFeedEntry(mint, f.feedIndex, oracleProgramId)[0]
  );
  await stablecoin.oracle.aggregate(feedPdas);
}, 60000); // Every minute
```

---

## TypeScript Types

All types are exported from the main package:

```typescript
import type {
  PresetConfig,
  CreateOptions,
  RolesUpdate,
  MinterUpdateOptions,
  StablecoinStatus,
  RolesStatus,
  MinterQuotaInfo,
  BlacklistEntry,
  AggregationMethod,
  FeedType,
  OracleInitializeOptions,
  OracleUpdateConfigOptions,
  AddFeedOptions,
  CrankFeedOptions,
  OracleStatus,
  PriceFeedInfo,
} from '@stbr/sss-token-sdk';
```

---

## Support

For issues, questions, or contributions:
- GitHub: [github.com/solanabr/solana-stablecoin-standard](https://github.com/solanabr/solana-stablecoin-standard)
- Discord: [discord.gg/superteambrasil](https://discord.gg/superteambrasil)
- Twitter: [@SuperteamBR](https://twitter.com/SuperteamBR)

## License

MIT License - see LICENSE file for details.
