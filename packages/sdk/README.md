# Solana Stablecoin Standard - TypeScript SDK

[![npm version](https://img.shields.io/npm/v/@stbr/sss-token-sdk.svg)](https://www.npmjs.com/package/@stbr/sss-token-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

TypeScript SDK for building production-ready stablecoins on Solana. Think OpenZeppelin for Solana stablecoins.

## Features

- **Three Standards**: SSS-1 (Minimal), SSS-2 (Compliant), SSS-3 (Private)
- **Role-Based Access Control**: Master, minter, burner, pauser, blacklister, seizer
- **Per-Minter Quotas**: Granular mint limits with quota tracking
- **Oracle Integration**: Multi-source price feeds for non-USD pegs (EUR, BRL, CPI-indexed)
- **Token-2022 Extensions**: Permanent delegate, transfer hooks, confidential transfers
- **Complete Audit Trail**: 32 on-chain events for compliance
- **PDA-Based Security**: All state in Program Derived Addresses

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
const { stablecoin, signature } = await SolanaStablecoin.create(connection, {
  preset: Presets.SSS_2,
  name: 'My USD Coin',
  symbol: 'MYUSD',
  decimals: 6,
  authority,
});

// Initialize transfer hook (required for SSS-2)
await stablecoin.compliance.initializeHook();

// Add a minter with quota
await stablecoin.addMinter(
  minterPublicKey,
  10_000_000_000000n // 10M tokens
);

// Mint tokens
await stablecoin.mintTokens({
  recipient: recipientPublicKey,
  amount: 1000_000000n, // 1000 tokens with 6 decimals
});
```

## Three Standards

### SSS-1: Minimal Stablecoin

Basic stablecoin for internal tokens, DAO treasuries, and ecosystem settlement.

```typescript
const stablecoin = await SolanaStablecoin.create(connection, {
  preset: Presets.SSS_1,
  name: 'Simple Dollar',
  symbol: 'SDOL',
  authority: adminKeypair,
});
```

**Features:**
- Mint, burn, freeze, metadata
- Role-based access control
- Per-minter quotas
- Reactive compliance (freeze after the fact)

### SSS-2: Compliant Stablecoin

Regulated stablecoin with on-chain blacklist enforcement for USDC/USDT-class tokens.

```typescript
const { stablecoin } = await SolanaStablecoin.create(connection, {
  preset: Presets.SSS_2,
  name: 'Compliant USD',
  symbol: 'CUSD',
  authority: adminKeypair,
  transferHookProgramId: hookProgramId,
});

// Initialize transfer hook (required)
await stablecoin.compliance.initializeHook();

// Add to blacklist
await stablecoin.compliance.blacklistAdd(
  suspiciousAddress,
  'OFAC sanctions',
  blacklisterKeypair
);
```

**Features:**
- All SSS-1 features
- Permanent delegate for token seizure
- Transfer hook with blacklist enforcement
- Proactive compliance (blocks transfers on-chain)

### SSS-3: Private Stablecoin

Privacy-preserving stablecoin with confidential transfers (experimental).

```typescript
const { stablecoin } = await SolanaStablecoin.create(connection, {
  preset: Presets.SSS_3,
  name: 'Private Dollar',
  symbol: 'PDOL',
  authority: adminKeypair,
  auditorElGamalPubkey: auditorPublicKey,
});

// Approve account for confidential transfers
await stablecoin.privacy.approveAccount(userTokenAccount);

// Enable receiving confidential transfers
await stablecoin.privacy.enableCredits(userTokenAccount);
```

**Features:**
- All SSS-1 features
- Confidential transfers via ElGamal encryption
- Optional auditor can decrypt amounts
- Experimental (Token-2022 tooling still maturing)

## Core Operations

### Minting

```typescript
// Mint tokens to a recipient
await stablecoin.mintTokens({
  recipient: userPublicKey,
  amount: 1000_000000n, // 1000 tokens (6 decimals)
  minter: minterKeypair, // optional, defaults to authority
});

// Prepare mint transaction for external wallet
const tx = await stablecoin.prepareMintTransaction({
  recipient: userPublicKey,
  amount: 1000_000000n,
  minter: minterPublicKey,
});
```

### Burning

```typescript
// Burn tokens from an account
await stablecoin.burn({
  fromTokenAccount: userTokenAccount,
  amount: 500_000000n,
  burner: burnerKeypair, // optional, defaults to authority
});

// Prepare burn transaction for external wallet
const tx = await stablecoin.prepareBurnTransaction({
  fromTokenAccount: userTokenAccount,
  amount: 500_000000n,
  burner: burnerPublicKey,
});
```

### Freeze/Thaw

```typescript
// Freeze a token account
await stablecoin.freeze(suspiciousAccount);

// Unfreeze a token account
await stablecoin.thaw(suspiciousAccount);
```

### Pause/Unpause

```typescript
// Global circuit breaker
await stablecoin.pause('Security incident detected');
await stablecoin.unpause();
```

## Role Management

```typescript
// Update role assignments
await stablecoin.updateRoles({
  burner: newBurnerPubkey,
  pauser: newPauserPubkey,
  blacklister: complianceOfficerPubkey,
  seizer: complianceOfficerPubkey,
});

// Two-step authority transfer
await stablecoin.transferAuthority(newMasterPubkey);

// New master accepts
const newStablecoin = await SolanaStablecoin.load(
  connection,
  mint,
  newMasterKeypair
);
await newStablecoin.acceptAuthority();
```

## Minter Management

```typescript
// Add a minter with quota
await stablecoin.addMinter(
  minterPubkey,
  10_000_000_000000n // 10M tokens quota
);

// Update minter quota
await stablecoin.updateMinter({
  minter: minterPubkey,
  quota: 20_000_000_000000n,
  active: true,
  resetMinted: true, // reset minted counter to 0
});

// Remove a minter
await stablecoin.removeMinter(minterPubkey);

// Get all minters
const minters = await stablecoin.getMinters();
for (const m of minters) {
  console.log(`${m.minter.toBase58()}: ${m.minted}/${m.quota}`);
}
```

## Compliance Module (SSS-2)

```typescript
// Add to blacklist
await stablecoin.compliance.blacklistAdd(
  address,
  'OFAC sanctions match',
  blacklisterKeypair
);

// Check if blacklisted
const blocked = await stablecoin.compliance.isBlacklisted(address);

// Get blacklist entry details
const entry = await stablecoin.compliance.getBlacklistEntry(address);
if (entry) {
  console.log(`Blacklisted: ${entry.reason}`);
  console.log(`Since: ${new Date(Number(entry.timestamp) * 1000)}`);
}

// Seize tokens from blacklisted account
await stablecoin.compliance.seize({
  fromTokenAccount: blacklistedAccount,
  toTokenAccount: treasuryAccount,
  amount: 1000_000000n,
  seizer: seizerKeypair,
});

// Remove from blacklist
await stablecoin.compliance.blacklistRemove(
  address,
  blacklisterKeypair
);
```

## Oracle Module

For non-USD pegged stablecoins (EUR, BRL, CPI-indexed, etc.).

```typescript
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

// Add price feeds
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

// Crank feeds (update prices)
await stablecoin.oracle.crankFeed({
  feedIndex: 0,
  price: 1_100_000_000n,      // 1.10 EUR/USD (9 decimals)
  confidence: 1_000_000n,
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
```

## Wallet Display (Metaplex Metadata)

Make your token visible in all Solana wallets and explorers:

```typescript
// After creating your stablecoin
const metadataPda = await stablecoin.initializeMetaplexMetadata(
  {
    name: "My Stablecoin",
    symbol: "MYUSD",
    uri: "https://arweave.net/...",
    sellerFeeBasisPoints: 0,
  },
  mintKeypair // Required to sign
);

console.log("Your token will now display in wallets!");
```

**Important Notes:**
- The mint keypair must sign this transaction (Metaplex requirement)
- Incompatible with `enableMintCloseAuthority: true`
- Default config has `enableMintCloseAuthority: false` for compatibility

## Query Methods

```typescript
// Get stablecoin status
const status = await stablecoin.getStatus();
console.log(`${status.name} (${status.symbol})`);
console.log(`Supply: ${status.totalSupply}`);
console.log(`Paused: ${status.paused}`);

// Get metadata
const metadata = await stablecoin.getMetadata();
console.log(`Token: ${metadata.name} (${metadata.symbol})`);
console.log(`URI: ${metadata.uri}`);

// Get role assignments
const roles = await stablecoin.getRoles();
console.log('Master:', roles.masterAuthority.toBase58());
console.log('Burner:', roles.burner.toBase58());

// Get total supply
const supply = await stablecoin.getTotalSupply();
console.log(`Total supply: ${supply}`);

// Get oracle status
const oracleStatus = await stablecoin.oracle.getStatus();
console.log(`${oracleStatus.baseCurrency}/${oracleStatus.quoteCurrency}`);
console.log(`Last price: ${oracleStatus.lastAggregatedPrice}`);
```

## Error Handling

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
- `ZeroAmount` - Amount must be > 0
- `SupplyNotZero` - Cannot close mint with non-zero supply
- `ComplianceNotEnabled` - SSS-2 instruction on non-SSS-2 mint

**sss-oracle errors:**
- `InvalidPrice` - Price is zero or invalid
- `StalePrice` - Feed price is too old
- `InsufficientFeeds` - Not enough valid feeds for aggregation
- `CircuitBreakerTriggered` - Price change exceeds threshold

## API Reference

For complete API documentation, see [docs/SDK.md](../../docs/SDK.md).

## Examples

See the [CLI source code](../cli/src/commands) for real-world usage examples.

## Development

IDL files (`src/idl/*.json`) are auto-generated by `anchor build` and gitignored.
Run `anchor build` from the repo root before building the SDK — the build script
copies them from `target/idl/` automatically.

```bash
# From repo root — compile programs and generate IDLs
anchor build

# Build SDK (copies IDLs from target/idl/, then compiles TypeScript)
pnpm --filter @stbr/sss-token-sdk build

# Run tests
pnpm --filter @stbr/sss-token-sdk test

# Type check
tsc --noEmit
```

## License

MIT