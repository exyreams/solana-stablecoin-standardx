import { Connection, PublicKey } from "@solana/web3.js";
import { SolanaStablecoin } from "@stbr/sss-token-sdk";
import { Command } from "commander";
import ora from "ora";
import { error, printTxLink } from "../../utils/display";
import { loadKeypair } from "../../utils/keypair";

export function seizeCommand(): Command {
	const cmd = new Command("seize");
	cmd
		.description(
			"Seize tokens from an account to treasury via permanent delegate (SSS-2 only)",
		)
		.argument("<fromTokenAccount>", "Token account to seize from")
		.requiredOption(
			"--to <tokenAccount>",
			"Treasury token account to receive seized funds",
		)
		.requiredOption("--amount <amount>", "Amount to seize (in token units)")
		.action(async (fromTokenAccount, opts, cmd) => {
			const globals = cmd.parent!.opts();
			const spinner = ora(`Seizing tokens from ${fromTokenAccount}...`).start();
			try {
				const authority = loadKeypair(globals.keypair);
				const connection = new Connection(globals.url, "confirmed");
				const stable = await SolanaStablecoin.load(
					connection,
					new PublicKey(globals.mint),
					authority,
				);
				const status = await stable.getStatus();
				const rawAmount = BigInt(
					Math.round(parseFloat(opts.amount) * 10 ** status.decimals),
				);
				const sig = await stable.compliance.seize({
					fromTokenAccount: new PublicKey(fromTokenAccount),
					toTokenAccount: new PublicKey(opts.to),
					amount: rawAmount,
					seizer: authority,
				});
				spinner.succeed(
					`Seized ${opts.amount} ${status.symbol} from ${fromTokenAccount}`,
				);
				printTxLink(sig);
			} catch (err: any) {
				spinner.fail("Seize failed");
				error(err.message);
				process.exit(1);
			}
		});
	return cmd;
}
