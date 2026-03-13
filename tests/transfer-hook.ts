import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import { SssToken } from "../target/types/sss_token";
import { TransferHook } from "../target/types/transfer_hook";
import {
	addMinter,
	airdrop,
	createTokenAccount,
	expectError,
	findBlacklistEntryPda,
	findExtraAccountMetaListPda,
	findRolesConfigPda,
	findStablecoinStatePda,
	mintTokens,
	sss2Config,
	TokenTestContext,
} from "./helpers";

describe("transfer-hook", () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const hookProgram = anchor.workspace.TransferHook as Program<TransferHook>;
	const tokenProgram = anchor.workspace.SssToken as Program<SssToken>;

	// ════════════════════════════════════════════════════════════
	// Setup: SSS-2 mint with transfer hook
	// ════════════════════════════════════════════════════════════

	interface HookTestContext extends TokenTestContext {
		extraAccountMetaList: PublicKey;
	}

	async function setupSss2WithHook(): Promise<HookTestContext> {
		const authority = Keypair.generate();
		const mint = Keypair.generate();
		await airdrop(provider, authority.publicKey);

		const [stablecoinState] = findStablecoinStatePda(
			mint.publicKey,
			tokenProgram.programId,
		);
		const [rolesConfig] = findRolesConfigPda(
			mint.publicKey,
			tokenProgram.programId,
		);

		const config = sss2Config(hookProgram.programId);

		// Initialize the SSS-2 token
		await tokenProgram.methods
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

		// Initialize the ExtraAccountMetaList
		const [extraAccountMetaList] = findExtraAccountMetaListPda(
			mint.publicKey,
			hookProgram.programId,
		);

		await hookProgram.methods
			.initializeExtraAccountMetaList()
			.accountsStrict({
				payer: authority.publicKey,
				extraAccountMetaList,
				mint: mint.publicKey,
				sssTokenProgram: tokenProgram.programId,
				rolesConfig,
				systemProgram: SystemProgram.programId,
			})
			.signers([authority])
			.rpc();

		return {
			program: tokenProgram,
			provider,
			authority,
			mint,
			stablecoinState,
			rolesConfig,
			extraAccountMetaList,
		};
	}

	// ════════════════════════════════════════════════════════════
	// 1. Initialize Extra Account Meta List
	// ════════════════════════════════════════════════════════════
	describe("initialize_extra_account_meta_list", () => {
		it("creates ExtraAccountMetaList PDA", async () => {
			const ctx = await setupSss2WithHook();

			const account = await provider.connection.getAccountInfo(
				ctx.extraAccountMetaList,
			);
			assert.isNotNull(account);
			assert.ok(account!.owner.equals(hookProgram.programId));
		});

		it("rejects non-master-authority payer", async () => {
			const authority = Keypair.generate();
			const imposter = Keypair.generate();
			const mint = Keypair.generate();
			await airdrop(provider, authority.publicKey);
			await airdrop(provider, imposter.publicKey);

			const [stablecoinState] = findStablecoinStatePda(
				mint.publicKey,
				tokenProgram.programId,
			);
			const [rolesConfig] = findRolesConfigPda(
				mint.publicKey,
				tokenProgram.programId,
			);

			const config = sss2Config(hookProgram.programId);

			await tokenProgram.methods
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

			const [extraAccountMetaList] = findExtraAccountMetaListPda(
				mint.publicKey,
				hookProgram.programId,
			);

			// Imposter tries to initialize
			await expectError(
				hookProgram.methods
					.initializeExtraAccountMetaList()
					.accountsStrict({
						payer: imposter.publicKey,
						extraAccountMetaList,
						mint: mint.publicKey,
						sssTokenProgram: tokenProgram.programId,
						rolesConfig,
						systemProgram: SystemProgram.programId,
					})
					.signers([imposter])
					.rpc(),
				"InvalidAuthority",
			);
		});
	});

	// ════════════════════════════════════════════════════════════
	// 2. Transfer Hook Execution
	// ════════════════════════════════════════════════════════════
	describe("transfer_hook execution", () => {
		let ctx: HookTestContext;
		let senderKeypair: Keypair;
		let recipientKeypair: Keypair;
		let senderAta: PublicKey;
		let recipientAta: PublicKey;

		beforeEach(async () => {
			ctx = await setupSss2WithHook();

			senderKeypair = Keypair.generate();
			recipientKeypair = Keypair.generate();
			await airdrop(provider, senderKeypair.publicKey);
			await airdrop(provider, recipientKeypair.publicKey);

			// Create token accounts
			senderAta = await createTokenAccount(
				provider,
				ctx.mint.publicKey,
				senderKeypair.publicKey,
				ctx.authority,
			);
			recipientAta = await createTokenAccount(
				provider,
				ctx.mint.publicKey,
				recipientKeypair.publicKey,
				ctx.authority,
			);

			// Mint tokens to sender
			const minterQuota = await addMinter(
				{
					...ctx,
					program: tokenProgram,
				},
				ctx.authority.publicKey,
				10_000_000,
			);
			const _authorityAta = await createTokenAccount(
				provider,
				ctx.mint.publicKey,
				ctx.authority.publicKey,
				ctx.authority,
			);
			await mintTokens(
				{ ...ctx, program: tokenProgram },
				ctx.authority,
				minterQuota,
				senderAta,
				1_000_000,
			);
		});

		it("allows transfer between non-blacklisted accounts", async () => {
			// Build transfer with hook accounts
			const [senderBlacklist] = findBlacklistEntryPda(
				ctx.mint.publicKey,
				senderKeypair.publicKey,
				tokenProgram.programId,
			);
			const [recipientBlacklist] = findBlacklistEntryPda(
				ctx.mint.publicKey,
				recipientKeypair.publicKey,
				tokenProgram.programId,
			);

			// Direct hook call test (simulating what Token-2022 would do)
			// In real usage, Token-2022 calls this automatically
			await hookProgram.methods
				.transferHook(new anchor.BN(1000))
				.accountsStrict({
					sourceToken: senderAta,
					mint: ctx.mint.publicKey,
					destinationToken: recipientAta,
					authority: senderKeypair.publicKey,
					extraAccountMetaList: ctx.extraAccountMetaList,
					sssTokenProgram: tokenProgram.programId,
					sourceBlacklistEntry: senderBlacklist,
					destinationBlacklistEntry: recipientBlacklist,
					stablecoinState: ctx.stablecoinState,
				})
				.signers([])
				.rpc();
		});

		it("blocks transfer from blacklisted source", async () => {
			// Blacklist sender
			const [senderBlacklist] = findBlacklistEntryPda(
				ctx.mint.publicKey,
				senderKeypair.publicKey,
				tokenProgram.programId,
			);

			await tokenProgram.methods
				.addToBlacklist("test block")
				.accountsStrict({
					blacklister: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
					target: senderKeypair.publicKey,
					blacklistEntry: senderBlacklist,
					systemProgram: SystemProgram.programId,
				})
				.signers([ctx.authority])
				.rpc();

			const [recipientBlacklist] = findBlacklistEntryPda(
				ctx.mint.publicKey,
				recipientKeypair.publicKey,
				tokenProgram.programId,
			);

			await expectError(
				hookProgram.methods
					.transferHook(new anchor.BN(1000))
					.accountsStrict({
						sourceToken: senderAta,
						mint: ctx.mint.publicKey,
						destinationToken: recipientAta,
						authority: senderKeypair.publicKey,
						extraAccountMetaList: ctx.extraAccountMetaList,
						sssTokenProgram: tokenProgram.programId,
						sourceBlacklistEntry: senderBlacklist,
						destinationBlacklistEntry: recipientBlacklist,
						stablecoinState: ctx.stablecoinState,
					})
					.signers([])
					.rpc(),
				"SourceBlacklisted",
			);
		});

		it("blocks transfer to blacklisted destination", async () => {
			const [senderBlacklist] = findBlacklistEntryPda(
				ctx.mint.publicKey,
				senderKeypair.publicKey,
				tokenProgram.programId,
			);

			// Blacklist recipient
			const [recipientBlacklist] = findBlacklistEntryPda(
				ctx.mint.publicKey,
				recipientKeypair.publicKey,
				tokenProgram.programId,
			);

			await tokenProgram.methods
				.addToBlacklist("test block destination")
				.accountsStrict({
					blacklister: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
					target: recipientKeypair.publicKey,
					blacklistEntry: recipientBlacklist,
					systemProgram: SystemProgram.programId,
				})
				.signers([ctx.authority])
				.rpc();

			await expectError(
				hookProgram.methods
					.transferHook(new anchor.BN(1000))
					.accountsStrict({
						sourceToken: senderAta,
						mint: ctx.mint.publicKey,
						destinationToken: recipientAta,
						authority: senderKeypair.publicKey,
						extraAccountMetaList: ctx.extraAccountMetaList,
						sssTokenProgram: tokenProgram.programId,
						sourceBlacklistEntry: senderBlacklist,
						destinationBlacklistEntry: recipientBlacklist,
						stablecoinState: ctx.stablecoinState,
					})
					.signers([])
					.rpc(),
				"DestinationBlacklisted",
			);
		});

		it("bypasses blacklist check for permanent delegate (seize)", async () => {
			// Blacklist both sender and recipient
			const [senderBlacklist] = findBlacklistEntryPda(
				ctx.mint.publicKey,
				senderKeypair.publicKey,
				tokenProgram.programId,
			);
			const [recipientBlacklist] = findBlacklistEntryPda(
				ctx.mint.publicKey,
				recipientKeypair.publicKey,
				tokenProgram.programId,
			);

			await tokenProgram.methods
				.addToBlacklist("blacklisted sender")
				.accountsStrict({
					blacklister: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
					target: senderKeypair.publicKey,
					blacklistEntry: senderBlacklist,
					systemProgram: SystemProgram.programId,
				})
				.signers([ctx.authority])
				.rpc();

			// When authority = stablecoin_state PDA, it's a seize — should pass
			await hookProgram.methods
				.transferHook(new anchor.BN(1000))
				.accountsStrict({
					sourceToken: senderAta,
					mint: ctx.mint.publicKey,
					destinationToken: recipientAta,
					authority: ctx.stablecoinState, // permanent delegate PDA
					extraAccountMetaList: ctx.extraAccountMetaList,
					sssTokenProgram: tokenProgram.programId,
					sourceBlacklistEntry: senderBlacklist,
					destinationBlacklistEntry: recipientBlacklist,
					stablecoinState: ctx.stablecoinState,
				})
				.signers([])
				.rpc();
			// Should succeed — permanent delegate bypasses blacklist
		});

		it("allows transfer after removing from blacklist", async () => {
			const [senderBlacklist] = findBlacklistEntryPda(
				ctx.mint.publicKey,
				senderKeypair.publicKey,
				tokenProgram.programId,
			);
			const [recipientBlacklist] = findBlacklistEntryPda(
				ctx.mint.publicKey,
				recipientKeypair.publicKey,
				tokenProgram.programId,
			);

			// Blacklist sender
			await tokenProgram.methods
				.addToBlacklist("temp block")
				.accountsStrict({
					blacklister: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
					target: senderKeypair.publicKey,
					blacklistEntry: senderBlacklist,
					systemProgram: SystemProgram.programId,
				})
				.signers([ctx.authority])
				.rpc();

			// Verify blocked
			await expectError(
				hookProgram.methods
					.transferHook(new anchor.BN(1000))
					.accountsStrict({
						sourceToken: senderAta,
						mint: ctx.mint.publicKey,
						destinationToken: recipientAta,
						authority: senderKeypair.publicKey,
						extraAccountMetaList: ctx.extraAccountMetaList,
						sssTokenProgram: tokenProgram.programId,
						sourceBlacklistEntry: senderBlacklist,
						destinationBlacklistEntry: recipientBlacklist,
						stablecoinState: ctx.stablecoinState,
					})
					.signers([])
					.rpc(),
				"SourceBlacklisted",
			);

			// Remove from blacklist
			await tokenProgram.methods
				.removeFromBlacklist()
				.accountsStrict({
					blacklister: ctx.authority.publicKey,
					stablecoinState: ctx.stablecoinState,
					rolesConfig: ctx.rolesConfig,
					target: senderKeypair.publicKey,
					blacklistEntry: senderBlacklist,
				})
				.signers([ctx.authority])
				.rpc();

			// Should now pass (blacklist PDA closed, lamports = 0)
			await hookProgram.methods
				.transferHook(new anchor.BN(1000))
				.accountsStrict({
					sourceToken: senderAta,
					mint: ctx.mint.publicKey,
					destinationToken: recipientAta,
					authority: senderKeypair.publicKey,
					extraAccountMetaList: ctx.extraAccountMetaList,
					sssTokenProgram: tokenProgram.programId,
					sourceBlacklistEntry: senderBlacklist,
					destinationBlacklistEntry: recipientBlacklist,
					stablecoinState: ctx.stablecoinState,
				})
				.signers([])
				.rpc();
		});
	});
});
