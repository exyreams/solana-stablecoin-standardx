import { BN, Program } from "@coral-xyz/anchor";
import {
	addExtraAccountMetasForExecute,
	createTransferCheckedInstruction,
	TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import {
	Connection,
	Keypair,
	PublicKey,
	SystemProgram,
	sendAndConfirmTransaction,
	Transaction,
	TransactionInstruction,
} from "@solana/web3.js";
import { createHash } from "crypto";
import {
	deriveBlacklistEntry,
	deriveExtraAccountMetaList,
	deriveRolesConfig,
	deriveStablecoinState,
} from "../client/accounts";
import { BlacklistEntry } from "../types";

export class ComplianceModule {
	constructor(
		private readonly program: Program,
		private readonly connection: Connection,
		private readonly mint: PublicKey,
		private readonly authority: Keypair,
		private readonly transferHookProgramId?: PublicKey,
	) {}

	/**
	 * Add an address to the on-chain blacklist. SSS-2 only.
	 * After this call, any transfer to/from this address will be rejected
	 * by the transfer hook program.
	 */
	async blacklistAdd(
		address: PublicKey,
		reason: string,
		blacklister: Keypair,
	): Promise<string> {
		const [statePda] = deriveStablecoinState(this.mint, this.program.programId);
		const [rolesPda] = deriveRolesConfig(this.mint, this.program.programId);
		const [entryPda] = deriveBlacklistEntry(
			this.mint,
			address,
			this.program.programId,
		);

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

	/**
	 * Remove an address from the blacklist. SSS-2 only.
	 * The blacklist PDA is closed and rent returned to the blacklister.
	 */
	async blacklistRemove(
		address: PublicKey,
		blacklister: Keypair,
	): Promise<string> {
		const [statePda] = deriveStablecoinState(this.mint, this.program.programId);
		const [rolesPda] = deriveRolesConfig(this.mint, this.program.programId);
		const [entryPda] = deriveBlacklistEntry(
			this.mint,
			address,
			this.program.programId,
		);

		return (this.program.methods as any)
			.removeFromBlacklist()
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

	/**
	 * Seize tokens from an account into the treasury via permanent delegate.
	 * SSS-2 only. Works on blacklisted accounts — the transfer hook
	 * detects the PDA as permanent delegate and skips blacklist checks.
	 */
	async seize(options: {
		fromTokenAccount: PublicKey;
		toTokenAccount: PublicKey;
		amount: bigint;
		seizer: Keypair;
	}): Promise<string> {
		const [statePda] = deriveStablecoinState(this.mint, this.program.programId);
		const [rolesPda] = deriveRolesConfig(this.mint, this.program.programId);

		if (this.transferHookProgramId) {
			// 1. Fetch the actual token accounts to get the true owners to generate the right Blacklist PDAs
			const sourceAccount = await this.connection.getParsedAccountInfo(
				options.fromTokenAccount,
			);
			const ownerPubkey = new PublicKey(
				(sourceAccount.value?.data as any)?.parsed?.info?.owner ||
					options.fromTokenAccount.toBase58(),
			);

			// 2. Create a dummy TransferChecked instruction.
			// We do this because `addExtraAccountMetasForExecute` relies on the exact
			// index positions of [source, mint, destination, authority] to derive PDAs.
			const status = await this.connection.getTokenSupply(this.mint);
			const dummyTransferIx = createTransferCheckedInstruction(
				options.fromTokenAccount,
				this.mint,
				options.toTokenAccount,
				statePda, // The PDA is the permanent delegate
				options.amount,
				status.value.decimals,
				[],
				TOKEN_2022_PROGRAM_ID,
			);

			// TEMPORARY HACK: `addExtraAccountMetasForExecute` needs the TRUE owner of the Token Account
			// to derive the Blacklist PDAs correctly, but `dummyTransferIx` has `statePda` as the owner.
			// We swap `dummyTransferIx.keys[3]` to `ownerPubkey` BEFORE calling it, then swap it back.
			dummyTransferIx.keys[3].pubkey = ownerPubkey;

			// 3. Resolve the transfer hook accounts onto the dummy instruction
			await addExtraAccountMetasForExecute(
				this.connection,
				dummyTransferIx,
				this.transferHookProgramId,
				options.fromTokenAccount,
				this.mint,
				options.toTokenAccount,
				ownerPubkey,
				options.amount,
				"confirmed",
			);

			// Sweep it back to statePda so the actual CPI generation doesn't break
			dummyTransferIx.keys[3].pubkey = statePda;

			// 3. Extract just the extra accounts (everything after the first 4 standard accounts)
			const extraAccounts = dummyTransferIx.keys.slice(4);

			// 4. Build and send the actual Seize instruction with the resolved extra accounts
			return (this.program.methods as any)
				.seize(new BN(options.amount.toString()))
				.accounts({
					seizer: options.seizer.publicKey,
					stablecoinState: statePda,
					rolesConfig: rolesPda,
					mint: this.mint,
					fromTokenAccount: options.fromTokenAccount,
					toTokenAccount: options.toTokenAccount,
					tokenProgram: TOKEN_2022_PROGRAM_ID,
				})
				.remainingAccounts(extraAccounts)
				.signers([options.seizer])
				.rpc();
		}

		return (this.program.methods as any)
			.seize(new BN(options.amount.toString()))
			.accounts({
				seizer: options.seizer.publicKey,
				stablecoinState: statePda,
				rolesConfig: rolesPda,
				mint: this.mint,
				fromTokenAccount: options.fromTokenAccount,
				toTokenAccount: options.toTokenAccount,
				tokenProgram: TOKEN_2022_PROGRAM_ID,
			})
			.signers([options.seizer])
			.rpc();
	}

	/**
	 * Initialize the ExtraAccountMetaList PDA for the transfer hook.
	 * Must be called once after SSS-2 mint creation before any transfers.
	 *
	 * This calls the transfer-hook program (separate from sss-token) to
	 * set up the account resolution metadata that Token-2022 needs for
	 * every transfer.
	 */
	async initializeHook(): Promise<string> {
		if (!this.transferHookProgramId) {
			throw new Error(
				"Transfer hook program ID not configured. " +
					"Pass transferHookProgramId when creating or loading the stablecoin, " +
					"or ensure the mint was initialized with SSS-2 preset.",
			);
		}

		const [extraAccountMetaList] = deriveExtraAccountMetaList(
			this.mint,
			this.transferHookProgramId,
		);

		const [rolesConfig] = deriveRolesConfig(this.mint, this.program.programId);

		// Build the Anchor instruction discriminator for the transfer-hook program's
		// initialize_extra_account_meta_list instruction.  This avoids needing to
		// load the transfer-hook IDL in the SDK.
		const discriminator = createHash("sha256")
			.update("global:initialize_extra_account_meta_list")
			.digest()
			.slice(0, 8);

		const ix = new TransactionInstruction({
			programId: this.transferHookProgramId,
			keys: [
				{ pubkey: this.authority.publicKey, isSigner: true, isWritable: true },
				{ pubkey: extraAccountMetaList, isSigner: false, isWritable: true },
				{ pubkey: this.mint, isSigner: false, isWritable: false },
				{ pubkey: this.program.programId, isSigner: false, isWritable: false },
				{ pubkey: rolesConfig, isSigner: false, isWritable: false },
				{ pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
			],
			data: discriminator,
		});

		const tx = new Transaction().add(ix);

		// Use the same commitment level as the connection for consistency
		const commitment = this.connection.commitment || "confirmed";

		return sendAndConfirmTransaction(this.connection, tx, [this.authority], {
			commitment,
		});
	}

	/** Check if a given address is currently blacklisted. */
	async isBlacklisted(address: PublicKey): Promise<boolean> {
		const [entryPda] = deriveBlacklistEntry(
			this.mint,
			address,
			this.program.programId,
		);
		const info = await this.connection.getAccountInfo(entryPda);
		return info !== null && info.lamports > 0;
	}

	/** Fetch the full blacklist entry details for an address. Returns null if not blacklisted. */
	async getBlacklistEntry(address: PublicKey): Promise<BlacklistEntry | null> {
		const [entryPda] = deriveBlacklistEntry(
			this.mint,
			address,
			this.program.programId,
		);
		try {
			const entry = await (this.program.account as any).blacklistEntry.fetch(
				entryPda,
			);
			return {
				mint: entry.mint,
				address: entry.address,
				reason: entry.reason,
				timestamp: BigInt(entry.timestamp.toString()),
			};
		} catch {
			return null;
		}
	}
}
