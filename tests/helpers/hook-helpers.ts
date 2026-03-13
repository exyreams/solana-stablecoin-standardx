import { PublicKey } from "@solana/web3.js";

// Declare Buffer for Node.js environment
declare const Buffer: {
	from(data: string | Uint8Array): Uint8Array;
};

export function findExtraAccountMetaListPda(
	mint: PublicKey,
	hookProgramId: PublicKey,
): [PublicKey, number] {
	return PublicKey.findProgramAddressSync(
		[Buffer.from("extra-account-metas"), mint.toBuffer()],
		hookProgramId,
	);
}
