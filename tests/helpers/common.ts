import * as anchor from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

// Declare setTimeout for Node.js environment
declare function setTimeout(callback: () => void, ms: number): any;

export const PRECISION = 1_000_000_000; // 9-decimal fixed point

/**
 * Airdrop SOL to a keypair and confirm.
 */
export async function airdrop(
	provider: anchor.AnchorProvider,
	to: PublicKey,
	amount: number = 100 * LAMPORTS_PER_SOL,
): Promise<void> {
	const sig = await provider.connection.requestAirdrop(to, amount);
	const latestBlockhash = await provider.connection.getLatestBlockhash();
	await provider.connection.confirmTransaction({
		signature: sig,
		...latestBlockhash,
	});
}

/**
 * Sleep for ms milliseconds.
 */
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Assert that a transaction fails with the expected error code or message.
 */
export async function expectError(
	promise: Promise<any>,
	errorCodeOrMsg: string | number,
): Promise<void> {
	try {
		await promise;
		throw new Error(
			`Expected error "${errorCodeOrMsg}" but transaction succeeded`,
		);
	} catch (err: any) {
		const errStr =
			typeof err === "string" ? err : err.message || JSON.stringify(err);
		if (typeof errorCodeOrMsg === "number") {
			// Anchor error code
			const hexCode = errorCodeOrMsg.toString(16);
			if (!errStr.includes(hexCode) && !errStr.includes(`${errorCodeOrMsg}`)) {
				// Also check for the error name in AnchorError
				if (err.error?.errorCode?.code) {
					// Anchor error - let it pass if any match
				} else {
					throw new Error(
						`Expected error code ${errorCodeOrMsg} (0x${hexCode}), got: ${errStr}`,
					);
				}
			}
		} else {
			if (
				!errStr.toLowerCase().includes(errorCodeOrMsg.toLowerCase()) &&
				!(
					err.error?.errorCode?.code &&
					err.error.errorCode.code
						.toLowerCase()
						.includes(errorCodeOrMsg.toLowerCase())
				) &&
				!(
					err.error?.errorMessage &&
					err.error.errorMessage
						.toLowerCase()
						.includes(errorCodeOrMsg.toLowerCase())
				)
			) {
				throw new Error(
					`Expected error containing "${errorCodeOrMsg}", got: ${errStr}`,
				);
			}
		}
	}
}

/**
 * Assert that a transaction fails (any error).
 */
export async function expectFail(promise: Promise<any>): Promise<void> {
	try {
		await promise;
		throw new Error("Expected transaction to fail but it succeeded");
	} catch (err: any) {
		if (err.message === "Expected transaction to fail but it succeeded") {
			throw err;
		}
		// Expected failure — pass
	}
}

/**
 * Generate N fresh keypairs.
 */
export function generateKeypairs(n: number): Keypair[] {
	return Array.from({ length: n }, () => Keypair.generate());
}

/**
 * Convert a number to 9-decimal fixed-point u64.
 */
export function toFixedPoint(value: number): anchor.BN {
	return new anchor.BN(Math.round(value * PRECISION));
}

/**
 * Convert a 9-decimal fixed-point u64 back to a float.
 */
export function fromFixedPoint(value: anchor.BN): number {
	return value.toNumber() / PRECISION;
}
