import { Program } from "@coral-xyz/anchor";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import { deriveRolesConfig, deriveStablecoinState } from "../client/accounts";

/**
 * SSS-3 privacy module — manages confidential transfer account
 * approval and credit controls.
 *
 * The actual confidential transfer execution (encrypting amounts,
 * generating ZK proofs) is handled by Token-2022 directly.
 * This module only manages the mint-level approval and per-account
 * credit settings through the sss-token program.
 */
export class PrivacyModule {
	constructor(
		private readonly program: Program,
		private readonly mint: PublicKey,
		private readonly authority: Keypair,
	) {}

	/**
	 * Approve a token account for confidential transfers.
	 * Required when auto-approve is disabled on the mint.
	 *
	 * The master authority triggers this instruction; the stablecoin_state
	 * PDA signs the CPI to Token-2022's confidential_transfer::approve_account.
	 */
	async approveAccount(tokenAccount: PublicKey): Promise<string> {
		const [statePda] = deriveStablecoinState(this.mint, this.program.programId);
		const [rolesPda] = deriveRolesConfig(this.mint, this.program.programId);

		return (this.program.methods as any)
			.approveAccount()
			.accounts({
				authority: this.authority.publicKey,
				mint: this.mint,
				tokenAccount,
				stablecoinState: statePda,
				rolesConfig: rolesPda,
				tokenProgram: TOKEN_2022_PROGRAM_ID,
			})
			.signers([this.authority])
			.rpc();
	}

	/**
	 * Enable receiving confidential transfers for a token account.
	 * Must be called by the token account owner.
	 */
	async enableCredits(tokenAccount: PublicKey): Promise<string> {
		const [statePda] = deriveStablecoinState(this.mint, this.program.programId);

		return (this.program.methods as any)
			.enableConfidentialCredits()
			.accounts({
				owner: this.authority.publicKey,
				tokenAccount,
				stablecoinState: statePda,
				tokenProgram: TOKEN_2022_PROGRAM_ID,
			})
			.signers([this.authority])
			.rpc();
	}

	/**
	 * Disable receiving confidential transfers for a token account.
	 * Must be called by the token account owner.
	 */
	async disableCredits(tokenAccount: PublicKey): Promise<string> {
		const [statePda] = deriveStablecoinState(this.mint, this.program.programId);

		return (this.program.methods as any)
			.disableConfidentialCredits()
			.accounts({
				owner: this.authority.publicKey,
				tokenAccount,
				stablecoinState: statePda,
				tokenProgram: TOKEN_2022_PROGRAM_ID,
			})
			.signers([this.authority])
			.rpc();
	}
}
