import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { getAccount, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import { SssToken } from "../target/types/sss_token";
import {
	addMinter,
	airdrop,
	createTokenAccount,
	expectError,
	findBlacklistEntryPda,
	findMinterQuotaPda,
	findRolesConfigPda,
	findStablecoinStatePda,
	mintTokens,
	setupSss1Token,
	sss1Config,
	TokenTestContext,
} from "./helpers";

// Declare Buffer for Node.js environment
declare const Buffer: {
	from(data: string | Uint8Array | number[]): Uint8Array;
};

describe("sss-token", () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);
	const program = anchor.workspace.SssToken as Program<SssToken>;

	// ════════════════════════════════════════════════════════════
	// 1. Initialize
	// ════════════════════════════════════════════════════════════
	describe("initialize", () => {
		it("creates SSS-1 stablecoin with correct state", async () => {
			const ctx = await setupSss1Token(program, provider);

			const state = await program.account.stablecoinState.fetch(
				ctx.stablecoinState,
			);

			assert.equal(state.version, 1);
			assert.ok(state.mint.equals(ctx.mint.publicKey));
			assert.equal(state.name, "Test Stablecoin");
			assert.equal(state.symbol, "TUSD");
			assert.equal(state.decimals, 6);
			assert.equal(state.enablePermanentDelegate, false);
			assert.equal(state.enableTransferHook, false);
			assert.equal(state.defaultAccountFrozen, false);
			assert.equal(state.enableConfidentialTransfers, false);
			assert.equal(state.paused, false);
			assert.equal(state.totalSupply.toNumber(), 0);

			const roles = await program.account.rolesConfig.fetch(ctx.rolesConfig);
			assert.ok(roles.masterAuthority.equals(ctx.authority.publicKey));
			assert.ok(roles.burner.equals(ctx.authority.publicKey));
			assert.ok(roles.pauser.equals(ctx.authority.publicKey));
			assert.ok(roles.blacklister.equals(ctx.authority.publicKey));
			assert.ok(roles.seizer.equals(ctx.authority.publicKey));
			assert.isNull(roles.pendingMaster);
		});

		it("rejects name too long (>32 chars)", async () => {
			const authority = Keypair.generate();
			const mint = Keypair.generate();
			await airdrop(provider, authority.publicKey);

			const [stablecoinState] = findStablecoinStatePda(
				mint.publicKey,
				program.programId,
			);
			const [rolesConfig] = findRolesConfigPda(
				mint.publicKey,
				program.programId,
			);

			const config = {
				...sss1Config(),
				name: "A".repeat(33),
			};

			await expectError(
				program.methods
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
					.rpc(),
				"NameTooLong",
			);
		});

		it("rejects symbol too long (>10 chars)", async () => {
			const authority = Keypair.generate();
			const mint = Keypair.generate();
			await airdrop(provider, authority.publicKey);

			const [stablecoinState] = findStablecoinStatePda(
				mint.publicKey,
				program.programId,
			);
			const [rolesConfig] = findRolesConfigPda(
				mint.publicKey,
				program.programId,
			);

			const config = {
				...sss1Config(),
				symbol: "TOOLONGSYMB",
			};

			await expectError(
				program.methods
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
					.rpc(),
				"SymbolTooLong",
			);
		});

		it("rejects URI too long (>200 chars)", async () => {
			const authority = Keypair.generate();
			const mint = Keypair.generate();
			await airdrop(provider, authority.publicKey);

			const [stablecoinState] = findStablecoinStatePda(
				mint.publicKey,
				program.programId,
			);
			const [rolesConfig] = findRolesConfigPda(
				mint.publicKey,
				program.programId,
			);

			const config = {
				...sss1Config(),
				uri: "https://example.com/" + "x".repeat(200),
			};

			await expectError(
				program.methods
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
					.rpc(),
				"UriTooLong",
			);
		});

		it("rejects transfer hook enabled without program id", async () => {
			const authority = Keypair.generate();
			const mint = Keypair.generate();
			await airdrop(provider, authority.publicKey);

			const [stablecoinState] = findStablecoinStatePda(
				mint.publicKey,
				program.programId,
			);
			const [rolesConfig] = findRolesConfigPda(
				mint.publicKey,
				program.programId,
			);

			const config = {
				...sss1Config(),
				enableTransferHook: true,
				transferHookProgramId: null,
			};

			await expectError(
				program.methods
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
					.rpc(),
				"MissingTransferHookProgram",
			);
		});
	});

	// ════════════════════════════════════════════════════════════
	// 2. Metaplex Metadata
	// ════════════════════════════════════════════════════════════
	describe("metaplex_metadata", () => {
		it("creates Metaplex metadata PDA", async () => {
			const ctx = await setupSss1Token(program, provider);

			const metadataPda = PublicKey.findProgramAddressSync(
				[
					Buffer.from("metadata"),
					new PublicKey(
						"metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
					).toBuffer(),
					ctx.mint.publicKey.toBuffer(),
				],
				new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
			)[0];

			await program.methods
				.metaplexMetadata({
					name: "Test Stablecoin",
					symbol: "TUSD",
					uri: "https://example.com/metadata.json",
				})
				.accountsStrict({
					authority: ctx.authority.publicKey,
					mint: ctx.mint.publicKey,
					stablecoinState: ctx.stablecoinState,
					metadata: metadataPda,
					tokenMetadataProgram: new PublicKey(
						"metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
					),
					sysvarInstructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
					systemProgram: SystemProgram.programId,
					rent: anchor.web3.SYSVAR_RENT_PUBKEY,
				})
				.signers([ctx.authority, ctx.mint])
				.rpc();

			// Verify metadata was created
			const metadataAccount =
				await provider.connection.getAccountInfo(metadataPda);
			assert.isNotNull(metadataAccount);
		});

		it("rejects non-master-authority caller", async () => {
			const ctx = await setupSss1Token(program, provider);
			const imposter = Keypair.generate();
			await airdrop(provider, imposter.publicKey);

			const metadataPda = PublicKey.findProgramAddressSync(
				[
					Buffer.from("metadata"),
					new PublicKey(
						"metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
					).toBuffer(),
					ctx.mint.publicKey.toBuffer(),
				],
				new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
			)[0];

			await expectError(
				program.methods
					.metaplexMetadata({
						name: "Test Stablecoin",
						symbol: "TUSD",
						uri: "https://example.com/metadata.json",
					})
					.accountsStrict({
						authority: imposter.publicKey,
						mint: ctx.mint.publicKey,
						stablecoinState: ctx.stablecoinState,
						metadata: metadataPda,
						tokenMetadataProgram: new PublicKey(
							"metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
						),
						sysvarInstructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
						systemProgram: SystemProgram.programId,
						rent: anchor.web3.SYSVAR_RENT_PUBKEY,
					})
					.signers([imposter, ctx.mint])
					.rpc(),
				"unknown signer",
			);
		});
	});

	// ════════════════════════════════════════════════════════════
	// 3. Minter Management
	// ════════════════════════════════════════════════════════════
	describe("minter management", () => {
		let ctx: TokenTestContext;

		beforeEach(async () => {
			ctx = await setupSss1Token(program, provider);
		});

		describe("add_minter", () => {
			it("creates minter quota PDA", async () => {
				const minter = Keypair.generate();
				const quota = 1_000_000;

				const minterQuotaPda = await addMinter(ctx, minter.publicKey, quota);

				const q = await program.account.minterQuota.fetch(minterQuotaPda);
				assert.ok(q.mint.equals(ctx.mint.publicKey));
				assert.ok(q.minter.equals(minter.publicKey));
				assert.equal(q.quota.toNumber(), quota);
				assert.equal(q.minted.toNumber(), 0);
				assert.equal(q.active, true);
			});

			it("rejects non-master-authority", async () => {
				const imposter = Keypair.generate();
				const minter = Keypair.generate();
				await airdrop(provider, imposter.publicKey);

				const [minterQuota] = findMinterQuotaPda(
					ctx.mint.publicKey,
					minter.publicKey,
					program.programId,
				);

				await expectError(
					program.methods
						.addMinter(new anchor.BN(1_000_000))
						.accountsStrict({
							authority: imposter.publicKey,
							stablecoinState: ctx.stablecoinState,
							rolesConfig: ctx.rolesConfig,
							minter: minter.publicKey,
							minterQuota,
							systemProgram: SystemProgram.programId,
						})
						.signers([imposter])
						.rpc(),
					"Unauthorized",
				);
			});
		});

		describe("update_minter", () => {
			it("updates quota and resets minted", async () => {
				const minter = Keypair.generate();
				const minterQuotaPda = await addMinter(
					ctx,
					minter.publicKey,
					1_000_000,
				);

				await program.methods
					.updateMinter(
						new anchor.BN(2_000_000),
						true,
						true, // reset_minted
					)
					.accountsStrict({
						authority: ctx.authority.publicKey,
						stablecoinState: ctx.stablecoinState,
						rolesConfig: ctx.rolesConfig,
						minter: minter.publicKey,
						minterQuota: minterQuotaPda,
					})
					.signers([ctx.authority])
					.rpc();

				const q = await program.account.minterQuota.fetch(minterQuotaPda);
				assert.equal(q.quota.toNumber(), 2_000_000);
				assert.equal(q.minted.toNumber(), 0);
				assert.equal(q.active, true);
			});

			it("can deactivate a minter", async () => {
				const minter = Keypair.generate();
				const minterQuotaPda = await addMinter(
					ctx,
					minter.publicKey,
					1_000_000,
				);

				await program.methods
					.updateMinter(new anchor.BN(1_000_000), false, false)
					.accountsStrict({
						authority: ctx.authority.publicKey,
						stablecoinState: ctx.stablecoinState,
						rolesConfig: ctx.rolesConfig,
						minter: minter.publicKey,
						minterQuota: minterQuotaPda,
					})
					.signers([ctx.authority])
					.rpc();

				const q = await program.account.minterQuota.fetch(minterQuotaPda);
				assert.equal(q.active, false);
			});
		});

		describe("remove_minter", () => {
			it("closes minter quota PDA", async () => {
				const minter = Keypair.generate();
				const minterQuotaPda = await addMinter(
					ctx,
					minter.publicKey,
					1_000_000,
				);

				await program.methods
					.removeMinter()
					.accountsStrict({
						authority: ctx.authority.publicKey,
						stablecoinState: ctx.stablecoinState,
						rolesConfig: ctx.rolesConfig,
						minter: minter.publicKey,
						minterQuota: minterQuotaPda,
					})
					.signers([ctx.authority])
					.rpc();

				const account =
					await provider.connection.getAccountInfo(minterQuotaPda);
				assert.isNull(account);
			});
		});
	});

	// ════════════════════════════════════════════════════════════
	// 4. Mint
	// ════════════════════════════════════════════════════════════
	describe("mint", () => {
		let ctx: TokenTestContext;
		let minter: Keypair;
		let minterQuotaPda: PublicKey;
		let recipientAta: PublicKey;

		beforeEach(async () => {
			ctx = await setupSss1Token(program, provider);
			minter = Keypair.generate();
			await airdrop(provider, minter.publicKey);

			minterQuotaPda = await addMinter(
				ctx,
				minter.publicKey,
				10_000_000, // 10M tokens
			);

			recipientAta = await createTokenAccount(
				provider,
				ctx.mint.publicKey,
				minter.publicKey,
				ctx.authority,
			);
		});

		it("mints tokens and updates supply", async () => {
			const amount = 1_000_000;

			await mintTokens(ctx, minter, minterQuotaPda, recipientAta, amount);

			const account = await getAccount(
				provider.connection,
				recipientAta,
				undefined,
				TOKEN_2022_PROGRAM_ID,
			);
			assert.equal(Number(account.amount), amount);

			const q = await program.account.minterQuota.fetch(minterQuotaPda);
			assert.equal(q.minted.toNumber(), amount);

			const state = await program.account.stablecoinState.fetch(
				ctx.stablecoinState,
			);
			assert.equal(state.totalSupply.toNumber(), amount);
		});

		it("tracks cumulative minting", async () => {
			await mintTokens(ctx, minter, minterQuotaPda, recipientAta, 100);
			await mintTokens(ctx, minter, minterQuotaPda, recipientAta, 200);
			await mintTokens(ctx, minter, minterQuotaPda, recipientAta, 300);

			const q = await program.account.minterQuota.fetch(minterQuotaPda);
			assert.equal(q.minted.toNumber(), 600);
		});

		it("rejects mint exceeding quota", async () => {
			await expectError(
				mintTokens(ctx, minter, minterQuotaPda, recipientAta, 10_000_001),
				"QuotaExceeded",
			);
		});

		it("allows unlimited minting when quota = 0", async () => {
			const unlimitedMinter = Keypair.generate();
			await airdrop(provider, unlimitedMinter.publicKey);

			const quotaPda = await addMinter(
				ctx,
				unlimitedMinter.publicKey,
				0, // unlimited
			);

			const ata = await createTokenAccount(
				provider,
				ctx.mint.publicKey,
				unlimitedMinter.publicKey,
				ctx.authority,
			);

			await mintTokens(ctx, unlimitedMinter, quotaPda, ata, 999_999_999);

			const q = await program.account.minterQuota.fetch(quotaPda);
			assert.equal(q.minted.toNumber(), 999_999_999);
		});

		it("rejects zero amount", async () => {
			await expectError(
				mintTokens(ctx, minter, minterQuotaPda, recipientAta, 0),
				"ZeroAmount",
			);
		});

		it("rejects when paused", async () => {
			await program.methods
				.pause(null)
				.accountsStrict({
					pauser: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
				})
				.signers([ctx.authority])
				.rpc();

			await expectError(
				mintTokens(ctx, minter, minterQuotaPda, recipientAta, 1000),
				"Paused",
			);
		});

		it("rejects inactive minter", async () => {
			await program.methods
				.updateMinter(new anchor.BN(10_000_000), false, false)
				.accountsStrict({
					authority: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
					minter: minter.publicKey,
					minterQuota: minterQuotaPda,
				})
				.signers([ctx.authority])
				.rpc();

			await expectError(
				mintTokens(ctx, minter, minterQuotaPda, recipientAta, 1000),
				"MinterInactive",
			);
		});
	});

	// ════════════════════════════════════════════════════════════
	// 5. Burn
	// ════════════════════════════════════════════════════════════
	describe("burn", () => {
		let ctx: TokenTestContext;
		let burnerAta: PublicKey;

		beforeEach(async () => {
			ctx = await setupSss1Token(program, provider);

			const minterQuota = await addMinter(
				ctx,
				ctx.authority.publicKey,
				10_000_000,
			);

			burnerAta = await createTokenAccount(
				provider,
				ctx.mint.publicKey,
				ctx.authority.publicKey,
				ctx.authority,
			);

			await mintTokens(ctx, ctx.authority, minterQuota, burnerAta, 5_000_000);
		});

		it("burns tokens and updates supply", async () => {
			const burnAmount = 1_000_000;

			await program.methods
				.burn(new anchor.BN(burnAmount))
				.accountsStrict({
					burner: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
					mint: ctx.mint.publicKey,
					fromTokenAccount: burnerAta,
					tokenProgram: TOKEN_2022_PROGRAM_ID,
				})
				.signers([ctx.authority])
				.rpc();

			const account = await getAccount(
				provider.connection,
				burnerAta,
				undefined,
				TOKEN_2022_PROGRAM_ID,
			);
			assert.equal(Number(account.amount), 4_000_000);

			const state = await program.account.stablecoinState.fetch(
				ctx.stablecoinState,
			);
			assert.equal(state.totalSupply.toNumber(), 4_000_000);
		});

		it("rejects zero amount", async () => {
			await expectError(
				program.methods
					.burn(new anchor.BN(0))
					.accountsStrict({
						burner: ctx.authority.publicKey,
						stablecoinState: ctx.stablecoinState,
						rolesConfig: ctx.rolesConfig,
						mint: ctx.mint.publicKey,
						fromTokenAccount: burnerAta,
						tokenProgram: TOKEN_2022_PROGRAM_ID,
					})
					.signers([ctx.authority])
					.rpc(),
				"ZeroAmount",
			);
		});

		it("rejects when paused", async () => {
			await program.methods
				.pause(null)
				.accountsStrict({
					pauser: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
				})
				.signers([ctx.authority])
				.rpc();

			await expectError(
				program.methods
					.burn(new anchor.BN(1000))
					.accountsStrict({
						burner: ctx.authority.publicKey,
						stablecoinState: ctx.stablecoinState,
						rolesConfig: ctx.rolesConfig,
						mint: ctx.mint.publicKey,
						fromTokenAccount: burnerAta,
						tokenProgram: TOKEN_2022_PROGRAM_ID,
					})
					.signers([ctx.authority])
					.rpc(),
				"Paused",
			);
		});

		it("rejects unauthorized burner", async () => {
			const imposter = Keypair.generate();
			await airdrop(provider, imposter.publicKey);

			await expectError(
				program.methods
					.burn(new anchor.BN(1000))
					.accountsStrict({
						burner: imposter.publicKey,
						stablecoinState: ctx.stablecoinState,
						rolesConfig: ctx.rolesConfig,
						mint: ctx.mint.publicKey,
						fromTokenAccount: burnerAta,
						tokenProgram: TOKEN_2022_PROGRAM_ID,
					})
					.signers([imposter])
					.rpc(),
				"NotBurner",
			);
		});
	});

	// ════════════════════════════════════════════════════════════
	// 6. Pause / Unpause
	// ════════════════════════════════════════════════════════════
	describe("pause / unpause", () => {
		let ctx: TokenTestContext;

		beforeEach(async () => {
			ctx = await setupSss1Token(program, provider);
		});

		it("pauses successfully", async () => {
			await program.methods
				.pause("Maintenance")
				.accountsStrict({
					pauser: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
				})
				.signers([ctx.authority])
				.rpc();

			const state = await program.account.stablecoinState.fetch(
				ctx.stablecoinState,
			);
			assert.equal(state.paused, true);
		});

		it("pauses with null reason", async () => {
			await program.methods
				.pause(null)
				.accountsStrict({
					pauser: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
				})
				.signers([ctx.authority])
				.rpc();

			const state = await program.account.stablecoinState.fetch(
				ctx.stablecoinState,
			);
			assert.equal(state.paused, true);
		});

		it("unpauses successfully", async () => {
			await program.methods
				.pause(null)
				.accountsStrict({
					pauser: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
				})
				.signers([ctx.authority])
				.rpc();

			await program.methods
				.unpause()
				.accountsStrict({
					pauser: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
				})
				.signers([ctx.authority])
				.rpc();

			const state = await program.account.stablecoinState.fetch(
				ctx.stablecoinState,
			);
			assert.equal(state.paused, false);
		});

		it("rejects double pause", async () => {
			await program.methods
				.pause(null)
				.accountsStrict({
					pauser: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
				})
				.signers([ctx.authority])
				.rpc();

			await expectError(
				program.methods
					.pause(null)
					.accountsStrict({
						pauser: ctx.authority.publicKey,
						stablecoinState: ctx.stablecoinState,
						rolesConfig: ctx.rolesConfig,
					})
					.signers([ctx.authority])
					.rpc(),
				"AlreadyPaused",
			);
		});

		it("rejects unpause when not paused", async () => {
			await expectError(
				program.methods
					.unpause()
					.accountsStrict({
						pauser: ctx.authority.publicKey,
						stablecoinState: ctx.stablecoinState,
						rolesConfig: ctx.rolesConfig,
					})
					.signers([ctx.authority])
					.rpc(),
				"NotPaused",
			);
		});

		it("rejects unauthorized pauser", async () => {
			const imposter = Keypair.generate();
			await airdrop(provider, imposter.publicKey);

			await expectError(
				program.methods
					.pause(null)
					.accountsStrict({
						pauser: imposter.publicKey,
						stablecoinState: ctx.stablecoinState,
						rolesConfig: ctx.rolesConfig,
					})
					.signers([imposter])
					.rpc(),
				"NotPauser",
			);
		});

		it("designated pauser can pause", async () => {
			const pauser = Keypair.generate();
			await airdrop(provider, pauser.publicKey);

			await program.methods
				.updateRoles({
					burner: null,
					pauser: pauser.publicKey,
					blacklister: null,
					seizer: null,
				})
				.accountsStrict({
					authority: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
				})
				.signers([ctx.authority])
				.rpc();

			await program.methods
				.pause(null)
				.accountsStrict({
					pauser: pauser.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
				})
				.signers([pauser])
				.rpc();

			const state = await program.account.stablecoinState.fetch(
				ctx.stablecoinState,
			);
			assert.equal(state.paused, true);
		});

		// metaplex_metadata is NOT blocked by pause
		it("metaplex_metadata succeeds even when stablecoin is paused", async () => {
			await program.methods
				.pause(null)
				.accountsStrict({
					pauser: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
				})
				.signers([ctx.authority])
				.rpc();

			const metadataPda = PublicKey.findProgramAddressSync(
				[
					Buffer.from("metadata"),
					new PublicKey(
						"metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
					).toBuffer(),
					ctx.mint.publicKey.toBuffer(),
				],
				new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
			)[0];

			// Should still succeed — metadata creation has no pause guard
			await program.methods
				.metaplexMetadata({
					name: "Test Stablecoin",
					symbol: "TUSD",
					uri: "https://example.com/metadata.json",
				})
				.accountsStrict({
					authority: ctx.authority.publicKey,
					mint: ctx.mint.publicKey,
					stablecoinState: ctx.stablecoinState,
					metadata: metadataPda,
					tokenMetadataProgram: new PublicKey(
						"metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
					),
					sysvarInstructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
					systemProgram: SystemProgram.programId,
					rent: anchor.web3.SYSVAR_RENT_PUBKEY,
				})
				.signers([ctx.authority, ctx.mint])
				.rpc();

			const state = await program.account.stablecoinState.fetch(
				ctx.stablecoinState,
			);
			assert.equal(state.paused, true); // still paused
			assert.equal(state.name, "Test Stablecoin"); // metadata unchanged
		});
	});

	// ════════════════════════════════════════════════════════════
	// 7. Update Roles
	// ════════════════════════════════════════════════════════════
	describe("update_roles", () => {
		let ctx: TokenTestContext;

		beforeEach(async () => {
			ctx = await setupSss1Token(program, provider);
		});

		it("updates individual roles", async () => {
			const newBurner = Keypair.generate();
			const newPauser = Keypair.generate();

			await program.methods
				.updateRoles({
					burner: newBurner.publicKey,
					pauser: newPauser.publicKey,
					blacklister: null,
					seizer: null,
				})
				.accountsStrict({
					authority: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
				})
				.signers([ctx.authority])
				.rpc();

			const roles = await program.account.rolesConfig.fetch(ctx.rolesConfig);
			assert.ok(roles.burner.equals(newBurner.publicKey));
			assert.ok(roles.pauser.equals(newPauser.publicKey));
			assert.ok(roles.blacklister.equals(ctx.authority.publicKey));
			assert.ok(roles.seizer.equals(ctx.authority.publicKey));
		});

		it("updates all roles at once", async () => {
			const [b, p, bl, s] = [
				Keypair.generate(),
				Keypair.generate(),
				Keypair.generate(),
				Keypair.generate(),
			];

			await program.methods
				.updateRoles({
					burner: b.publicKey,
					pauser: p.publicKey,
					blacklister: bl.publicKey,
					seizer: s.publicKey,
				})
				.accountsStrict({
					authority: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
				})
				.signers([ctx.authority])
				.rpc();

			const roles = await program.account.rolesConfig.fetch(ctx.rolesConfig);
			assert.ok(roles.burner.equals(b.publicKey));
			assert.ok(roles.pauser.equals(p.publicKey));
			assert.ok(roles.blacklister.equals(bl.publicKey));
			assert.ok(roles.seizer.equals(s.publicKey));
		});

		it("rejects non-master-authority", async () => {
			const imposter = Keypair.generate();
			await airdrop(provider, imposter.publicKey);

			await expectError(
				program.methods
					.updateRoles({
						burner: imposter.publicKey,
						pauser: null,
						blacklister: null,
						seizer: null,
					})
					.accountsStrict({
						authority: imposter.publicKey,
						stablecoinState: ctx.stablecoinState,
						rolesConfig: ctx.rolesConfig,
					})
					.signers([imposter])
					.rpc(),
				"Unauthorized",
			);
		});
	});

	// ════════════════════════════════════════════════════════════
	// 8. Transfer Authority
	// ════════════════════════════════════════════════════════════
	describe("transfer_authority", () => {
		let ctx: TokenTestContext;

		beforeEach(async () => {
			ctx = await setupSss1Token(program, provider);
		});

		it("completes two-step transfer", async () => {
			const newMaster = Keypair.generate();
			await airdrop(provider, newMaster.publicKey);

			await program.methods
				.transferAuthority(newMaster.publicKey)
				.accountsStrict({
					caller: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
				})
				.signers([ctx.authority])
				.rpc();

			let roles = await program.account.rolesConfig.fetch(ctx.rolesConfig);
			assert.ok(
				roles.pendingMaster !== null &&
					new PublicKey(roles.pendingMaster).equals(newMaster.publicKey),
			);

			await program.methods
				.transferAuthority(null)
				.accountsStrict({
					caller: newMaster.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
				})
				.signers([newMaster])
				.rpc();

			roles = await program.account.rolesConfig.fetch(ctx.rolesConfig);
			assert.ok(roles.masterAuthority.equals(newMaster.publicKey));
			assert.isNull(roles.pendingMaster);
		});

		it("allows cancel by current master", async () => {
			const newMaster = Keypair.generate();

			await program.methods
				.transferAuthority(newMaster.publicKey)
				.accountsStrict({
					caller: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
				})
				.signers([ctx.authority])
				.rpc();

			await program.methods
				.transferAuthority(null)
				.accountsStrict({
					caller: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
				})
				.signers([ctx.authority])
				.rpc();

			const roles = await program.account.rolesConfig.fetch(ctx.rolesConfig);
			assert.isNull(roles.pendingMaster);
			assert.ok(roles.masterAuthority.equals(ctx.authority.publicKey));
		});

		it("rejects accept from wrong pubkey", async () => {
			const newMaster = Keypair.generate();
			const imposter = Keypair.generate();
			await airdrop(provider, imposter.publicKey);

			await program.methods
				.transferAuthority(newMaster.publicKey)
				.accountsStrict({
					caller: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
				})
				.signers([ctx.authority])
				.rpc();

			await expectError(
				program.methods
					.transferAuthority(null)
					.accountsStrict({
						caller: imposter.publicKey,
						stablecoinState: ctx.stablecoinState,
						rolesConfig: ctx.rolesConfig,
					})
					.signers([imposter])
					.rpc(),
				"NotPendingMaster",
			);
		});
	});

	// ════════════════════════════════════════════════════════════
	// 9. Freeze / Thaw Account
	// ════════════════════════════════════════════════════════════
	describe("freeze / thaw account", () => {
		let ctx: TokenTestContext;
		let targetOwner: Keypair;
		let targetAta: PublicKey;

		beforeEach(async () => {
			ctx = await setupSss1Token(program, provider);
			targetOwner = Keypair.generate();
			await airdrop(provider, targetOwner.publicKey);

			targetAta = await createTokenAccount(
				provider,
				ctx.mint.publicKey,
				targetOwner.publicKey,
				ctx.authority,
			);
		});

		it("freezes a token account", async () => {
			await program.methods
				.freezeAccount()
				.accountsStrict({
					authority: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
					mint: ctx.mint.publicKey,
					targetAccount: targetAta,
					tokenProgram: TOKEN_2022_PROGRAM_ID,
				})
				.signers([ctx.authority])
				.rpc();

			const account = await getAccount(
				provider.connection,
				targetAta,
				undefined,
				TOKEN_2022_PROGRAM_ID,
			);
			assert.equal(account.isFrozen, true);
		});

		it("thaws a frozen account", async () => {
			await program.methods
				.freezeAccount()
				.accountsStrict({
					authority: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
					mint: ctx.mint.publicKey,
					targetAccount: targetAta,
					tokenProgram: TOKEN_2022_PROGRAM_ID,
				})
				.signers([ctx.authority])
				.rpc();

			await program.methods
				.thawAccount()
				.accountsStrict({
					authority: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
					mint: ctx.mint.publicKey,
					targetAccount: targetAta,
					tokenProgram: TOKEN_2022_PROGRAM_ID,
				})
				.signers([ctx.authority])
				.rpc();

			const account = await getAccount(
				provider.connection,
				targetAta,
				undefined,
				TOKEN_2022_PROGRAM_ID,
			);
			assert.equal(account.isFrozen, false);
		});

		it("rejects unauthorized freeze", async () => {
			const imposter = Keypair.generate();
			await airdrop(provider, imposter.publicKey);

			await expectError(
				program.methods
					.freezeAccount()
					.accountsStrict({
						authority: imposter.publicKey,
						stablecoinState: ctx.stablecoinState,
						rolesConfig: ctx.rolesConfig,
						mint: ctx.mint.publicKey,
						targetAccount: targetAta,
						tokenProgram: TOKEN_2022_PROGRAM_ID,
					})
					.signers([imposter])
					.rpc(),
				"Unauthorized",
			);
		});
	});

	// ════════════════════════════════════════════════════════════
	// 10. Blacklist (SSS-2)
	// ════════════════════════════════════════════════════════════
	describe("blacklist (SSS-2)", () => {
		let ctx: TokenTestContext;

		beforeEach(async () => {
			ctx = await setupSss1Token(program, provider, {
				enablePermanentDelegate: true,
				enableTransferHook: true,
				transferHookProgramId: anchor.workspace.TransferHook
					? anchor.workspace.TransferHook.programId
					: Keypair.generate().publicKey,
			});
		});

		it("adds address to blacklist", async () => {
			const target = Keypair.generate();

			const [blacklistEntry] = findBlacklistEntryPda(
				ctx.mint.publicKey,
				target.publicKey,
				program.programId,
			);

			await program.methods
				.addToBlacklist("OFAC SDN match")
				.accountsStrict({
					blacklister: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
					target: target.publicKey,
					blacklistEntry,
					systemProgram: SystemProgram.programId,
				})
				.signers([ctx.authority])
				.rpc();

			const entry = await program.account.blacklistEntry.fetch(blacklistEntry);
			assert.ok(entry.mint.equals(ctx.mint.publicKey));
			assert.ok(entry.address.equals(target.publicKey));
			assert.equal(entry.reason, "OFAC SDN match");
			assert.isAbove(entry.timestamp.toNumber(), 0);
		});

		it("removes address from blacklist", async () => {
			const target = Keypair.generate();

			const [blacklistEntry] = findBlacklistEntryPda(
				ctx.mint.publicKey,
				target.publicKey,
				program.programId,
			);

			await program.methods
				.addToBlacklist("test")
				.accountsStrict({
					blacklister: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
					target: target.publicKey,
					blacklistEntry,
					systemProgram: SystemProgram.programId,
				})
				.signers([ctx.authority])
				.rpc();

			await program.methods
				.removeFromBlacklist()
				.accountsStrict({
					blacklister: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
					target: target.publicKey,
					blacklistEntry,
				})
				.signers([ctx.authority])
				.rpc();

			const account = await provider.connection.getAccountInfo(blacklistEntry);
			assert.isNull(account);
		});

		it("truncates long reason to 128 bytes", async () => {
			const target = Keypair.generate();

			const [blacklistEntry] = findBlacklistEntryPda(
				ctx.mint.publicKey,
				target.publicKey,
				program.programId,
			);

			const longReason = "A".repeat(200);

			await program.methods
				.addToBlacklist(longReason)
				.accountsStrict({
					blacklister: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
					target: target.publicKey,
					blacklistEntry,
					systemProgram: SystemProgram.programId,
				})
				.signers([ctx.authority])
				.rpc();

			const entry = await program.account.blacklistEntry.fetch(blacklistEntry);
			assert.isAtMost(Buffer.from(entry.reason).length, 128);
		});

		it("rejects blacklist when compliance not enabled", async () => {
			const sss1Ctx = await setupSss1Token(program, provider);
			const target = Keypair.generate();

			const [blacklistEntry] = findBlacklistEntryPda(
				sss1Ctx.mint.publicKey,
				target.publicKey,
				program.programId,
			);

			await expectError(
				program.methods
					.addToBlacklist("test")
					.accountsStrict({
						blacklister: sss1Ctx.authority.publicKey,
						stablecoinState: sss1Ctx.stablecoinState,
						rolesConfig: sss1Ctx.rolesConfig,
						target: target.publicKey,
						blacklistEntry,
						systemProgram: SystemProgram.programId,
					})
					.signers([sss1Ctx.authority])
					.rpc(),
				"ComplianceNotEnabled",
			);
		});

		it("rejects unauthorized blacklister", async () => {
			const imposter = Keypair.generate();
			const target = Keypair.generate();
			await airdrop(provider, imposter.publicKey);

			const [blacklistEntry] = findBlacklistEntryPda(
				ctx.mint.publicKey,
				target.publicKey,
				program.programId,
			);

			await expectError(
				program.methods
					.addToBlacklist("test")
					.accountsStrict({
						blacklister: imposter.publicKey,
						stablecoinState: ctx.stablecoinState,
						rolesConfig: ctx.rolesConfig,
						target: target.publicKey,
						blacklistEntry,
						systemProgram: SystemProgram.programId,
					})
					.signers([imposter])
					.rpc(),
				"NotBlacklister",
			);
		});

		it("designated blacklister can add entries", async () => {
			const blacklister = Keypair.generate();
			await airdrop(provider, blacklister.publicKey);

			await program.methods
				.updateRoles({
					burner: null,
					pauser: null,
					blacklister: blacklister.publicKey,
					seizer: null,
				})
				.accountsStrict({
					authority: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
				})
				.signers([ctx.authority])
				.rpc();

			const target = Keypair.generate();
			const [blacklistEntry] = findBlacklistEntryPda(
				ctx.mint.publicKey,
				target.publicKey,
				program.programId,
			);

			await program.methods
				.addToBlacklist("designated blacklister action")
				.accountsStrict({
					blacklister: blacklister.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
					target: target.publicKey,
					blacklistEntry,
					systemProgram: SystemProgram.programId,
				})
				.signers([blacklister])
				.rpc();

			const entry = await program.account.blacklistEntry.fetch(blacklistEntry);
			assert.ok(entry.address.equals(target.publicKey));
		});
	});

	// ════════════════════════════════════════════════════════════
	// 11. Seize (SSS-2)
	// ════════════════════════════════════════════════════════════
	describe("seize (SSS-2)", () => {
		it("rejects seize when permanent delegate not enabled", async () => {
			const sss1Ctx = await setupSss1Token(program, provider);
			const from = Keypair.generate();
			const to = Keypair.generate();
			await airdrop(provider, from.publicKey);

			const fromAta = await createTokenAccount(
				provider,
				sss1Ctx.mint.publicKey,
				from.publicKey,
				sss1Ctx.authority,
			);
			const toAta = await createTokenAccount(
				provider,
				sss1Ctx.mint.publicKey,
				to.publicKey,
				sss1Ctx.authority,
			);

			await expectError(
				program.methods
					.seize(new anchor.BN(100))
					.accountsStrict({
						seizer: sss1Ctx.authority.publicKey,
						stablecoinState: sss1Ctx.stablecoinState,
						rolesConfig: sss1Ctx.rolesConfig,
						mint: sss1Ctx.mint.publicKey,
						fromTokenAccount: fromAta,
						toTokenAccount: toAta,
						tokenProgram: TOKEN_2022_PROGRAM_ID,
					})
					.signers([sss1Ctx.authority])
					.rpc(),
				"ComplianceNotEnabled",
			);
		});

		it("rejects zero amount", async () => {
			const ctx = await setupSss1Token(program, provider, {
				enablePermanentDelegate: true,
				enableTransferHook: true,
				transferHookProgramId: Keypair.generate().publicKey,
			});

			const from = Keypair.generate();
			const to = Keypair.generate();

			const fromAta = await createTokenAccount(
				provider,
				ctx.mint.publicKey,
				from.publicKey,
				ctx.authority,
			);
			const toAta = await createTokenAccount(
				provider,
				ctx.mint.publicKey,
				to.publicKey,
				ctx.authority,
			);

			await expectError(
				program.methods
					.seize(new anchor.BN(0))
					.accountsStrict({
						seizer: ctx.authority.publicKey,
						stablecoinState: ctx.stablecoinState,
						rolesConfig: ctx.rolesConfig,
						mint: ctx.mint.publicKey,
						fromTokenAccount: fromAta,
						toTokenAccount: toAta,
						tokenProgram: TOKEN_2022_PROGRAM_ID,
					})
					.signers([ctx.authority])
					.rpc(),
				"ZeroAmount",
			);
		});
	});

	// ════════════════════════════════════════════════════════════
	// 12. Get Supply
	// ════════════════════════════════════════════════════════════
	describe("get_supply", () => {
		it("returns zero initially", async () => {
			const ctx = await setupSss1Token(program, provider);

			const supply = await program.methods
				.getSupply()
				.accountsStrict({
					stablecoinState: ctx.stablecoinState,
					mint: ctx.mint.publicKey,
				})
				.view();

			assert.equal(supply.toNumber(), 0);
		});

		it("returns correct supply after minting", async () => {
			const ctx = await setupSss1Token(program, provider);
			const minter = Keypair.generate();
			await airdrop(provider, minter.publicKey);

			const minterQuota = await addMinter(ctx, minter.publicKey, 10_000_000);
			const ata = await createTokenAccount(
				provider,
				ctx.mint.publicKey,
				minter.publicKey,
				ctx.authority,
			);

			await mintTokens(ctx, minter, minterQuota, ata, 5_000_000);

			const supply = await program.methods
				.getSupply()
				.accountsStrict({
					stablecoinState: ctx.stablecoinState,
					mint: ctx.mint.publicKey,
				})
				.view();

			assert.equal(supply.toNumber(), 5_000_000);
		});
	});

	// ════════════════════════════════════════════════════════════
	// 13. Close Mint
	// ════════════════════════════════════════════════════════════
	// NOTE: close_mint requires enableMintCloseAuthority: true
	// This is INCOMPATIBLE with Metaplex metadata (Metaplex rejects mints with close authority)
	// Users must choose: Metaplex metadata (recommended for stablecoins) OR close authority
	describe("close_mint", () => {
		it("closes mint, stablecoin_state, and roles_config when supply is zero", async () => {
			// Enable MintCloseAuthority for this test (disabled by default for Metaplex compatibility)
			const ctx = await setupSss1Token(program, provider, {
				enableMintCloseAuthority: true,
			});

			await program.methods
				.closeMint()
				.accountsStrict({
					authority: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
					mint: ctx.mint.publicKey,
					tokenProgram: TOKEN_2022_PROGRAM_ID,
				})
				.signers([ctx.authority])
				.rpc();

			const mintAcc = await provider.connection.getAccountInfo(
				ctx.mint.publicKey,
			);
			const stateAcc = await provider.connection.getAccountInfo(
				ctx.stablecoinState,
			);
			const rolesAcc = await provider.connection.getAccountInfo(
				ctx.rolesConfig,
			);

			assert.isNull(mintAcc);
			assert.isNull(stateAcc);
			assert.isNull(rolesAcc);
		});

		it("closes mint without metaplex metadata (close authority enabled)", async () => {
			// Enable MintCloseAuthority for this test
			// Note: Cannot use Metaplex metadata when close authority is enabled
			const ctx = await setupSss1Token(program, provider, {
				enableMintCloseAuthority: true,
			});

			// Close mint directly (no Metaplex metadata)
			await program.methods
				.closeMint()
				.accountsStrict({
					authority: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
					mint: ctx.mint.publicKey,
					tokenProgram: TOKEN_2022_PROGRAM_ID,
				})
				.signers([ctx.authority])
				.rpc();

			const mintAcc = await provider.connection.getAccountInfo(
				ctx.mint.publicKey,
			);
			assert.isNull(mintAcc);
		});

		it("rejects close_mint when close authority is disabled (default for Metaplex)", async () => {
			// Default config has enableMintCloseAuthority: false for Metaplex compatibility
			const ctx = await setupSss1Token(program, provider);

			// Attempting to close should fail because close authority is not enabled
			await expectError(
				program.methods
					.closeMint()
					.accountsStrict({
						authority: ctx.authority.publicKey,
						stablecoinState: ctx.stablecoinState,
						rolesConfig: ctx.rolesConfig,
						mint: ctx.mint.publicKey,
						tokenProgram: TOKEN_2022_PROGRAM_ID,
					})
					.signers([ctx.authority])
					.rpc(),
				"InvalidAccountData", // Token-2022 error: mint doesn't have close authority extension
			);
		});

		it("metaplex_metadata rejects mint with close authority enabled", async () => {
			// This test demonstrates the Metaplex incompatibility
			const ctx = await setupSss1Token(program, provider, {
				enableMintCloseAuthority: true,
			});

			const metadataPda = PublicKey.findProgramAddressSync(
				[
					Buffer.from("metadata"),
					new PublicKey(
						"metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
					).toBuffer(),
					ctx.mint.publicKey.toBuffer(),
				],
				new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
			)[0];

			// Metaplex will reject this because close authority is enabled
			await expectError(
				program.methods
					.metaplexMetadata({
						name: "Test Stablecoin",
						symbol: "TUSD",
						uri: "https://example.com/metadata.json",
					})
					.accountsStrict({
						authority: ctx.authority.publicKey,
						mint: ctx.mint.publicKey,
						stablecoinState: ctx.stablecoinState,
						metadata: metadataPda,
						tokenMetadataProgram: new PublicKey(
							"metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
						),
						sysvarInstructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
						systemProgram: SystemProgram.programId,
						rent: anchor.web3.SYSVAR_RENT_PUBKEY,
					})
					.signers([ctx.authority, ctx.mint])
					.rpc(),
				"Invalid mint close authority", // Metaplex error
			);
		});

		it("metaplex_metadata succeeds when close authority is disabled (default)", async () => {
			// Default config has enableMintCloseAuthority: false - perfect for Metaplex
			const ctx = await setupSss1Token(program, provider);

			const metadataPda = PublicKey.findProgramAddressSync(
				[
					Buffer.from("metadata"),
					new PublicKey(
						"metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
					).toBuffer(),
					ctx.mint.publicKey.toBuffer(),
				],
				new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
			)[0];

			// This should succeed because close authority is disabled
			await program.methods
				.metaplexMetadata({
					name: "Test Stablecoin",
					symbol: "TUSD",
					uri: "https://example.com/metadata.json",
				})
				.accountsStrict({
					authority: ctx.authority.publicKey,
					mint: ctx.mint.publicKey,
					stablecoinState: ctx.stablecoinState,
					metadata: metadataPda,
					tokenMetadataProgram: new PublicKey(
						"metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
					),
					sysvarInstructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
					systemProgram: SystemProgram.programId,
					rent: anchor.web3.SYSVAR_RENT_PUBKEY,
				})
				.signers([ctx.authority, ctx.mint])
				.rpc();

			// Verify metadata was created
			const metadataAccount =
				await provider.connection.getAccountInfo(metadataPda);
			assert.isNotNull(metadataAccount);
		});

		it("rejects close when supply > 0", async () => {
			const ctx = await setupSss1Token(program, provider, {
				enableMintCloseAuthority: true,
			});

			const minter = Keypair.generate();
			await airdrop(provider, minter.publicKey);
			const quotaPda = await addMinter(ctx, minter.publicKey, 1000);
			const ata = await createTokenAccount(
				provider,
				ctx.mint.publicKey,
				minter.publicKey,
				ctx.authority,
			);
			await mintTokens(ctx, minter, quotaPda, ata, 100);

			await expectError(
				program.methods
					.closeMint()
					.accountsStrict({
						authority: ctx.authority.publicKey,
						stablecoinState: ctx.stablecoinState,
						rolesConfig: ctx.rolesConfig,
						mint: ctx.mint.publicKey,
						tokenProgram: TOKEN_2022_PROGRAM_ID,
					})
					.signers([ctx.authority])
					.rpc(),
				"SupplyNotZero",
			);
		});

		it("rejects non-master-authority", async () => {
			const ctx = await setupSss1Token(program, provider, {
				enableMintCloseAuthority: true,
			});
			const imposter = Keypair.generate();
			await airdrop(provider, imposter.publicKey);

			await expectError(
				program.methods
					.closeMint()
					.accountsStrict({
						authority: imposter.publicKey,
						stablecoinState: ctx.stablecoinState,
						rolesConfig: ctx.rolesConfig,
						mint: ctx.mint.publicKey,
						tokenProgram: TOKEN_2022_PROGRAM_ID,
					})
					.signers([imposter])
					.rpc(),
				"Unauthorized",
			);
		});
	});
});
