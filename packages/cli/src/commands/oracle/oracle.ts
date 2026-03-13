import { Connection, PublicKey } from "@solana/web3.js";
import {
	AggregationMethod,
	FeedType,
	SolanaStablecoin,
} from "@stbr/sss-token-sdk";
import { Command } from "commander";
import ora from "ora";
import {
	error,
	info,
	printTable,
	printTxLink,
	success,
} from "../../utils/display";
import { loadKeypair } from "../../utils/keypair";

export function oracleCommand(): Command {
	const cmd = new Command("oracle");
	cmd.description("Manage oracle price feeds for non-USD pegs");

	// oracle init
	cmd
		.command("init")
		.description("Initialize oracle for the stablecoin mint")
		.requiredOption("--base <currency>", "Base currency (e.g., EUR, BRL, CPI)")
		.requiredOption("--quote <currency>", "Quote currency (e.g., USD)")
		.option("--staleness <seconds>", "Max staleness in seconds", "300")
		.option("--confidence <bps>", "Max confidence interval in bps", "100")
		.option(
			"--method <method>",
			"Aggregation method: median, mean, weighted",
			"median",
		)
		.option("--mint-premium <bps>", "Mint premium in bps", "0")
		.option("--redeem-discount <bps>", "Redeem discount in bps", "0")
		.option(
			"--circuit-breaker <bps>",
			"Max single-crank price change in bps (0 = disabled)",
			"500",
		)
		.option(
			"--deviation <bps>",
			"Max deviation threshold in bps (0 = disabled)",
			"0",
		)
		.action(async (opts, cmd) => {
			const globals = cmd.parent!.parent!.opts();
			const spinner = ora("Initializing oracle...").start();
			try {
				const authority = loadKeypair(globals.keypair);
				const connection = new Connection(globals.url, "confirmed");
				const stable = await SolanaStablecoin.load(
					connection,
					new PublicKey(globals.mint),
					authority,
				);

				let method: AggregationMethod;
				switch (opts.method.toLowerCase()) {
					case "mean":
						method = AggregationMethod.Mean;
						break;
					case "weighted":
						method = AggregationMethod.WeightedMean;
						break;
					default:
						method = AggregationMethod.Median;
				}

				const sig = await stable.oracle.initialize({
					baseCurrency: opts.base,
					quoteCurrency: opts.quote,
					maxStalenessSeconds: parseInt(opts.staleness),
					maxConfidenceIntervalBps: parseInt(opts.confidence),
					aggregationMethod: method,
					mintPremiumBps: parseInt(opts.mintPremium),
					redeemDiscountBps: parseInt(opts.redeemDiscount),
					maxPriceChangeBps: parseInt(opts.circuitBreaker),
					deviationThresholdBps: parseInt(opts.deviation),
				});

				spinner.succeed(`Oracle initialized: ${opts.base}/${opts.quote}`);
				success(`Aggregation: ${opts.method}`);
				success(`Staleness: ${opts.staleness}s`);
				printTxLink(sig);
			} catch (err: any) {
				spinner.fail("Oracle initialization failed");
				error(err.message);
				process.exit(1);
			}
		});

	// oracle status
	cmd
		.command("status")
		.description("Show oracle configuration and current state")
		.action(async (opts, cmd) => {
			const globals = cmd.parent!.parent!.opts();
			const spinner = ora("Fetching oracle status...").start();
			try {
				const authority = loadKeypair(globals.keypair);
				const connection = new Connection(globals.url, "confirmed");
				const stable = await SolanaStablecoin.load(
					connection,
					new PublicKey(globals.mint),
					authority,
				);
				const status = await stable.oracle.getStatus();
				spinner.stop();

				const methodLabel = ["Median", "Mean", "Weighted Mean"][
					status.aggregationMethod
				];

				printTable(
					["Field", "Value"],
					[
						["Currency Pair", `${status.baseCurrency}/${status.quoteCurrency}`],
						["Version", String(status.version)],
						["Authority", status.authority.toBase58()],
						[
							"Pending Authority",
							status.pendingAuthority
								? status.pendingAuthority.toBase58()
								: "(none)",
						],
						["Paused", status.paused ? "🔴 YES" : "🟢 NO"],
						["Feed Count", String(status.feedCount)],
						["Aggregation Method", methodLabel],
						["Max Staleness", `${status.maxStalenessSeconds}s`],
						["Max Confidence", `${status.maxConfidenceIntervalBps} bps`],
						["Mint Premium", `${status.mintPremiumBps} bps`],
						["Redeem Discount", `${status.redeemDiscountBps} bps`],
						["Max Price Change", `${status.maxPriceChangeBps} bps`],
						["Deviation Threshold", `${status.deviationThresholdBps} bps`],
						[
							"Last Aggregated Price",
							status.lastAggregatedPrice
								? String(status.lastAggregatedPrice)
								: "(none)",
						],
						[
							"Last Aggregation Time",
							status.lastAggregatedTimestamp
								? new Date(
										Number(status.lastAggregatedTimestamp) * 1000,
									).toISOString()
								: "(none)",
						],
					],
				);
			} catch (err: any) {
				spinner.fail("Failed to fetch oracle status");
				error(err.message);
				process.exit(1);
			}
		});

	// oracle update
	cmd
		.command("update")
		.description("Update oracle configuration")
		.option("--staleness <seconds>", "Max staleness in seconds")
		.option("--confidence <bps>", "Max confidence interval in bps")
		.option("--method <method>", "Aggregation method: median, mean, weighted")
		.option("--mint-premium <bps>", "Mint premium in bps")
		.option("--redeem-discount <bps>", "Redeem discount in bps")
		.option("--circuit-breaker <bps>", "Max single-crank price change in bps")
		.option("--deviation <bps>", "Max deviation threshold in bps")
		.option("--pause", "Pause oracle")
		.option("--unpause", "Unpause oracle")
		.action(async (opts, cmd) => {
			const globals = cmd.parent!.parent!.opts();
			const spinner = ora("Updating oracle config...").start();
			try {
				const authority = loadKeypair(globals.keypair);
				const connection = new Connection(globals.url, "confirmed");
				const stable = await SolanaStablecoin.load(
					connection,
					new PublicKey(globals.mint),
					authority,
				);

				const update: any = {};
				if (opts.staleness)
					update.maxStalenessSeconds = parseInt(opts.staleness);
				if (opts.confidence)
					update.maxConfidenceIntervalBps = parseInt(opts.confidence);
				if (opts.method) {
					switch (opts.method.toLowerCase()) {
						case "mean":
							update.aggregationMethod = AggregationMethod.Mean;
							break;
						case "weighted":
							update.aggregationMethod = AggregationMethod.WeightedMean;
							break;
						default:
							update.aggregationMethod = AggregationMethod.Median;
					}
				}
				if (opts.mintPremium)
					update.mintPremiumBps = parseInt(opts.mintPremium);
				if (opts.redeemDiscount)
					update.redeemDiscountBps = parseInt(opts.redeemDiscount);
				if (opts.circuitBreaker)
					update.maxPriceChangeBps = parseInt(opts.circuitBreaker);
				if (opts.deviation)
					update.deviationThresholdBps = parseInt(opts.deviation);
				if (opts.pause !== undefined) update.paused = true;
				if (opts.unpause !== undefined) update.paused = false;

				if (Object.keys(update).length === 0) {
					spinner.fail("No updates specified");
					process.exit(1);
				}

				const sig = await stable.oracle.updateConfig(update);
				spinner.succeed("Oracle config updated");
				printTxLink(sig);
			} catch (err: any) {
				spinner.fail("Oracle update failed");
				error(err.message);
				process.exit(1);
			}
		});

	// oracle add-feed
	cmd
		.command("add-feed")
		.description("Add a price feed to the oracle")
		.requiredOption("--index <n>", "Feed index (0-255)")
		.requiredOption(
			"--type <type>",
			"Feed type: switchboard, pyth, chainlink, manual, api",
		)
		.requiredOption(
			"--address <pubkey>",
			"Feed address (PublicKey for on-chain feeds)",
		)
		.option("--label <label>", "Feed label", "")
		.option("--weight <n>", "Feed weight for weighted mean aggregation", "1")
		.option(
			"--staleness <seconds>",
			"Per-feed staleness override (0 = use global)",
			"0",
		)
		.action(async (opts, cmd) => {
			const globals = cmd.parent!.parent!.opts();
			const spinner = ora("Adding price feed...").start();
			try {
				const authority = loadKeypair(globals.keypair);
				const connection = new Connection(globals.url, "confirmed");
				const stable = await SolanaStablecoin.load(
					connection,
					new PublicKey(globals.mint),
					authority,
				);

				let feedType: FeedType;
				switch (opts.type.toLowerCase()) {
					case "pyth":
						feedType = FeedType.Pyth;
						break;
					case "chainlink":
						feedType = FeedType.Chainlink;
						break;
					case "manual":
						feedType = FeedType.Manual;
						break;
					case "api":
						feedType = FeedType.API;
						break;
					default:
						feedType = FeedType.Switchboard;
				}

				const sig = await stable.oracle.addFeed({
					feedIndex: parseInt(opts.index),
					feedType,
					feedAddress: new PublicKey(opts.address),
					label: opts.label,
					weight: parseInt(opts.weight),
					maxStalenessOverride: parseInt(opts.staleness),
				});

				spinner.succeed(`Feed added: ${opts.type} at index ${opts.index}`);
				printTxLink(sig);
			} catch (err: any) {
				spinner.fail("Add feed failed");
				error(err.message);
				process.exit(1);
			}
		});

	// oracle remove-feed
	cmd
		.command("remove-feed <index>")
		.description("Remove a price feed from the oracle")
		.action(async (index, opts, cmd) => {
			const globals = cmd.parent!.parent!.opts();
			const spinner = ora(`Removing feed ${index}...`).start();
			try {
				const authority = loadKeypair(globals.keypair);
				const connection = new Connection(globals.url, "confirmed");
				const stable = await SolanaStablecoin.load(
					connection,
					new PublicKey(globals.mint),
					authority,
				);
				const sig = await stable.oracle.removeFeed(parseInt(index));
				spinner.succeed(`Feed ${index} removed`);
				printTxLink(sig);
			} catch (err: any) {
				spinner.fail("Remove feed failed");
				error(err.message);
				process.exit(1);
			}
		});

	// oracle crank
	cmd
		.command("crank <index>")
		.description("Push a price observation to a feed")
		.requiredOption("--price <price>", "Price value (9-decimal fixed-point)")
		.option("--confidence <confidence>", "Confidence interval", "0")
		.action(async (index, opts, cmd) => {
			const globals = cmd.parent!.parent!.opts();
			const spinner = ora(`Cranking feed ${index}...`).start();
			try {
				const authority = loadKeypair(globals.keypair);
				const connection = new Connection(globals.url, "confirmed");
				const stable = await SolanaStablecoin.load(
					connection,
					new PublicKey(globals.mint),
					authority,
				);
				const sig = await stable.oracle.crankFeed({
					feedIndex: parseInt(index),
					price: BigInt(opts.price),
					confidence: BigInt(opts.confidence),
					cranker: authority,
				});
				spinner.succeed(`Feed ${index} cranked with price ${opts.price}`);
				printTxLink(sig);
			} catch (err: any) {
				spinner.fail("Crank failed");
				error(err.message);
				process.exit(1);
			}
		});

	// oracle set-manual
	cmd
		.command("set-manual")
		.description("Set manual price override (authority only)")
		.requiredOption("--price <price>", "Manual price (9-decimal fixed-point)")
		.option("--active", "Activate manual override", false)
		.option("--no-active", "Deactivate manual override")
		.action(async (opts, cmd) => {
			const globals = cmd.parent!.parent!.opts();
			const spinner = ora("Setting manual price...").start();
			try {
				const authority = loadKeypair(globals.keypair);
				const connection = new Connection(globals.url, "confirmed");
				const stable = await SolanaStablecoin.load(
					connection,
					new PublicKey(globals.mint),
					authority,
				);
				const sig = await stable.oracle.setManualPrice(
					BigInt(opts.price),
					opts.active,
				);
				spinner.succeed(
					`Manual price set: ${opts.price} (${opts.active ? "active" : "inactive"})`,
				);
				printTxLink(sig);
			} catch (err: any) {
				spinner.fail("Set manual price failed");
				error(err.message);
				process.exit(1);
			}
		});

	// oracle price
	cmd
		.command("price")
		.description("Get current mint or redeem price")
		.option("--side <side>", "Price side: mint or redeem", "mint")
		.action(async (opts, cmd) => {
			const globals = cmd.parent!.parent!.opts();
			const spinner = ora("Fetching price...").start();
			try {
				const authority = loadKeypair(globals.keypair);
				const connection = new Connection(globals.url, "confirmed");
				const stable = await SolanaStablecoin.load(
					connection,
					new PublicKey(globals.mint),
					authority,
				);

				const price =
					opts.side.toLowerCase() === "redeem"
						? await stable.oracle.getRedeemPrice()
						: await stable.oracle.getMintPrice();

				spinner.stop();
				success(`${opts.side.toUpperCase()} price: ${price}`);
			} catch (err: any) {
				spinner.fail("Price fetch failed");
				error(err.message);
				process.exit(1);
			}
		});

	// oracle feeds
	cmd
		.command("feeds")
		.description("List all registered price feeds")
		.action(async (opts, cmd) => {
			const globals = cmd.parent!.parent!.opts();
			const spinner = ora("Fetching feeds...").start();
			try {
				const authority = loadKeypair(globals.keypair);
				const connection = new Connection(globals.url, "confirmed");
				const stable = await SolanaStablecoin.load(
					connection,
					new PublicKey(globals.mint),
					authority,
				);
				const feeds = await stable.oracle.getFeeds();
				spinner.stop();

				if (feeds.length === 0) {
					success("No feeds registered");
					return;
				}

				const feedTypeLabels = [
					"Switchboard",
					"Pyth",
					"Chainlink",
					"Manual",
					"API",
				];
				const rows = feeds.map((f: any) => [
					String(f.feedIndex),
					feedTypeLabels[f.feedType] ?? "Unknown",
					f.feedAddress.toBase58(),
					f.label || "(no label)",
					f.enabled ? "🟢 Yes" : "🔴 No",
					String(f.weight),
					f.lastPrice ? String(f.lastPrice) : "(none)",
					f.lastUpdateTimestamp
						? new Date(Number(f.lastUpdateTimestamp) * 1000).toISOString()
						: "(none)",
				]);

				printTable(
					[
						"Index",
						"Type",
						"Address",
						"Label",
						"Enabled",
						"Weight",
						"Last Price",
						"Last Update",
					],
					rows,
				);
			} catch (err: any) {
				spinner.fail("Failed to fetch feeds");
				error(err.message);
				process.exit(1);
			}
		});

	// oracle transfer-authority
	cmd
		.command("transfer-authority <newAuthority>")
		.description("Initiate oracle authority transfer (step 1 of 2)")
		.action(async (newAuthority, opts, cmd) => {
			const globals = cmd.parent!.parent!.opts();
			const spinner = ora("Initiating oracle authority transfer...").start();
			try {
				const authority = loadKeypair(globals.keypair);
				const connection = new Connection(globals.url, "confirmed");
				const stable = await SolanaStablecoin.load(
					connection,
					new PublicKey(globals.mint),
					authority,
				);
				const sig = await stable.oracle.transferAuthority(
					new PublicKey(newAuthority),
				);
				spinner.succeed(
					`Oracle authority transfer initiated → ${newAuthority}`,
				);
				success(
					'The new authority must call "sss-token oracle accept-authority" to complete',
				);
				printTxLink(sig);
			} catch (err: any) {
				spinner.fail("Oracle authority transfer failed");
				error(err.message);
				process.exit(1);
			}
		});

	// oracle accept-authority
	cmd
		.command("accept-authority")
		.description("Accept pending oracle authority transfer (step 2 of 2)")
		.action(async (opts, cmd) => {
			const globals = cmd.parent!.parent!.opts();
			const spinner = ora("Accepting oracle authority transfer...").start();
			try {
				const authority = loadKeypair(globals.keypair);
				const connection = new Connection(globals.url, "confirmed");
				const stable = await SolanaStablecoin.load(
					connection,
					new PublicKey(globals.mint),
					authority,
				);
				const sig = await stable.oracle.acceptAuthority();
				spinner.succeed(
					"Oracle authority transfer accepted — you are now the oracle authority",
				);
				printTxLink(sig);
			} catch (err: any) {
				spinner.fail("Oracle authority accept failed");
				error(err.message);
				process.exit(1);
			}
		});

	// oracle close
	cmd
		.command("close")
		.description("Close the oracle (all feeds must be removed first)")
		.action(async (opts, cmd) => {
			const globals = cmd.parent!.parent!.opts();
			const spinner = ora("Closing oracle...").start();
			try {
				const authority = loadKeypair(globals.keypair);
				const connection = new Connection(globals.url, "confirmed");
				const stable = await SolanaStablecoin.load(
					connection,
					new PublicKey(globals.mint),
					authority,
				);
				const sig = await stable.oracle.close();
				spinner.succeed("Oracle closed — rent reclaimed");
				printTxLink(sig);
			} catch (err: any) {
				spinner.fail("Oracle close failed");
				error(err.message);
				process.exit(1);
			}
		});

	return cmd;
}
