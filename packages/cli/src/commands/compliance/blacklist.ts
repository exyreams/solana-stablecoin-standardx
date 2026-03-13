import { Connection, PublicKey } from "@solana/web3.js";
import { SolanaStablecoin } from "@stbr/sss-token-sdk";
import { Command } from "commander";
import ora from "ora";
import { error, printTable, printTxLink, success } from "../../utils/display";
import { loadKeypair } from "../../utils/keypair";

export function blacklistCommand(): Command {
	const cmd = new Command("blacklist");
	cmd.description("Manage the SSS-2 on-chain blacklist");

	// blacklist add
	cmd
		.command("add <address>")
		.description("Add an address to the blacklist (SSS-2 only)")
		.requiredOption(
			"--reason <reason>",
			'Reason for blacklisting (e.g. "OFAC SDN match")',
		)
		.action(async (address, opts, cmd) => {
			const globals = cmd.parent!.parent!.opts();
			const spinner = ora(`Blacklisting ${address}...`).start();
			try {
				const authority = loadKeypair(globals.keypair);
				const connection = new Connection(globals.url, "confirmed");
				const stable = await SolanaStablecoin.load(
					connection,
					new PublicKey(globals.mint),
					authority,
				);
				const sig = await stable.compliance.blacklistAdd(
					new PublicKey(address),
					opts.reason,
					authority,
				);
				spinner.succeed(`Address blacklisted: ${address}`);
				success(`Reason: ${opts.reason}`);
				printTxLink(sig);
			} catch (err: any) {
				spinner.fail("Blacklist add failed");
				error(err.message);
				process.exit(1);
			}
		});

	// blacklist remove
	cmd
		.command("remove <address>")
		.description("Remove an address from the blacklist (SSS-2 only)")
		.action(async (address, opts, cmd) => {
			const globals = cmd.parent!.parent!.opts();
			const spinner = ora(`Removing ${address} from blacklist...`).start();
			try {
				const authority = loadKeypair(globals.keypair);
				const connection = new Connection(globals.url, "confirmed");
				const stable = await SolanaStablecoin.load(
					connection,
					new PublicKey(globals.mint),
					authority,
				);
				const sig = await stable.compliance.blacklistRemove(
					new PublicKey(address),
					authority,
				);
				spinner.succeed(`Address removed from blacklist: ${address}`);
				printTxLink(sig);
			} catch (err: any) {
				spinner.fail("Blacklist remove failed");
				error(err.message);
				process.exit(1);
			}
		});

	// blacklist check
	cmd
		.command("check <address>")
		.description("Check if an address is blacklisted")
		.action(async (address, opts, cmd) => {
			const globals = cmd.parent!.parent!.opts();
			const spinner = ora(`Checking ${address}...`).start();
			try {
				const authority = loadKeypair(globals.keypair);
				const connection = new Connection(globals.url, "confirmed");
				const stable = await SolanaStablecoin.load(
					connection,
					new PublicKey(globals.mint),
					authority,
				);
				const entry = await stable.compliance.getBlacklistEntry(
					new PublicKey(address),
				);
				spinner.stop();
				if (entry) {
					printTable(
						["Field", "Value"],
						[
							["Status", "🔴 BLACKLISTED"],
							["Address", entry.address.toBase58()],
							["Reason", entry.reason],
							["Since", new Date(Number(entry.timestamp) * 1000).toISOString()],
						],
					);
				} else {
					success(`✅ ${address} is NOT blacklisted`);
				}
			} catch (err: any) {
				spinner.fail("Blacklist check failed");
				error(err.message);
				process.exit(1);
			}
		});

	return cmd;
}
