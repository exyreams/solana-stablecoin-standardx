# SSS Token CLI

Command-line interface for managing Solana Stablecoin Standard (SSS) tokens.

## Installation

### From Source
```bash
# Clone repository
git clone https://github.com/exyreams/solana-stablecoin-standard.git
cd solana-stablecoin-standard

# Install dependencies and build
pnpm install
pnpm build

# Run CLI
node packages/cli/dist/index.js --version
```

### Global Install (Future)
```bash
npm install -g @stbr/sss-token-cli
sss-token --version
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:
```env
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_KEYPAIR_PATH=~/.config/solana/id.json
STABLECOIN_MINT=<your_mint_address>
```

### Command-Line Options

Override environment variables with flags:
```bash
sss-token status \
  --url https://api.mainnet-beta.solana.com \
  --keypair /path/to/keypair.json \
  --mint 2qfDMPMeK6SmyK9DPi8Pe8y1rjHJZFASDREw5K2frVag
```

## Quick Start

### 1. Initialize a Stablecoin
```bash
# SSS-1 (Minimal)
sss-token init --name "My Token" --symbol "MTK" --preset sss-1

# SSS-2 (Compliant)
sss-token init \
  --name "My USD" \
  --symbol "MUSD" \
  --preset sss-2 \
  --transfer-hook-program HPksBobjquMqBfnCgpqBQDkomJ4HmGB1AbvJnemNBEig

# SSS-3 (Private)
sss-token init --name "Private Token" --symbol "PTK" --preset sss-3
```

### 2. Set Default Mint
```bash
export STABLECOIN_MINT=<mint_address_from_init>
```

### 3. Add Minter
```bash
sss-token minters add <MINTER_ADDRESS> --quota 1000000
```

### 4. Mint Tokens
```bash
sss-token mint <RECIPIENT_ADDRESS> 1000
```

### 5. Monitor with TUI
```bash
sss-token tui
```

## Core Commands

### Initialization
- `init` - Create new stablecoin
- `metadata init` - Add Metaplex metadata

### Supply Management
- `mint <recipient> <amount>` - Mint tokens
- `burn <amount> --from <account>` - Burn tokens
- `supply` - Check total supply

### Compliance
- `pause` / `unpause` - Global pause
- `freeze <account>` / `thaw <account>` - Account freeze
- `blacklist add/remove/check` - SSS-2 blacklist
- `seize` - Asset seizure (SSS-2)
- `hook init` - Initialize transfer hook (SSS-2)

### Administration
- `roles show/update` - Manage roles
- `minters list/add/update/remove` - Manage minters
- `status` - View complete status
- `holders` - List token holders

### Oracle (Non-USD Pegs)
- `oracle init` - Initialize oracle
- `oracle add-feed` - Add price feed
- `oracle crank` - Update feed price
- `oracle price` - Get current price

### Privacy (SSS-3)
- `privacy approve` - Approve confidential transfers
- `privacy enable-credits` - Enable receiving
- `privacy disable-credits` - Disable receiving

### Monitoring
- `audit-log` - View transaction history
- `tui` - Launch terminal UI

## Examples

### Complete Workflow
```bash
# 1. Initialize SSS-2 stablecoin
sss-token init \
  --name "Verification Dollar" \
  --symbol "VUSD" \
  --preset sss-2 \
  --transfer-hook-program HPksBobjquMqBfnCgpqBQDkomJ4HmGB1AbvJnemNBEig

# 2. Set as default
export STABLECOIN_MINT=<mint_address>

# 3. Initialize transfer hook
sss-token hook init

# 4. Add metadata
sss-token metadata init \
  --name "Verification Dollar" \
  --symbol "VUSD" \
  --uri "https://arweave.net/metadata.json" \
  --mint-keypair ./mint-keypair.json

# 5. Add minter
sss-token minters add Cpj1RneABzEthffn7V7iC4Jquy1ZqYpvD9HXXooPMFgi --quota 5000000

# 6. Mint tokens
sss-token mint Cpj1RneABzEthffn7V7iC4Jquy1ZqYpvD9HXXooPMFgi 1000

# 7. Check status
sss-token status

# 8. Monitor with TUI
sss-token tui
```

### Compliance Operations
```bash
# Blacklist an address
sss-token blacklist add <ADDRESS> --reason "Suspected fraud"

# Check blacklist status
sss-token blacklist check <ADDRESS>

# Seize tokens
sss-token seize <FROM_ACCOUNT> --to <TREASURY> --amount 500

# Freeze account
sss-token freeze <TOKEN_ACCOUNT>
```

### Oracle Setup
```bash
# Initialize EUR/USD oracle
sss-token oracle init --base EUR --quote USD

# Add manual feed
sss-token oracle add-feed \
  --index 0 \
  --type manual \
  --address 11111111111111111111111111111111 \
  --label "Manual EUR/USD"

# Update price (1.085 EUR/USD)
sss-token oracle crank 0 --price 1085000000

# Get current price
sss-token oracle price --side mint
```

## Documentation

- [Complete CLI Testing Guide](../../docs/testing/CLI_TEST.md)
- [SSS-1 Specification](../../docs/SSS-1.md)
- [SSS-2 Specification](../../docs/SSS-2.md)
- [SSS-3 Specification](../../docs/SSS-3.md)
- [Oracle Integration](../../docs/SSS-Oracle.md)
- [SDK Reference](../../docs/SDK.md)

## Troubleshooting

### "No mint address provided"
Set the `STABLECOIN_MINT` environment variable or use `--mint` flag.

### "Insufficient funds"
Ensure your wallet has enough SOL for transaction fees and rent.

### "Protocol is paused"
Unpause the protocol: `sss-token unpause`

### "Transfer hook not initialized"
For SSS-2, run: `sss-token hook init`

See [Troubleshooting Guide](../../docs/testing/CLI_TEST.md#troubleshooting) for more.

## Support

- GitHub: https://github.com/exyreams/solana-stablecoin-standard
- Issues: https://github.com/exyreams/solana-stablecoin-standard/issues
- Documentation: https://github.com/exyreams/solana-stablecoin-standard/tree/main/docs

## License

MIT
