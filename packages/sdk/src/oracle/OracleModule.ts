import { BN, Program } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { deriveOracleConfig, derivePriceFeedEntry } from "../client/accounts";
import {
	AddFeedOptions,
	AggregationMethod,
	CrankFeedOptions,
	OracleInitializeOptions,
	OracleStatus,
	OracleUpdateConfigOptions,
	PriceFeedInfo,
} from "../types";

// IDL for sss-oracle program
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ORACLE_IDL = require("../idl/sss_oracle.json");

/**
 * Oracle module for managing multi-source price feeds.
 * Supports non-USD pegs (EUR, BRL, CPI-indexed, etc.).
 */
export class OracleModule {
	private oracleProgram: Program;

	constructor(
		readonly connection: Connection,
		private readonly mint: PublicKey,
		private readonly authority: Keypair,
		oracleProgramId?: PublicKey,
	) {
		// Create a proper Anchor provider
		const { AnchorProvider, Wallet } = require("@coral-xyz/anchor");
		const wallet = new Wallet(authority);
		const provider = new AnchorProvider(connection, wallet, {
			commitment: "confirmed",
		});

		// Create program instance with provider
		// Note: Program ID is read from the IDL. If oracleProgramId is provided,
		// we need to override it after instantiation or modify the IDL
		this.oracleProgram = new Program(ORACLE_IDL as any, provider);

		// Override program ID if provided
		if (oracleProgramId) {
			// @ts-ignore - Anchor allows programId override
			this.oracleProgram._programId = oracleProgramId;
		}
	}

	/**
	 * Initialize oracle configuration for a mint.
	 * Creates the OracleConfig PDA with currency pair and quality gates.
	 */
	async initialize(options: OracleInitializeOptions): Promise<string> {
		const [oracleConfigPda] = deriveOracleConfig(
			this.mint,
			this.oracleProgram.programId,
		);

		const params = {
			baseCurrency: options.baseCurrency,
			quoteCurrency: options.quoteCurrency,
			maxStalenessSeconds: new BN(options.maxStalenessSeconds ?? 300),
			maxConfidenceIntervalBps: options.maxConfidenceIntervalBps ?? 500,
			aggregationMethod: options.aggregationMethod ?? AggregationMethod.Median,
			minFeedsRequired: options.minFeedsRequired ?? 1,
			deviationThresholdBps: options.deviationThresholdBps ?? 0,
			maxPriceChangeBps: options.maxPriceChangeBps ?? 1000,
			mintPremiumBps: options.mintPremiumBps ?? 0,
			redeemDiscountBps: options.redeemDiscountBps ?? 0,
			cranker: options.cranker ?? this.authority.publicKey,
		};

		return (this.oracleProgram.methods as any)
			.initializeOracle(params)
			.accounts({
				authority: this.authority.publicKey,
				mint: this.mint,
				oracleConfig: oracleConfigPda,
				systemProgram: SystemProgram.programId,
			})
			.signers([this.authority])
			.rpc();
	}

	/**
	 * Update oracle configuration parameters.
	 * Only provided fields are updated; omitted fields keep their current value.
	 */
	async updateConfig(options: OracleUpdateConfigOptions): Promise<string> {
		const [oracleConfigPda] = deriveOracleConfig(
			this.mint,
			this.oracleProgram.programId,
		);

		const params = {
			maxStalenessSeconds:
				options.maxStalenessSeconds !== undefined
					? new BN(options.maxStalenessSeconds)
					: null,
			maxConfidenceIntervalBps: options.maxConfidenceIntervalBps ?? null,
			aggregationMethod: options.aggregationMethod ?? null,
			minFeedsRequired: options.minFeedsRequired ?? null,
			deviationThresholdBps: options.deviationThresholdBps ?? null,
			maxPriceChangeBps: options.maxPriceChangeBps ?? null,
			mintPremiumBps: options.mintPremiumBps ?? null,
			redeemDiscountBps: options.redeemDiscountBps ?? null,
			cranker: options.cranker ?? null,
			paused: options.paused ?? null,
		};

		return (this.oracleProgram.methods as any)
			.updateOracleConfig(params)
			.accounts({
				authority: this.authority.publicKey,
				oracleConfig: oracleConfigPda,
			})
			.signers([this.authority])
			.rpc();
	}

	/**
	 * Initiate oracle authority transfer (step 1 of 2).
	 */
	async transferAuthority(newAuthority: PublicKey): Promise<string> {
		const [oracleConfigPda] = deriveOracleConfig(
			this.mint,
			this.oracleProgram.programId,
		);

		return (this.oracleProgram.methods as any)
			.transferOracleAuthority(newAuthority)
			.accounts({
				caller: this.authority.publicKey,
				oracleConfig: oracleConfigPda,
				newAuthority,
			})
			.signers([this.authority])
			.rpc();
	}

	/**
	 * Accept pending oracle authority transfer (step 2 of 2).
	 */
	async acceptAuthority(): Promise<string> {
		const [oracleConfigPda] = deriveOracleConfig(
			this.mint,
			this.oracleProgram.programId,
		);

		return (this.oracleProgram.methods as any)
			.transferOracleAuthority(null)
			.accounts({
				caller: this.authority.publicKey,
				oracleConfig: oracleConfigPda,
				newAuthority: this.authority.publicKey, // unused in step 2
			})
			.signers([this.authority])
			.rpc();
	}

	/**
	 * Add a price feed to the oracle.
	 * Creates a PriceFeedEntry PDA for the specified feed source.
	 */
	async addFeed(options: AddFeedOptions): Promise<string> {
		const [oracleConfigPda] = deriveOracleConfig(
			this.mint,
			this.oracleProgram.programId,
		);
		const [feedPda] = derivePriceFeedEntry(
			this.mint,
			options.feedIndex,
			this.oracleProgram.programId,
		);

		const params = {
			feedIndex: options.feedIndex,
			feedType: options.feedType,
			feedAddress: options.feedAddress ?? PublicKey.default,
			label: options.label,
			weight: options.weight ?? 10000, // 1.0x default
			maxStalenessOverride: new BN(options.maxStalenessOverride ?? 0),
		};

		return (this.oracleProgram.methods as any)
			.addFeed(params)
			.accounts({
				authority: this.authority.publicKey,
				oracleConfig: oracleConfigPda,
				priceFeedEntry: feedPda,
				systemProgram: SystemProgram.programId,
			})
			.signers([this.authority])
			.rpc();
	}

	/**
	 * Remove a price feed from the oracle.
	 * Closes the PriceFeedEntry PDA and reclaims rent.
	 */
	async removeFeed(feedIndex: number): Promise<string> {
		const [oracleConfigPda] = deriveOracleConfig(
			this.mint,
			this.oracleProgram.programId,
		);
		const [feedPda] = derivePriceFeedEntry(
			this.mint,
			feedIndex,
			this.oracleProgram.programId,
		);

		return (this.oracleProgram.methods as any)
			.removeFeed(feedIndex)
			.accounts({
				authority: this.authority.publicKey,
				oracleConfig: oracleConfigPda,
				priceFeedEntry: feedPda,
			})
			.signers([this.authority])
			.rpc();
	}

	/**
	 * Crank a feed with a new price observation.
	 * Includes circuit breaker protection against price manipulation.
	 */
	async crankFeed(options: CrankFeedOptions): Promise<string> {
		const [oracleConfigPda] = deriveOracleConfig(
			this.mint,
			this.oracleProgram.programId,
		);
		const [feedPda] = derivePriceFeedEntry(
			this.mint,
			options.feedIndex,
			this.oracleProgram.programId,
		);

		const cranker = options.cranker ?? this.authority;

		return (this.oracleProgram.methods as any)
			.crankFeed(
				new BN(options.price.toString()),
				new BN(options.confidence.toString()),
			)
			.accounts({
				cranker: cranker.publicKey,
				oracleConfig: oracleConfigPda,
				priceFeedEntry: feedPda,
			})
			.signers([cranker])
			.rpc();
	}

	/**
	 * Set manual price override.
	 * When active, this price is used instead of feed aggregation.
	 */
	async setManualPrice(price: bigint, active: boolean): Promise<string> {
		const [oracleConfigPda] = deriveOracleConfig(
			this.mint,
			this.oracleProgram.programId,
		);

		return (this.oracleProgram.methods as any)
			.setManualPrice(new BN(price.toString()), active)
			.accounts({
				authority: this.authority.publicKey,
				oracleConfig: oracleConfigPda,
			})
			.signers([this.authority])
			.rpc();
	}

	/**
	 * Aggregate prices from all enabled feeds.
	 * Filters stale/invalid feeds and applies the configured aggregation method.
	 *
	 * @param feedAccounts - Array of PriceFeedEntry PDAs to aggregate.
	 *                       Pass all feed PDAs for this oracle.
	 */
	async aggregate(feedAccounts: PublicKey[]): Promise<string> {
		const [oracleConfigPda] = deriveOracleConfig(
			this.mint,
			this.oracleProgram.programId,
		);

		return (this.oracleProgram.methods as any)
			.aggregate()
			.accounts({
				oracleConfig: oracleConfigPda,
			})
			.remainingAccounts(
				feedAccounts.map((pubkey) => ({
					pubkey,
					isSigner: false,
					isWritable: false,
				})),
			)
			.rpc();
	}

	/**
	 * Get the mint price (aggregated price + mint premium).
	 * Returns the price via return data and emits an event.
	 */
	async getMintPrice(): Promise<string> {
		const [oracleConfigPda] = deriveOracleConfig(
			this.mint,
			this.oracleProgram.programId,
		);

		return (this.oracleProgram.methods as any)
			.getMintPrice()
			.accounts({
				oracleConfig: oracleConfigPda,
			})
			.rpc();
	}

	/**
	 * Get the redeem price (aggregated price - redeem discount).
	 * Returns the price via return data and emits an event.
	 */
	async getRedeemPrice(): Promise<string> {
		const [oracleConfigPda] = deriveOracleConfig(
			this.mint,
			this.oracleProgram.programId,
		);

		return (this.oracleProgram.methods as any)
			.getRedeemPrice()
			.accounts({
				oracleConfig: oracleConfigPda,
			})
			.rpc();
	}

	/**
	 * Close the oracle and reclaim rent.
	 * All feeds must be removed first.
	 */
	async close(): Promise<string> {
		const [oracleConfigPda] = deriveOracleConfig(
			this.mint,
			this.oracleProgram.programId,
		);

		return (this.oracleProgram.methods as any)
			.closeOracle()
			.accounts({
				authority: this.authority.publicKey,
				oracleConfig: oracleConfigPda,
			})
			.signers([this.authority])
			.rpc();
	}

	// ── Queries ────────────────────────────────────────────────────────────────

	/**
	 * Fetch oracle configuration status.
	 */
	async getStatus(): Promise<OracleStatus> {
		const [oracleConfigPda] = deriveOracleConfig(
			this.mint,
			this.oracleProgram.programId,
		);
		const config = await (this.oracleProgram.account as any).oracleConfig.fetch(
			oracleConfigPda,
		);

		return {
			version: config.version,
			authority: config.authority,
			pendingAuthority: config.pendingAuthority ?? null,
			cranker: config.cranker,
			mint: config.mint,
			baseCurrency: config.baseCurrency,
			quoteCurrency: config.quoteCurrency,
			maxStalenessSeconds: config.maxStalenessSeconds.toNumber(),
			maxConfidenceIntervalBps: config.maxConfidenceIntervalBps,
			aggregationMethod: config.aggregationMethod,
			minFeedsRequired: config.minFeedsRequired,
			deviationThresholdBps: config.deviationThresholdBps,
			maxPriceChangeBps: config.maxPriceChangeBps,
			mintPremiumBps: config.mintPremiumBps,
			redeemDiscountBps: config.redeemDiscountBps,
			manualPrice: BigInt(config.manualPrice.toString()),
			manualPriceActive: config.manualPriceActive,
			lastAggregatedPrice: BigInt(config.lastAggregatedPrice.toString()),
			lastAggregatedConfidence: BigInt(
				config.lastAggregatedConfidence.toString(),
			),
			lastAggregatedTimestamp: config.lastAggregatedTimestamp.toNumber(),
			feedCount: config.feedCount,
			paused: config.paused,
		};
	}

	/**
	 * Fetch all price feeds for this oracle.
	 */
	async getFeeds(): Promise<PriceFeedInfo[]> {
		const [oracleConfigPda] = deriveOracleConfig(
			this.mint,
			this.oracleProgram.programId,
		);

		const accounts = await (
			this.oracleProgram.account as any
		).priceFeedEntry.all([
			{
				memcmp: {
					offset: 8, // skip discriminator
					bytes: oracleConfigPda.toBase58(),
				},
			},
		]);

		return accounts.map((a: any) => ({
			priceFeedPda: a.publicKey,
			oracleConfig: a.account.oracleConfig,
			feedIndex: a.account.feedIndex,
			feedType: a.account.feedType,
			feedAddress: a.account.feedAddress,
			label: a.account.label,
			lastPrice: BigInt(a.account.lastPrice.toString()),
			lastConfidence: BigInt(a.account.lastConfidence.toString()),
			lastTimestamp: a.account.lastTimestamp.toNumber(),
			weight: a.account.weight,
			enabled: a.account.enabled,
			maxStalenessOverride: a.account.maxStalenessOverride.toNumber(),
		}));
	}

	/**
	 * Fetch a specific feed by index.
	 */
	async getFeed(feedIndex: number): Promise<PriceFeedInfo | null> {
		const [feedPda] = derivePriceFeedEntry(
			this.mint,
			feedIndex,
			this.oracleProgram.programId,
		);

		try {
			const feed = await (
				this.oracleProgram.account as any
			).priceFeedEntry.fetch(feedPda);
			return {
				priceFeedPda: feedPda,
				oracleConfig: feed.oracleConfig,
				feedIndex: feed.feedIndex,
				feedType: feed.feedType,
				feedAddress: feed.feedAddress,
				label: feed.label,
				lastPrice: BigInt(feed.lastPrice.toString()),
				lastConfidence: BigInt(feed.lastConfidence.toString()),
				lastTimestamp: feed.lastTimestamp.toNumber(),
				weight: feed.weight,
				enabled: feed.enabled,
				maxStalenessOverride: feed.maxStalenessOverride.toNumber(),
			};
		} catch {
			return null;
		}
	}
}
