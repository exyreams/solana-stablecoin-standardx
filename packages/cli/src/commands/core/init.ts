import { Connection, PublicKey } from "@solana/web3.js";
import { Presets, SolanaStablecoin } from "@stbr/sss-token-sdk";
import { Command } from "commander";
import ora from "ora";
import { loadCustomConfig } from "../../utils/config";
import { error, info, printTable, success } from "../../utils/display";
import { loadKeypair } from "../../utils/keypair";

export function initCommand(): Command {
	const cmd = new Command("init");
	cmd
		.description("Initialize a new stablecoin mint")
		.option(
			"--preset <preset>",
			"Preset to use: sss-1, sss-2, or sss-3",
			"sss-1",
		)
		.option("--custom <file>", "Path to custom TOML or JSON config file")
		.requiredOption("--name <name>", "Token name (max 32 bytes)")
		.requiredOption("--symbol <symbol>", "Token symbol (max 10 bytes)")
		.option("--decimals <n>", "Decimal places", "6")
		.option("--uri <uri>", "Metadata URI (max 200 bytes)", "")
		.option(
			"--transfer-hook-program <programId>",
			"Transfer hook program ID (SSS-2)",
		)
		.option(
			"--auto-approve",
			"Auto-approve new accounts for confidential transfers (SSS-3)",
			false,
		)
		.option(
			"--auditor-elgamal-pubkey <pubkey>",
			"Auditor ElGamal public key hex (SSS-3)",
		)
		.option("--mint-keypair <path>", "Path to a specific mint keypair file")
		.option(
			"--mint-close-authority",
			"Enable mint close authority (incompatible with Metaplex)",
			false,
		)
		.action(async (opts, cmd) => {
			const globals = cmd.parent!.opts();
			const spinner = ora("Initializing stablecoin...").start();
			try {
				const authority = loadKeypair(globals.keypair);
				const connection = new Connection(globals.url, "confirmed");

				// If custom config file is provided, load and merge it
				if (opts.custom) {
					const customConfig = loadCustomConfig(opts.custom);
					const stable = await SolanaStablecoin.create(connection, {
						name: customConfig.name ?? opts.name,
						symbol: customConfig.symbol ?? opts.symbol,
						decimals: customConfig.decimals ?? parseInt(opts.decimals),
						uri: customConfig.uri ?? opts.uri,
						authority,
						enablePermanentDelegate:
							customConfig.enable_permanent_delegate ?? false,
						enableTransferHook: customConfig.enable_transfer_hook ?? false,
						defaultAccountFrozen: customConfig.default_account_frozen ?? false,
						transferHookProgramId: customConfig.transfer_hook_program_id
							? new PublicKey(customConfig.transfer_hook_program_id)
							: undefined,
						mintKeypair: opts.mintKeypair ? loadKeypair(opts.mintKeypair) : undefined,
						enableMintCloseAuthority: opts.mintCloseAuthority ?? false,
						enableConfidentialTransfers:
							customConfig.enable_confidential_transfers ?? false,
						confidentialTransferAutoApprove:
							customConfig.confidential_transfer_auto_approve ?? false,
						auditorElGamalPubkey: customConfig.auditor_elgamal_pubkey
							? Buffer.from(customConfig.auditor_elgamal_pubkey, "hex")
							: undefined,
					});
					spinner.succeed("Stablecoin initialized from custom config!");
					success(`Mint address: ${stable.stablecoin.mint.toBase58()}`);
					info(`Config file:  ${opts.custom}`);
					printInitSummary(
						stable.stablecoin.mint,
						customConfig.name ?? opts.name,
						opts.symbol,
						"custom",
					);
					return;
				}

				// Preset-based initialization
				let preset: (typeof Presets)[keyof typeof Presets];
				let presetLabel: string;

				switch (opts.preset.toLowerCase()) {
					case "sss-2":
						preset = Presets.SSS_2;
						presetLabel = "SSS-2 (Compliant)";
						break;
					case "sss-3":
						preset = Presets.SSS_3;
						presetLabel = "SSS-3 (Private)";
						break;
					case "sss-1":
					default:
						preset = Presets.SSS_1;
						presetLabel = "SSS-1 (Minimal)";
						break;
				}

				const createConfig: any = {
					preset,
					name: opts.name,
					symbol: opts.symbol,
					decimals: parseInt(opts.decimals),
					uri: opts.uri,
					authority,
					mintKeypair: opts.mintKeypair ? loadKeypair(opts.mintKeypair) : undefined,
					enableMintCloseAuthority: opts.mintCloseAuthority ?? false,
				};

				// SSS-2: transfer hook program is required
				if (preset === Presets.SSS_2) {
					if (!opts.transferHookProgram) {
						spinner.fail("SSS-2 requires --transfer-hook-program <programId>");
						process.exit(1);
					}
					createConfig.transferHookProgramId = new PublicKey(
						opts.transferHookProgram,
					);
				}

				// SSS-3: optional params
				if (preset === Presets.SSS_3) {
					createConfig.confidentialTransferAutoApprove =
						opts.autoApprove ?? false;
					if (opts.auditorElgamalPubkey) {
						createConfig.auditorElGamalPubkey = Buffer.from(
							opts.auditorElgamalPubkey,
							"hex",
						);
					}
				}

				const stable = await SolanaStablecoin.create(connection, createConfig);

				spinner.succeed("Stablecoin initialized!");
				printInitSummary(
					stable.stablecoin.mint,
					opts.name,
					opts.symbol,
					presetLabel,
				);
			} catch (err: any) {
				spinner.fail("Initialization failed");
				error(err.message);
				process.exit(1);
			}
		});
	return cmd;
}

function printInitSummary(
	mint: PublicKey,
	name: string,
	symbol: string,
	preset: string,
) {
	printTable(
		["Field", "Value"],
		[
			["Mint", mint.toBase58()],
			["Name", name],
			["Symbol", symbol],
			["Preset", preset],
		],
	);
	console.log("\nSet this as your default mint:");
	console.log(`  export STABLECOIN_MINT=${mint.toBase58()}`);
}
