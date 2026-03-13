import { Keypair } from "@solana/web3.js";
import { readFileSync } from "fs";
import { homedir } from "os";
import { resolve } from "path";

/**
 * Load a Solana keypair from a JSON file.
 * Supports ~ expansion.
 */
export function loadKeypair(filePath: string): Keypair {
	const expanded = filePath.replace("~", homedir());
	const resolved = resolve(expanded);
	const raw = JSON.parse(readFileSync(resolved, "utf-8"));
	return Keypair.fromSecretKey(Uint8Array.from(raw));
}
