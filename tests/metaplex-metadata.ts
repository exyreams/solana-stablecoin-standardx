import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
	PublicKey,
	SYSVAR_INSTRUCTIONS_PUBKEY,
	SystemProgram,
} from "@solana/web3.js";
import { assert } from "chai";
import { SssToken } from "../target/types/sss_token";
import { expectError, setupSss1Token } from "./helpers";

// Declare Buffer for Node.js environment
declare const Buffer: {
	from(data: string | Uint8Array | number[]): Uint8Array;
};

describe("metaplex_metadata", () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);
	const program = anchor.workspace.SssToken as Program<SssToken>;

	const METAPLEX_TOKEN_METADATA_PROGRAM_ID = new PublicKey(
		"metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
	);

	function findMetaplexMetadataPda(mint: PublicKey): [PublicKey, number] {
		return PublicKey.findProgramAddressSync(
			[
				Buffer.from("metadata"),
				METAPLEX_TOKEN_METADATA_PROGRAM_ID.toBuffer(),
				mint.toBuffer(),
			],
			METAPLEX_TOKEN_METADATA_PROGRAM_ID,
		);
	}

	it("creates Metaplex metadata PDA", async () => {
		const ctx = await setupSss1Token(program, provider);
		const [metadataPda] = findMetaplexMetadataPda(ctx.mint.publicKey);

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
				tokenMetadataProgram: METAPLEX_TOKEN_METADATA_PROGRAM_ID,
				sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
				systemProgram: SystemProgram.programId,
				rent: anchor.web3.SYSVAR_RENT_PUBKEY,
			})
			.signers([ctx.authority, ctx.mint])
			.rpc();

		// Verify metadata account was created
		const metadataAccount =
			await provider.connection.getAccountInfo(metadataPda);
		assert.isNotNull(metadataAccount);
		assert.ok(
			metadataAccount!.owner.equals(METAPLEX_TOKEN_METADATA_PROGRAM_ID),
		);
	});

	it("rejects name too long (>32 chars)", async () => {
		const ctx = await setupSss1Token(program, provider);
		const [metadataPda] = findMetaplexMetadataPda(ctx.mint.publicKey);

		await expectError(
			program.methods
				.metaplexMetadata({
					name: "A".repeat(33),
					symbol: "TUSD",
					uri: "https://example.com/metadata.json",
				})
				.accountsStrict({
					authority: ctx.authority.publicKey,
					mint: ctx.mint.publicKey,
					stablecoinState: ctx.stablecoinState,
					metadata: metadataPda,
					tokenMetadataProgram: METAPLEX_TOKEN_METADATA_PROGRAM_ID,
					sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
					systemProgram: SystemProgram.programId,
					rent: anchor.web3.SYSVAR_RENT_PUBKEY,
				})
				.signers([ctx.authority, ctx.mint])
				.rpc(),
			"NameTooLong",
		);
	});

	it("rejects symbol too long (>10 chars)", async () => {
		const ctx = await setupSss1Token(program, provider);
		const [metadataPda] = findMetaplexMetadataPda(ctx.mint.publicKey);

		await expectError(
			program.methods
				.metaplexMetadata({
					name: "Test Stablecoin",
					symbol: "TOOLONGSYMB",
					uri: "https://example.com/metadata.json",
				})
				.accountsStrict({
					authority: ctx.authority.publicKey,
					mint: ctx.mint.publicKey,
					stablecoinState: ctx.stablecoinState,
					metadata: metadataPda,
					tokenMetadataProgram: METAPLEX_TOKEN_METADATA_PROGRAM_ID,
					sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
					systemProgram: SystemProgram.programId,
					rent: anchor.web3.SYSVAR_RENT_PUBKEY,
				})
				.signers([ctx.authority, ctx.mint])
				.rpc(),
			"SymbolTooLong",
		);
	});

	it("rejects URI too long (>200 chars)", async () => {
		const ctx = await setupSss1Token(program, provider);
		const [metadataPda] = findMetaplexMetadataPda(ctx.mint.publicKey);

		await expectError(
			program.methods
				.metaplexMetadata({
					name: "Test Stablecoin",
					symbol: "TUSD",
					uri: "https://example.com/" + "x".repeat(200),
				})
				.accountsStrict({
					authority: ctx.authority.publicKey,
					mint: ctx.mint.publicKey,
					stablecoinState: ctx.stablecoinState,
					metadata: metadataPda,
					tokenMetadataProgram: METAPLEX_TOKEN_METADATA_PROGRAM_ID,
					sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
					systemProgram: SystemProgram.programId,
					rent: anchor.web3.SYSVAR_RENT_PUBKEY,
				})
				.signers([ctx.authority, ctx.mint])
				.rpc(),
			"UriTooLong",
		);
	});

	it("rejects duplicate metadata creation", async () => {
		const ctx = await setupSss1Token(program, provider);
		const [metadataPda] = findMetaplexMetadataPda(ctx.mint.publicKey);

		// First call succeeds
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
				tokenMetadataProgram: METAPLEX_TOKEN_METADATA_PROGRAM_ID,
				sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
				systemProgram: SystemProgram.programId,
				rent: anchor.web3.SYSVAR_RENT_PUBKEY,
			})
			.signers([ctx.authority, ctx.mint])
			.rpc();

		// Second call should fail
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
					tokenMetadataProgram: METAPLEX_TOKEN_METADATA_PROGRAM_ID,
					sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
					systemProgram: SystemProgram.programId,
					rent: anchor.web3.SYSVAR_RENT_PUBKEY,
				})
				.signers([ctx.authority, ctx.mint])
				.rpc(),
			"Error",
		);
	});

	it("requires mint keypair to sign", async () => {
		const ctx = await setupSss1Token(program, provider);
		const [metadataPda] = findMetaplexMetadataPda(ctx.mint.publicKey);

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
					tokenMetadataProgram: METAPLEX_TOKEN_METADATA_PROGRAM_ID,
					sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
					systemProgram: SystemProgram.programId,
					rent: anchor.web3.SYSVAR_RENT_PUBKEY,
				})
				.signers([ctx.authority])
				.rpc(),
			"Signature verification failed",
		);
	});
});
