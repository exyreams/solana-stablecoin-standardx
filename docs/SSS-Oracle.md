# SSS-Oracle: Price Feed Integration Module

**Status:** Final
**Version:** 1
**Category:** Oracle Layer (companion to SSS-1/SSS-2/SSS-3)

---

## Summary

SSS-Oracle is the **price-feed aggregation module** for non-USD stablecoin pegs. It provides:

- **Multi-source price aggregation** — median, mean, or weighted mean across up to 16 feeds
- **Staleness and confidence gating** — reject stale or low-quality price data at the protocol level
- **Deviation protection** — reject aggregation when feeds diverge beyond a threshold
- **Circuit breaker** — reject individual crank updates that exceed a maximum price change
- **Manual override** — authority can set a fallback price during feed outages
- **Mint/redeem spread** — configurable basis-point premiums and discounts
- **Two-step authority transfer** — prevents accidental lockout, consistent with sss-token
- **CPI integration** — `sss-token` reads prices via CPI or direct account deserialization

SSS-Oracle is deployed as a **separate program** alongside `sss-token`. Each stablecoin mint gets its own `OracleConfig` PDA with independent feed configuration and quality parameters.

SSS-Oracle is suitable for **EUR, GBP, JPY, BRL, and any non-USD peg** where the mint/redeem price depends on a live exchange rate.

---

## Architecture

```text
┌──────────────────────────────────────────────────────┐
│                   sss-token program                  │
│   mint / redeem ──► CPI ──► get_mint_price           │
│                             get_redeem_price          │
└─────────────────────────┬────────────────────────────┘
                          │ reads
                          ▼
┌──────────────────────────────────────────────────────┐
│                OracleConfig  (PDA)                   │
│   last_aggregated_price · mint_premium_bps · …       │
└─────────────────────────┬────────────────────────────┘
                          │ populated by
                          ▼
┌───────────┐  ┌───────────┐  ┌───────────┐
│  Feed #0  │  │  Feed #1  │  │  Feed #2  │  …
│ Switchb.  │  │   Pyth    │  │  Manual   │
└───────────┘  └───────────┘  └───────────┘
       ▲             ▲             ▲
       │             │             │
    crank_feed    crank_feed   set_manual_price
    (circuit      (circuit
     breaker)      breaker)
```

---

## On-Chain Accounts

### `OracleConfig` PDA

Seeds: `["oracle_config", mint]`

This PDA stores all configuration, quality gates, spread parameters, and cached aggregation results for a single stablecoin mint's price oracle.

| Field | Type | Description |
|---|---|---|
| `version` | `u8` | Schema version for future state migrations (currently `1`) |
| `authority` | `Pubkey` | Full admin; can manage config, feeds, manual override, transfer authority |
| `pending_authority` | `Option<Pubkey>` | Pending new authority for two-step transfer pattern |
| `cranker` | `Pubkey` | Authorized price pusher; can crank feeds and run aggregation |
| `mint` | `Pubkey` | The stablecoin mint this oracle serves |
| `base_currency` | `String` | Base currency symbol, e.g. "EUR" (max 8 bytes) |
| `quote_currency` | `String` | Quote currency symbol, e.g. "USD" (max 8 bytes) |
| `max_staleness_seconds` | `i64` | Maximum age (seconds) before a single feed is considered stale |
| `max_confidence_interval_bps` | `u16` | Maximum confidence interval width (basis points); `0` = disabled |
| `aggregation_method` | `u8` | `0` = Median, `1` = Mean, `2` = Weighted Mean |
| `min_feeds_required` | `u8` | Minimum valid feeds required for aggregation to succeed |
| `deviation_threshold_bps` | `u16` | Maximum acceptable deviation between any two feeds (basis points); `0` = disabled |
| `max_price_change_bps` | `u16` | Maximum single-crank price change (basis points); `0` = disabled |
| `mint_premium_bps` | `i16` | Basis-point premium added when computing the mint price (signed) |
| `redeem_discount_bps` | `i16` | Basis-point discount subtracted when computing the redeem price (signed) |
| `manual_price` | `u64` | Fallback price (9-decimal fixed point) |
| `manual_price_active` | `bool` | When `true`, `manual_price` overrides feed aggregation |
| `last_aggregated_price` | `u64` | Last successfully aggregated price (9-decimal fixed point) |
| `last_aggregated_confidence` | `u64` | RMS confidence of the last aggregation (9-decimal fixed point) |
| `last_aggregated_timestamp` | `i64` | Unix timestamp of the last aggregation |
| `feed_count` | `u8` | Number of active `PriceFeedEntry` PDAs |
| `paused` | `bool` | Global kill switch — blocks cranks, aggregation, and price reads |
| `bump` | `u8` | PDA bump seed |
| `reserved` | `[u8; 32]` | Reserved for future upgrades |

**Note on `last_aggregated_price`:** When `manual_price_active` is true and `set_manual_price` is called, this field is also updated to the manual price so that downstream raw-state readers see the effective price. After deactivating manual mode, call `aggregate` to refresh this field from live feeds before querying `get_mint_price`/`get_redeem_price`.

### `PriceFeedEntry` PDA

Seeds: `["price_feed", oracle_config, &[feed_index]]`

One PDA per registered price source. Created via `add_feed`, closed via `remove_feed`.

| Field | Type | Description |
|---|---|---|
| `oracle_config` | `Pubkey` | Parent oracle this feed belongs to |
| `feed_index` | `u8` | Unique slot `0..15` — used as PDA seed |
| `feed_type` | `u8` | `0` = Switchboard, `1` = Pyth, `2` = Chainlink, `3` = Manual, `4` = API |
| `feed_address` | `Pubkey` | On-chain address of the external feed (`Pubkey::default()` for manual/API) |
| `label` | `String` | Human-readable name, e.g. "switchboard-eur-usd" (max 32 bytes) |
| `last_price` | `u64` | Last recorded price (9-decimal fixed point) |
| `last_confidence` | `u64` | Last recorded confidence interval (9-decimal fixed point) |
| `last_timestamp` | `i64` | Unix timestamp of the last price update |
| `weight` | `u16` | Weight for weighted-mean aggregation (basis points; `10000` = 1.0×) |
| `enabled` | `bool` | Admin can disable a feed without removing it |
| `max_staleness_override` | `i64` | Per-feed staleness override; `0` → use global `max_staleness_seconds` |
| `bump` | `u8` | PDA bump seed |
| `reserved` | `[u8; 32]` | Reserved for future upgrades |

**Existence of this PDA = feed is registered.** Closing it removes the feed from the oracle and reclaims rent.

---

## Instructions

### Core Operations

| Instruction | Auth Required | Description |
|---|---|---|
| `initialize_oracle` | payer (becomes authority) | Create `OracleConfig` PDA for a stablecoin mint |
| `aggregate` | cranker / authority | Collect feeds, filter stale/invalid, aggregate, store result |
| `get_mint_price` | none | Read aggregated price, apply mint premium, emit + return data |
| `get_redeem_price` | none | Read aggregated price, apply redeem discount, emit + return data |
| `close_oracle` | authority | Close `OracleConfig` PDA (all feeds must be removed first) |

### Feed Management

| Instruction | Auth Required | Description |
|---|---|---|
| `add_feed` | authority | Create a `PriceFeedEntry` PDA for a new price source |
| `remove_feed` | authority | Close a `PriceFeedEntry` PDA (reclaims rent) |
| `crank_feed` | cranker / authority | Push a new price + confidence observation (circuit breaker enforced) |

### Configuration & Administration

| Instruction | Auth Required | Description |
|---|---|---|
| `update_oracle_config` | authority | Modify any config parameter (staleness, confidence, spread, circuit breaker, etc.) |
| `set_manual_price` | authority | Set or clear the manual price override |
| `transfer_oracle_authority` | authority / pending | Two-step authority transfer: initiate, cancel, or accept |

---

## Input Validation

All price-based instructions enforce `price > 0`:

| Instruction | Guard |
|---|---|
| `crank_feed` | `InvalidPrice` if price is 0 |
| `set_manual_price` | `InvalidPrice` if price is 0 and `active` is true |

Circuit breaker protection on individual cranks:

| Instruction | Guard |
|---|---|
| `crank_feed` | `PriceChangeExceedsLimit` if change > `max_price_change_bps` (when enabled and feed has prior price) |

Pause protection blocks operational instructions:

| Instruction | Guard |
|---|---|
| `add_feed` | `OraclePaused` if paused |
| `crank_feed` | `OraclePaused` if paused |
| `aggregate` | `OraclePaused` if paused |
| `get_mint_price` | `OraclePaused` if paused |
| `get_redeem_price` | `OraclePaused` if paused |

Instructions that remain operational while paused (authority can respond to incidents):

| Instruction | Reason |
|---|---|
| `update_oracle_config` | Authority needs to modify config during incidents |
| `set_manual_price` | Authority needs to set fallback price before unpausing |
| `transfer_oracle_authority` | Access control must not be blocked |
| `remove_feed` | Authority may need to remove faulty feeds |
| `close_oracle` | Authority may need to shut down oracle |

Feed count protection prevents orphaned PDAs:

| Instruction | Guard |
|---|---|
| `add_feed` | `MaxFeedsReached` if `feed_count >= 16` |
| `remove_feed` | `FeedCountUnderflow` if `feed_count` would go below 0 (checked arithmetic) |
| `close_oracle` | `ActiveFeedsExist` if `feed_count > 0` |

---

## Events

Every state-changing instruction emits an event for off-chain indexing.

| Event | Emitted By |
|---|---|
| `OracleInitialized` | `initialize_oracle` (includes authority, mint, currencies) |
| `OracleConfigUpdated` | `update_oracle_config` |
| `OracleClosed` | `close_oracle` |
| `OracleAuthorityTransferInitiated` | `transfer_oracle_authority` step 1 (includes current + pending authority) |
| `OracleAuthorityTransferCompleted` | `transfer_oracle_authority` step 2 (includes new authority) |
| `OracleAuthorityTransferCancelled` | `transfer_oracle_authority` cancel (includes cancelled-by + was-pending) |
| `OraclePauseStateChanged` | `update_oracle_config` when paused state changes (includes paused flag, authority) |
| `FeedAdded` | `add_feed` (includes feed_entry pubkey, index, type, label) |
| `FeedRemoved` | `remove_feed` (includes feed_index) |
| `FeedCranked` | `crank_feed` (includes price, confidence, timestamp) |
| `ManualPriceSet` | `set_manual_price` (includes price, active flag) |
| `PriceAggregated` | `aggregate` (includes aggregated_price, confidence, feeds_used) |
| `MintPriceComputed` | `get_mint_price` (includes base_price, mint_price, premium_bps) |
| `RedeemPriceComputed` | `get_redeem_price` (includes base_price, redeem_price, discount_bps) |

---

## Fixed-Point Format

All prices use **9-decimal fixed point** stored as `u64`.

| Real Value | Stored Value |
|---|---|
| 1.000 | `1_000_000_000` |
| 1.085 (EUR/USD) | `1_085_000_000` |
| 0.00769 (JPY/USD) | `7_690_000` |
| 156.42 (USD/JPY) | `156_420_000_000` |

Basis-point denominator: `10_000 = 100%`.

---

## Aggregation Pipeline

```text
crank_feed (per source, called by off-chain service)
        │
        ├── price > 0?                         → InvalidPrice
        ├── oracle paused?                     → OraclePaused
        ├── feed enabled?                      → FeedNotEnabled
        ├── circuit breaker (if prior price):
        │     |new − old| / max(new,old) > max_price_change_bps?
        │                                      → PriceChangeExceedsLimit
        └── store price, confidence, timestamp
        │
        ▼
aggregate ─────────────────────────────────────────────
  1. Short-circuit: if manual_price_active, store manual price and return
  2. Collect remaining accounts (PriceFeedEntry PDAs)
  3. Filter each feed:
     a. Owner check — must be owned by this program
     b. Deserialize — must be a valid PriceFeedEntry
     c. Oracle check — must belong to this OracleConfig
     d. Enabled check — feed.enabled must be true
     e. Non-zero check — feed.last_price must be > 0
     f. Staleness check — age ≤ max_staleness_seconds (or per-feed override)
     g. Confidence check — confidence/price ≤ max_confidence_interval_bps
                           (skipped when max_confidence_interval_bps = 0)
  4. Minimum-feeds gate — valid_count ≥ min_feeds_required
  5. Deviation gate — all pairwise deviations ≤ deviation_threshold_bps
                      (skipped when deviation_threshold_bps = 0)
  6. Aggregate: median | mean | weighted_mean
  7. Compute RMS confidence across valid feeds
  8. Store → last_aggregated_price / confidence / timestamp
        │
        ▼
get_mint_price / get_redeem_price ─────────────────────
  1. Read cached price (or manual override)
  2. Staleness check on aggregated timestamp
  3. Apply spread:
     • mint:   price × (10000 + mint_premium_bps) / 10000
     • redeem: price × (10000 − redeem_discount_bps) / 10000
  4. Emit event + set_return_data (8-byte u64 LE)
```

---

## Aggregation Methods

| Method | ID | Behaviour |
|---|---|---|
| Median | `0` | Sort prices, take middle value (average of two middle values for even count) |
| Mean | `1` | Arithmetic average of all valid prices |
| Weighted Mean | `2` | `Σ(price_i × weight_i) / Σ(weight_i)` where weights are in basis points |

The **median** is recommended for most deployments. It is robust against a single outlier feed and does not require weight calibration.

---

## Initialization Parameters

```rust
pub struct InitializeOracleParams {
    pub base_currency: String,              // max 8 bytes, e.g. "EUR"
    pub quote_currency: String,             // max 8 bytes, e.g. "USD"
    pub max_staleness_seconds: i64,         // e.g. 120 (2 minutes)
    pub max_confidence_interval_bps: u16,   // e.g. 100 (1%); 0 = disabled
    pub aggregation_method: u8,             // 0 = Median
    pub min_feeds_required: u8,             // e.g. 2
    pub deviation_threshold_bps: u16,       // e.g. 100 (1%); 0 = disabled
    pub max_price_change_bps: u16,          // e.g. 1000 (10%); 0 = disabled
    pub mint_premium_bps: i16,              // e.g. 10 (0.1% premium)
    pub redeem_discount_bps: i16,           // e.g. 10 (0.1% discount)
    pub cranker: Pubkey,                    // authorized price pusher
}
```

---

## Authority Transfer

Oracle authority transfer follows the same **two-step pattern** as sss-token's `transfer_authority`:

```text
Step 1 — Initiate:
  Current authority calls transfer_oracle_authority(Some(new_pubkey))
  → Sets pending_authority
  → Emits OracleAuthorityTransferInitiated

Cancel:
  Current authority calls transfer_oracle_authority(None)
  → Clears pending_authority
  → Emits OracleAuthorityTransferCancelled

Step 2 — Accept:
  Pending authority calls transfer_oracle_authority(any value)
  → Sets authority = caller, clears pending_authority
  → Emits OracleAuthorityTransferCompleted
```

This prevents accidental lockout from typos in the new authority address. The pending party must explicitly accept, proving they control the key.

---

## Circuit Breaker

The circuit breaker protects against price manipulation through compromised cranker keys or buggy off-chain services.

**Behaviour:** When `max_price_change_bps > 0` and a feed already has a prior price (`last_price > 0`), each `crank_feed` call checks whether the new price deviates from the previous price by more than the threshold. If it does, the crank is rejected with `PriceChangeExceedsLimit`.

**First crank bypass:** The first crank to a newly added feed (where `last_price == 0`) always passes — there is no reference point for comparison.

**Recommended values:**
| Pair Type | Suggested `max_price_change_bps` |
|---|---|
| Stable pairs (EUR/USD, GBP/USD) | `500` – `1000` (5% – 10%) |
| Volatile pairs (BRL/USD, emerging markets) | `2000` – `3000` (20% – 30%) |
| Disabled (trust the cranker fully) | `0` |

**Emergency override:** If the circuit breaker blocks a legitimate price move (e.g., flash crash), the authority can:
1. Set `max_price_change_bps` to `0` temporarily via `update_oracle_config`
2. Crank the new price
3. Re-enable the circuit breaker

Alternatively, use `set_manual_price` to bypass feeds entirely.

---

## CPI Integration

The `sss-token` program (or any consumer) can read oracle prices two ways:

### 1. Direct Account Deserialization

Deserialize `OracleConfig` and read `last_aggregated_price` plus the bps fields. Apply spread math in the consumer program. This avoids CPI overhead but requires the consumer to replicate spread logic.

### 2. CPI Call

Invoke `get_mint_price` or `get_redeem_price` and read the 8-byte `u64` (little-endian) from `sol_get_return_data`. This is the recommended approach — spread math is handled by the oracle program.

```rust
// In sss-token's mint instruction:
let cpi_accounts = GetMintPrice {
    oracle_config: ctx.accounts.oracle_config.to_account_info(),
};
let cpi_ctx = CpiContext::new(ctx.accounts.oracle_program.to_account_info(), cpi_accounts);
sss_oracle::cpi::get_mint_price(cpi_ctx)?;

let (_, data) = sol_get_return_data().unwrap();
let mint_price = u64::from_le_bytes(data[..8].try_into().unwrap());
```

---

## Design Decisions

### Cranker Separation

The `cranker` key can push prices and trigger aggregation without having authority to change configuration, override prices manually, or close the oracle. This allows automated off-chain services to operate with minimal privileges. The authority can always act as cranker.

### Circuit Breaker

A compromised or buggy cranker could push an extreme price (e.g., 1000× the real rate) in a single update. The circuit breaker (`max_price_change_bps`) rejects any single-crank price change that exceeds the threshold. This limits the damage window: an attacker must push many small incremental changes, giving operators time to detect and respond. Set to `0` to disable for fully trusted crankers.

### Deviation Gate

Before aggregation, every pair of valid feed prices is compared. If any pair exceeds `deviation_threshold_bps`, aggregation fails with `ExcessiveDeviation`. This prevents a single compromised or misconfigured feed from skewing the aggregate. Operators must investigate and resolve the discrepancy.

When `deviation_threshold_bps` is `0`, the deviation check is **disabled** (all feeds are accepted regardless of spread). This is distinct from the previous behaviour where `0` would require all prices to be identical — a value of `0` now explicitly means "no deviation check".

### Staleness Gate

Each feed has a maximum allowed age. Feeds older than `max_staleness_seconds` (or their per-feed override) are silently excluded from aggregation. If too few feeds pass the staleness filter, aggregation fails with `InsufficientFeeds`. The cached aggregated price also has a staleness check — `get_mint_price` and `get_redeem_price` reject prices where `last_aggregated_timestamp` is too old.

### Confidence Gate

When `max_confidence_interval_bps` is `0`, the confidence check is **disabled** — all confidence values are accepted. When non-zero, feeds whose `confidence / price` ratio exceeds the threshold are excluded from aggregation.

### Minimum Feeds Requirement

The oracle refuses to produce an aggregated price when fewer than `min_feeds_required` sources pass all quality gates. This ensures the price is never derived from a single potentially faulty source (unless `min_feeds_required` is explicitly set to `1`).

### Manual Override Priority

When `manual_price_active` is `true`, all feed-based aggregation is bypassed. The manual price is returned directly. This is a circuit-breaker for extreme market conditions or feed infrastructure failures. Setting a manual price also immediately updates the cached aggregation fields so downstream readers see it without waiting for an `aggregate` call.

### Two-Step Authority Transfer

Authority transfer uses the same two-step pattern as sss-token's `transfer_authority`. The current authority initiates the transfer, and the pending authority must accept it in a separate transaction. This prevents accidental lockout from typos in the new authority pubkey. Authority transfer was intentionally removed from `update_oracle_config` to enforce this pattern.

### State Versioning

`OracleConfig` includes a `version` field (currently `1`) for future state migrations. If the account layout changes in a future version, the program can detect old-version accounts and handle them appropriately. This matches sss-token's versioning pattern.

### Pause Scope

`paused` blocks `add_feed`, `crank_feed`, `aggregate`, `get_mint_price`, and `get_redeem_price`. Configuration changes (`update_oracle_config`, `set_manual_price`, `transfer_oracle_authority`, `remove_feed`, `close_oracle`) remain operational during a pause so the authority can respond to incidents. This is consistent with SSS-1's pause design where operational instructions are blocked but admin instructions are not.

### Feed Count Guard

`close_oracle` requires `feed_count == 0`. All `PriceFeedEntry` PDAs must be removed via `remove_feed` before the oracle can be closed. This prevents orphaned PDAs whose rent would be stuck permanently. The `feed_count` decrement uses `checked_sub` to surface state corruption rather than silently masking it with `saturating_sub`.

### Spread Design

`mint_premium_bps` and `redeem_discount_bps` are **signed** values:
- Positive `mint_premium_bps` → minter pays more (covers slippage, revenue)
- Positive `redeem_discount_bps` → redeemer receives less (covers slippage, revenue)
- Negative values are allowed for promotional or market-making scenarios

The spread is applied as: `price × (10000 ± bps) / 10000`.

### Reserved Fields

Both `OracleConfig` (32 bytes) and `PriceFeedEntry` (32 bytes) include reserved byte arrays. These enable future field additions without account reallocation or migration instructions.

### No On-Chain Feed Reading

SSS-Oracle does **not** directly read Switchboard, Pyth, or Chainlink accounts on-chain. Instead, an off-chain cranker service reads external feeds, validates them, and pushes prices via `crank_feed`. This design:
- Avoids dependency on specific oracle SDK versions
- Allows the cranker to apply additional off-chain validation (including its own circuit breakers)
- Keeps the on-chain program simple and auditable
- Supports arbitrary data sources (APIs, manual entry, etc.)

---

## Error Codes

| Error | Description |
|---|---|
| `Unauthorized` | Signer is not the authority or cranker |
| `OraclePaused` | Oracle is paused; operational instruction blocked |
| `NotPendingAuthority` | Caller is not the pending authority (transfer step 2) |
| `StalePriceFeed` | Individual feed price is too old |
| `ConfidenceTooWide` | Feed confidence interval exceeds threshold |
| `InsufficientFeeds` | Not enough valid feeds for aggregation |
| `ExcessiveDeviation` | Pairwise feed deviation exceeds threshold |
| `AggregatedPriceStale` | Cached aggregated price is too old for price reads |
| `PriceChangeExceedsLimit` | Single-crank price change exceeds circuit breaker threshold |
| `MaxFeedsReached` | Cannot add more than 16 feeds |
| `FeedIndexOutOfBounds` | Feed index ≥ 16 |
| `FeedAlreadyExists` | PDA already exists at this index |
| `FeedNotEnabled` | Feed is disabled; cannot crank |
| `InvalidFeedAccount` | Feed PDA does not belong to this oracle |
| `ActiveFeedsExist` | Cannot close oracle with active feeds |
| `FeedCountUnderflow` | Feed count would go below 0 — potential state corruption |
| `InvalidPrice` | Price must be greater than zero |
| `InvalidAggregationMethod` | Aggregation method must be 0, 1, or 2 |
| `ManualPriceNotActive` | Manual price override is not enabled |
| `InvalidParameter` | Generic parameter validation failure |
| `CurrencyLabelTooLong` | Currency label exceeds 8 bytes |
| `FeedLabelTooLong` | Feed label exceeds 32 bytes |
| `MathOverflow` | Arithmetic overflow in fixed-point math |

---

## Quick Start

```bash
# 1. Initialize oracle for EUR stablecoin
sss-oracle init \
  --mint <EUR_MINT> \
  --base-currency EUR \
  --quote-currency USD \
  --max-staleness 120 \
  --max-confidence 100 \
  --aggregation-method 0 \
  --min-feeds 2 \
  --deviation-threshold 100 \
  --max-price-change 1000 \
  --mint-premium 10 \
  --redeem-discount 10 \
  --cranker <CRANKER_PUBKEY>

# 2. Add Switchboard feed
sss-oracle add-feed \
  --mint <EUR_MINT> \
  --feed-index 0 \
  --feed-type 0 \
  --feed-address <SWITCHBOARD_AGGREGATOR> \
  --label "switchboard-eur-usd" \
  --weight 10000

# 3. Add Pyth feed
sss-oracle add-feed \
  --mint <EUR_MINT> \
  --feed-index 1 \
  --feed-type 1 \
  --feed-address <PYTH_PRICE_ACCOUNT> \
  --label "pyth-eur-usd" \
  --weight 10000

# 4. Start cranker service (off-chain)
sss-oracle crank start --mint <EUR_MINT> --interval 10

# 5. sss-token reads price during mint/redeem via CPI automatically

# 6. Transfer authority (two-step)
sss-oracle transfer-authority --to <NEW_AUTHORITY>   # Step 1: initiate
# ... new authority runs:
sss-oracle accept-authority                          # Step 2: accept
```

```typescript
const oracle = await SSSOracle.initialize(connection, {
  mint: eurMintAddress,
  baseCurrency: 'EUR',
  quoteCurrency: 'USD',
  maxStalenessSeconds: 120,
  maxConfidenceIntervalBps: 100,
  aggregationMethod: AggregationMethod.Median,
  minFeedsRequired: 2,
  deviationThresholdBps: 100,
  maxPriceChangeBps: 1000,
  mintPremiumBps: 10,
  redeemDiscountBps: 10,
  cranker: crankerKeypair.publicKey,
  authority: adminKeypair,
});

await oracle.addFeed({
  feedIndex: 0,
  feedType: FeedType.Switchboard,
  feedAddress: switchboardAggregator,
  label: 'switchboard-eur-usd',
  weight: 10000,
});
```

---

## Operational Workflow

```
1. Deploy sss-oracle program

2. Initialize oracle for each non-USD stablecoin mint:
   sss-oracle init --mint <MINT> --base-currency EUR ...
   → Creates OracleConfig PDA (version = 1)
   → Emits OracleInitialized event

3. Register price sources:
   sss-oracle add-feed --feed-index 0 --feed-type 0 ...
   sss-oracle add-feed --feed-index 1 --feed-type 1 ...
   → Creates PriceFeedEntry PDAs
   → Emits FeedAdded events

4. Off-chain cranker service runs continuously:
   a. Read prices from Switchboard, Pyth, APIs, etc.
   b. Push each price: sss-oracle crank-feed --feed-index N ...
      → Circuit breaker validates price change is within bounds
      → Updates PriceFeedEntry.last_price/confidence/timestamp
      → Emits FeedCranked event
   c. Trigger aggregation: sss-oracle aggregate
      → Filters feeds, computes aggregate, stores result
      → Emits PriceAggregated event

5. sss-token mint/redeem instructions call via CPI:
   get_mint_price → base_price × (10000 + premium) / 10000
   get_redeem_price → base_price × (10000 − discount) / 10000
   → Emits MintPriceComputed / RedeemPriceComputed event
   → Returns price via set_return_data

6. Emergency procedures:
   • Feed outage → set_manual_price with fallback rate
   • Suspicious prices → pause oracle
   • Circuit breaker too tight → update max_price_change_bps temporarily
   • Feed decommission → remove_feed, optionally add replacement
   • Authority rotation → transfer_oracle_authority (two-step)
   • Mint sunset → remove all feeds, close_oracle
```

---

## Security Model

| Aspect | Implementation |
|---|---|
| Authority transfer | Two-step (initiate → accept), prevents accidental lockout |
| Cranker privilege separation | Cranker can only push prices and aggregate; cannot change config or override |
| Circuit breaker | Limits per-crank price change; prevents single compromised crank from setting extreme prices |
| Deviation gate | Rejects aggregation when feeds disagree beyond threshold; prevents outlier manipulation |
| Staleness gate | Excludes old data from aggregation; prevents stale prices from influencing results |
| Minimum feeds | Requires multiple sources to agree before producing a price |
| Manual override | Authority-only fallback; bypasses all feed logic for emergencies |
| Pause scope | Blocks operations but keeps admin functions available for incident response |
| State versioning | Version field enables safe future migrations |
| Feed count integrity | Checked arithmetic prevents silent state corruption |
```