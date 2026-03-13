/**
 * PDA (Program Derived Address) derivation utilities for the Solana Stablecoin Standard.
 *
 * This module provides helper functions to derive all PDAs used by the sss-token and sss-oracle programs.
 * PDAs are deterministic addresses derived from seeds and program IDs, used for storing on-chain state.
 *
 * @module client/accounts
 */

import { PublicKey } from "@solana/web3.js";

/** Seed for deriving the StablecoinState PDA */
export const STABLECOIN_STATE_SEED = Buffer.from("stablecoin_state");

/** Seed for deriving the RolesConfig PDA */
export const ROLES_CONFIG_SEED = Buffer.from("roles_config");

/** Seed for deriving MinterQuota PDAs */
export const MINTER_QUOTA_SEED = Buffer.from("minter_quota");

/** Seed for deriving BlacklistEntry PDAs (SSS-2) */
export const BLACKLIST_SEED = Buffer.from("blacklist");

/** Seed for deriving ExtraAccountMetaList PDA (SSS-2 transfer hook) */
export const EXTRA_ACCOUNT_META_LIST_SEED = Buffer.from("extra-account-metas");

/** Seed for deriving the OracleConfig PDA */
export const ORACLE_CONFIG_SEED = Buffer.from("oracle_config");

/** Seed for deriving PriceFeedEntry PDAs */
export const PRICE_FEED_SEED = Buffer.from("price_feed");

/**
 * Derive the StablecoinState PDA for a given mint.
 *
 * The StablecoinState account stores the main configuration and status of a stablecoin,
 * including name, symbol, pause state, and enabled features.
 *
 * @param mint - The mint public key
 * @param programId - The sss-token program ID
 * @returns A tuple of [PDA address, bump seed]
 *
 * @example
 * ```typescript
 * const [statePda, bump] = deriveStablecoinState(mintPubkey, programId);
 * ```
 */
export function deriveStablecoinState(
	mint: PublicKey,
	programId: PublicKey,
): [PublicKey, number] {
	return PublicKey.findProgramAddressSync(
		[STABLECOIN_STATE_SEED, mint.toBuffer()],
		programId,
	);
}

/**
 * Derive the RolesConfig PDA for a given mint.
 *
 * The RolesConfig account stores role assignments (master, burner, pauser, blacklister, seizer)
 * and pending authority transfers.
 *
 * @param mint - The mint public key
 * @param programId - The sss-token program ID
 * @returns A tuple of [PDA address, bump seed]
 *
 * @example
 * ```typescript
 * const [rolesPda] = deriveRolesConfig(mintPubkey, programId);
 * ```
 */
export function deriveRolesConfig(
	mint: PublicKey,
	programId: PublicKey,
): [PublicKey, number] {
	return PublicKey.findProgramAddressSync(
		[ROLES_CONFIG_SEED, mint.toBuffer()],
		programId,
	);
}

/**
 * Derive the MinterQuota PDA for a given (mint, minter) pair.
 *
 * Each minter has a dedicated MinterQuota account that tracks their quota,
 * minted amount, and active status.
 *
 * @param mint - The mint public key
 * @param minter - The minter's public key
 * @param programId - The sss-token program ID
 * @returns A tuple of [PDA address, bump seed]
 *
 * @example
 * ```typescript
 * const [quotaPda] = deriveMinterQuota(mintPubkey, minterPubkey, programId);
 * ```
 */
export function deriveMinterQuota(
	mint: PublicKey,
	minter: PublicKey,
	programId: PublicKey,
): [PublicKey, number] {
	return PublicKey.findProgramAddressSync(
		[MINTER_QUOTA_SEED, mint.toBuffer(), minter.toBuffer()],
		programId,
	);
}

/**
 * Derive the BlacklistEntry PDA for a given (mint, address) pair.
 *
 * BlacklistEntry accounts are used in SSS-2 stablecoins to enforce on-chain blacklists.
 * The transfer hook checks these accounts on every transfer.
 *
 * @param mint - The mint public key
 * @param address - The address to check/blacklist
 * @param programId - The sss-token program ID
 * @returns A tuple of [PDA address, bump seed]
 *
 * @example
 * ```typescript
 * const [blacklistPda] = deriveBlacklistEntry(mintPubkey, addressToCheck, programId);
 * ```
 */
export function deriveBlacklistEntry(
	mint: PublicKey,
	address: PublicKey,
	programId: PublicKey,
): [PublicKey, number] {
	return PublicKey.findProgramAddressSync(
		[BLACKLIST_SEED, mint.toBuffer(), address.toBuffer()],
		programId,
	);
}

/**
 * Derive the ExtraAccountMetaList PDA for the transfer hook program.
 *
 * This account stores metadata about additional accounts required by the transfer hook,
 * enabling Token-2022 to resolve the necessary accounts for blacklist checks.
 *
 * @param mint - The mint public key
 * @param hookProgramId - The transfer hook program ID
 * @returns A tuple of [PDA address, bump seed]
 *
 * @example
 * ```typescript
 * const [hookPda] = deriveExtraAccountMetaList(mintPubkey, hookProgramId);
 * ```
 */
export function deriveExtraAccountMetaList(
	mint: PublicKey,
	hookProgramId: PublicKey,
): [PublicKey, number] {
	return PublicKey.findProgramAddressSync(
		[EXTRA_ACCOUNT_META_LIST_SEED, mint.toBuffer()],
		hookProgramId,
	);
}

/**
 * Derive the OracleConfig PDA for a given mint.
 *
 * The OracleConfig account stores oracle configuration including currency pair,
 * aggregation method, quality gates, spreads, and cached aggregated price.
 *
 * @param mint - The mint public key
 * @param oracleProgramId - The sss-oracle program ID
 * @returns A tuple of [PDA address, bump seed]
 *
 * @example
 * ```typescript
 * const [oraclePda] = deriveOracleConfig(mintPubkey, oracleProgramId);
 * ```
 */
export function deriveOracleConfig(
	mint: PublicKey,
	oracleProgramId: PublicKey,
): [PublicKey, number] {
	return PublicKey.findProgramAddressSync(
		[ORACLE_CONFIG_SEED, mint.toBuffer()],
		oracleProgramId,
	);
}

/**
 * Derive the PriceFeedEntry PDA for a given (mint, feed_index) pair.
 *
 * Each price feed (Switchboard, Pyth, Chainlink, manual, API) has a dedicated
 * PriceFeedEntry account that stores the feed's configuration and last price observation.
 *
 * @param mint - The mint public key
 * @param feedIndex - The feed index (0-15)
 * @param oracleProgramId - The sss-oracle program ID
 * @returns A tuple of [PDA address, bump seed]
 *
 * @example
 * ```typescript
 * const [feedPda] = derivePriceFeedEntry(mintPubkey, 0, oracleProgramId);
 * ```
 */
export function derivePriceFeedEntry(
	mint: PublicKey,
	feedIndex: number,
	oracleProgramId: PublicKey,
): [PublicKey, number] {
	const [oracleConfig] = deriveOracleConfig(mint, oracleProgramId);
	const indexBuffer = Buffer.alloc(1);
	indexBuffer.writeUInt8(feedIndex, 0);

	return PublicKey.findProgramAddressSync(
		[PRICE_FEED_SEED, oracleConfig.toBuffer(), indexBuffer],
		oracleProgramId,
	);
}
