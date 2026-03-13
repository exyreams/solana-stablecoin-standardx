import { Connection, PublicKey } from "@solana/web3.js";
import { SolanaStablecoin } from "@stbr/sss-token-sdk";
import { Command } from "commander";
import ora from "ora";
import { error, printTxLink, success } from "../../utils/display";
import { loadKeypair } from "../../utils/keypair";

export function freezeCommand(): Command {
	const cmd = new Command("freeze");
	cmd
		.description("Freeze a token account")
		.argument("<tokenAccount>", "Token account address to freeze")
		.action(async (tokenAccount, opts, cmd) => {
			const globals = cmd.parent!.opts();
			const spinner = ora("Freezing account...").start();
			try {
				const authority = loadKeypair(globals.keypair);
				const connection = new Connection(globals.url, "confirmed");
				const stable = await SolanaStablecoin.load(
					connection,
					new PublicKey(globals.mint),
					authority,
				);
				const sig = await stable.freeze(new PublicKey(tokenAccount));
				spinner.succeed(`Account frozen: ${tokenAccount}`);
				printTxLink(sig);
			} catch (err: any) {
				spinner.fail("Freeze failed");
				error(err.message);
				process.exit(1);
			}
		});
	return cmd;
}

export function thawCommand(): Command {
	const cmd = new Command("thaw");
	cmd
		.description("Thaw (unfreeze) a token account")
		.argument("<tokenAccount>", "Token account address to thaw")
		.action(async (tokenAccount, opts, cmd) => {
			const globals = cmd.parent!.opts();
			const spinner = ora("Thawing account...").start();
			try {
				const authority = loadKeypair(globals.keypair);
				const connection = new Connection(globals.url, "confirmed");
				const stable = await SolanaStablecoin.load(
					connection,
					new PublicKey(globals.mint),
					authority,
				);
				const sig = await stable.thaw(new PublicKey(tokenAccount));
				spinner.succeed(`Account thawed: ${tokenAccount}`);
				printTxLink(sig);
			} catch (err: any) {
				spinner.fail("Thaw failed");
				error(err.message);
				process.exit(1);
			}
		});
	return cmd;
}
