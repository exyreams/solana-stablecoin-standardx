import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { SssOracle } from "../../target/types/sss_oracle";
import { airdrop } from "./common";

// Declare Buffer for Node.js environment
declare const Buffer: {
	from(data: string | Uint8Array | number[]): Uint8Array;
};

// ── PDA derivation ─────────────────────────────────────────

export function findOracleConfigPda(
	mint: PublicKey,
	programId: PublicKey,
): [PublicKey, number] {
	return PublicKey.findProgramAddressSync(
		[Buffer.from("oracle_config"), mint.toBuffer()],
		programId,
	);
}

export function findPriceFeedPda(
	oracleConfig: PublicKey,
	feedIndex: number,
	programId: PublicKey,
): [PublicKey, number] {
	return PublicKey.findProgramAddressSync(
		[
			Buffer.from("price_feed"),
			oracleConfig.toBuffer(),
			Buffer.from([feedIndex]),
		],
		programId,
	);
}

// ── Default params ─────────────────────────────────────────

export interface OracleInitParams {
	baseCurrency: string;
	quoteCurrency: string;
	maxStalenessSeconds: anchor.BN;
	maxConfidenceIntervalBps: number;
	aggregationMethod: number;
	minFeedsRequired: number;
	deviationThresholdBps: number;
	maxPriceChangeBps: number;
	mintPremiumBps: number;
	redeemDiscountBps: number;
	cranker: PublicKey;
}

export function defaultOracleParams(cranker: PublicKey): OracleInitParams {
	return {
		baseCurrency: "EUR",
		quoteCurrency: "USD",
		maxStalenessSeconds: new anchor.BN(300),
		maxConfidenceIntervalBps: 100,
		aggregationMethod: 0, // Median
		minFeedsRequired: 1,
		deviationThresholdBps: 500,
		maxPriceChangeBps: 1000,
		mintPremiumBps: 50,
		redeemDiscountBps: 30,
		cranker,
	};
}

export interface FeedParams {
	feedIndex: number;
	feedType: number;
	feedAddress: PublicKey;
	label: string;
	weight: number;
	maxStalenessOverride: anchor.BN;
}

export function defaultFeedParams(
	feedIndex: number = 0,
	label: string = "test-feed",
): FeedParams {
	return {
		feedIndex,
		feedType: 3, // Manual
		feedAddress: PublicKey.default,
		label,
		weight: 10000, // 1.0x
		maxStalenessOverride: new anchor.BN(0),
	};
}

// ── Setup helpers ──────────────────────────────────────────

export interface OracleTestContext {
	program: Program<SssOracle>;
	provider: anchor.AnchorProvider;
	authority: Keypair;
	cranker: Keypair;
	mint: Keypair;
	oracleConfig: PublicKey;
	oracleConfigBump: number;
}

/**
 * Initialize an oracle and return all the context needed for further tests.
 */
export async function setupOracle(
	program: Program<SssOracle>,
	provider: anchor.AnchorProvider,
	overrides?: Partial<OracleInitParams>,
): Promise<OracleTestContext> {
	const authority = Keypair.generate();
	const cranker = Keypair.generate();
	const mint = Keypair.generate();

	await airdrop(provider, authority.publicKey);

	const [oracleConfig, oracleConfigBump] = findOracleConfigPda(
		mint.publicKey,
		program.programId,
	);

	const params = {
		...defaultOracleParams(cranker.publicKey),
		...overrides,
	};

	await program.methods
		.initializeOracle(params)
		.accountsStrict({
			authority: authority.publicKey,
			mint: mint.publicKey,
			oracleConfig,
			systemProgram: SystemProgram.programId,
		})
		.signers([authority])
		.rpc();

	return {
		program,
		provider,
		authority,
		cranker,
		mint,
		oracleConfig,
		oracleConfigBump,
	};
}

/**
 * Add a feed and return its PDA.
 */
export async function addFeed(
	ctx: OracleTestContext,
	feedParams?: Partial<FeedParams>,
): Promise<{ feedPda: PublicKey; feedIndex: number }> {
	const params = {
		...defaultFeedParams(),
		...feedParams,
	};

	const [feedPda] = findPriceFeedPda(
		ctx.oracleConfig,
		params.feedIndex,
		ctx.program.programId,
	);

	await ctx.program.methods
		.addFeed(params)
		.accountsStrict({
			authority: ctx.authority.publicKey,
			oracleConfig: ctx.oracleConfig,
			priceFeedEntry: feedPda,
			systemProgram: SystemProgram.programId,
		})
		.signers([ctx.authority])
		.rpc();

	return { feedPda, feedIndex: params.feedIndex };
}

/**
 * Crank a feed with a price.
 */
export async function crankFeed(
	ctx: OracleTestContext,
	feedPda: PublicKey,
	price: anchor.BN,
	confidence: anchor.BN = new anchor.BN(0),
): Promise<void> {
	await airdrop(ctx.provider, ctx.cranker.publicKey);

	await ctx.program.methods
		.crankFeed(price, confidence)
		.accountsStrict({
			cranker: ctx.cranker.publicKey,
			oracleConfig: ctx.oracleConfig,
			priceFeedEntry: feedPda,
		})
		.signers([ctx.cranker])
		.rpc();
}
