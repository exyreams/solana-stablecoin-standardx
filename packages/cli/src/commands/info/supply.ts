import { Connection, PublicKey } from "@solana/web3.js";
import { SolanaStablecoin } from "@stbr/sss-token-sdk";
import { Command } from "commander";
import ora from "ora";
import { error, success } from "../../utils/display";
import { loadKeypair } from "../../utils/keypair";

export function supplyCommand(): Command {
	const cmd = new Command("supply");
	cmd
		.description("Show total supply (reads directly from mint account)")
		.action(async (opts, cmd) => {
			const globals = cmd.parent!.opts();
			const spinner = ora("Fetching supply...").start();
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
				const [status, supply] = await Promise.all([
					stable.getStatus(),
					stable.getTotalSupply(),
				]);
				spinner.stop();
				const humanSupply = (
					Number(supply) /
					10 ** status.decimals
				).toLocaleString();
				success(`Total supply: ${humanSupply} ${status.symbol}`);
			} catch (err: any) {
				spinner.fail("Supply fetch failed");
				error(err.message);
				process.exit(1);
			}
		});
	return cmd;
}
