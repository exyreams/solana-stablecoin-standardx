# SSS Backend Services

Backend services for the Solana Stablecoin Standard (SSS) - event indexing, mint/burn coordination, compliance monitoring, and webhooks.

## Architecture

- **Event Indexer** - Monitors on-chain events from sss-token, transfer-hook, and sss-oracle programs.
- **Mint/Burn Service** - Coordinates fiat-to-stablecoin lifecycle (request → verify → execute → log).
- **Compliance Service** - SSS-2 blacklist management, sanctions screening integration, audit trail.
- **Webhook Service** - Configurable event notifications with retry logic.
- **Dashboard & Analytics** - High-level metrics and historical data for stablecoin monitoring.

## Prerequisites

- Node.js 20+
- Solana CLI tools (for devnet deployment)
- pnpm (for local development)
- Redis (for BullMQ queues)

## Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Database Setup (Drizzle + SQLite)
```bash
# Generate migrations
pnpm db:generate

# Apply migrations to the local SQLite database
pnpm db:migrate

# Optionally, view the database via Drizzle Studio
pnpm db:studio
```

### 4. Start the Server
```bash
# Development mode (with hot reload)
pnpm dev

# Production build
pnpm build
pnpm start
```

Default API URL: `http://localhost:3000`

---

## Environment Configuration

Key variables in `.env`:

```bash
# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
STABLECOIN_MINT=your_mint_address_here # Optional
METADATA_PDA=your_metadata_pda_here
AUTHORITY_SECRET_KEY=[1,2,3,...,64]

# Database (SQLite)
DATABASE_URL=file:./db/dev.db

# Redis
REDIS_URL=redis://:your-redis-password@localhost:6379
REDIS_PASSWORD=your-redis-password

# Optional Program Overrides
SSS_TOKEN_PROGRAM_ID=your_custom_program_id

# API & Logging
PORT=3000
LOG_LEVEL=info
JWT_SECRET=your-secure-jwt-key
REGISTRATION_SECRET=your-reg-secret
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

---

## Admin Authentication

Most routes are protected by JWT authentication (Role: `ADMIN` or `MINTER`).

1. **Register**: `/admin/register` (Requires `REGISTRATION_SECRET`)
2. **Login**: `/admin/login` -> Returns JWT token
3. **Usage**: Header `Authorization: Bearer <token>`

---

## API Summary

For full details and testing tools, see:
- [API Reference](../docs/API.md) — Comprehensive route documentation.
- [API Testing Guide](../docs/testing/API_TEST.md) — Step-by-step verification guide.
- [Postman Collection](../docs/testing/sss-postman-collection.json) — Postman assets for manual testing.

### Core
- `GET /health` - Service status
- `POST /create-stablecoin` - New stablecoin deployment
- `GET /list-stablecoins` - List created tokens

### Mint & Burn
- `POST /mint-burn/mint` - Queue a mint (Admin)
- `POST /mint-burn/prepare-mint` - Prepare transaction for Minter signature

### Compliance & Privacy
- `POST /compliance/blacklist` - Add address to blacklist (SSS-2)
- `POST /compliance/freeze` - Freeze token account (SSS-1)
- `POST /privacy/approve` - Approve confidential transfers (SSS-3)

### Monitoring
- `GET /analytics` - 24h metrics and history
- `GET /dashboard/summary` - Trajectory and recent activity
- `GET /compliance/audit` - Internal and on-chain audit trail

---

## Docker Support

You can also run the entire stack via Docker:

```bash
docker compose up -d
```

This starts:
- `sss-backend` (Hono API)
- `redis` (Queue management)
- `postgres` (Optional, if configured for production)

---

## Scripts

- `pnpm dev`: Start development server
- `pnpm build`: Compile TypeScript
- `pnpm db:generate`: Sync schema changes to migrations
- `pnpm db:migrate`: Apply migrations to database
- `pnpm db:studio`: Launch database GUI
