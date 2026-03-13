import { Connection, PublicKey } from "@solana/web3.js";
import { SolanaStablecoin } from "@stbr/sss-token-sdk";
import { Command } from "commander";
import ora from "ora";
import { error, printTxLink, success } from "../../utils/display";
import { loadKeypair } from "../../utils/keypair";

export function hookCommand(): Command {
	const cmd = new Command("hook");
	cmd.description("Manage the SSS-2 transfer hook");

	// hook init
	cmd
		.command("init")
		.description(
			"Initialize the ExtraAccountMetaList for the transfer hook (call once after mint creation)",
		)
		.action(async (opts, cmd) => {
			const globals = cmd.parent!.parent!.opts();
			const spinner = ora(
				"Initializing transfer hook ExtraAccountMetaList...",
			).start();
			try {
				const authority = loadKeypair(globals.keypair);
				const connection = new Connection(globals.url, "confirmed");
				const stable = await SolanaStablecoin.load(
					connection,
					new PublicKey(globals.mint),
					authority,
				);
				const sig = await stable.compliance.initializeHook();
				spinner.succeed("Transfer hook initialized");
				success(
					"ExtraAccountMetaList PDA created — blacklist checks are now active on all transfers",
				);
				printTxLink(sig);
			} catch (err: any) {
				spinner.fail("Hook initialization failed");
				error(err.message);
				process.exit(1);
			}
		});

	return cmd;
}
