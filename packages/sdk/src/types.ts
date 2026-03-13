import type { Keypair } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

// ── Config Types ─────────────────────────────────────────────────────────────

export interface PresetConfig {
	enablePermanentDelegate: boolean;
	enableTransferHook: boolean;
	defaultAccountFrozen: boolean;
	enableConfidentialTransfers: boolean;
	confidentialTransferAutoApprove: boolean;
}

export interface CreateOptions {
	/** Use a pre-defined preset config (SSS_1, SSS_2, SSS_3). */
	preset?: PresetConfig;
	name: string;
	symbol: string;
	decimals?: number;
	uri?: string;

	// ── Direct extension flags (override preset or use standalone) ──────
	enableMintCloseAuthority?: boolean;
	enablePermanentDelegate?: boolean;
	enableTransferHook?: boolean;
	defaultAccountFrozen?: boolean;
	enableConfidentialTransfers?: boolean;
	confidentialTransferAutoApprove?: boolean;

	// ── Extension-specific config ───────────────────────────────────────
	/** Transfer hook program ID (required for SSS-2). */
	transferHookProgramId?: PublicKey;
	/** Auditor ElGamal public key for confidential transfers (SSS-3). */
	auditorElGamalPubkey?: Buffer | Uint8Array | number[];

	// ── Deprecated — use top-level fields instead ───────────────────────
	extensions?: {
		permanentDelegate?: boolean;
		transferHook?: boolean;
		defaultAccountFrozen?: boolean;
	};
}

// ── Role Types ────────────────────────────────────────────────────────────────

/** Fields for update_roles instruction. All optional — only provided fields are updated. */
export interface RolesUpdate {
	burner?: PublicKey;
	pauser?: PublicKey;
	blacklister?: PublicKey;
	seizer?: PublicKey;
}

/** Parameters for update_minter instruction. */
export interface MinterUpdateOptions {
	minter: PublicKey;
	quota: bigint;
	active: boolean;
	resetMinted?: boolean;
}

// ── On-chain State Types ──────────────────────────────────────────────────────

export interface StablecoinStatus {
	version: number;
	mint: PublicKey;
	name: string;
	symbol: string;
	decimals: number;
	uri: string;
	paused: boolean;
	totalSupply: bigint;
	enablePermanentDelegate: boolean;
	enableTransferHook: boolean;
	defaultAccountFrozen: boolean;
	enableConfidentialTransfers: boolean;
	confidentialTransferAutoApprove: boolean;
}

export interface RolesStatus {
	masterAuthority: PublicKey;
	pendingMaster: PublicKey | null;
	burner: PublicKey;
	pauser: PublicKey;
	blacklister: PublicKey;
	seizer: PublicKey;
}

export interface MinterQuotaInfo {
	mint: PublicKey;
	minter: PublicKey;
	quota: bigint;
	minted: bigint;
	active: boolean;
}

export interface BlacklistEntry {
	mint: PublicKey;
	address: PublicKey;
	reason: string;
	timestamp: bigint;
}

// ── Oracle Types ──────────────────────────────────────────────────────────────

export enum AggregationMethod {
	Median = 0,
	Mean = 1,
	WeightedMean = 2,
}

export enum FeedType {
	Switchboard = 0,
	Pyth = 1,
	Chainlink = 2,
	Manual = 3,
	API = 4,
}

export interface OracleInitializeOptions {
	baseCurrency: string;
	quoteCurrency: string;
	maxStalenessSeconds?: number;
	maxConfidenceIntervalBps?: number;
	aggregationMethod?: AggregationMethod;
	minFeedsRequired?: number;
	deviationThresholdBps?: number;
	maxPriceChangeBps?: number;
	mintPremiumBps?: number;
	redeemDiscountBps?: number;
	cranker?: PublicKey;
}

export interface OracleUpdateConfigOptions {
	maxStalenessSeconds?: number;
	maxConfidenceIntervalBps?: number;
	aggregationMethod?: AggregationMethod;
	minFeedsRequired?: number;
	deviationThresholdBps?: number;
	maxPriceChangeBps?: number;
	mintPremiumBps?: number;
	redeemDiscountBps?: number;
	cranker?: PublicKey;
	paused?: boolean;
}

export interface AddFeedOptions {
	feedIndex: number;
	feedType: FeedType;
	feedAddress?: PublicKey;
	label: string;
	weight?: number;
	maxStalenessOverride?: number;
}

export interface CrankFeedOptions {
	feedIndex: number;
	price: bigint;
	confidence: bigint;
	cranker?: Keypair;
}

export interface OracleStatus {
	version: number;
	authority: PublicKey;
	pendingAuthority: PublicKey | null;
	cranker: PublicKey;
	mint: PublicKey;
	baseCurrency: string;
	quoteCurrency: string;
	maxStalenessSeconds: number;
	maxConfidenceIntervalBps: number;
	aggregationMethod: number;
	minFeedsRequired: number;
	deviationThresholdBps: number;
	maxPriceChangeBps: number;
	mintPremiumBps: number;
	redeemDiscountBps: number;
	manualPrice: bigint;
	manualPriceActive: boolean;
	lastAggregatedPrice: bigint;
	lastAggregatedConfidence: bigint;
	lastAggregatedTimestamp: number;
	feedCount: number;
	paused: boolean;
}

export interface PriceFeedInfo {
	priceFeedPda: PublicKey;
	oracleConfig: PublicKey;
	feedIndex: number;
	feedType: number;
	feedAddress: PublicKey;
	label: string;
	lastPrice: bigint;
	lastConfidence: bigint;
	lastTimestamp: number;
	weight: number;
	enabled: boolean;
	maxStalenessOverride: number;
}
