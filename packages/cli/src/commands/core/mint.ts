import { Connection, PublicKey } from "@solana/web3.js";
import { SolanaStablecoin } from "@stbr/sss-token-sdk";
import { Command } from "commander";
import ora from "ora";
import { error, printTxLink, success } from "../../utils/display";
import { loadKeypair } from "../../utils/keypair";

export function mintCommand(): Command {
	const cmd = new Command("mint");
	cmd
		.description("Mint tokens to a recipient")
		.argument("<recipient>", "Recipient wallet address")
		.argument("<amount>", "Amount to mint (in token units, not lamports)")
		.action(async (recipient, amount, opts, cmd) => {
			const globals = cmd.parent!.opts();
			const spinner = ora(`Minting ${amount} tokens...`).start();
			try {
				if (!globals.mint) {
					spinner.fail("No mint address provided. Use --mint <address> or set STABLECOIN_MINT env var.");
					process.exit(1);
				}
				const authority = loadKeypair(globals.keypair);
				const connection = new Connection(globals.url, "confirmed");
				const stable = await SolanaStablecoin.load(
					connection,
					new PublicKey(globals.mint),
					authority,
				);
				const status = await stable.getStatus();
				const rawAmount = BigInt(
					Math.round(parseFloat(amount) * 10 ** status.decimals),
				);

				const sig = await stable.mintTokens({
					recipient: new PublicKey(recipient),
					amount: rawAmount,
					minter: authority,
				});

				spinner.succeed(`Minted ${amount} ${status.symbol}`);
				printTxLink(sig);
			} catch (err: any) {
				spinner.fail("Mint failed");
				error(err.message);
				process.exit(1);
			}
		});
	return cmd;
}
