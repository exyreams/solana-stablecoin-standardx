import { Connection, PublicKey } from "@solana/web3.js";
import { SolanaStablecoin } from "@stbr/sss-token-sdk";
import { Command } from "commander";
import ora from "ora";
import { error, printTxLink } from "../../utils/display";
import { loadKeypair } from "../../utils/keypair";

export function pauseCommand(): Command {
	const cmd = new Command("pause");
	cmd
		.description("Pause all minting and burning")
		.option("--reason <reason>", "Reason for pausing")
		.action(async (opts, cmd) => {
			const globals = cmd.parent!.opts();
			const spinner = ora("Pausing stablecoin...").start();
			try {
				const authority = loadKeypair(globals.keypair);
				const connection = new Connection(globals.url, "confirmed");
				const stable = await SolanaStablecoin.load(
					connection,
					new PublicKey(globals.mint),
					authority,
				);
				const sig = await stable.pause(opts.reason);
				spinner.succeed("Stablecoin paused — minting and burning disabled");
				printTxLink(sig);
			} catch (err: any) {
				spinner.fail("Pause failed");
				error(err.message);
				process.exit(1);
			}
		});
	return cmd;
}

export function unpauseCommand(): Command {
	const cmd = new Command("unpause");
	cmd.description("Resume minting and burning").action(async (opts, cmd) => {
		const globals = cmd.parent!.opts();
		const spinner = ora("Unpausing stablecoin...").start();
		try {
			const authority = loadKeypair(globals.keypair);
			const connection = new Connection(globals.url, "confirmed");
			const stable = await SolanaStablecoin.load(
				connection,
				new PublicKey(globals.mint),
				authority,
			);
			const sig = await stable.unpause();
			spinner.succeed("Stablecoin unpaused — minting and burning resumed");
			printTxLink(sig);
		} catch (err: any) {
			spinner.fail("Unpause failed");
			error(err.message);
			process.exit(1);
		}
	});
	return cmd;
}
