import { Connection, PublicKey } from "@solana/web3.js";
import { Command } from "commander";
import ora from "ora";
import { error, printTable, success } from "../../utils/display";
import { loadKeypair } from "../../utils/keypair";

export function holdersCommand(): Command {
	const cmd = new Command("holders");
	cmd
		.description("List token holders with balances")
		.option(
			"--min-balance <amount>",
			"Minimum balance filter (in token units)",
			"0",
		)
		.action(async (opts, cmd) => {
			const globals = cmd.parent!.opts();
			const spinner = ora("Fetching holders...").start();
			try {
				const connection = new Connection(globals.url, "confirmed");
				const mint = new PublicKey(globals.mint);
				const { TOKEN_2022_PROGRAM_ID } = await import("@solana/spl-token");

				// Fetch all token accounts for this mint via getProgramAccounts
				// Token account layout: mint (32 bytes at offset 0), owner (32 bytes at offset 32)
				const accounts = await connection.getParsedProgramAccounts(
					TOKEN_2022_PROGRAM_ID,
					{
						filters: [{ memcmp: { offset: 0, bytes: mint.toBase58() } }],
					},
				);

				spinner.stop();

				if (accounts.length === 0) {
					success("No token accounts found for this mint");
					return;
				}

				const minBalance = parseFloat(opts.minBalance);
				const rows: string[][] = [];

				for (const account of accounts) {
					const parsed = (account.account.data as any)?.parsed?.info;
					if (!parsed) continue;

					const balance = parseFloat(parsed.tokenAmount?.uiAmountString ?? "0");
					if (balance < minBalance) continue;

					rows.push([
						parsed.owner ?? "unknown",
						account.pubkey.toBase58(),
						parsed.tokenAmount?.uiAmountString ?? "0",
						parsed.state ?? "unknown",
					]);
				}

				// Sort by balance descending
				rows.sort((a, b) => parseFloat(b[2]) - parseFloat(a[2]));

				if (rows.length === 0) {
					success(`No holders with balance ≥ ${minBalance}`);
					return;
				}

				success(`Found ${rows.length} holder(s)`);
				printTable(["Owner", "Token Account", "Balance", "State"], rows);
			} catch (err: any) {
				spinner.fail("Failed to fetch holders");
				error(err.message);
				process.exit(1);
			}
		});
	return cmd;
}
