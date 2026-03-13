import { Connection, PublicKey } from "@solana/web3.js";
import { SolanaStablecoin } from "@stbr/sss-token-sdk";
import { Command } from "commander";
import ora from "ora";
import { error, printTxLink } from "../../utils/display";
import { loadKeypair } from "../../utils/keypair";

export function privacyCommand(): Command {
	const cmd = new Command("privacy");
	cmd.description("SSS-3 privacy / confidential transfer operations");

	// privacy approve
	cmd
		.command("approve <tokenAccount>")
		.description(
			"Approve a token account for confidential transfers (master authority only)",
		)
		.action(async (tokenAccount, opts, cmd) => {
			const globals = cmd.parent!.parent!.opts();
			const spinner = ora(
				"Approving account for confidential transfers...",
			).start();
			try {
				const authority = loadKeypair(globals.keypair);
				const connection = new Connection(globals.url, "confirmed");
				const stable = await SolanaStablecoin.load(
					connection,
					new PublicKey(globals.mint),
					authority,
				);
				const sig = await stable.privacy.approveAccount(
					new PublicKey(tokenAccount),
				);
				spinner.succeed(
					`Account approved for confidential transfers: ${tokenAccount}`,
				);
				printTxLink(sig);
			} catch (err: any) {
				spinner.fail("Approve failed");
				error(err.message);
				process.exit(1);
			}
		});

	// privacy enable-credits
	cmd
		.command("enable-credits <tokenAccount>")
		.description("Enable receiving confidential transfers (account owner only)")
		.action(async (tokenAccount, opts, cmd) => {
			const globals = cmd.parent!.parent!.opts();
			const spinner = ora("Enabling confidential credits...").start();
			try {
				const authority = loadKeypair(globals.keypair);
				const connection = new Connection(globals.url, "confirmed");
				const stable = await SolanaStablecoin.load(
					connection,
					new PublicKey(globals.mint),
					authority,
				);
				const sig = await stable.privacy.enableCredits(
					new PublicKey(tokenAccount),
				);
				spinner.succeed(`Confidential credits enabled: ${tokenAccount}`);
				printTxLink(sig);
			} catch (err: any) {
				spinner.fail("Enable credits failed");
				error(err.message);
				process.exit(1);
			}
		});

	// privacy disable-credits
	cmd
		.command("disable-credits <tokenAccount>")
		.description(
			"Disable receiving confidential transfers (account owner only)",
		)
		.action(async (tokenAccount, opts, cmd) => {
			const globals = cmd.parent!.parent!.opts();
			const spinner = ora("Disabling confidential credits...").start();
			try {
				const authority = loadKeypair(globals.keypair);
				const connection = new Connection(globals.url, "confirmed");
				const stable = await SolanaStablecoin.load(
					connection,
					new PublicKey(globals.mint),
					authority,
				);
				const sig = await stable.privacy.disableCredits(
					new PublicKey(tokenAccount),
				);
				spinner.succeed(`Confidential credits disabled: ${tokenAccount}`);
				printTxLink(sig);
			} catch (err: any) {
				spinner.fail("Disable credits failed");
				error(err.message);
				process.exit(1);
			}
		});

	return cmd;
}
