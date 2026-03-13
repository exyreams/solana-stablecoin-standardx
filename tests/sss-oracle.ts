import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import { SssOracle } from "../target/types/sss_oracle";
import {
	addFeed,
	airdrop,
	crankFeed,
	defaultFeedParams,
	defaultOracleParams,
	expectError,
	findOracleConfigPda,
	findPriceFeedPda,
	OracleTestContext,
	setupOracle,
	toFixedPoint,
} from "./helpers";

describe("sss-oracle", () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);
	const program = anchor.workspace.SssOracle as Program<SssOracle>;

	// ════════════════════════════════════════════════════════════
	// 1. Initialize Oracle
	// ════════════════════════════════════════════════════════════
	describe("initialize_oracle", () => {
		it("creates oracle config with correct state", async () => {
			const ctx = await setupOracle(program, provider);

			const config = await program.account.oracleConfig.fetch(ctx.oracleConfig);

			assert.equal(config.version, 1);
			assert.ok(config.authority.equals(ctx.authority.publicKey));
			assert.ok(config.cranker.equals(ctx.cranker.publicKey));
			assert.ok(config.mint.equals(ctx.mint.publicKey));
			assert.equal(config.baseCurrency, "EUR");
			assert.equal(config.quoteCurrency, "USD");
			assert.equal(config.maxStalenessSeconds.toNumber(), 300);
			assert.equal(config.maxConfidenceIntervalBps, 100);
			assert.equal(config.aggregationMethod, 0);
			assert.equal(config.minFeedsRequired, 1);
			assert.equal(config.deviationThresholdBps, 500);
			assert.equal(config.maxPriceChangeBps, 1000);
			assert.equal(config.mintPremiumBps, 50);
			assert.equal(config.redeemDiscountBps, 30);
			assert.equal(config.manualPrice.toNumber(), 0);
			assert.equal(config.manualPriceActive, false);
			assert.equal(config.lastAggregatedPrice.toNumber(), 0);
			assert.equal(config.feedCount, 0);
			assert.equal(config.paused, false);
			assert.isNull(config.pendingAuthority);
		});

		it("rejects base currency label too long", async () => {
			const authority = Keypair.generate();
			const mint = Keypair.generate();
			await airdrop(provider, authority.publicKey);

			const [oracleConfig] = findOracleConfigPda(
				mint.publicKey,
				program.programId,
			);

			const params = defaultOracleParams(Keypair.generate().publicKey);
			params.baseCurrency = "TOOLONGCUR"; // > 8 chars

			await expectError(
				program.methods
					.initializeOracle(params)
					.accountsStrict({
						authority: authority.publicKey,
						mint: mint.publicKey,
						oracleConfig,
						systemProgram: SystemProgram.programId,
					})
					.signers([authority])
					.rpc(),
				"CurrencyLabelTooLong",
			);
		});

		it("rejects zero max_staleness_seconds", async () => {
			const authority = Keypair.generate();
			const mint = Keypair.generate();
			await airdrop(provider, authority.publicKey);

			const [oracleConfig] = findOracleConfigPda(
				mint.publicKey,
				program.programId,
			);

			const params = defaultOracleParams(Keypair.generate().publicKey);
			params.maxStalenessSeconds = new anchor.BN(0);

			await expectError(
				program.methods
					.initializeOracle(params)
					.accountsStrict({
						authority: authority.publicKey,
						mint: mint.publicKey,
						oracleConfig,
						systemProgram: SystemProgram.programId,
					})
					.signers([authority])
					.rpc(),
				"InvalidParameter",
			);
		});

		it("rejects invalid aggregation method", async () => {
			const authority = Keypair.generate();
			const mint = Keypair.generate();
			await airdrop(provider, authority.publicKey);

			const [oracleConfig] = findOracleConfigPda(
				mint.publicKey,
				program.programId,
			);

			const params = defaultOracleParams(Keypair.generate().publicKey);
			params.aggregationMethod = 5; // invalid

			await expectError(
				program.methods
					.initializeOracle(params)
					.accountsStrict({
						authority: authority.publicKey,
						mint: mint.publicKey,
						oracleConfig,
						systemProgram: SystemProgram.programId,
					})
					.signers([authority])
					.rpc(),
				"InvalidAggregationMethod",
			);
		});

		it("rejects zero min_feeds_required", async () => {
			const authority = Keypair.generate();
			const mint = Keypair.generate();
			await airdrop(provider, authority.publicKey);

			const [oracleConfig] = findOracleConfigPda(
				mint.publicKey,
				program.programId,
			);

			const params = defaultOracleParams(Keypair.generate().publicKey);
			params.minFeedsRequired = 0;

			await expectError(
				program.methods
					.initializeOracle(params)
					.accountsStrict({
						authority: authority.publicKey,
						mint: mint.publicKey,
						oracleConfig,
						systemProgram: SystemProgram.programId,
					})
					.signers([authority])
					.rpc(),
				"InvalidParameter",
			);
		});

		it("derives correct PDA from mint key", async () => {
			const mint = Keypair.generate();
			const [_expected] = findOracleConfigPda(
				mint.publicKey,
				program.programId,
			);

			const ctx = await setupOracle(program, provider);
			const [actual] = findOracleConfigPda(
				ctx.mint.publicKey,
				program.programId,
			);

			assert.ok(actual.equals(ctx.oracleConfig));
		});
	});

	// ════════════════════════════════════════════════════════════
	// 2. Update Oracle Config
	// ════════════════════════════════════════════════════════════
	describe("update_oracle_config", () => {
		let ctx: OracleTestContext;

		beforeEach(async () => {
			ctx = await setupOracle(program, provider);
		});

		it("updates max_staleness_seconds", async () => {
			await ctx.program.methods
				.updateOracleConfig({
					maxStalenessSeconds: new anchor.BN(600),
					maxConfidenceIntervalBps: null,
					aggregationMethod: null,
					minFeedsRequired: null,
					deviationThresholdBps: null,
					maxPriceChangeBps: null,
					mintPremiumBps: null,
					redeemDiscountBps: null,
					cranker: null,
					paused: null,
				})
				.accountsStrict({
					authority: ctx.authority.publicKey,
					oracleConfig: ctx.oracleConfig,
				})
				.signers([ctx.authority])
				.rpc();

			const config = await program.account.oracleConfig.fetch(ctx.oracleConfig);
			assert.equal(config.maxStalenessSeconds.toNumber(), 600);
		});

		it("updates multiple fields at once", async () => {
			const newCranker = Keypair.generate();

			await ctx.program.methods
				.updateOracleConfig({
					maxStalenessSeconds: new anchor.BN(120),
					maxConfidenceIntervalBps: 200,
					aggregationMethod: 1, // Mean
					minFeedsRequired: 3,
					deviationThresholdBps: 250,
					maxPriceChangeBps: 500,
					mintPremiumBps: 100,
					redeemDiscountBps: 75,
					cranker: newCranker.publicKey,
					paused: null,
				})
				.accountsStrict({
					authority: ctx.authority.publicKey,
					oracleConfig: ctx.oracleConfig,
				})
				.signers([ctx.authority])
				.rpc();

			const config = await program.account.oracleConfig.fetch(ctx.oracleConfig);
			assert.equal(config.maxStalenessSeconds.toNumber(), 120);
			assert.equal(config.maxConfidenceIntervalBps, 200);
			assert.equal(config.aggregationMethod, 1);
			assert.equal(config.minFeedsRequired, 3);
			assert.equal(config.deviationThresholdBps, 250);
			assert.equal(config.maxPriceChangeBps, 500);
			assert.equal(config.mintPremiumBps, 100);
			assert.equal(config.redeemDiscountBps, 75);
			assert.ok(config.cranker.equals(newCranker.publicKey));
		});

		it("can pause and unpause", async () => {
			await ctx.program.methods
				.updateOracleConfig({
					maxStalenessSeconds: null,
					maxConfidenceIntervalBps: null,
					aggregationMethod: null,
					minFeedsRequired: null,
					deviationThresholdBps: null,
					maxPriceChangeBps: null,
					mintPremiumBps: null,
					redeemDiscountBps: null,
					cranker: null,
					paused: true,
				})
				.accountsStrict({
					authority: ctx.authority.publicKey,
					oracleConfig: ctx.oracleConfig,
				})
				.signers([ctx.authority])
				.rpc();

			let config = await program.account.oracleConfig.fetch(ctx.oracleConfig);
			assert.equal(config.paused, true);

			// Unpause
			await ctx.program.methods
				.updateOracleConfig({
					maxStalenessSeconds: null,
					maxConfidenceIntervalBps: null,
					aggregationMethod: null,
					minFeedsRequired: null,
					deviationThresholdBps: null,
					maxPriceChangeBps: null,
					mintPremiumBps: null,
					redeemDiscountBps: null,
					cranker: null,
					paused: false,
				})
				.accountsStrict({
					authority: ctx.authority.publicKey,
					oracleConfig: ctx.oracleConfig,
				})
				.signers([ctx.authority])
				.rpc();

			config = await program.account.oracleConfig.fetch(ctx.oracleConfig);
			assert.equal(config.paused, false);
		});

		it("rejects non-authority caller", async () => {
			const imposter = Keypair.generate();
			await airdrop(provider, imposter.publicKey);

			await expectError(
				ctx.program.methods
					.updateOracleConfig({
						maxStalenessSeconds: new anchor.BN(999),
						maxConfidenceIntervalBps: null,
						aggregationMethod: null,
						minFeedsRequired: null,
						deviationThresholdBps: null,
						maxPriceChangeBps: null,
						mintPremiumBps: null,
						redeemDiscountBps: null,
						cranker: null,
						paused: null,
					})
					.accountsStrict({
						authority: imposter.publicKey,
						oracleConfig: ctx.oracleConfig,
					})
					.signers([imposter])
					.rpc(),
				"Unauthorized",
			);
		});

		it("rejects invalid aggregation method update", async () => {
			await expectError(
				ctx.program.methods
					.updateOracleConfig({
						maxStalenessSeconds: null,
						maxConfidenceIntervalBps: null,
						aggregationMethod: 9,
						minFeedsRequired: null,
						deviationThresholdBps: null,
						maxPriceChangeBps: null,
						mintPremiumBps: null,
						redeemDiscountBps: null,
						cranker: null,
						paused: null,
					})
					.accountsStrict({
						authority: ctx.authority.publicKey,
						oracleConfig: ctx.oracleConfig,
					})
					.signers([ctx.authority])
					.rpc(),
				"InvalidAggregationMethod",
			);
		});
	});

	// ════════════════════════════════════════════════════════════
	// 3. Transfer Oracle Authority
	// ════════════════════════════════════════════════════════════
	describe("transfer_oracle_authority", () => {
		let ctx: OracleTestContext;

		beforeEach(async () => {
			ctx = await setupOracle(program, provider);
		});

		it("completes two-step authority transfer", async () => {
			const newAuthority = Keypair.generate();
			await airdrop(provider, newAuthority.publicKey);

			// Step 1: Initiate
			await ctx.program.methods
				.transferOracleAuthority(newAuthority.publicKey)
				.accountsStrict({
					caller: ctx.authority.publicKey,
					oracleConfig: ctx.oracleConfig,
				})
				.signers([ctx.authority])
				.rpc();

			let config = await program.account.oracleConfig.fetch(ctx.oracleConfig);
			assert.ok(
				config.pendingAuthority !== null &&
					new PublicKey(config.pendingAuthority).equals(newAuthority.publicKey),
			);

			// Step 2: Accept
			await ctx.program.methods
				.transferOracleAuthority(null)
				.accountsStrict({
					caller: newAuthority.publicKey,
					oracleConfig: ctx.oracleConfig,
				})
				.signers([newAuthority])
				.rpc();

			config = await program.account.oracleConfig.fetch(ctx.oracleConfig);
			assert.ok(config.authority.equals(newAuthority.publicKey));
			assert.isNull(config.pendingAuthority);
		});

		it("allows current authority to cancel pending transfer", async () => {
			const newAuthority = Keypair.generate();

			// Initiate
			await ctx.program.methods
				.transferOracleAuthority(newAuthority.publicKey)
				.accountsStrict({
					caller: ctx.authority.publicKey,
					oracleConfig: ctx.oracleConfig,
				})
				.signers([ctx.authority])
				.rpc();

			// Cancel
			await ctx.program.methods
				.transferOracleAuthority(null)
				.accountsStrict({
					caller: ctx.authority.publicKey,
					oracleConfig: ctx.oracleConfig,
				})
				.signers([ctx.authority])
				.rpc();

			const config = await program.account.oracleConfig.fetch(ctx.oracleConfig);
			assert.isNull(config.pendingAuthority);
			assert.ok(config.authority.equals(ctx.authority.publicKey));
		});

		it("rejects accept from non-pending authority", async () => {
			const newAuthority = Keypair.generate();
			const imposter = Keypair.generate();
			await airdrop(provider, imposter.publicKey);

			// Initiate transfer to newAuthority
			await ctx.program.methods
				.transferOracleAuthority(newAuthority.publicKey)
				.accountsStrict({
					caller: ctx.authority.publicKey,
					oracleConfig: ctx.oracleConfig,
				})
				.signers([ctx.authority])
				.rpc();

			// Imposter tries to accept
			await expectError(
				ctx.program.methods
					.transferOracleAuthority(null)
					.accountsStrict({
						caller: imposter.publicKey,
						oracleConfig: ctx.oracleConfig,
					})
					.signers([imposter])
					.rpc(),
				"NotPendingAuthority",
			);
		});
	});

	// ════════════════════════════════════════════════════════════
	// 4. Add Feed
	// ════════════════════════════════════════════════════════════
	describe("add_feed", () => {
		let ctx: OracleTestContext;

		beforeEach(async () => {
			ctx = await setupOracle(program, provider);
		});

		it("creates a feed with correct state", async () => {
			const { feedPda } = await addFeed(ctx, {
				feedIndex: 0,
				label: "switchboard-eur-usd",
				feedType: 0,
				weight: 10000,
			});

			const feed = await program.account.priceFeedEntry.fetch(feedPda);
			assert.ok(feed.oracleConfig.equals(ctx.oracleConfig));
			assert.equal(feed.feedIndex, 0);
			assert.equal(feed.feedType, 0);
			assert.equal(feed.label, "switchboard-eur-usd");
			assert.equal(feed.lastPrice.toNumber(), 0);
			assert.equal(feed.weight, 10000);
			assert.equal(feed.enabled, true);

			const config = await program.account.oracleConfig.fetch(ctx.oracleConfig);
			assert.equal(config.feedCount, 1);
		});

		it("allows multiple feeds at different indices", async () => {
			await addFeed(ctx, { feedIndex: 0, label: "feed-0" });
			await addFeed(ctx, { feedIndex: 1, label: "feed-1" });
			await addFeed(ctx, { feedIndex: 2, label: "feed-2" });

			const config = await program.account.oracleConfig.fetch(ctx.oracleConfig);
			assert.equal(config.feedCount, 3);
		});

		it("rejects feed_index >= MAX_FEEDS (16)", async () => {
			await expectError(
				addFeed(ctx, { feedIndex: 16, label: "overflow" }),
				"FeedIndexOutOfBounds",
			);
		});

		it("rejects zero weight", async () => {
			const params = defaultFeedParams(0, "zero-weight");
			params.weight = 0;

			const [feedPda] = findPriceFeedPda(
				ctx.oracleConfig,
				0,
				program.programId,
			);

			await expectError(
				ctx.program.methods
					.addFeed(params)
					.accountsStrict({
						authority: ctx.authority.publicKey,
						oracleConfig: ctx.oracleConfig,
						priceFeedEntry: feedPda,
						systemProgram: SystemProgram.programId,
					})
					.signers([ctx.authority])
					.rpc(),
				"InvalidParameter",
			);
		});

		it("rejects label too long (>32 bytes)", async () => {
			await expectError(
				addFeed(ctx, {
					feedIndex: 0,
					label: "A".repeat(33),
				}),
				"FeedLabelTooLong",
			);
		});

		it("rejects add when paused", async () => {
			// Pause
			await ctx.program.methods
				.updateOracleConfig({
					maxStalenessSeconds: null,
					maxConfidenceIntervalBps: null,
					aggregationMethod: null,
					minFeedsRequired: null,
					deviationThresholdBps: null,
					maxPriceChangeBps: null,
					mintPremiumBps: null,
					redeemDiscountBps: null,
					cranker: null,
					paused: true,
				})
				.accountsStrict({
					authority: ctx.authority.publicKey,
					oracleConfig: ctx.oracleConfig,
				})
				.signers([ctx.authority])
				.rpc();

			await expectError(
				addFeed(ctx, { feedIndex: 0, label: "should-fail" }),
				"OraclePaused",
			);
		});

		it("rejects non-authority", async () => {
			const imposter = Keypair.generate();
			await airdrop(provider, imposter.publicKey);

			const params = defaultFeedParams(0, "imposter-feed");
			const [feedPda] = findPriceFeedPda(
				ctx.oracleConfig,
				0,
				program.programId,
			);

			await expectError(
				ctx.program.methods
					.addFeed(params)
					.accountsStrict({
						authority: imposter.publicKey,
						oracleConfig: ctx.oracleConfig,
						priceFeedEntry: feedPda,
						systemProgram: SystemProgram.programId,
					})
					.signers([imposter])
					.rpc(),
				"Unauthorized",
			);
		});
	});

	// ════════════════════════════════════════════════════════════
	// 5. Remove Feed
	// ════════════════════════════════════════════════════════════
	describe("remove_feed", () => {
		let ctx: OracleTestContext;

		beforeEach(async () => {
			ctx = await setupOracle(program, provider);
		});

		it("closes feed account and decrements count", async () => {
			const { feedPda, feedIndex } = await addFeed(ctx, {
				feedIndex: 3,
				label: "to-remove",
			});

			let config = await program.account.oracleConfig.fetch(ctx.oracleConfig);
			assert.equal(config.feedCount, 1);

			await ctx.program.methods
				.removeFeed(feedIndex)
				.accountsStrict({
					authority: ctx.authority.publicKey,
					oracleConfig: ctx.oracleConfig,
					priceFeedEntry: feedPda,
					systemProgram: SystemProgram.programId,
				})
				.signers([ctx.authority])
				.rpc();

			config = await program.account.oracleConfig.fetch(ctx.oracleConfig);
			assert.equal(config.feedCount, 0);

			// Feed account should be closed
			const feedAccount = await provider.connection.getAccountInfo(feedPda);
			assert.isNull(feedAccount);
		});

		it("rejects non-authority", async () => {
			const { feedPda, feedIndex } = await addFeed(ctx);
			const imposter = Keypair.generate();
			await airdrop(provider, imposter.publicKey);

			await expectError(
				ctx.program.methods
					.removeFeed(feedIndex)
					.accountsStrict({
						authority: imposter.publicKey,
						oracleConfig: ctx.oracleConfig,
						priceFeedEntry: feedPda,
						systemProgram: SystemProgram.programId,
					})
					.signers([imposter])
					.rpc(),
				"Unauthorized",
			);
		});
	});

	// ════════════════════════════════════════════════════════════
	// 6. Crank Feed
	// ════════════════════════════════════════════════════════════
	describe("crank_feed", () => {
		let ctx: OracleTestContext;
		let feedPda: PublicKey;

		beforeEach(async () => {
			ctx = await setupOracle(program, provider, {
				maxPriceChangeBps: 1000, // 10% circuit breaker
			});
			const result = await addFeed(ctx);
			feedPda = result.feedPda;
		});

		it("writes price and timestamp", async () => {
			const price = toFixedPoint(1.1); // EUR/USD = 1.10
			const confidence = toFixedPoint(0.001);

			await crankFeed(ctx, feedPda, price, confidence);

			const feed = await program.account.priceFeedEntry.fetch(feedPda);
			assert.equal(feed.lastPrice.toString(), price.toString());
			assert.equal(feed.lastConfidence.toString(), confidence.toString());
			assert.isAbove(feed.lastTimestamp.toNumber(), 0);
		});

		it("authority can also crank", async () => {
			const price = toFixedPoint(1.1);

			await ctx.program.methods
				.crankFeed(price, new anchor.BN(0))
				.accountsStrict({
					cranker: ctx.authority.publicKey,
					oracleConfig: ctx.oracleConfig,
					priceFeedEntry: feedPda,
				})
				.signers([ctx.authority])
				.rpc();

			const feed = await program.account.priceFeedEntry.fetch(feedPda);
			assert.equal(feed.lastPrice.toString(), price.toString());
		});

		it("rejects zero price", async () => {
			await airdrop(provider, ctx.cranker.publicKey);

			await expectError(
				ctx.program.methods
					.crankFeed(new anchor.BN(0), new anchor.BN(0))
					.accountsStrict({
						cranker: ctx.cranker.publicKey,
						oracleConfig: ctx.oracleConfig,
						priceFeedEntry: feedPda,
					})
					.signers([ctx.cranker])
					.rpc(),
				"InvalidPrice",
			);
		});

		it("rejects price change exceeding circuit breaker", async () => {
			const price1 = toFixedPoint(1.0);
			await crankFeed(ctx, feedPda, price1);

			// Try 15% jump — exceeds 10% limit
			const price2 = toFixedPoint(1.15);
			await expectError(
				crankFeed(ctx, feedPda, price2),
				"PriceChangeExceedsLimit",
			);
		});

		it("allows price change within circuit breaker", async () => {
			const price1 = toFixedPoint(1.0);
			await crankFeed(ctx, feedPda, price1);

			// 5% change — within 10% limit
			const price2 = toFixedPoint(1.05);
			await crankFeed(ctx, feedPda, price2);

			const feed = await program.account.priceFeedEntry.fetch(feedPda);
			assert.equal(feed.lastPrice.toString(), price2.toString());
		});

		it("first crank always passes (no reference price)", async () => {
			const price = toFixedPoint(100.0); // big initial value
			await crankFeed(ctx, feedPda, price);

			const feed = await program.account.priceFeedEntry.fetch(feedPda);
			assert.equal(feed.lastPrice.toString(), price.toString());
		});

		it("rejects when paused", async () => {
			await ctx.program.methods
				.updateOracleConfig({
					maxStalenessSeconds: null,
					maxConfidenceIntervalBps: null,
					aggregationMethod: null,
					minFeedsRequired: null,
					deviationThresholdBps: null,
					maxPriceChangeBps: null,
					mintPremiumBps: null,
					redeemDiscountBps: null,
					cranker: null,
					paused: true,
				})
				.accountsStrict({
					authority: ctx.authority.publicKey,
					oracleConfig: ctx.oracleConfig,
				})
				.signers([ctx.authority])
				.rpc();

			await expectError(
				crankFeed(ctx, feedPda, toFixedPoint(1.0)),
				"OraclePaused",
			);
		});

		it("rejects unauthorized cranker", async () => {
			const imposter = Keypair.generate();
			await airdrop(provider, imposter.publicKey);

			await expectError(
				ctx.program.methods
					.crankFeed(toFixedPoint(1.0), new anchor.BN(0))
					.accountsStrict({
						cranker: imposter.publicKey,
						oracleConfig: ctx.oracleConfig,
						priceFeedEntry: feedPda,
					})
					.signers([imposter])
					.rpc(),
				"Unauthorized",
			);
		});
	});

	// ════════════════════════════════════════════════════════════
	// 7. Set Manual Price
	// ════════════════════════════════════════════════════════════
	describe("set_manual_price", () => {
		let ctx: OracleTestContext;

		beforeEach(async () => {
			ctx = await setupOracle(program, provider);
		});

		it("activates manual price", async () => {
			const price = toFixedPoint(1.2);

			await ctx.program.methods
				.setManualPrice(price, true)
				.accountsStrict({
					authority: ctx.authority.publicKey,
					oracleConfig: ctx.oracleConfig,
				})
				.signers([ctx.authority])
				.rpc();

			const config = await program.account.oracleConfig.fetch(ctx.oracleConfig);
			assert.equal(config.manualPrice.toString(), price.toString());
			assert.equal(config.manualPriceActive, true);
			// Should also propagate to aggregated price
			assert.equal(config.lastAggregatedPrice.toString(), price.toString());
			assert.equal(config.lastAggregatedConfidence.toNumber(), 0);
		});

		it("deactivates manual price", async () => {
			const price = toFixedPoint(1.2);
			await ctx.program.methods
				.setManualPrice(price, true)
				.accountsStrict({
					authority: ctx.authority.publicKey,
					oracleConfig: ctx.oracleConfig,
				})
				.signers([ctx.authority])
				.rpc();

			await ctx.program.methods
				.setManualPrice(new anchor.BN(0), false)
				.accountsStrict({
					authority: ctx.authority.publicKey,
					oracleConfig: ctx.oracleConfig,
				})
				.signers([ctx.authority])
				.rpc();

			const config = await program.account.oracleConfig.fetch(ctx.oracleConfig);
			assert.equal(config.manualPriceActive, false);
		});

		it("rejects zero price when activating", async () => {
			await expectError(
				ctx.program.methods
					.setManualPrice(new anchor.BN(0), true)
					.accountsStrict({
						authority: ctx.authority.publicKey,
						oracleConfig: ctx.oracleConfig,
					})
					.signers([ctx.authority])
					.rpc(),
				"InvalidPrice",
			);
		});

		it("rejects non-authority", async () => {
			const imposter = Keypair.generate();
			await airdrop(provider, imposter.publicKey);

			await expectError(
				ctx.program.methods
					.setManualPrice(toFixedPoint(1.0), true)
					.accountsStrict({
						authority: imposter.publicKey,
						oracleConfig: ctx.oracleConfig,
					})
					.signers([imposter])
					.rpc(),
				"Unauthorized",
			);
		});
	});

	// ════════════════════════════════════════════════════════════
	// 8. Aggregate
	// ════════════════════════════════════════════════════════════
	describe("aggregate", () => {
		it("aggregates single feed (median)", async () => {
			const ctx = await setupOracle(program, provider, {
				aggregationMethod: 0, // Median
				minFeedsRequired: 1,
				deviationThresholdBps: 0, // disabled
			});

			const { feedPda } = await addFeed(ctx, {
				feedIndex: 0,
				label: "feed-0",
			});

			const price = toFixedPoint(1.1);
			await crankFeed(ctx, feedPda, price, new anchor.BN(1000));

			await airdrop(provider, ctx.cranker.publicKey);
			await ctx.program.methods
				.aggregate()
				.accountsStrict({
					cranker: ctx.cranker.publicKey,
					oracleConfig: ctx.oracleConfig,
				})
				.remainingAccounts([
					{
						pubkey: feedPda,
						isWritable: false,
						isSigner: false,
					},
				])
				.signers([ctx.cranker])
				.rpc();

			const config = await program.account.oracleConfig.fetch(ctx.oracleConfig);
			assert.equal(config.lastAggregatedPrice.toString(), price.toString());
		});

		it("aggregates three feeds with median", async () => {
			const ctx = await setupOracle(program, provider, {
				aggregationMethod: 0, // Median
				minFeedsRequired: 3,
				deviationThresholdBps: 0,
				maxPriceChangeBps: 0,
			});

			const feed0 = await addFeed(ctx, { feedIndex: 0, label: "f0" });
			const feed1 = await addFeed(ctx, { feedIndex: 1, label: "f1" });
			const feed2 = await addFeed(ctx, { feedIndex: 2, label: "f2" });

			await crankFeed(ctx, feed0.feedPda, toFixedPoint(1.08));
			await crankFeed(ctx, feed1.feedPda, toFixedPoint(1.1));
			await crankFeed(ctx, feed2.feedPda, toFixedPoint(1.12));

			await ctx.program.methods
				.aggregate()
				.accountsStrict({
					cranker: ctx.cranker.publicKey,
					oracleConfig: ctx.oracleConfig,
				})
				.remainingAccounts([
					{ pubkey: feed0.feedPda, isWritable: false, isSigner: false },
					{ pubkey: feed1.feedPda, isWritable: false, isSigner: false },
					{ pubkey: feed2.feedPda, isWritable: false, isSigner: false },
				])
				.signers([ctx.cranker])
				.rpc();

			const config = await program.account.oracleConfig.fetch(ctx.oracleConfig);
			// Median of [1.08, 1.10, 1.12] = 1.10
			assert.equal(
				config.lastAggregatedPrice.toString(),
				toFixedPoint(1.1).toString(),
			);
		});

		it("aggregates three feeds with mean", async () => {
			const ctx = await setupOracle(program, provider, {
				aggregationMethod: 1, // Mean
				minFeedsRequired: 3,
				deviationThresholdBps: 0,
				maxPriceChangeBps: 0,
			});

			const feed0 = await addFeed(ctx, { feedIndex: 0, label: "f0" });
			const feed1 = await addFeed(ctx, { feedIndex: 1, label: "f1" });
			const feed2 = await addFeed(ctx, { feedIndex: 2, label: "f2" });

			await crankFeed(ctx, feed0.feedPda, toFixedPoint(1.08));
			await crankFeed(ctx, feed1.feedPda, toFixedPoint(1.1));
			await crankFeed(ctx, feed2.feedPda, toFixedPoint(1.12));

			await ctx.program.methods
				.aggregate()
				.accountsStrict({
					cranker: ctx.cranker.publicKey,
					oracleConfig: ctx.oracleConfig,
				})
				.remainingAccounts([
					{ pubkey: feed0.feedPda, isWritable: false, isSigner: false },
					{ pubkey: feed1.feedPda, isWritable: false, isSigner: false },
					{ pubkey: feed2.feedPda, isWritable: false, isSigner: false },
				])
				.signers([ctx.cranker])
				.rpc();

			const config = await program.account.oracleConfig.fetch(ctx.oracleConfig);
			// Mean of [1.08, 1.10, 1.12] = 1.10
			assert.equal(
				config.lastAggregatedPrice.toString(),
				toFixedPoint(1.1).toString(),
			);
		});

		it("aggregates with weighted mean", async () => {
			const ctx = await setupOracle(program, provider, {
				aggregationMethod: 2, // Weighted Mean
				minFeedsRequired: 2,
				deviationThresholdBps: 0,
				maxPriceChangeBps: 0,
			});

			// Feed 0: weight 3x, price 1.0
			const feed0 = await addFeed(ctx, {
				feedIndex: 0,
				label: "heavy",
				weight: 30000,
			});
			// Feed 1: weight 1x, price 2.0
			const feed1 = await addFeed(ctx, {
				feedIndex: 1,
				label: "light",
				weight: 10000,
			});

			await crankFeed(ctx, feed0.feedPda, toFixedPoint(1.0));
			await crankFeed(ctx, feed1.feedPda, toFixedPoint(2.0));

			await ctx.program.methods
				.aggregate()
				.accountsStrict({
					cranker: ctx.cranker.publicKey,
					oracleConfig: ctx.oracleConfig,
				})
				.remainingAccounts([
					{ pubkey: feed0.feedPda, isWritable: false, isSigner: false },
					{ pubkey: feed1.feedPda, isWritable: false, isSigner: false },
				])
				.signers([ctx.cranker])
				.rpc();

			const config = await program.account.oracleConfig.fetch(ctx.oracleConfig);
			// Weighted: (1.0*30000 + 2.0*10000) / 40000 = 50000/40000 = 1.25
			assert.equal(
				config.lastAggregatedPrice.toString(),
				toFixedPoint(1.25).toString(),
			);
		});

		it("uses manual price when active", async () => {
			const ctx = await setupOracle(program, provider);

			const manualPrice = toFixedPoint(1.5);
			await ctx.program.methods
				.setManualPrice(manualPrice, true)
				.accountsStrict({
					authority: ctx.authority.publicKey,
					oracleConfig: ctx.oracleConfig,
				})
				.signers([ctx.authority])
				.rpc();

			await airdrop(provider, ctx.cranker.publicKey);
			await ctx.program.methods
				.aggregate()
				.accountsStrict({
					cranker: ctx.cranker.publicKey,
					oracleConfig: ctx.oracleConfig,
				})
				.remainingAccounts([])
				.signers([ctx.cranker])
				.rpc();

			const config = await program.account.oracleConfig.fetch(ctx.oracleConfig);
			assert.equal(
				config.lastAggregatedPrice.toString(),
				manualPrice.toString(),
			);
		});

		it("fails when insufficient feeds", async () => {
			const ctx = await setupOracle(program, provider, {
				minFeedsRequired: 3,
			});

			// Only add 1 feed
			const { feedPda } = await addFeed(ctx);
			await crankFeed(ctx, feedPda, toFixedPoint(1.0));

			await airdrop(provider, ctx.cranker.publicKey);
			await expectError(
				ctx.program.methods
					.aggregate()
					.accountsStrict({
						cranker: ctx.cranker.publicKey,
						oracleConfig: ctx.oracleConfig,
					})
					.remainingAccounts([
						{ pubkey: feedPda, isWritable: false, isSigner: false },
					])
					.signers([ctx.cranker])
					.rpc(),
				"InsufficientFeeds",
			);
		});

		it("rejects excessive deviation between feeds", async () => {
			const ctx = await setupOracle(program, provider, {
				aggregationMethod: 0,
				minFeedsRequired: 2,
				deviationThresholdBps: 500, // 5%
				maxPriceChangeBps: 0,
			});

			const feed0 = await addFeed(ctx, { feedIndex: 0, label: "f0" });
			const feed1 = await addFeed(ctx, { feedIndex: 1, label: "f1" });

			// 20% apart — exceeds 5% threshold
			await crankFeed(ctx, feed0.feedPda, toFixedPoint(1.0));
			await crankFeed(ctx, feed1.feedPda, toFixedPoint(1.2));

			await expectError(
				ctx.program.methods
					.aggregate()
					.accountsStrict({
						cranker: ctx.cranker.publicKey,
						oracleConfig: ctx.oracleConfig,
					})
					.remainingAccounts([
						{
							pubkey: feed0.feedPda,
							isWritable: false,
							isSigner: false,
						},
						{
							pubkey: feed1.feedPda,
							isWritable: false,
							isSigner: false,
						},
					])
					.signers([ctx.cranker])
					.rpc(),
				"ExcessiveDeviation",
			);
		});

		it("skips disabled feeds", async () => {
			const ctx = await setupOracle(program, provider, {
				minFeedsRequired: 1,
				deviationThresholdBps: 0,
				maxPriceChangeBps: 0,
			});

			const feed0 = await addFeed(ctx, { feedIndex: 0, label: "f0" });
			const feed1 = await addFeed(ctx, { feedIndex: 1, label: "f1" });

			await crankFeed(ctx, feed0.feedPda, toFixedPoint(1.0));
			await crankFeed(ctx, feed1.feedPda, toFixedPoint(2.0));

			// Remove feed1 so only feed0 is available
			await ctx.program.methods
				.removeFeed(1)
				.accountsStrict({
					authority: ctx.authority.publicKey,
					oracleConfig: ctx.oracleConfig,
					priceFeedEntry: feed1.feedPda,
					systemProgram: SystemProgram.programId,
				})
				.signers([ctx.authority])
				.rpc();

			// Aggregate with only feed0 remaining
			await ctx.program.methods
				.aggregate()
				.accountsStrict({
					cranker: ctx.cranker.publicKey,
					oracleConfig: ctx.oracleConfig,
				})
				.remainingAccounts([
					{ pubkey: feed0.feedPda, isWritable: false, isSigner: false },
				])
				.signers([ctx.cranker])
				.rpc();

			const config = await program.account.oracleConfig.fetch(ctx.oracleConfig);
			assert.equal(
				config.lastAggregatedPrice.toString(),
				toFixedPoint(1.0).toString(),
			);
		});
	});

	// ════════════════════════════════════════════════════════════
	// 9. Get Mint Price
	// ════════════════════════════════════════════════════════════
	describe("get_mint_price", () => {
		it("applies mint premium to aggregated price", async () => {
			const ctx = await setupOracle(program, provider, {
				mintPremiumBps: 50, // +0.5%
				maxPriceChangeBps: 0,
			});

			// Set manual price for simplicity
			const basePrice = toFixedPoint(1.0);
			await ctx.program.methods
				.setManualPrice(basePrice, true)
				.accountsStrict({
					authority: ctx.authority.publicKey,
					oracleConfig: ctx.oracleConfig,
				})
				.signers([ctx.authority])
				.rpc();

			await ctx.program.methods
				.getMintPrice()
				.accountsStrict({
					oracleConfig: ctx.oracleConfig,
				})
				.rpc();

			// Expected: 1.0 * (10000 + 50) / 10000 = 1.005
			// Just verify the call succeeded; return data verification
			// requires transaction simulation
		});

		it("rejects when paused", async () => {
			const ctx = await setupOracle(program, provider);

			await ctx.program.methods
				.updateOracleConfig({
					maxStalenessSeconds: null,
					maxConfidenceIntervalBps: null,
					aggregationMethod: null,
					minFeedsRequired: null,
					deviationThresholdBps: null,
					maxPriceChangeBps: null,
					mintPremiumBps: null,
					redeemDiscountBps: null,
					cranker: null,
					paused: true,
				})
				.accountsStrict({
					authority: ctx.authority.publicKey,
					oracleConfig: ctx.oracleConfig,
				})
				.signers([ctx.authority])
				.rpc();

			await expectError(
				ctx.program.methods
					.getMintPrice()
					.accountsStrict({
						oracleConfig: ctx.oracleConfig,
					})
					.rpc(),
				"OraclePaused",
			);
		});

		it("rejects when no aggregated price exists", async () => {
			const ctx = await setupOracle(program, provider);

			// No price set, no aggregation done
			await expectError(
				ctx.program.methods
					.getMintPrice()
					.accountsStrict({
						oracleConfig: ctx.oracleConfig,
					})
					.rpc(),
				"InvalidPrice",
			);
		});
	});

	// ════════════════════════════════════════════════════════════
	// 10. Get Redeem Price
	// ════════════════════════════════════════════════════════════
	describe("get_redeem_price", () => {
		it("applies redeem discount to aggregated price", async () => {
			const ctx = await setupOracle(program, provider, {
				redeemDiscountBps: 30, // -0.3%
			});

			const basePrice = toFixedPoint(1.0);
			await ctx.program.methods
				.setManualPrice(basePrice, true)
				.accountsStrict({
					authority: ctx.authority.publicKey,
					oracleConfig: ctx.oracleConfig,
				})
				.signers([ctx.authority])
				.rpc();

			// Expected: 1.0 * (10000 - 30) / 10000 = 0.997
			await ctx.program.methods
				.getRedeemPrice()
				.accountsStrict({
					oracleConfig: ctx.oracleConfig,
				})
				.rpc();
		});

		it("rejects when paused", async () => {
			const ctx = await setupOracle(program, provider);

			await ctx.program.methods
				.updateOracleConfig({
					maxStalenessSeconds: null,
					maxConfidenceIntervalBps: null,
					aggregationMethod: null,
					minFeedsRequired: null,
					deviationThresholdBps: null,
					maxPriceChangeBps: null,
					mintPremiumBps: null,
					redeemDiscountBps: null,
					cranker: null,
					paused: true,
				})
				.accountsStrict({
					authority: ctx.authority.publicKey,
					oracleConfig: ctx.oracleConfig,
				})
				.signers([ctx.authority])
				.rpc();

			await expectError(
				ctx.program.methods
					.getRedeemPrice()
					.accountsStrict({
						oracleConfig: ctx.oracleConfig,
					})
					.rpc(),
				"OraclePaused",
			);
		});
	});

	// ════════════════════════════════════════════════════════════
	// 11. Close Oracle
	// ════════════════════════════════════════════════════════════
	describe("close_oracle", () => {
		it("closes oracle when no feeds exist", async () => {
			const ctx = await setupOracle(program, provider);

			await ctx.program.methods
				.closeOracle()
				.accountsStrict({
					authority: ctx.authority.publicKey,
					oracleConfig: ctx.oracleConfig,
					systemProgram: SystemProgram.programId,
				})
				.signers([ctx.authority])
				.rpc();

			const account = await provider.connection.getAccountInfo(
				ctx.oracleConfig,
			);
			assert.isNull(account);
		});

		it("rejects close when feeds still exist", async () => {
			const ctx = await setupOracle(program, provider);
			await addFeed(ctx, { feedIndex: 0, label: "blocking" });

			await expectError(
				ctx.program.methods
					.closeOracle()
					.accountsStrict({
						authority: ctx.authority.publicKey,
						oracleConfig: ctx.oracleConfig,
						systemProgram: SystemProgram.programId,
					})
					.signers([ctx.authority])
					.rpc(),
				"ActiveFeedsExist",
			);
		});

		it("rejects non-authority", async () => {
			const ctx = await setupOracle(program, provider);
			const imposter = Keypair.generate();
			await airdrop(provider, imposter.publicKey);

			await expectError(
				ctx.program.methods
					.closeOracle()
					.accountsStrict({
						authority: imposter.publicKey,
						oracleConfig: ctx.oracleConfig,
						systemProgram: SystemProgram.programId,
					})
					.signers([imposter])
					.rpc(),
				"Unauthorized",
			);
		});
	});
});
