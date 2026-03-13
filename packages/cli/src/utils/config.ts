import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Custom stablecoin config loaded from a TOML or JSON file.
 * Field names match the Rust StablecoinConfig struct (snake_case).
 */
export interface CustomStablecoinConfig {
	name?: string;
	symbol?: string;
	uri?: string;
	decimals?: number;
	enable_permanent_delegate?: boolean;
	enable_transfer_hook?: boolean;
	default_account_frozen?: boolean;
	transfer_hook_program_id?: string;
	enable_confidential_transfers?: boolean;
	confidential_transfer_auto_approve?: boolean;
	auditor_elgamal_pubkey?: string;
}

/**
 * Load a custom stablecoin configuration from a TOML or JSON file.
 *
 * Example TOML:
 * ```toml
 * name = "My Stablecoin"
 * symbol = "MYUSD"
 * decimals = 6
 * uri = "https://example.com/metadata.json"
 * enable_permanent_delegate = true
 * enable_transfer_hook = true
 * transfer_hook_program_id = "F8wwXWp8JUKVrDPwFCpG2NrheV3X7KKatoDuiYeBigkf"
 * ```
 */
export function loadCustomConfig(filePath: string): CustomStablecoinConfig {
	const resolved = resolve(filePath);
	const content = readFileSync(resolved, "utf-8");

	if (filePath.endsWith(".toml")) {
		try {
			// Dynamic import for TOML parser
			const TOML = require("@iarna/toml");
			return TOML.parse(content) as CustomStablecoinConfig;
		} catch (err: any) {
			if (err.code === "MODULE_NOT_FOUND") {
				throw new Error(
					"TOML support requires @iarna/toml. Install it with: pnpm add @iarna/toml",
				);
			}
			throw new Error(`Failed to parse TOML config: ${err.message}`);
		}
	}

	if (filePath.endsWith(".json")) {
		try {
			return JSON.parse(content) as CustomStablecoinConfig;
		} catch (err: any) {
			throw new Error(`Failed to parse JSON config: ${err.message}`);
		}
	}

	throw new Error("Config file must be .toml or .json");
}
