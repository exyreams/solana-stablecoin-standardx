import { Connection, PublicKey } from "@solana/web3.js";
import { SolanaStablecoin } from "@stbr/sss-token-sdk";
import { Command } from "commander";
import ora from "ora";
import { error, printTxLink, success, warn } from "../../utils/display";
import { loadKeypair } from "../../utils/keypair";

export function closeMintCommand(): Command {
	const cmd = new Command("close-mint");
	cmd
		.description(
			"Permanently close the mint and reclaim all rent (supply must be zero, irreversible)",
		)
		.option("--force", "Skip confirmation prompt", false)
		.action(async (opts, cmd) => {
			const globals = cmd.parent!.opts();

			if (!opts.force) {
				warn(
					"⚠️  This is IRREVERSIBLE. The mint, state, and roles will be permanently destroyed.",
				);
				warn(
					'   All MinterQuota PDAs should be removed first via "minters remove".',
				);
				warn("   Run with --force to skip this warning.\n");

				// Simple confirmation via stdin
				const readline = await import("readline");
				const rl = readline.createInterface({
					input: process.stdin,
					output: process.stdout,
				});
				const answer = await new Promise<string>((resolve) => {
					rl.question('Type "CLOSE" to confirm: ', resolve);
				});
				rl.close();

				if (answer !== "CLOSE") {
					console.log("Aborted.");
					process.exit(0);
				}
			}

			const spinner = ora("Closing mint...").start();
			try {
				const authority = loadKeypair(globals.keypair);
				const connection = new Connection(globals.url, "confirmed");
				const stable = await SolanaStablecoin.load(
					connection,
					new PublicKey(globals.mint),
					authority,
				);
				const sig = await stable.closeMint();
				spinner.succeed("Mint permanently closed");
				success("All rent reclaimed to master authority");
				printTxLink(sig);
			} catch (err: any) {
				spinner.fail("Close mint failed");
				error(err.message);
				process.exit(1);
			}
		});
	return cmd;
}
