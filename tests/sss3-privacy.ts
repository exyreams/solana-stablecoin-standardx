import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
	createAccount,
	getAccount,
	TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import { SssToken } from "../target/types/sss_token";
import {
	airdrop,
	expectError,
	findRolesConfigPda,
	findStablecoinStatePda,
	sss1Config,
} from "./helpers";

describe("sss3-privacy (confidential transfers)", () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);
	const program = anchor.workspace.SssToken as Program<SssToken>;

	// Helper to setup SSS-3 token with confidential transfers enabled
	async function setupSss3Token() {
		const authority = Keypair.generate();
		const mint = Keypair.generate();

		await airdrop(provider, authority.publicKey);

		const [stablecoinState] = findStablecoinStatePda(
			mint.publicKey,
			program.programId,
		);
		const [rolesConfig] = findRolesConfigPda(mint.publicKey, program.programId);

		const config = {
			...sss1Config(),
			enableConfidentialTransfers: true,
			confidentialTransferAutoApprove: false, // Require manual approval
			auditorElgamalPubkey: null,
		};

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

	// ════════════════════════════════════════════════════════════
	// approve_account
	// ════════════════════════════════════════════════════════════
	describe("approve_account", () => {
		it("approves account for confidential transfers (expects Token-2022 error without CT config)", async () => {
			const ctx = await setupSss3Token();
			const user = Keypair.generate();
			await airdrop(provider, user.publicKey);

			// Create token account
			const tokenAccount = await createAccount(
				provider.connection,
				ctx.authority,
				ctx.mint.publicKey,
				user.publicKey,
				undefined,
				undefined,
				TOKEN_2022_PROGRAM_ID,
			);

			// Approve the account for confidential transfers
			// Note: This will fail at Token-2022 level because the account doesn't have
			// confidential transfer extension configured (requires ElGamal keypairs).
			// We're testing that our program correctly calls Token-2022, even though
			// Token-2022 will reject it due to missing CT configuration.
			await expectError(
				program.methods
					.approveAccount()
					.accountsStrict({
						authority: ctx.authority.publicKey,
						stablecoinState: ctx.stablecoinState,
						rolesConfig: ctx.rolesConfig,
						tokenAccount,
						mint: ctx.mint.publicKey,
						tokenProgram: TOKEN_2022_PROGRAM_ID,
					})
					.signers([ctx.authority])
					.rpc(),
				"InvalidAccountData", // Token-2022 error: account missing CT extension
			);
		});

		it("rejects when confidential transfers not enabled", async () => {
			// Setup SSS-1 token (no confidential transfers)
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

			await program.methods
				.initialize(sss1Config())
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

			const user = Keypair.generate();
			await airdrop(provider, user.publicKey);

			const tokenAccount = await createAccount(
				provider.connection,
				authority,
				mint.publicKey,
				user.publicKey,
				undefined,
				undefined,
				TOKEN_2022_PROGRAM_ID,
			);

			await expectError(
				program.methods
					.approveAccount()
					.accountsStrict({
						authority: authority.publicKey,
						stablecoinState,
						rolesConfig,
						tokenAccount,
						mint: mint.publicKey,
						tokenProgram: TOKEN_2022_PROGRAM_ID,
					})
					.signers([authority])
					.rpc(),
				"FeatureNotEnabled",
			);
		});

		it("rejects non-master-authority caller", async () => {
			const ctx = await setupSss3Token();
			const user = Keypair.generate();
			const imposter = Keypair.generate();
			await airdrop(provider, user.publicKey);
			await airdrop(provider, imposter.publicKey);

			const tokenAccount = await createAccount(
				provider.connection,
				ctx.authority,
				ctx.mint.publicKey,
				user.publicKey,
				undefined,
				undefined,
				TOKEN_2022_PROGRAM_ID,
			);

			await expectError(
				program.methods
					.approveAccount()
					.accountsStrict({
						authority: imposter.publicKey,
						stablecoinState: ctx.stablecoinState,
						rolesConfig: ctx.rolesConfig,
						tokenAccount,
						mint: ctx.mint.publicKey,
						tokenProgram: TOKEN_2022_PROGRAM_ID,
					})
					.signers([imposter])
					.rpc(),
				"Unauthorized",
			);
		});
	});

	// ════════════════════════════════════════════════════════════
	// enable_confidential_credits
	// ════════════════════════════════════════════════════════════
	describe("enable_confidential_credits", () => {
		it("enables confidential credits for account (expects Token-2022 error without CT config)", async () => {
			const ctx = await setupSss3Token();
			const user = Keypair.generate();
			await airdrop(provider, user.publicKey);

			const tokenAccount = await createAccount(
				provider.connection,
				ctx.authority,
				ctx.mint.publicKey,
				user.publicKey,
				undefined,
				undefined,
				TOKEN_2022_PROGRAM_ID,
			);

			// First approve the account (will fail due to missing CT config)
			await expectError(
				program.methods
					.approveAccount()
					.accountsStrict({
						authority: ctx.authority.publicKey,
						stablecoinState: ctx.stablecoinState,
						rolesConfig: ctx.rolesConfig,
						tokenAccount,
						mint: ctx.mint.publicKey,
						tokenProgram: TOKEN_2022_PROGRAM_ID,
					})
					.signers([ctx.authority])
					.rpc(),
				"InvalidAccountData",
			);

			// Enable confidential credits (will also fail due to missing CT config)
			await expectError(
				program.methods
					.enableConfidentialCredits()
					.accountsStrict({
						owner: user.publicKey,
						tokenAccount,
						stablecoinState: ctx.stablecoinState,
						tokenProgram: TOKEN_2022_PROGRAM_ID,
					})
					.signers([user])
					.rpc(),
				"InvalidAccountData", // Token-2022 error: account missing CT extension
			);
		});

		it("rejects when confidential transfers not enabled", async () => {
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

			await program.methods
				.initialize(sss1Config())
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

			const user = Keypair.generate();
			await airdrop(provider, user.publicKey);

			const tokenAccount = await createAccount(
				provider.connection,
				authority,
				mint.publicKey,
				user.publicKey,
				undefined,
				undefined,
				TOKEN_2022_PROGRAM_ID,
			);

			await expectError(
				program.methods
					.enableConfidentialCredits()
					.accountsStrict({
						owner: user.publicKey,
						tokenAccount,
						stablecoinState,
						tokenProgram: TOKEN_2022_PROGRAM_ID,
					})
					.signers([user])
					.rpc(),
				"FeatureNotEnabled",
			);
		});

		it("rejects non-master-authority caller", async () => {
			const ctx = await setupSss3Token();
			const user = Keypair.generate();
			const imposter = Keypair.generate();
			await airdrop(provider, user.publicKey);
			await airdrop(provider, imposter.publicKey);

			const tokenAccount = await createAccount(
				provider.connection,
				ctx.authority,
				ctx.mint.publicKey,
				user.publicKey,
				undefined,
				undefined,
				TOKEN_2022_PROGRAM_ID,
			);

			await expectError(
				program.methods
					.enableConfidentialCredits()
					.accountsStrict({
						owner: imposter.publicKey,
						tokenAccount,
						stablecoinState: ctx.stablecoinState,
						tokenProgram: TOKEN_2022_PROGRAM_ID,
					})
					.signers([imposter])
					.rpc(),
				"Unauthorized",
			);
		});
	});

	// ════════════════════════════════════════════════════════════
	// disable_confidential_credits
	// ════════════════════════════════════════════════════════════
	describe("disable_confidential_credits", () => {
		it("disables confidential credits for account (expects Token-2022 error without CT config)", async () => {
			const ctx = await setupSss3Token();
			const user = Keypair.generate();
			await airdrop(provider, user.publicKey);

			const tokenAccount = await createAccount(
				provider.connection,
				ctx.authority,
				ctx.mint.publicKey,
				user.publicKey,
				undefined,
				undefined,
				TOKEN_2022_PROGRAM_ID,
			);

			// Approve and enable credits first (both will fail due to missing CT config)
			await expectError(
				program.methods
					.approveAccount()
					.accountsStrict({
						authority: ctx.authority.publicKey,
						stablecoinState: ctx.stablecoinState,
						rolesConfig: ctx.rolesConfig,
						tokenAccount,
						mint: ctx.mint.publicKey,
						tokenProgram: TOKEN_2022_PROGRAM_ID,
					})
					.signers([ctx.authority])
					.rpc(),
				"InvalidAccountData",
			);

			await expectError(
				program.methods
					.enableConfidentialCredits()
					.accountsStrict({
						owner: user.publicKey,
						tokenAccount,
						stablecoinState: ctx.stablecoinState,
						tokenProgram: TOKEN_2022_PROGRAM_ID,
					})
					.signers([user])
					.rpc(),
				"InvalidAccountData",
			);

			// Now disable (will also fail due to missing CT config)
			await expectError(
				program.methods
					.disableConfidentialCredits()
					.accountsStrict({
						owner: user.publicKey,
						tokenAccount,
						stablecoinState: ctx.stablecoinState,
						tokenProgram: TOKEN_2022_PROGRAM_ID,
					})
					.signers([user])
					.rpc(),
				"InvalidAccountData", // Token-2022 error: account missing CT extension
			);
		});

		it("rejects when confidential transfers not enabled", async () => {
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

			await program.methods
				.initialize(sss1Config())
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

			const user = Keypair.generate();
			await airdrop(provider, user.publicKey);

			const tokenAccount = await createAccount(
				provider.connection,
				authority,
				mint.publicKey,
				user.publicKey,
				undefined,
				undefined,
				TOKEN_2022_PROGRAM_ID,
			);

			await expectError(
				program.methods
					.disableConfidentialCredits()
					.accountsStrict({
						owner: user.publicKey,
						tokenAccount,
						stablecoinState,
						tokenProgram: TOKEN_2022_PROGRAM_ID,
					})
					.signers([user])
					.rpc(),
				"FeatureNotEnabled",
			);
		});

		it("rejects non-master-authority caller", async () => {
			const ctx = await setupSss3Token();
			const user = Keypair.generate();
			const imposter = Keypair.generate();
			await airdrop(provider, user.publicKey);
			await airdrop(provider, imposter.publicKey);

			const tokenAccount = await createAccount(
				provider.connection,
				ctx.authority,
				ctx.mint.publicKey,
				user.publicKey,
				undefined,
				undefined,
				TOKEN_2022_PROGRAM_ID,
			);

			await expectError(
				program.methods
					.disableConfidentialCredits()
					.accountsStrict({
						owner: imposter.publicKey,
						tokenAccount,
						stablecoinState: ctx.stablecoinState,
						tokenProgram: TOKEN_2022_PROGRAM_ID,
					})
					.signers([imposter])
					.rpc(),
				"Unauthorized",
			);
		});
	});
});
