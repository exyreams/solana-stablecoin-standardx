/**
 * Preset configurations for the Solana Stablecoin Standard.
 *
 * This module provides three opinionated preset configurations that cover
 * the most common stablecoin architectures:
 * - SSS-1: Minimal stablecoin for internal use
 * - SSS-2: Compliant stablecoin with blacklist enforcement
 * - SSS-3: Private stablecoin with confidential transfers
 *
 * @module presets
 */

import { PresetConfig } from "./types";

/**
 * SSS-1: Minimal Stablecoin
 *
 * Basic stablecoin with mint authority, freeze authority, and metadata.
 * No permanent delegate, no transfer hook, no confidential transfers.
 *
 * **Use cases:**
 * - Internal tokens
 * - DAO treasuries
 * - Ecosystem settlement
 *
 * **Compliance:** Reactive (freeze accounts after the fact)
 *
 * @example
 * ```typescript
 * const stablecoin = await SolanaStablecoin.create(connection, {
 *   preset: Presets.SSS_1,
 *   name: 'Simple Dollar',
 *   symbol: 'SDOL',
 *   authority: adminKeypair,
 * });
 * ```
 */
export const SSS_1: PresetConfig = {
	enablePermanentDelegate: false,
	enableTransferHook: false,
	defaultAccountFrozen: false,
	enableConfidentialTransfers: false,
	confidentialTransferAutoApprove: false,
};

/**
 * SSS-2: Compliant Stablecoin
 *
 * SSS-1 + permanent delegate + transfer hook + blacklist enforcement.
 * For USDC/USDT-class regulated tokens. Every transfer is checked on-chain
 * against the blacklist.
 *
 * **Use cases:**
 * - Regulated stablecoins
 * - USDC/USDT-class tokens
 * - Tokens requiring on-chain compliance
 *
 * **Compliance:** Proactive (blacklist enforcement on every transfer)
 *
 * **Note:** Requires calling `stablecoin.compliance.initializeHook()` after creation.
 *
 * @example
 * ```typescript
 * const stablecoin = await SolanaStablecoin.create(connection, {
 *   preset: Presets.SSS_2,
 *   name: 'Compliant USD',
 *   symbol: 'CUSD',
 *   authority: adminKeypair,
 *   transferHookProgramId: hookProgramId,
 * });
 *
 * // Initialize transfer hook
 * await stablecoin.compliance.initializeHook();
 * ```
 */
export const SSS_2: PresetConfig = {
	enablePermanentDelegate: true,
	enableTransferHook: true,
	defaultAccountFrozen: false,
	enableConfidentialTransfers: false,
	confidentialTransferAutoApprove: false,
};

/**
 * SSS-3: Private Stablecoin
 *
 * SSS-1 + confidential transfers via ElGamal encryption.
 * Transfer amounts are encrypted on-chain. Optional auditor can decrypt.
 *
 * **Use cases:**
 * - Privacy-preserving stablecoins
 * - Experimental/proof-of-concept tokens
 *
 * **Note:** Experimental feature. Token-2022 confidential transfer tooling is still maturing.
 *
 * @example
 * ```typescript
 * const stablecoin = await SolanaStablecoin.create(connection, {
 *   preset: Presets.SSS_3,
 *   name: 'Private Dollar',
 *   symbol: 'PDOL',
 *   authority: adminKeypair,
 *   auditorElGamalPubkey: auditorPublicKey,
 * });
 * ```
 */
export const SSS_3: PresetConfig = {
	enablePermanentDelegate: false,
	enableTransferHook: false,
	defaultAccountFrozen: false,
	enableConfidentialTransfers: true,
	confidentialTransferAutoApprove: false,
};

/**
 * Collection of all preset configurations.
 *
 * @example
 * ```typescript
 * import { Presets } from '@stbr/sss-token-sdk';
 *
 * // Use a preset
 * const stablecoin = await SolanaStablecoin.create(connection, {
 *   preset: Presets.SSS_2,
 *   name: 'My Token',
 *   symbol: 'MTK',
 *   authority: adminKeypair,
 * });
 * ```
 */
export const Presets = {
	SSS_1,
	SSS_2,
	SSS_3,
} as const;

/**
 * Type representing the names of available presets.
 * Can be 'SSS_1', 'SSS_2', or 'SSS_3'.
 */
export type PresetName = keyof typeof Presets;
