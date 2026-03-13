import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
	ASSOCIATED_TOKEN_PROGRAM_ID,
	createAssociatedTokenAccountInstruction,
	getAssociatedTokenAddressSync,
	TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import {
	Keypair,
	PublicKey,
	SystemProgram,
	Transaction,
} from "@solana/web3.js";
import { SssToken } from "../../target/types/sss_token";
import { airdrop } from "./common";

// Declare Buffer for Node.js environment
declare const Buffer: {
	from(data: string | Uint8Array | number[]): Uint8Array;
};

// ── PDA derivation ─────────────────────────────────────────

export function findStablecoinStatePda(
	mint: PublicKey,
	programId: PublicKey,
): [PublicKey, number] {
	return PublicKey.findProgramAddressSync(
		[Buffer.from("stablecoin_state"), mint.toBuffer()],
		programId,
	);
}

export function findRolesConfigPda(
	mint: PublicKey,
	programId: PublicKey,
): [PublicKey, number] {
	return PublicKey.findProgramAddressSync(
		[Buffer.from("roles_config"), mint.toBuffer()],
		programId,
	);
}

export function findMinterQuotaPda(
	mint: PublicKey,
	minter: PublicKey,
	programId: PublicKey,
): [PublicKey, number] {
	return PublicKey.findProgramAddressSync(
		[Buffer.from("minter_quota"), mint.toBuffer(), minter.toBuffer()],
		programId,
	);
}

export function findBlacklistEntryPda(
	mint: PublicKey,
	address: PublicKey,
	programId: PublicKey,
): [PublicKey, number] {
	return PublicKey.findProgramAddressSync(
		[Buffer.from("blacklist"), mint.toBuffer(), address.toBuffer()],
		programId,
	);
}

// ── Default config ─────────────────────────────────────────

export interface StablecoinConfig {
	name: string;
	symbol: string;
	uri: string;
	decimals: number;
	enableMintCloseAuthority: boolean;
	enablePermanentDelegate: boolean;
	enableTransferHook: boolean;
	defaultAccountFrozen: boolean;
	transferHookProgramId: PublicKey | null;
	enableConfidentialTransfers: boolean;
	confidentialTransferAutoApprove: boolean;
	auditorElgamalPubkey: number[] | null;
}

export function sss1Config(): StablecoinConfig {
	return {
		name: "Test Stablecoin",
		symbol: "TUSD",
		uri: "https://example.com/metadata.json",
		decimals: 6,
		enableMintCloseAuthority: false, // Disable for Metaplex compatibility
		enablePermanentDelegate: false,
		enableTransferHook: false,
		defaultAccountFrozen: false,
		transferHookProgramId: null,
		enableConfidentialTransfers: false,
		confidentialTransferAutoApprove: false,
		auditorElgamalPubkey: null,
	};
}

export function sss2Config(transferHookProgramId: PublicKey): StablecoinConfig {
	return {
		name: "Compliant Stablecoin",
		symbol: "CUSD",
		uri: "https://example.com/metadata.json",
		decimals: 6,
		enableMintCloseAuthority: false, // Disable for Metaplex compatibility
		enablePermanentDelegate: true,
		enableTransferHook: true,
		defaultAccountFrozen: false,
		transferHookProgramId,
		enableConfidentialTransfers: false,
		confidentialTransferAutoApprove: false,
		auditorElgamalPubkey: null,
	};
}

// ── Setup helpers ──────────────────────────────────────────

export interface TokenTestContext {
	program: Program<SssToken>;
	provider: anchor.AnchorProvider;
	authority: Keypair;
	mint: Keypair;
	stablecoinState: PublicKey;
	rolesConfig: PublicKey;
}

/**
 * Initialize an SSS-1 stablecoin and return all context.
 * Does NOT call initialize_metadata — use initializeMetadata() separately
 * if you need on-mint metadata for wallet/explorer display.
 */
export async function setupSss1Token(
	program: Program<SssToken>,
	provider: anchor.AnchorProvider,
	configOverrides?: Partial<StablecoinConfig>,
): Promise<TokenTestContext> {
	const authority = Keypair.generate();
	const mint = Keypair.generate();

	await airdrop(provider, authority.publicKey);

	const [stablecoinState] = findStablecoinStatePda(
		mint.publicKey,
		program.programId,
	);
	const [rolesConfig] = findRolesConfigPda(mint.publicKey, program.programId);

	const config = { ...sss1Config(), ...configOverrides };

	await program.methods
		.initialize(config)
		.accountsStrict({
			authority: authority.publicKey,
			mint: mint.publicKey,
			stablecoinState,
			rolesConfig,
			tokenProgram: TOKEN_2022_PROGRAM_ID,
			systemProgram: SystemProgram.programId,
			rent: anchor.web3.SYSVAR_RENT_PUBKEY,
		})
		.signers([authority, mint])
		.rpc();

	return {
		program,
		provider,
		authority,
		mint,
		stablecoinState,
		rolesConfig,
	};
}

// initializeMetadata() removed - we now use Metaplex metadata instead of Token-2022 on-mint metadata
// See tests/metaplex-metadata.ts for Metaplex metadata examples

/**
 * Create an associated token account for Token-2022.
 */
export async function createTokenAccount(
	provider: anchor.AnchorProvider,
	mint: PublicKey,
	owner: PublicKey,
	payer: Keypair,
): Promise<PublicKey> {
	const ata = getAssociatedTokenAddressSync(
		mint,
		owner,
		false,
		TOKEN_2022_PROGRAM_ID,
	);

	const ix = createAssociatedTokenAccountInstruction(
		payer.publicKey,
		ata,
		owner,
		mint,
		TOKEN_2022_PROGRAM_ID,
		ASSOCIATED_TOKEN_PROGRAM_ID,
	);

	const tx = new Transaction().add(ix);
	await provider.sendAndConfirm(tx, [payer]);
	return ata;
}

/**
 * Create a token account with confidential transfer extension configured.
 * Note: This is a simplified version that creates the account but does NOT
 * configure the confidential transfer extension (which requires ElGamal keypairs
 * and proof generation). The account can still be used for testing authorization
 * checks, but actual confidential transfer operations will fail.
 */
export async function createConfidentialTokenAccount(
	provider: anchor.AnchorProvider,
	mint: PublicKey,
	owner: PublicKey,
	payer: Keypair,
): Promise<PublicKey> {
	// For now, just create a regular token account
	// Full confidential transfer setup requires:
	// 1. ElGamal keypair generation
	// 2. AES key generation
	// 3. Proof data generation
	// 4. configure_account instruction with proof
	// This is complex and requires additional dependencies
	return createTokenAccount(provider, mint, owner, payer);
}

/**
 * Add a minter with quota.
 */
export async function addMinter(
	ctx: TokenTestContext,
	minter: PublicKey,
	quota: number,
): Promise<PublicKey> {
	const [minterQuota] = findMinterQuotaPda(
		ctx.mint.publicKey,
		minter,
		ctx.program.programId,
	);

	await ctx.program.methods
		.addMinter(new anchor.BN(quota))
		.accountsStrict({
			authority: ctx.authority.publicKey,
			stablecoinState: ctx.stablecoinState,
			rolesConfig: ctx.rolesConfig,
			minter,
			minterQuota,
			systemProgram: SystemProgram.programId,
		})
		.signers([ctx.authority])
		.rpc();

	return minterQuota;
}

/**
 * Mint tokens to a recipient.
 */
export async function mintTokens(
	ctx: TokenTestContext,
	minter: Keypair,
	minterQuota: PublicKey,
	recipientTokenAccount: PublicKey,
	amount: number,
): Promise<void> {
	await ctx.program.methods
		.mint(new anchor.BN(amount))
		.accountsStrict({
			minter: minter.publicKey,
			stablecoinState: ctx.stablecoinState,
			rolesConfig: ctx.rolesConfig,
			minterQuota,
			mint: ctx.mint.publicKey,
			recipientTokenAccount,
			tokenProgram: TOKEN_2022_PROGRAM_ID,
		})
		.signers([minter])
		.rpc();
}
