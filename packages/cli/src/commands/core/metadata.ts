import { Connection, PublicKey } from "@solana/web3.js";
import { SolanaStablecoin } from "@stbr/sss-token-sdk";
import chalk from "chalk";
import { Command } from "commander";
import ora from "ora";
import { loadKeypair } from "../../utils/keypair";

export const metadataCommand = new Command("metadata")
	.description("Manage Metaplex metadata for wallet display")
	.addCommand(
		new Command("init")
			.description("Initialize Metaplex metadata (required for wallet display)")
			.requiredOption("--name <name>", 'Token name (e.g., "My Stablecoin")')
			.requiredOption("--symbol <symbol>", 'Token symbol (e.g., "MYUSD")')
			.requiredOption("--uri <uri>", "Metadata JSON URI (Arweave, IPFS, etc.)")
			.requiredOption(
				"--mint-keypair <path>",
				"Path to mint keypair JSON (required for Metaplex)",
			)
			.option("--seller-fee <bps>", "Seller fee basis points (default: 0)", "0")
			.action(async (options, cmd) => {
				const globals = cmd.parent!.parent!.opts();
				const spinner = ora("Initializing Metaplex metadata...").start();

				try {
					if (!globals.mint) {
						spinner.fail("No mint address provided. Use --mint option.");
						process.exit(1);
					}

					const authority = loadKeypair(globals.keypair);
					const mintKeypair = loadKeypair(options.mintKeypair);
					const connection = new Connection(globals.url, "confirmed");
					const mintAddress = new PublicKey(globals.mint);

					// Verify mint keypair matches mint address
					if (!mintKeypair.publicKey.equals(mintAddress)) {
						spinner.fail(
							"Mint keypair does not match --mint address. Please provide the correct mint keypair.",
						);
						process.exit(1);
					}

					// Load stablecoin instance
					const stablecoin = await SolanaStablecoin.load(
						connection,
						mintAddress,
						authority,
					);

					// Initialize Metaplex metadata
					const metadataAccount = await stablecoin.initializeMetaplexMetadata(
						{
							name: options.name,
							symbol: options.symbol,
							uri: options.uri,
							sellerFeeBasisPoints: parseInt(options.sellerFee, 10),
						},
						mintKeypair,
					);

					spinner.succeed("Metaplex metadata initialized successfully!");

					console.log("\n" + chalk.bold("Metadata Details:"));
					console.log(chalk.gray("─".repeat(60)));
					console.log(`${chalk.cyan("Name:")}          ${options.name}`);
					console.log(`${chalk.cyan("Symbol:")}        ${options.symbol}`);
					console.log(`${chalk.cyan("URI:")}           ${options.uri}`);
					console.log(
						`${chalk.cyan("Metadata PDA:")}  ${metadataAccount.toBase58()}`,
					);
					console.log(chalk.gray("─".repeat(60)));

					console.log(
						"\n" +
							chalk.green("✓") +
							" Your token will now display in wallets (Phantom, Solflare, etc.)",
					);
					console.log(
						chalk.gray(
							"  Note: It may take a few minutes for wallets to index the metadata.",
						),
					);
					console.log(
						"\n" +
							chalk.yellow("⚠") +
							" " +
							chalk.bold("Important:") +
							" Keep your mint keypair secure!",
					);
					console.log(
						chalk.gray(
							"  The mint keypair was required for this one-time metadata creation.",
						),
					);
				} catch (error: any) {
					spinner.fail("Failed to initialize Metaplex metadata");
					console.error(chalk.red("\nError:"), error.message);
					if (error.logs) {
						console.error(chalk.gray("\nProgram logs:"));
						error.logs.forEach((log: string) =>
							console.error(chalk.gray("  " + log)),
						);
					}
					process.exit(1);
				}
			}),
	);
