import { Connection, PublicKey } from "@solana/web3.js";
import { Command } from "commander";
import ora from "ora";
import { error, printTable, success } from "../../utils/display";

export function auditLogCommand(): Command {
	const cmd = new Command("audit-log");
	cmd
		.description("Display recent transactions for the stablecoin mint")
		.option(
			"--action <type>",
			"Filter by memo/log content (mint, burn, freeze, blacklist, seize, pause)",
		)
		.option("--limit <n>", "Max transactions to show", "50")
		.action(async (opts, cmd) => {
			const globals = cmd.parent!.opts();
			const spinner = ora("Fetching audit log...").start();
			try {
				const connection = new Connection(globals.url, "confirmed");
				const mint = new PublicKey(globals.mint);

				const sigs = await connection.getSignaturesForAddress(mint, {
					limit: parseInt(opts.limit),
				});

				if (opts.action) {
					// If action filter is set, fetch full transactions and filter by log content
					const filtered: typeof sigs = [];
					const actionLower = opts.action.toLowerCase();

					for (const sig of sigs) {
						try {
							const tx = await connection.getTransaction(sig.signature, {
								maxSupportedTransactionVersion: 0,
							});
							const logs = tx?.meta?.logMessages ?? [];
							const hasMatch = logs.some((log: string) =>
								log.toLowerCase().includes(actionLower),
							);
							if (hasMatch) filtered.push(sig);
						} catch {
							// Skip failed transaction fetches
						}
					}

					spinner.stop();
					if (filtered.length === 0) {
						success(`No transactions found matching action: ${opts.action}`);
						return;
					}

					const rows = filtered.map((s) => [
						s.signature.slice(0, 24) + "...",
						s.blockTime ? new Date(s.blockTime * 1000).toISOString() : "N/A",
						s.err ? "❌ FAILED" : "✅ OK",
					]);
					success(
						`Found ${filtered.length} transaction(s) matching "${opts.action}"`,
					);
					printTable(["Signature", "Time", "Status"], rows);
				} else {
					spinner.stop();
					if (sigs.length === 0) {
						success("No transactions found");
						return;
					}

					const rows = sigs.map((s) => [
						s.signature.slice(0, 24) + "...",
						s.blockTime ? new Date(s.blockTime * 1000).toISOString() : "N/A",
						s.err ? "❌ FAILED" : "✅ OK",
						s.memo ?? "",
					]);
					printTable(["Signature", "Time", "Status", "Memo"], rows);
				}
			} catch (err: any) {
				spinner.fail("Failed to fetch audit log");
				error(err.message);
				process.exit(1);
			}
		});
	return cmd;
}
