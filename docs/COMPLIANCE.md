# Compliance Guide

## Overview

This guide provides comprehensive information on regulatory compliance for stablecoin issuers using the Solana Stablecoin Standard (SSS). It covers regulatory frameworks, implementation strategies, audit requirements, and best practices.

## Regulatory Context

SSS-2 is designed for issuers operating under various regulatory frameworks worldwide:

### United States
- **GENIUS Act** (Guiding and Establishing National Innovation for US Stablecoins)
  - Reserve requirements (1:1 backing)
  - Monthly attestations
  - Redemption rights
  - Issuer registration
  
- **OFAC Sanctions Compliance**
  - Specially Designated Nationals (SDN) list
  - Blocked persons and entities
  - Real-time screening requirements
  - Reporting obligations

- **FinCEN Regulations**
  - Bank Secrecy Act (BSA) compliance
  - Anti-Money Laundering (AML) programs
  - Know Your Customer (KYC) requirements
  - Suspicious Activity Reports (SARs)

### European Union
- **MiCA** (Markets in Crypto-Assets Regulation)
  - Authorization requirements for issuers
  - Reserve asset requirements
  - Redemption rights at par value
  - White paper publication
  - Ongoing supervision

### Other Jurisdictions
- **Singapore MAS**: Payment Services Act
- **UK FCA**: E-money regulations
- **Hong Kong HKMA**: Stablecoin regulatory framework
- **Japan FSA**: Payment Services Act

---

## Compliance Architecture

### Three-Layer Model

```
┌─────────────────────────────────────────────────────────┐
│  Layer 3: Regulatory Reporting                          │
│  - Monthly attestations                                 │
│  - SAR filings                                          │
│  - Regulator dashboards                                 │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────┐
│  Layer 2: Off-Chain Screening                           │
│  - KYC/AML verification                                 │
│  - Sanctions screening (OFAC, UN, EU)                   │
│  - Transaction monitoring                               │
│  - Risk scoring                                         │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────┐
│  Layer 1: On-Chain Enforcement                          │
│  - Blacklist PDAs (unforgeable)                         │
│  - Transfer hook (runtime-enforced)                     │
│  - Token seizure (permanent delegate)                   │
│  - Immutable audit trail (events)                       │
└─────────────────────────────────────────────────────────┘
```

### Integration Points

The compliance service (`services/compliance-service`) bridges off-chain screening and on-chain enforcement:

```typescript
// External sanctions API → Compliance Service → On-Chain
POST /api/compliance/blacklist
  → Verify API key
  → Validate address
  → Call SDK: stablecoin.compliance.blacklistAdd()
  → Log to audit trail
  → Notify webhooks
  → Return transaction signature
```

---

## Blacklisting Workflow

### Standard Process

```
1. Transaction Monitoring
   - Real-time transaction analysis
   - Pattern detection (structuring, layering)
   - Velocity checks
   - Geographic risk assessment

2. Sanctions Screening
   - Check against OFAC SDN list
   - Check against UN sanctions list
   - Check against EU sanctions list
   - Third-party screening (Chainalysis, TRM Labs, Elliptic)

3. Risk Assessment
   - Assign risk score (low/medium/high)
   - Review by compliance officer
   - Document decision rationale

4. On-Chain Enforcement
   POST /blacklist { address, reason: "OFAC SDN match" }
   → Creates BlacklistEntry PDA
   → Emits AddedToBlacklist event
   → Transfer hook blocks all transfers

5. Notification
   - Alert account holder (if possible)
   - Document notification attempt
   - Provide appeal process information

6. Ongoing Monitoring
   - Review blacklist quarterly
   - Check for delisting from sanctions lists
   - Process appeals

7. Removal (if cleared)
   DELETE /blacklist/:address
   → Closes BlacklistEntry PDA
   → Emits RemovedFromBlacklist event
   → Reclaims rent
```

### Emergency Blacklisting

For urgent cases (court orders, law enforcement requests):

```bash
# Immediate blacklist
sss-token blacklist add <address> --reason "Court order #12345" --emergency

# Freeze account simultaneously
sss-token freeze <token-account>

# Seize tokens if required
sss-token blacklist seize <from-account> --to <treasury> --amount <amount>
```

---

## Token Seizure

Token seizure uses the **permanent delegate** extension. The designated `seizer` role can transfer tokens from any account without the account owner's signature.

### Legal Basis

Seizure should only be performed under:
- Court orders
- Law enforcement requests
- Regulatory directives
- Terms of service violations (with proper notice)

### Seizure Process

```
1. Receive Legal Order
   - Verify authenticity
   - Document order details
   - Confirm jurisdiction

2. Internal Review
   - Legal team approval
   - Compliance officer sign-off
   - Document decision

3. Execute Seizure
   sss-token blacklist seize <from-token-account> \
     --to <treasury-token-account> \
     --amount <amount> \
     --reference "Court Order #12345"

4. Documentation
   - Record transaction signature
   - Store legal order
   - Update case management system

5. Notification
   - Notify account holder
   - Provide appeal information
   - Document notification

6. Reporting
   - Report to requesting authority
   - Update internal audit log
   - Quarterly review
```

### Seizure Limits

Best practices:
- Seize only the amount specified in legal order
- Do not seize more than necessary
- Maintain detailed records
- Provide clear appeal process

---

## Audit Trail

### Event Types

All compliance-related events are logged on-chain:

```typescript
// Blacklist events
AddedToBlacklist {
  mint: PublicKey,
  address: PublicKey,
  reason: String,
  blacklister: PublicKey,
  timestamp: i64,
}

RemovedFromBlacklist {
  mint: PublicKey,
  address: PublicKey,
  blacklister: PublicKey,
  timestamp: i64,
}

// Seizure events
TokensSeized {
  mint: PublicKey,
  from_account: PublicKey,
  to_account: PublicKey,
  amount: u64,
  seizer: PublicKey,
  timestamp: i64,
}

// Account freeze events
AccountFrozen {
  mint: PublicKey,
  token_account: PublicKey,
  authority: PublicKey,
  timestamp: i64,
}

AccountThawed {
  mint: PublicKey,
  token_account: PublicKey,
  authority: PublicKey,
  timestamp: i64,
}
```

### Exporting Audit Logs

```bash
# Export all compliance events
sss-token audit-log --action blacklist,seize,freeze,thaw --format csv > compliance_audit.csv

# Export for specific date range
sss-token audit-log --start 2024-01-01 --end 2024-12-31 --format json > annual_report.json

# Export via API
curl http://localhost:3003/audit?action=blacklist&start=2024-01-01 | jq > audit.json
```

### Audit Log Format

```json
{
  "signature": "5XK7mN...",
  "event": "AddedToBlacklist",
  "mint": "SSSToken...",
  "data": {
    "address": "BadActor...",
    "reason": "OFAC SDN match - Entity #12345",
    "blacklister": "ComplianceOfficer...",
    "timestamp": 1711234567
  },
  "blockTime": 1711234567,
  "slot": 123456789
}
```

---

## KYC/AML Integration

### User Onboarding Flow

```
1. User Registration
   - Collect personal information
   - Verify email/phone
   - Generate wallet address

2. Identity Verification
   - Document upload (passport, driver's license)
   - Liveness check (selfie)
   - Address verification
   - Third-party KYC provider (Onfido, Jumio, Sumsub)

3. Risk Assessment
   - PEP (Politically Exposed Person) check
   - Sanctions screening
   - Adverse media screening
   - Risk score assignment

4. Approval/Rejection
   - Compliance officer review (for high-risk)
   - Automated approval (for low-risk)
   - Document decision

5. Ongoing Monitoring
   - Periodic re-verification (annual)
   - Transaction monitoring
   - Behavior analysis
   - Risk score updates
```

### Integration Example

```typescript
// KYC provider webhook
app.post('/webhooks/kyc', async (req, res) => {
  const { userId, status, riskScore, walletAddress } = req.body;
  
  if (status === 'approved' && riskScore < 70) {
    // Low risk - auto-approve
    await db.users.update(userId, { kycStatus: 'approved' });
  } else if (status === 'approved' && riskScore >= 70) {
    // High risk - manual review
    await db.users.update(userId, { kycStatus: 'pending_review' });
    await notifyComplianceTeam(userId);
  } else if (status === 'rejected') {
    // Rejected - blacklist if necessary
    await db.users.update(userId, { kycStatus: 'rejected' });
    if (walletAddress) {
      await stablecoin.compliance.blacklistAdd(
        new PublicKey(walletAddress),
        'KYC verification failed',
        blacklisterKeypair
      );
    }
  }
  
  res.json({ success: true });
});
```

---

## Transaction Monitoring

### Monitoring Rules

Implement automated rules to detect suspicious activity:

```typescript
// Large transaction threshold
if (amount > 10000) {
  await flagForReview(transaction, 'Large transaction');
}

// Rapid succession (structuring)
const recentTxs = await getRecentTransactions(address, '24h');
if (recentTxs.length > 10 && totalAmount(recentTxs) > 50000) {
  await flagForReview(transaction, 'Possible structuring');
}

// Geographic risk
if (isHighRiskJurisdiction(userCountry)) {
  await flagForReview(transaction, 'High-risk jurisdiction');
}

// Velocity check
const dailyVolume = await getDailyVolume(address);
if (dailyVolume > userLimit) {
  await flagForReview(transaction, 'Velocity limit exceeded');
}

// Sanctions screening
const screeningResult = await screenAddress(address);
if (screeningResult.match) {
  await blacklistAddress(address, screeningResult.reason);
  await rejectTransaction(transaction);
}
```

### Suspicious Activity Reports (SARs)

When to file a SAR:
- Transactions over $10,000 (or equivalent) with no clear business purpose
- Patterns consistent with money laundering
- Transactions involving sanctioned entities
- Structuring (breaking large amounts into smaller transactions)
- Unusual transaction patterns

SAR filing process:
1. Detect suspicious activity
2. Investigate and document
3. Compliance officer review
4. File SAR with FinCEN (US) or equivalent authority
5. Do not notify the subject (tipping off is illegal)
6. Maintain records for 5 years

---

## Reserve Management

### Reserve Requirements

Most jurisdictions require 1:1 backing:
- 1 stablecoin = 1 unit of fiat currency
- Held in segregated accounts
- Audited regularly
- Redeemable on demand

### Acceptable Reserve Assets

**Tier 1 (Highest Quality):**
- Cash in FDIC-insured accounts
- US Treasury bills (< 3 months maturity)
- Central bank reserves

**Tier 2 (High Quality):**
- US Treasury bills (3-12 months maturity)
- Repurchase agreements (overnight)
- Money market funds (government-only)

**Not Acceptable:**
- Corporate bonds
- Equities
- Cryptocurrencies
- Real estate
- Loans

### Attestation Requirements

Monthly attestations must include:
- Total stablecoin supply (on-chain)
- Total reserve assets (off-chain)
- Breakdown by asset type
- Attestation by independent CPA
- Published publicly

Example attestation:

```
ATTESTATION REPORT
Month: December 2024
Stablecoin: CUSD (Compliant USD)

Total Supply (on-chain): 100,000,000 CUSD
Total Reserves (off-chain): $100,000,000

Reserve Breakdown:
- Cash (FDIC-insured): $50,000,000 (50%)
- US Treasury Bills (<3mo): $40,000,000 (40%)
- US Treasury Bills (3-12mo): $10,000,000 (10%)

Attestation: We have examined the reserve assets and confirm
they are sufficient to back the outstanding stablecoin supply
at a 1:1 ratio as of December 31, 2024.

Signed: [CPA Firm Name]
Date: January 5, 2025
```

---

## Redemption Process

### User-Initiated Redemption

```
1. User Request
   - Submit redemption request via web interface
   - Specify amount and bank account
   - Confirm identity

2. Compliance Check
   - Verify KYC status
   - Check for pending investigations
   - Sanctions screening

3. Burn Tokens
   sss-token burn <amount> --from <user-token-account>

4. Fiat Transfer
   - Initiate wire transfer or ACH
   - Deduct from reserve account
   - Provide transaction reference

5. Confirmation
   - Notify user of completion
   - Update internal records
   - Log for audit trail
```

### Redemption Limits

Implement reasonable limits:
- Daily limit: $50,000 per user
- Monthly limit: $500,000 per user
- Instant redemption: Up to $10,000
- Large redemptions (>$100,000): 1-3 business days

---

## Regulatory Reporting

### Required Reports

**United States:**
- Currency Transaction Reports (CTRs) - transactions > $10,000
- Suspicious Activity Reports (SARs) - suspicious activity
- OFAC reporting - blocked transactions
- FinCEN 114 (FBAR) - foreign accounts > $10,000

**European Union:**
- Transaction reports to FIU (Financial Intelligence Unit)
- MiCA quarterly reports
- Annual audit reports
- White paper updates

### Report Generation

```bash
# Generate CTR report
sss-token reports ctr --start 2024-01-01 --end 2024-01-31

# Generate SAR data
sss-token reports sar --case-id 12345

# Generate monthly attestation data
sss-token reports attestation --month 2024-12

# Export for regulator
sss-token reports export --type all --format xml --output regulator_report.xml
```

---

## Compliance Team Structure

### Recommended Roles

**Chief Compliance Officer (CCO)**
- Overall compliance strategy
- Regulatory relationships
- Board reporting
- Final decision authority

**AML/KYC Manager**
- KYC process oversight
- AML program management
- Staff training
- Policy development

**Sanctions Compliance Officer**
- OFAC screening
- Blacklist management
- Sanctions updates
- Government liaison

**Transaction Monitoring Analyst**
- Daily transaction review
- Alert investigation
- SAR preparation
- Pattern analysis

**Compliance Operations**
- User support
- Document management
- Report generation
- System administration

### Minimum Staffing

- Small operation (<$10M supply): 2-3 people
- Medium operation ($10M-$100M): 5-10 people
- Large operation (>$100M): 10+ people

---

## Technology Requirements

### Compliance Systems

**Required:**
- KYC/AML platform (Onfido, Jumio, Sumsub)
- Sanctions screening (Chainalysis, TRM Labs, Elliptic)
- Transaction monitoring system
- Case management system
- Audit log storage (7+ years)

**Recommended:**
- Risk scoring engine
- Automated alert system
- Regulatory reporting tools
- Document management system
- Secure communication platform

### Data Retention

| Data Type | Retention Period |
|-----------|------------------|
| KYC documents | 5 years after account closure |
| Transaction records | 7 years |
| SARs | 5 years |
| Audit logs | 7 years |
| Blacklist records | Permanent |
| Seizure records | Permanent |
| Communications | 7 years |

---

## Best Practices

### Operational

1. **Segregation of Duties**
   - Separate blacklister and seizer roles
   - Require dual approval for large seizures
   - Rotate compliance staff periodically

2. **Regular Training**
   - Annual AML/KYC training for all staff
   - Quarterly updates on new regulations
   - Sanctions list training
   - Incident response drills

3. **Documentation**
   - Document all compliance decisions
   - Maintain detailed case files
   - Record all communications
   - Regular policy reviews

4. **Independent Audits**
   - Annual compliance audit
   - Quarterly reserve attestations
   - Penetration testing
   - Smart contract audits

5. **Incident Response**
   - Documented incident response plan
   - Regular drills
   - Clear escalation procedures
   - Post-incident reviews

### Technical

1. **Access Control**
   - Hardware wallets for master authority
   - Multi-signature for sensitive operations
   - Role-based access control
   - Regular access reviews

2. **Monitoring**
   - Real-time transaction monitoring
   - Alert system for suspicious activity
   - Dashboard for compliance team
   - Automated reporting

3. **Backup and Recovery**
   - Daily database backups
   - Disaster recovery plan
   - Regular recovery drills
   - Off-site backup storage

4. **Security**
   - Encryption at rest and in transit
   - Regular security audits
   - Penetration testing
   - Bug bounty program

---

## Common Pitfalls

### Avoid These Mistakes

1. **Insufficient KYC**
   - Don't skip verification for "small" users
   - Don't rely solely on automated checks
   - Don't ignore red flags

2. **Delayed Blacklisting**
   - Don't wait to blacklist sanctioned entities
   - Don't ignore screening alerts
   - Don't delay enforcement

3. **Poor Documentation**
   - Don't make decisions without documentation
   - Don't delete records prematurely
   - Don't fail to document exceptions

4. **Inadequate Training**
   - Don't assume staff know regulations
   - Don't skip annual training
   - Don't ignore new regulations

5. **Weak Monitoring**
   - Don't rely only on automated systems
   - Don't ignore manual review
   - Don't miss pattern analysis

---

## Regulatory Resources

### United States
- FinCEN: https://www.fincen.gov
- OFAC: https://home.treasury.gov/policy-issues/office-of-foreign-assets-control-sanctions-programs-and-information
- SEC: https://www.sec.gov

### European Union
- ESMA: https://www.esma.europa.eu
- EBA: https://www.eba.europa.eu

### International
- FATF: https://www.fatf-gafi.org
- Basel Committee: https://www.bis.org/bcbs

### Industry Associations
- Blockchain Association: https://theblockchainassociation.org
- Chamber of Digital Commerce: https://digitalchamber.org

---

## Contact Information

For compliance-related questions:
- Email: compliance@example.com
- Emergency: +1-XXX-XXX-XXXX
- Mailing Address: [Your Address]

For regulatory inquiries:
- Chief Compliance Officer: [Name]
- Email: cco@example.com
