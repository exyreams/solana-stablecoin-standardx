# Operations Runbook

This document provides comprehensive operational procedures for running a production stablecoin using the Solana Stablecoin Standard.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Deployment](#initial-deployment)
3. [Daily Operations](#daily-operations)
4. [Emergency Procedures](#emergency-procedures)
5. [Monitoring](#monitoring)
6. [Maintenance](#maintenance)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Environment Setup

```bash
# Set your environment variables
export SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
export SOLANA_KEYPAIR_PATH=~/.config/solana/id.json
export STABLECOIN_MINT=<your-mint-address>

# For devnet testing
export SOLANA_RPC_URL=https://api.devnet.solana.com
```

### Required Tools

```bash
# Solana CLI
solana --version  # Should be 1.18+

# Anchor CLI
anchor --version  # Should be 0.32.1

# SSS Token CLI
sss-token --version

# Node.js
node --version  # Should be 18+

# pnpm
pnpm --version
```

### Access Requirements

- Master authority keypair (hardware wallet recommended)
- Minter keypairs (hot wallets or KMS)
- Compliance officer keypairs
- Operations team keypairs
- RPC endpoint credentials
- Database credentials
- Monitoring system access

---

## Initial Deployment

### Step 1: Build and Deploy Programs

```bash
# Clone repository
git clone https://github.com/your-org/solana-stablecoin-standard
cd solana-stablecoin-standard

# Install dependencies
pnpm install

# Build programs
anchor build

# Deploy to devnet (testing)
anchor deploy --provider.cluster devnet

# Deploy to mainnet (production)
anchor deploy --provider.cluster mainnet-beta

# Note the program IDs
cat target/deploy/sss_token-keypair.json | solana-keygen pubkey
cat target/deploy/transfer_hook-keypair.json | solana-keygen pubkey
cat target/deploy/sss_oracle-keypair.json | solana-keygen pubkey
```

### Step 2: Initialize Stablecoin

```bash
# SSS-1: Minimal stablecoin
sss-token init \
  --preset sss-1 \
  --name "My Dollar" \
  --symbol "MYDOL" \
  --decimals 6 \
  --uri "https://example.com/metadata.json"

# SSS-2: Compliant stablecoin
sss-token init \
  --preset sss-2 \
  --name "Compliant USD" \
  --symbol "CUSD" \
  --decimals 6 \
  --uri "https://example.com/metadata.json"

# Initialize transfer hook (SSS-2 only)
sss-token compliance hook init

# SSS-3: Private stablecoin
sss-token init \
  --preset sss-3 \
  --name "Private Dollar" \
  --symbol "PDOL" \
  --decimals 6 \
  --auditor <auditor-elgamal-pubkey>
```

### Step 3: Configure Roles

```bash
# Update role assignments
sss-token roles update \
  --burner <burner-pubkey> \
  --pauser <pauser-pubkey> \
  --blacklister <compliance-officer-pubkey> \
  --seizer <compliance-officer-pubkey>

# Verify roles
sss-token roles show
```

### Step 4: Add Minters

```bash
# Add primary minter with 10M quota
sss-token minters add <minter-pubkey> --quota 10000000

# Add backup minter with 5M quota
sss-token minters add <backup-minter-pubkey> --quota 5000000

# Add unlimited minter (quota = 0)
sss-token minters add <unlimited-minter-pubkey> --quota 0

# Verify minters
sss-token minters list
```

### Step 5: Initialize Oracle (Optional)

```bash
# For non-USD pegged stablecoins
sss-token oracle init \
  --base EUR \
  --quote USD \
  --staleness 300 \
  --method median \
  --min-feeds 2 \
  --circuit-breaker 1000

# Add price feeds
sss-token oracle add-feed \
  --index 0 \
  --type switchboard \
  --address <switchboard-feed-pubkey> \
  --label "Switchboard EUR/USD"

sss-token oracle add-feed \
  --index 1 \
  --type pyth \
  --address <pyth-feed-pubkey> \
  --label "Pyth EUR/USD"
```

### Step 6: Deploy Backend Services

```bash
# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start services
docker compose up -d

# Verify services
curl http://localhost:3001/health  # mint-burn-service
curl http://localhost:3002/health  # event-indexer
curl http://localhost:3003/health  # compliance-service
curl http://localhost:3004/health  # webhook-service
```

### Step 7: Initialize Metaplex Metadata

```bash
# For wallet display compatibility
sss-token metadata init \
  --name "My Stablecoin" \
  --symbol "MYUSD" \
  --uri "https://arweave.net/..." \
  --mint-keypair <path-to-mint-keypair>
```

---

## Daily Operations

### Morning Checklist

```bash
# 1. Check system status
sss-token status

# 2. Verify total supply matches reserves
sss-token info supply

# 3. Check minter quotas
sss-token minters list

# 4. Review overnight activity
sss-token audit-log --since "24 hours ago" --limit 100

# 5. Check for alerts
curl http://localhost:3002/alerts

# 6. Verify backend services
docker compose ps

# 7. Check RPC endpoint health
solana cluster-version
```

### Minting Tokens

```bash
# Standard mint
sss-token mint <recipient-address> 1000

# Mint with specific minter
sss-token mint <recipient-address> 1000 --minter <minter-keypair>

# Batch mint (via API)
curl -X POST http://localhost:3001/mint \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "<address>",
    "amount": "1000000000",
    "minter": "<minter-pubkey>"
  }'
```

### Burning Tokens

```bash
# Burn from specific account
sss-token burn 500 --from <token-account-address>

# Burn with specific burner
sss-token burn 500 --from <token-account> --burner <burner-keypair>
```

### Monitoring Supply

```bash
# Check current supply
sss-token info supply

# View supply history
sss-token info supply --history

# Check against reserves
# Compare on-chain supply with off-chain reserves
# Ensure 1:1 backing
```

### Reviewing Activity

```bash
# View recent transactions
sss-token audit-log --limit 50

# Filter by action
sss-token audit-log --action mint --limit 20
sss-token audit-log --action burn --limit 20
sss-token audit-log --action blacklist --limit 10

# Export for reporting
sss-token audit-log --start 2024-01-01 --end 2024-01-31 --format csv > january_activity.csv
```

---

## Emergency Procedures

### Emergency Pause

Use when:
- Security incident detected
- Smart contract bug discovered
- Regulatory order received
- Reserve backing compromised

```bash
# Pause immediately
sss-token pause --reason "Security incident - investigating"

# Verify paused
sss-token status | grep paused

# Notify stakeholders
# - Send email to users
# - Post on status page
# - Alert team via Slack/PagerDuty

# Investigate issue
# - Review logs
# - Check transactions
# - Consult security team

# Resume when safe
sss-token unpause

# Post-incident report
# - Document timeline
# - Root cause analysis
# - Preventive measures
```

### Compromised Hot Wallet

```bash
# 1. Pause stablecoin
sss-token pause --reason "Compromised wallet detected"

# 2. Identify compromised wallet
# Review recent transactions
sss-token audit-log --limit 100

# 3. Remove compromised minter
sss-token minters remove <compromised-minter-pubkey>

# 4. Blacklist if unauthorized mints occurred
# Review unauthorized transactions
# Add affected addresses to blacklist if needed

# 5. Generate new wallet
solana-keygen new --outfile ~/.config/solana/new-minter.json

# 6. Add new minter
sss-token minters add <new-minter-pubkey> --quota 10000000

# 7. Update backend services
# Update environment variables
# Restart services

# 8. Unpause after verification
sss-token unpause

# 9. Incident report
# Document what happened
# How it was resolved
# Preventive measures
```

### Blacklist Emergency

```bash
# Immediate blacklist (court order, law enforcement)
sss-token blacklist add <address> \
  --reason "Court order #12345" \
  --emergency

# Freeze account simultaneously
sss-token freeze <token-account>

# Seize tokens if required
sss-token blacklist seize <from-account> \
  --to <treasury-account> \
  --amount <amount>

# Document everything
# - Legal order reference
# - Transaction signatures
# - Notification attempts
# - Timeline of actions
```

### RPC Endpoint Failure

```bash
# Switch to backup RPC
export SOLANA_RPC_URL=https://backup-rpc.example.com

# Verify connectivity
solana cluster-version

# Update backend services
# Edit docker-compose.yml or .env
# Restart services
docker compose restart

# Monitor for recovery
# Check primary RPC periodically
# Switch back when recovered
```

### Database Issues

```bash
# Check database status
docker compose logs postgres

# If corrupted, restore from backup
docker compose stop postgres
# Restore from latest backup
./scripts/restore-db.sh <backup-file>
docker compose start postgres

# Replay events from blockchain
# Re-index events since last backup
node services/indexer/replay-events.js --since <timestamp>

# Verify data integrity
node services/indexer/verify-integrity.js
```

---

## Monitoring

### Key Metrics

**On-Chain Metrics:**
```bash
# Total supply
sss-token info supply

# Number of holders
sss-token info holders --count

# Minter quota usage
sss-token minters list

# Blacklist size
sss-token blacklist list --count

# Recent activity
sss-token audit-log --since "1 hour ago" --count
```

**Off-Chain Metrics:**
```bash
# API health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health

# Queue depth
curl http://localhost:3001/metrics | grep queue_depth

# Event indexer lag
curl http://localhost:3002/metrics | grep indexer_lag

# Database connections
docker compose exec postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

### Alerting Rules

**Critical Alerts (Page immediately):**
- Stablecoin paused
- Master authority transfer initiated
- Large mint/burn (>$1M)
- Token seizure executed
- RPC endpoint down
- Database connection lost
- Event indexer stopped

**Warning Alerts (Email/Slack):**
- Minter approaching quota (>80%)
- High transaction failure rate (>5%)
- Event indexer lag (>30 seconds)
- API rate limit approaching (>80%)
- Disk space low (<20%)
- Unusual transaction pattern detected

### Dashboards

**Grafana Dashboard:**
```yaml
# Key panels
- Total Supply (time series)
- Mint/Burn Rate (gauge)
- Active Minters (stat)
- Blacklist Size (stat)
- Transaction Success Rate (gauge)
- API Response Time (time series)
- Event Indexer Lag (gauge)
- Database Query Time (time series)
```

**Custom Dashboard:**
```bash
# Launch interactive TUI
sss-token tui

# Features:
# - Real-time token info
# - Supply chart
# - Minters table
# - Activity log
# - Auto-refresh every 5s
```

---

## Maintenance

### Daily Tasks

```bash
# Morning checklist (see above)

# Review overnight activity
sss-token audit-log --since "24 hours ago"

# Check minter quotas
sss-token minters list

# Verify reserve backing
# Compare on-chain supply with off-chain reserves

# Review alerts
curl http://localhost:3002/alerts

# Check system health
docker compose ps
```

### Weekly Tasks

```bash
# Review blacklist
sss-token blacklist list
# Check for addresses that should be removed

# Audit minter activity
sss-token audit-log --action mint --since "7 days ago"

# Review large transactions
sss-token audit-log --min-amount 100000 --since "7 days ago"

# Database backup verification
./scripts/verify-backups.sh

# Security log review
docker compose logs --since 7d | grep -i "error\|warning"

# Update documentation
# Document any incidents
# Update runbooks if needed
```

### Monthly Tasks

```bash
# Generate attestation report
sss-token reports attestation --month $(date +%Y-%m)

# Review and rotate API keys
# Generate new keys
# Update services
# Revoke old keys

# Compliance report
sss-token audit-log --start $(date -d "1 month ago" +%Y-%m-01) --end $(date +%Y-%m-%d) --format csv

# Review role assignments
sss-token roles show
# Verify all roles are still appropriate

# Update dependencies
pnpm update
anchor build
# Test on devnet before deploying

# Security audit
# Review access logs
# Check for unauthorized access attempts
# Update security policies
```

### Quarterly Tasks

```bash
# Reserve attestation
# Independent CPA audit
# Publish attestation report

# Disaster recovery drill
# Test backup restoration
# Test failover procedures
# Document results

# Compliance training
# Train staff on new regulations
# Review policies
# Update procedures

# Performance review
# Analyze transaction throughput
# Optimize slow queries
# Review infrastructure costs
```

---

## Troubleshooting

### Transaction Failures

**Symptom:** Mint/burn transactions failing

```bash
# Check if paused
sss-token status | grep paused

# Check minter quota
sss-token minters list

# Check account status
solana account <token-account>

# Check RPC endpoint
solana cluster-version

# Review recent errors
sss-token audit-log --action mint --limit 20 | grep -i error

# Check compute units
# If hitting compute limit, optimize transaction
```

**Common Causes:**
- Stablecoin paused
- Minter quota exceeded
- Account frozen
- Insufficient SOL for fees
- RPC endpoint issues
- Network congestion

### Event Indexer Lag

**Symptom:** Events not appearing in database

```bash
# Check indexer status
curl http://localhost:3002/health

# Check indexer logs
docker compose logs event-indexer

# Check WebSocket connection
docker compose logs event-indexer | grep -i "websocket\|connection"

# Restart indexer
docker compose restart event-indexer

# If persistent, replay events
node services/indexer/replay-events.js --since <timestamp>
```

### High API Latency

**Symptom:** Slow API responses

```bash
# Check API metrics
curl http://localhost:3001/metrics

# Check database performance
docker compose exec postgres psql -U postgres -c "
  SELECT query, mean_exec_time, calls
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10;
"

# Check RPC latency
time solana cluster-version

# Scale horizontally if needed
docker compose up -d --scale api=3

# Optimize slow queries
# Add indexes
# Use caching (Redis)
```

### Blacklist Not Enforcing

**Symptom:** Blacklisted address can still transfer

```bash
# Verify blacklist entry exists
sss-token blacklist check <address>

# Verify transfer hook is initialized
solana account <extra-account-meta-list-pda>

# Check if SSS-2 enabled
sss-token status | grep enable_transfer_hook

# Re-initialize hook if needed
sss-token compliance hook init

# Test transfer
# Should fail with "SourceBlacklisted" or "DestinationBlacklisted"
```

### Oracle Price Issues

**Symptom:** Oracle prices stale or incorrect

```bash
# Check oracle status
sss-token oracle status

# Check feed status
sss-token oracle feeds

# Crank stale feeds
sss-token oracle crank 0 --price <price> --confidence <confidence>
sss-token oracle crank 1 --price <price> --confidence <confidence>

# Aggregate prices
sss-token oracle aggregate

# Check for circuit breaker
# If price change > max_price_change_bps, will reject

# Verify feed addresses
# Ensure Switchboard/Pyth feeds are correct
```

---

## Backup and Recovery

### Backup Strategy

**What to Backup:**
- Database (PostgreSQL)
- Configuration files
- Keypairs (encrypted)
- Audit logs
- Documentation

**Backup Schedule:**
- Database: Every 6 hours
- Configuration: On every change
- Audit logs: Daily
- Full system: Weekly

**Backup Script:**
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/$DATE"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker compose exec -T postgres pg_dump -U postgres stablecoin > $BACKUP_DIR/database.sql

# Backup configuration
cp -r .env docker-compose.yml $BACKUP_DIR/

# Backup audit logs
cp -r logs/ $BACKUP_DIR/logs/

# Compress
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR

# Upload to S3 (or other storage)
aws s3 cp $BACKUP_DIR.tar.gz s3://backups/stablecoin/

# Cleanup old backups (keep 30 days)
find /backups -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR.tar.gz"
```

### Recovery Procedures

**Database Recovery:**
```bash
# Stop services
docker compose stop

# Restore database
docker compose exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS stablecoin;"
docker compose exec -T postgres psql -U postgres -c "CREATE DATABASE stablecoin;"
docker compose exec -T postgres psql -U postgres stablecoin < backup/database.sql

# Replay events since backup
node services/indexer/replay-events.js --since <backup-timestamp>

# Verify integrity
node services/indexer/verify-integrity.js

# Start services
docker compose start
```

**Disaster Recovery:**
```bash
# 1. Provision new infrastructure
# 2. Restore from backups
# 3. Update DNS/load balancer
# 4. Verify all services
# 5. Resume operations
# 6. Post-mortem analysis
```

---

## Security Checklist

### Access Control

- [ ] Master authority on hardware wallet
- [ ] Hot wallets in KMS or secure enclave
- [ ] Role-based access control enforced
- [ ] Regular access reviews (quarterly)
- [ ] Multi-factor authentication enabled
- [ ] API keys rotated regularly
- [ ] Principle of least privilege applied

### Monitoring

- [ ] Real-time transaction monitoring
- [ ] Alert system configured
- [ ] Logs centralized and searchable
- [ ] Anomaly detection enabled
- [ ] Regular security log reviews
- [ ] Incident response plan documented
- [ ] On-call rotation established

### Compliance

- [ ] KYC/AML procedures documented
- [ ] Sanctions screening automated
- [ ] Blacklist regularly reviewed
- [ ] Audit trail maintained
- [ ] Regulatory reports filed on time
- [ ] Reserve attestations published
- [ ] Compliance training completed

### Infrastructure

- [ ] Backups automated and tested
- [ ] Disaster recovery plan documented
- [ ] Failover procedures tested
- [ ] RPC endpoints redundant
- [ ] Database replicated
- [ ] SSL/TLS everywhere
- [ ] Firewall rules configured

---

## Contact Information

### Emergency Contacts

**On-Call Engineer:**
- Phone: +1-XXX-XXX-XXXX
- Email: oncall@example.com
- PagerDuty: https://example.pagerduty.com

**Compliance Officer:**
- Phone: +1-XXX-XXX-XXXX
- Email: compliance@example.com

**Security Team:**
- Phone: +1-XXX-XXX-XXXX
- Email: security@example.com

### Vendor Contacts

**RPC Provider:**
- Support: support@rpc-provider.com
- Status: https://status.rpc-provider.com

**KYC Provider:**
- Support: support@kyc-provider.com
- Emergency: +1-XXX-XXX-XXXX

**Audit Firm:**
- Contact: partner@audit-firm.com
- Phone: +1-XXX-XXX-XXXX

---

## Appendix

### Useful Commands Reference

```bash
# Status and info
sss-token status
sss-token info supply
sss-token info holders
sss-token roles show
sss-token minters list

# Operations
sss-token mint <address> <amount>
sss-token burn <amount> --from <account>
sss-token freeze <account>
sss-token thaw <account>
sss-token pause
sss-token unpause

# Compliance
sss-token blacklist add <address> --reason "<reason>"
sss-token blacklist remove <address>
sss-token blacklist check <address>
sss-token blacklist seize <from> --to <to> --amount <amount>

# Oracle
sss-token oracle status
sss-token oracle feeds
sss-token oracle crank <index> --price <price> --confidence <confidence>
sss-token oracle aggregate
sss-token oracle price --side mint

# Audit
sss-token audit-log
sss-token audit-log --action mint,burn
sss-token audit-log --since "24 hours ago"
sss-token audit-log --start 2024-01-01 --end 2024-12-31

# Interactive
sss-token tui
```

### Configuration Files

**~/.config/sss-token/config.json:**
```json
{
  "network": "mainnet-beta",
  "rpcUrl": "https://api.mainnet-beta.solana.com",
  "keypairPath": "~/.config/solana/id.json",
  "mint": "SSSToken...",
  "programId": "7nFqXZae9mzYP7LefmCe9C1V2zzPbrY3nLR9WVGorQee",
  "transferHookProgramId": "HPksBobjquMqBfnCgpqBQDkomJ4HmGB1AbvJnemNBEig",
  "oracleProgramId": "GQp6UgyhLZP6zXRf24JH2BiwuoSAfYZruJ3WUPkqgj8X"
}
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: stablecoin
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  event-indexer:
    build: ./services/indexer
    environment:
      SOLANA_RPC_URL: ${SOLANA_RPC_URL}
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/stablecoin
    depends_on:
      - postgres

  api:
    build: ./services/api
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/stablecoin
      SOLANA_RPC_URL: ${SOLANA_RPC_URL}
    ports:
      - "3001:3001"
    depends_on:
      - postgres

volumes:
  postgres-data:
```
