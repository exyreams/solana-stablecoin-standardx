import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { getAccount, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import { SssOracle } from "../target/types/sss_oracle";
import { SssToken } from "../target/types/sss_token";
import {
	addFeed,
	addMinter,
	airdrop,
	crankFeed,
	createTokenAccount,
	expectError,
	findMinterQuotaPda,
	findOracleConfigPda,
	mintTokens,
	OracleTestContext,
	setupOracle,
	setupSss1Token,
	TokenTestContext,
	toFixedPoint,
} from "./helpers";

describe("integration tests", () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const oracleProgram = anchor.workspace.SssOracle as Program<SssOracle>;
	const tokenProgram = anchor.workspace.SssToken as Program<SssToken>;

	// ════════════════════════════════════════════════════════════
	// Full lifecycle: Create oracle → feed → price → mint → burn → close
	// ════════════════════════════════════════════════════════════
	describe("full stablecoin lifecycle", () => {
		let oracleCtx: OracleTestContext | undefined;
		let tokenCtx: TokenTestContext | undefined;

		before(async () => {
			// Setup token and oracle once for all tests in this suite
			tokenCtx = await setupSss1Token(tokenProgram, provider);

			// Create oracle for that mint
			const cranker = Keypair.generate();
			const [oracleConfig] = findOracleConfigPda(
				tokenCtx.mint.publicKey,
				oracleProgram.programId,
			);

			await airdrop(provider, tokenCtx.authority.publicKey);

			await oracleProgram.methods
				.initializeOracle({
					baseCurrency: "EUR",
					quoteCurrency: "USD",
					maxStalenessSeconds: new anchor.BN(600),
					maxConfidenceIntervalBps: 100,
					aggregationMethod: 0,
					minFeedsRequired: 1,
					deviationThresholdBps: 500,
					maxPriceChangeBps: 1000,
					mintPremiumBps: 25,
					redeemDiscountBps: 25,
					cranker: cranker.publicKey,
				})
				.accountsStrict({
					authority: tokenCtx.authority.publicKey,
					mint: tokenCtx.mint.publicKey,
					oracleConfig,
					systemProgram: SystemProgram.programId,
				})
				.signers([tokenCtx.authority])
				.rpc();

			oracleCtx = {
				program: oracleProgram,
				provider,
				authority: tokenCtx.authority,
				cranker,
				mint: tokenCtx.mint,
				oracleConfig,
				oracleConfigBump: 0,
			};

			const config =
				await oracleProgram.account.oracleConfig.fetch(oracleConfig);
			assert.ok(config.mint.equals(tokenCtx.mint.publicKey));
			assert.equal(config.baseCurrency, "EUR");
		});

		it("step 1: verify oracle initialization", async () => {
			assert.isDefined(oracleCtx);
			assert.isDefined(tokenCtx);
			const config = await oracleProgram.account.oracleConfig.fetch(
				oracleCtx!.oracleConfig,
			);
			assert.ok(config.mint.equals(tokenCtx!.mint.publicKey));
			assert.equal(config.baseCurrency, "EUR");
		});

		it("step 2: add feeds and crank prices", async () => {
			assert.isDefined(oracleCtx);
			const feed0 = await addFeed(oracleCtx!, {
				feedIndex: 0,
				label: "primary-eur-usd",
				weight: 20000,
			});
			const feed1 = await addFeed(oracleCtx!, {
				feedIndex: 1,
				label: "backup-eur-usd",
				weight: 10000,
			});

			// Crank both feeds
			await crankFeed(
				oracleCtx!,
				feed0.feedPda,
				toFixedPoint(1.085),
				toFixedPoint(0.001),
			);
			await crankFeed(
				oracleCtx!,
				feed1.feedPda,
				toFixedPoint(1.087),
				toFixedPoint(0.002),
			);

			const f0 = await oracleProgram.account.priceFeedEntry.fetch(
				feed0.feedPda,
			);
			assert.equal(f0.lastPrice.toString(), toFixedPoint(1.085).toString());

			const f1 = await oracleProgram.account.priceFeedEntry.fetch(
				feed1.feedPda,
			);
			assert.equal(f1.lastPrice.toString(), toFixedPoint(1.087).toString());
		});

		it("step 3: aggregate price from feeds", async () => {
			assert.isDefined(oracleCtx);
			const feed0Pda = (
				await addFeed(oracleCtx!, {
					feedIndex: 2,
					label: "agg-test",
				})
			).feedPda;
			await crankFeed(oracleCtx!, feed0Pda, toFixedPoint(1.1));

			// Update min_feeds to allow aggregation with available feeds
			await oracleCtx!.program.methods
				.updateOracleConfig({
					maxStalenessSeconds: null,
					maxConfidenceIntervalBps: null,
					aggregationMethod: null,
					minFeedsRequired: 1,
					deviationThresholdBps: 0, // disable for this test
					maxPriceChangeBps: null,
					mintPremiumBps: null,
					redeemDiscountBps: null,
					cranker: null,
					paused: null,
				})
				.accountsStrict({
					authority: oracleCtx!.authority.publicKey,
					oracleConfig: oracleCtx!.oracleConfig,
				})
				.signers([oracleCtx!.authority])
				.rpc();

			await airdrop(provider, oracleCtx!.cranker.publicKey);
			await oracleCtx!.program.methods
				.aggregate()
				.accountsStrict({
					cranker: oracleCtx!.cranker.publicKey,
					oracleConfig: oracleCtx!.oracleConfig,
				})
				.remainingAccounts([
					{
						pubkey: feed0Pda,
						isWritable: false,
						isSigner: false,
					},
				])
				.signers([oracleCtx!.cranker])
				.rpc();

			const config = await oracleProgram.account.oracleConfig.fetch(
				oracleCtx!.oracleConfig,
			);
			assert.isAbove(config.lastAggregatedPrice.toNumber(), 0);
		});

		it("step 4: mint tokens using the stablecoin program", async () => {
			assert.isDefined(tokenCtx);
			assert.isDefined(tokenCtx);
			const minter = Keypair.generate();
			await airdrop(provider, minter.publicKey);

			const minterQuota = await addMinter(
				tokenCtx!,
				minter.publicKey,
				100_000_000,
			);

			const ata = await createTokenAccount(
				provider,
				tokenCtx!.mint.publicKey,
				minter.publicKey,
				tokenCtx!.authority,
			);

			await mintTokens(tokenCtx!, minter, minterQuota, ata, 50_000_000);

			const account = await getAccount(
				provider.connection,
				ata,
				undefined,
				TOKEN_2022_PROGRAM_ID,
			);
			assert.equal(Number(account.amount), 50_000_000);
		});

		it("step 5: burn tokens", async () => {
			assert.isDefined(tokenCtx);
			const state = await tokenProgram.account.stablecoinState.fetch(
				tokenCtx!.stablecoinState,
			);
			const currentSupply = state.totalSupply.toNumber();

			if (currentSupply > 0) {
				// Authority is the burner
				const authorityAta = await createTokenAccount(
					provider,
					tokenCtx!.mint.publicKey,
					tokenCtx!.authority.publicKey,
					tokenCtx!.authority,
				);

				// Need to mint to authority first to burn
				const minterQuota = await addMinter(
					tokenCtx!,
					tokenCtx!.authority.publicKey,
					10_000,
				);
				await mintTokens(
					tokenCtx!,
					tokenCtx!.authority,
					minterQuota,
					authorityAta,
					5_000,
				);

				await tokenProgram.methods
					.burn(new anchor.BN(5_000))
					.accountsStrict({
						burner: tokenCtx!.authority.publicKey,
						stablecoinState: tokenCtx!.stablecoinState,
						rolesConfig: tokenCtx!.rolesConfig,
						mint: tokenCtx!.mint.publicKey,
						fromTokenAccount: authorityAta,
						tokenProgram: TOKEN_2022_PROGRAM_ID,
					})
					.signers([tokenCtx!.authority])
					.rpc();
			}
		});
	});

	// ════════════════════════════════════════════════════════════
	// Emergency scenarios
	// ════════════════════════════════════════════════════════════
	describe("emergency scenarios", () => {
		it("oracle pause → manual price → token operations continue", async () => {
			const tokenCtx = await setupSss1Token(tokenProgram, provider);
			const oracleCtx = await setupOracle(oracleProgram, provider);

			// Simulate emergency: pause oracle
			await oracleCtx.program.methods
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
					authority: oracleCtx.authority.publicKey,
					oracleConfig: oracleCtx.oracleConfig,
				})
				.signers([oracleCtx.authority])
				.rpc();

			// Set manual price (works while paused because set_manual_price
			// doesn't check pause state)
			await oracleCtx.program.methods
				.setManualPrice(toFixedPoint(1.0), true)
				.accountsStrict({
					authority: oracleCtx.authority.publicKey,
					oracleConfig: oracleCtx.oracleConfig,
				})
				.signers([oracleCtx.authority])
				.rpc();

			const config = await oracleProgram.account.oracleConfig.fetch(
				oracleCtx.oracleConfig,
			);
			assert.equal(config.manualPriceActive, true);
			assert.equal(config.paused, true);
			// Aggregated price should reflect manual price
			assert.equal(
				config.lastAggregatedPrice.toString(),
				toFixedPoint(1.0).toString(),
			);

			// Token operations should still work (token is independent of oracle pause)
			const minter = Keypair.generate();
			await airdrop(provider, minter.publicKey);
			const minterQuota = await addMinter(
				tokenCtx,
				minter.publicKey,
				1_000_000,
			);
			const ata = await createTokenAccount(
				provider,
				tokenCtx.mint.publicKey,
				minter.publicKey,
				tokenCtx.authority,
			);
			await mintTokens(tokenCtx, minter, minterQuota, ata, 100);

			const account = await getAccount(
				provider.connection,
				ata,
				undefined,
				TOKEN_2022_PROGRAM_ID,
			);
			assert.equal(Number(account.amount), 100);
		});

		it("token pause blocks minting but not authority operations", async () => {
			const tokenCtx = await setupSss1Token(tokenProgram, provider);

			// Pause token
			await tokenProgram.methods
				.pause("Security incident")
				.accountsStrict({
					pauser: tokenCtx.authority.publicKey,
					stablecoinState: tokenCtx.stablecoinState,
					rolesConfig: tokenCtx.rolesConfig,
				})
				.signers([tokenCtx.authority])
				.rpc();

			// Minting should fail
			const minter = Keypair.generate();
			await airdrop(provider, minter.publicKey);
			const minterQuota = await addMinter(
				tokenCtx,
				minter.publicKey,
				1_000_000,
			);
			const ata = await createTokenAccount(
				provider,
				tokenCtx.mint.publicKey,
				minter.publicKey,
				tokenCtx.authority,
			);

			await expectError(
				mintTokens(tokenCtx, minter, minterQuota, ata, 100),
				"Paused",
			);

			// Role updates should still work
			const newPauser = Keypair.generate();
			await tokenProgram.methods
				.updateRoles({
					burner: null,
					pauser: newPauser.publicKey,
					blacklister: null,
					seizer: null,
				})
				.accountsStrict({
					authority: tokenCtx.authority.publicKey,
					stablecoinState: tokenCtx.stablecoinState,
					rolesConfig: tokenCtx.rolesConfig,
				})
				.signers([tokenCtx.authority])
				.rpc();

			// Unpause with new pauser
			await airdrop(provider, newPauser.publicKey);
			await tokenProgram.methods
				.unpause()
				.accountsStrict({
					pauser: newPauser.publicKey,
					stablecoinState: tokenCtx.stablecoinState,
					rolesConfig: tokenCtx.rolesConfig,
				})
				.signers([newPauser])
				.rpc();

			// Now minting should work again
			await mintTokens(tokenCtx, minter, minterQuota, ata, 100);
			const account = await getAccount(
				provider.connection,
				ata,
				undefined,
				TOKEN_2022_PROGRAM_ID,
			);
			assert.equal(Number(account.amount), 100);
		});
	});

	// ════════════════════════════════════════════════════════════
	// Authority transfer chain
	// ════════════════════════════════════════════════════════════
	describe("authority transfer chain", () => {
		it("new authority can perform all operations after transfer", async () => {
			const tokenCtx = await setupSss1Token(tokenProgram, provider);
			const newMaster = Keypair.generate();
			await airdrop(provider, newMaster.publicKey);

			// Transfer authority
			await tokenProgram.methods
				.transferAuthority(newMaster.publicKey)
				.accountsStrict({
					caller: tokenCtx.authority.publicKey,
					stablecoinState: tokenCtx.stablecoinState,
					rolesConfig: tokenCtx.rolesConfig,
				})
				.signers([tokenCtx.authority])
				.rpc();

			await tokenProgram.methods
				.transferAuthority(null)
				.accountsStrict({
					caller: newMaster.publicKey,
					stablecoinState: tokenCtx.stablecoinState,
					rolesConfig: tokenCtx.rolesConfig,
				})
				.signers([newMaster])
				.rpc();

			// New master should be able to add minters
			const minter = Keypair.generate();
			const [minterQuota] = findMinterQuotaPda(
				tokenCtx.mint.publicKey,
				minter.publicKey,
				tokenProgram.programId,
			);

			await tokenProgram.methods
				.addMinter(new anchor.BN(1_000_000))
				.accountsStrict({
					authority: newMaster.publicKey,
					stablecoinState: tokenCtx.stablecoinState,
					rolesConfig: tokenCtx.rolesConfig,
					minter: minter.publicKey,
					minterQuota,
					systemProgram: SystemProgram.programId,
				})
				.signers([newMaster])
				.rpc();

			// Old master should NOT be able to
			const anotherMinter = Keypair.generate();
			const [anotherMinterQuota] = findMinterQuotaPda(
				tokenCtx.mint.publicKey,
				anotherMinter.publicKey,
				tokenProgram.programId,
			);

			await expectError(
				tokenProgram.methods
					.addMinter(new anchor.BN(1_000_000))
					.accountsStrict({
						authority: tokenCtx.authority.publicKey,
						stablecoinState: tokenCtx.stablecoinState,
						rolesConfig: tokenCtx.rolesConfig,
						minter: anotherMinter.publicKey,
						minterQuota: anotherMinterQuota,
						systemProgram: SystemProgram.programId,
					})
					.signers([tokenCtx.authority])
					.rpc(),
				"Unauthorized",
			);
		});
	});

	// ════════════════════════════════════════════════════════════
	// Multi-minter scenario
	// ════════════════════════════════════════════════════════════
	describe("multi-minter scenario", () => {
		it("independent minters with separate quotas", async () => {
			const tokenCtx = await setupSss1Token(tokenProgram, provider);

			const minterA = Keypair.generate();
			const minterB = Keypair.generate();
			await airdrop(provider, minterA.publicKey);
			await airdrop(provider, minterB.publicKey);

			const quotaA = await addMinter(tokenCtx, minterA.publicKey, 1_000);
			const quotaB = await addMinter(tokenCtx, minterB.publicKey, 500);

			const ataA = await createTokenAccount(
				provider,
				tokenCtx.mint.publicKey,
				minterA.publicKey,
				tokenCtx.authority,
			);
			const ataB = await createTokenAccount(
				provider,
				tokenCtx.mint.publicKey,
				minterB.publicKey,
				tokenCtx.authority,
			);

			// A mints up to quota
			await mintTokens(tokenCtx, minterA, quotaA, ataA, 1_000);

			// A can't mint more
			await expectError(
				mintTokens(tokenCtx, minterA, quotaA, ataA, 1),
				"QuotaExceeded",
			);

			// B still has quota
			await mintTokens(tokenCtx, minterB, quotaB, ataB, 500);

			// B also exhausted
			await expectError(
				mintTokens(tokenCtx, minterB, quotaB, ataB, 1),
				"QuotaExceeded",
			);

			// Check total supply
			const state = await tokenProgram.account.stablecoinState.fetch(
				tokenCtx.stablecoinState,
			);
			assert.equal(state.totalSupply.toNumber(), 1_500);
		});
	});
});
