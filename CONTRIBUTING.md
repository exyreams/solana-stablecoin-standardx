# Contributing to Solana Stablecoin Standard

Thank you for your interest in contributing to the Solana Stablecoin Standard! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [How to Contribute](#how-to-contribute)
5. [Pull Request Process](#pull-request-process)
6. [Coding Standards](#coding-standards)
7. [Testing Guidelines](#testing-guidelines)
8. [Documentation](#documentation)
9. [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to conduct@example.com.

## Getting Started

### Prerequisites

- **Rust**: 1.75.0 or later
- **Solana CLI**: 1.18.0 or later
- **Anchor CLI**: 0.32.1
- **Node.js**: 18.0.0 or later
- **pnpm**: 8.0.0 or later
- **Git**: 2.0.0 or later

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/solana-stablecoin-standard.git
   cd solana-stablecoin-standard
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/solanabr/solana-stablecoin-standard.git
   ```

## Development Setup

### Install Dependencies

```bash
# Install Node.js dependencies
pnpm install

# Build Anchor programs
anchor build

# Build TypeScript packages
pnpm build
```

### Run Tests

```bash
# Run all tests
pnpm test

# Run Anchor tests
anchor test

# Run SDK tests
pnpm test:sdk

# Run CLI tests
pnpm test:cli

# Run fuzz tests
cd trident-tests && trident fuzz run
```

### Start Local Development

```bash
# Terminal 1: Start local validator
solana-test-validator

# Terminal 2: Deploy programs
anchor deploy

# Terminal 3: Start backend services
docker compose up

# Terminal 4: Start web dashboard
cd packages/web && pnpm dev
```

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check the [issue tracker](https://github.com/solanabr/solana-stablecoin-standard/issues) to avoid duplicates.

When creating a bug report, include:
- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected behavior** vs **actual behavior**
- **Environment details** (OS, Solana version, Anchor version, etc.)
- **Code samples** or **error messages** if applicable
- **Screenshots** if relevant

Use the bug report template:

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Environment:**
 - OS: [e.g. Ubuntu 22.04]
 - Solana CLI: [e.g. 1.18.0]
 - Anchor: [e.g. 0.32.1]
 - Node.js: [e.g. 18.19.0]

**Additional context**
Add any other context about the problem here.
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title and description**
- **Use case** - why is this enhancement needed?
- **Proposed solution** - how should it work?
- **Alternatives considered**
- **Additional context** - mockups, examples, etc.

### Contributing Code

1. **Find an issue** to work on or create a new one
2. **Comment on the issue** to let others know you're working on it
3. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes** following our [coding standards](#coding-standards)
5. **Write tests** for your changes
6. **Update documentation** if needed
7. **Commit your changes** with clear commit messages
8. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
9. **Create a Pull Request** on GitHub

## Pull Request Process

### Before Submitting

- [ ] Code follows the project's coding standards
- [ ] All tests pass (`pnpm test`)
- [ ] New tests added for new functionality
- [ ] Documentation updated if needed
- [ ] Commit messages are clear and descriptive
- [ ] No merge conflicts with `main`
- [ ] Code has been formatted (`pnpm format`)
- [ ] Linting passes (`pnpm lint`)

### PR Title Format

Use conventional commits format:

```
<type>(<scope>): <description>

Examples:
feat(sdk): add oracle price aggregation
fix(cli): resolve minter quota display issue
docs(readme): update installation instructions
test(programs): add fuzz tests for blacklist
refactor(web): simplify dashboard component
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Adding or updating tests
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### PR Description Template

```markdown
## Description
Brief description of the changes.

## Motivation
Why is this change needed? What problem does it solve?

## Changes
- List of changes made
- Another change
- Yet another change

## Testing
How has this been tested?
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Checklist
- [ ] My code follows the project's coding standards
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published
```

### Review Process

1. **Automated checks** must pass (CI/CD, linting, tests)
2. **Code review** by at least one maintainer
3. **Address feedback** and make requested changes
4. **Approval** from maintainer(s)
5. **Merge** by maintainer

## Coding Standards

### Rust (Programs)

Follow standard Rust conventions:

```rust
// Use descriptive names
pub fn add_to_blacklist(ctx: Context<AddToBlacklist>, reason: String) -> Result<()> {
    // Validate inputs
    require!(!reason.is_empty(), ErrorCode::InvalidReason);
    
    // Business logic
    let blacklist_entry = &mut ctx.accounts.blacklist_entry;
    blacklist_entry.mint = ctx.accounts.mint.key();
    blacklist_entry.address = ctx.accounts.target.key();
    blacklist_entry.reason = reason;
    blacklist_entry.timestamp = Clock::get()?.unix_timestamp;
    
    // Emit event
    emit!(AddedToBlacklist {
        mint: blacklist_entry.mint,
        address: blacklist_entry.address,
        reason: blacklist_entry.reason.clone(),
        blacklister: ctx.accounts.blacklister.key(),
        timestamp: blacklist_entry.timestamp,
    });
    
    Ok(())
}
```

**Guidelines:**
- Use `rustfmt` for formatting
- Use `clippy` for linting
- Add doc comments for public items
- Use descriptive variable names
- Keep functions focused and small
- Handle errors explicitly
- Emit events for state changes

### TypeScript (SDK, CLI, Web)

Follow project conventions:

```typescript
// Use descriptive names and types
async function blacklistAdd(
  address: PublicKey,
  reason: string,
  blacklister: Keypair
): Promise<string> {
  // Validate inputs
  if (!reason || reason.trim().length === 0) {
    throw new Error('Reason cannot be empty');
  }
  
  // Derive PDAs
  const [statePda] = deriveStablecoinState(this.mint, this.program.programId);
  const [rolesPda] = deriveRolesConfig(this.mint, this.program.programId);
  const [entryPda] = deriveBlacklistEntry(
    this.mint,
    address,
    this.program.programId
  );
  
  // Execute instruction
  return (this.program.methods as any)
    .addToBlacklist(reason)
    .accounts({
      blacklister: blacklister.publicKey,
      stablecoinState: statePda,
      rolesConfig: rolesPda,
      target: address,
      blacklistEntry: entryPda,
    })
    .signers([blacklister])
    .rpc();
}
```

**Guidelines:**
- Use Biome for formatting and linting
- Use TypeScript strict mode
- Add JSDoc comments for public APIs
- Use descriptive variable names
- Keep functions focused and small
- Handle errors explicitly
- Use async/await over promises
- Prefer const over let

### Code Formatting

```bash
# Format all code
pnpm format

# Check formatting
pnpm format:check

# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix
```

## Testing Guidelines

### Unit Tests

Write unit tests for all new functionality:

```typescript
// SDK test example
describe('ComplianceModule', () => {
  it('should add address to blacklist', async () => {
    const address = Keypair.generate().publicKey;
    const reason = 'Test blacklist';
    
    await stablecoin.compliance.blacklistAdd(
      address,
      reason,
      blacklisterKeypair
    );
    
    const isBlacklisted = await stablecoin.compliance.isBlacklisted(address);
    expect(isBlacklisted).to.be.true;
    
    const entry = await stablecoin.compliance.getBlacklistEntry(address);
    expect(entry?.reason).to.equal(reason);
  });
});
```

### Integration Tests

Test interactions between components:

```typescript
// Anchor test example
it('Blacklisted address cannot transfer', async () => {
  // Add to blacklist
  await program.methods
    .addToBlacklist('Test')
    .accounts({...})
    .rpc();
  
  // Attempt transfer (should fail)
  try {
    await transfer(...);
    assert.fail('Transfer should have failed');
  } catch (err) {
    assert.include(err.message, 'SourceBlacklisted');
  }
});
```

### Fuzz Tests

Add fuzz tests for critical functions:

```rust
// Trident fuzz test example
#[fuzz_test]
fn fuzz_mint(amount: u64, quota: u64) {
    // Setup
    let mut accounts = initialize_accounts();
    
    // Set quota
    accounts.minter_quota.quota = quota;
    accounts.minter_quota.minted = 0;
    
    // Execute
    let result = mint(&accounts, amount);
    
    // Verify
    if amount <= quota {
        assert!(result.is_ok());
        assert_eq!(accounts.minter_quota.minted, amount);
    } else {
        assert!(result.is_err());
    }
}
```

### Test Coverage

Aim for:
- **Programs**: >80% coverage
- **SDK**: >90% coverage
- **CLI**: >70% coverage

Check coverage:
```bash
# Rust coverage
cargo tarpaulin --out Html

# TypeScript coverage
pnpm test:coverage
```

## Documentation

### Code Documentation

Add doc comments for all public APIs:

```rust
/// Adds an address to the blacklist.
///
/// # Arguments
/// * `ctx` - The instruction context
/// * `reason` - The reason for blacklisting (max 200 characters)
///
/// # Errors
/// * `Unauthorized` - Caller is not the blacklister
/// * `InvalidReason` - Reason is empty or too long
/// * `AlreadyBlacklisted` - Address is already blacklisted
///
/// # Events
/// Emits `AddedToBlacklist` event on success
pub fn add_to_blacklist(ctx: Context<AddToBlacklist>, reason: String) -> Result<()> {
    // Implementation
}
```

```typescript
/**
 * Add an address to the on-chain blacklist.
 * 
 * After this call, any transfer to/from this address will be rejected
 * by the transfer hook program.
 * 
 * @param address - The address to blacklist
 * @param reason - The reason for blacklisting (stored on-chain)
 * @param blacklister - The blacklister keypair (must have blacklister role)
 * @returns Transaction signature
 * 
 * @throws {Error} If caller lacks blacklister role
 * @throws {Error} If address is already blacklisted
 * 
 * @example
 * ```typescript
 * await stablecoin.compliance.blacklistAdd(
 *   suspiciousAddress,
 *   'OFAC sanctions match',
 *   blacklisterKeypair
 * );
 * ```
 */
async blacklistAdd(
  address: PublicKey,
  reason: string,
  blacklister: Keypair
): Promise<string> {
  // Implementation
}
```

### User Documentation

Update relevant documentation:
- **README.md**: High-level overview
- **docs/SDK.md**: SDK API reference
- **docs/CLI.md**: CLI command reference
- **docs/ARCHITECTURE.md**: Architecture details
- **docs/OPERATIONS.md**: Operational procedures

### Changelog

Update `CHANGELOG.md` with your changes:

```markdown
## [Unreleased]

### Added
- Oracle price aggregation with multiple feeds
- Metaplex metadata integration for wallet display

### Changed
- Improved error messages for quota exceeded
- Updated dependencies to latest versions

### Fixed
- Fixed blacklist check in transfer hook
- Resolved minter quota display issue in CLI

### Security
- Added circuit breaker for oracle price changes
```

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and discussions
- **Discord**: Real-time chat and support
- **Twitter**: Announcements and updates

### Getting Help

- Check the [documentation](docs/)
- Search [existing issues](https://github.com/solanabr/solana-stablecoin-standard/issues)
- Ask in [GitHub Discussions](https://github.com/solanabr/solana-stablecoin-standard/discussions)
- Join our [Discord server](https://discord.gg/superteambrasil)

### Recognition

Contributors are recognized in:
- `CONTRIBUTORS.md` file
- Release notes
- Project README
- Social media shoutouts

## License

By contributing to this project, you agree that your contributions will be licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Questions?

If you have questions about contributing, please:
1. Check this guide
2. Search existing issues and discussions
3. Ask in Discord
4. Create a GitHub Discussion

Thank you for contributing to the Solana Stablecoin Standard! 🚀
