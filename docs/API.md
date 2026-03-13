# API Reference — Unified SSS Backend

All routes are on a single Hono server (`PORT=3000`). Set `Content-Type: application/json`.

## Authentication

Most routes (except Health and Public Stablecoin info) require a JSON Web Token (JWT).
- **Header**: `Authorization: Bearer <your_jwt_token>`
- **Roles**: `ADMIN` (Full access) or `MINTER` (Mint/Burn only)

---

## Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Returns `{ status: "ok", service: "sss-backend" }` |

## Authentication (Admin/Minter)

| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/admin/register` | `{ username, password, secretToken, role? }` | Register a new Admin (requires secret token). Role defaults to `ADMIN`. |
| `POST` | `/admin/login` | `{ username, password }` | Login and receive `{ success, token, role }` |

---

## Stablecoin Management

| Method | Path | Body | Description | Auth |
|---|---|---|---|---|
| `POST` | `/create-stablecoin` | `{ preset, name, symbol, decimals?, uri?, extensions?, roles? }` | Create a new stablecoin (presets: `sss1`, `sss2`, `sss3`) | `ADMIN` |
| `GET` | `/list-stablecoins` | `?limit=50&offset=0` | List all created stablecoins. Returns `{ stablecoins, count, limit, offset }` | `ADMIN`/`MINTER` |
| `GET` | `/get-stablecoin/:mintAddress` | — | Get specific stablecoin details (including `onChain` status) | `ADMIN`/`MINTER` |
| `GET` | `/get-stablecoin/:mintAddress/history` | — | Get recent `mints` and `burns` for this mint | `ADMIN`/`MINTER` |

---

## Mint / Burn (SSS-1+)

| Method | Path | Body | Description | Auth |
|---|---|---|---|---|
| `POST` | `/mint-burn/mint` | `{ recipient, amount, mintAddress?, minter? }` | Queue a mint request (Admin flow). `mintAddress` falls back to ENV if omitted. | `ADMIN` |
| `POST` | `/mint-burn/prepare-mint` | `{ recipient, amount, mintAddress, minter }` | Prepare a mint transaction (Minter flow). Returns `{ transaction }` (base64) | `MINTER`/`ADMIN` |
| `POST` | `/mint-burn/burn` | `{ fromTokenAccount, amount, mintAddress?, minter? }` | Queue a burn request (Admin flow). `mintAddress` falls back to ENV if omitted. | `ADMIN` |
| `POST` | `/mint-burn/prepare-burn` | `{ fromTokenAccount, amount, mintAddress, minter }` | Prepare a burn transaction (Minter flow). Returns `{ transaction }` (base64) | `MINTER`/`ADMIN` |

---

## Compliance & Privacy

### General Operations (SSS-1+)

| Method | Path | Body | Description | Auth |
|---|---|---|---|---|
| `POST` | `/compliance/freeze` | `{ mintAddress?, address, reason? }` | Freeze a token account | `ADMIN` |
| `POST` | `/compliance/thaw` | `{ mintAddress?, address, reason? }` | Thaw a token account | `ADMIN` |
| `POST` | `/compliance/pause` | `{ reason? }` | Pause minting & burning globally | `ADMIN` |
| `POST` | `/compliance/unpause` | `{ reason? }` | Unpause minting & burning | `ADMIN` |
| `GET` | `/compliance/audit` | `?limit=100&offset=0&action?&address?` | Filterable audit trail (Admin & On-chain) | `ADMIN` |
| `GET` | `/compliance/history/:address` | `?limit=20` | Combined on-chain and internal history for an address | `ADMIN` |

### Blacklist & Seize (SSS-2)

| Method | Path | Body / Query | Description | Auth |
|---|---|---|---|---|
| `GET` | `/compliance/blacklist` | `?mintAddress=&sync=true` | List all blacklisted addresses for a mint | `ADMIN` |
| `POST` | `/compliance/blacklist` | `{ mintAddress, address, reason? }` | Blacklist an address | `ADMIN` |
| `DELETE` | `/compliance/blacklist/:address`| `?mintAddress=` | Remove from blacklist | `ADMIN` |
| `GET` | `/compliance/blacklist/:address`| `?mintAddress=` | Check if address is blacklisted | `ADMIN` |
| `POST` | `/compliance/seize` | `{ mintAddress, fromTokenAccount, toTokenAccount, amount, reason? }` | Seize tokens from a frozen account | `ADMIN` |

### Privacy / Confidential Transfers (SSS-3)

| Method | Path | Body | Description | Auth |
|---|---|---|---|---|
| `POST` | `/privacy/approve` | `{ tokenAccount, reason? }` | Approve account for confidential transfers | `ADMIN` |
| `POST` | `/privacy/enable-credits` | `{ tokenAccount, reason? }` | Enable confidential credits | `ADMIN` |
| `POST` | `/privacy/disable-credits` | `{ tokenAccount, reason? }` | Disable confidential credits | `ADMIN` |

---

## Analytics & Dashboard

### Analytics
| Method | Path | Query | Description | Auth |
|---|---|---|---|---|
| `GET` | `/analytics` | `?mint=` | Get 24h stats, holders, gini index, and supply history | `ADMIN`/`MINTER` |

### Dashboard
| Method | Path | Query | Description | Auth |
|---|---|---|---|---|
| `GET` | `/dashboard/summary` | `?mint=` | Get high-level metrics, trajectory, and recent activities | `ADMIN`/`MINTER` |

---

## Admin — Infrastructure

### Status & Lifecycle
| Method | Path | Body | Description | Auth |
|---|---|---|---|---|
| `GET` | `/admin/status` | — | High-level state, metadata, and roles | `ADMIN` |
| `GET` | `/admin/on-chain-status` | — | Raw account existence and size on-chain | `ADMIN` |
| `GET` | `/admin/supply` | — | Canonical total supply for the global mint | `ADMIN` |
| `GET` | `/admin/authority` | — | Get the backend's authority public key | `MINTER`/`ADMIN` |
| `DELETE` | `/admin/close-mint` | — | Permanently close the mint | `ADMIN` |
| `PUT` | `/admin/roles` | `{ burner?, pauser?, blacklister?, seizer? }` | Update role assignments | `ADMIN` |
| `POST` | `/admin/authority/transfer`| `{ newMaster }` | Step 1 of Master Authority transfer | `ADMIN` |
| `POST` | `/admin/authority/accept`| — | Step 2 of Master Authority transfer | `ADMIN` |

### Minter Management
| Method | Path | Body / Query | Description | Auth |
|---|---|---|---|---|
| `GET` | `/admin/minters` | `?mint=` | List all minters for a specific mint | `ADMIN` |
| `POST` | `/admin/minters` | `{ address, quota, mintAddress }` | Add a new authorized minter | `ADMIN` |
| `PUT` | `/admin/minters/:address`| `{ quota, active, resetMinted?, mintAddress }` | Update minter config | `ADMIN` |
| `DELETE` | `/admin/minters/:address`| `?mint=` | Remove a minter | `ADMIN` |
| `GET` | `/admin/minter-status/:wallet`| — | List all mints where this wallet is authorized | `MINTER`/`ADMIN` |

### Oracle Management
| Method | Path | Body | Description | Auth |
|---|---|---|---|---|
| `GET` | `/admin/oracle/status` | — | Oracle config + current feeds and prices | `ADMIN` |
| `GET` | `/admin/oracle/activity` | `?limit=15` | Merged event and audit logs for oracle | `ADMIN` |
| `GET` | `/admin/oracle/feeds/:index` | — | Details for a specific feed index | `ADMIN` |
| `GET` | `/admin/oracle/price/mint` | — | Get current on-chain mint price | `ADMIN` |
| `GET` | `/admin/oracle/price/redeem` | — | Get current on-chain redeem price | `ADMIN` |
| `POST` | `/admin/oracle/initialize`| `{ baseCurrency, quoteCurrency, ... }` | Initialize oracle for the mint | `ADMIN` |
| `PUT` | `/admin/oracle/config` | `{ maxStalenessSeconds?, aggregationMethod?, ... }` | Update oracle config | `ADMIN` |
| `POST` | `/admin/oracle/feeds` | `{ feedIndex, feedType, feedAddress?, label, weight? }` | Add a price feed | `ADMIN` |
| `DELETE` | `/admin/oracle/feeds/:index`| — | Remove a price feed | `ADMIN` |
| `POST` | `/admin/oracle/crank` | `{ feedIndex, price }` | Manually update a feed price | `ADMIN` |
| `POST` | `/admin/oracle/aggregate`| `{ feedAccounts: string[] }` | Manually trigger price aggregation | `ADMIN` |
| `POST` | `/admin/oracle/manual-price`| `{ price, active }` | Set manual price override | `ADMIN` |
| `DELETE` | `/admin/oracle/close` | — | Close the oracle | `ADMIN` |
| `POST` | `/admin/oracle/authority/transfer` | `{ newAuthority }` | Step 1 of Oracle Authority transfer | `ADMIN` |
| `POST` | `/admin/oracle/authority/accept` | — | Step 2 of Oracle Authority transfer | `ADMIN` |

### Transfer Hook (SSS-2)
| Method | Path | Body | Description | Auth |
|---|---|---|---|---|
| `POST` | `/admin/hook/initialize` | — | Initialize `ExtraAccountMetaList` PDA | `ADMIN` |

### Development / Debug
| Method | Path | Body | Description | Auth |
|---|---|---|---|---|
| `POST` | `/admin/dev/set-authority` | `{ secretKey }` | Manually update the backend authority keypair | `ADMIN` |

---

## Webhooks

| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/webhooks/subscribe` | `{ url, events: string[] }` | Register callback URL for event notifications |
| `DELETE` | `/webhooks/subscribe/:id` | — | Unsubscribe |
| `POST` | `/webhooks/dispatch` | `{ event, data }` | Internal: trigger a manual event dispatch |

---

## Testing & Verification

For hands-on testing and automated verification, see:
- [API Testing Guide](./testing/API_TEST.md) — Comprehensive phase-by-phase testing manual.
- [CLI Testing Guide](./testing/CLI_TEST.md) — Phase-based CLI verification guide.
- [Postman Collection](./testing/sss-postman-collection.json) — Ready-to-use API requests for manual testing.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `file:./db/dev.db` | SQLite path |
| `SOLANA_RPC_URL` | `https://api.devnet.solana.com` | Solana RPC endpoint |
| `STABLECOIN_MINT` | — | Global default mint address |
| `AUTHORITY_SECRET_KEY`| — | Backend authority keypair (JSON array) |
| `JWT_SECRET` | — | Secret for signing JWT tokens |
| `REGISTRATION_SECRET` | — | Required token for `/admin/register` |
| `CORS_ORIGINS` | — | Comma-separated list of allowed origins |
| `TRANSFER_HOOK_PROGRAM_ID` | — | Override default transfer hook program |
| `REDIS_URL` | `redis://localhost:6379` | Redis for BullMQ |
| `PORT` | `3000` | HTTP port |
| `LOG_LEVEL` | `info` | Pino logging level |
