import { Connection, PublicKey } from "@solana/web3.js";
import { SolanaStablecoin } from "@stbr/sss-token-sdk";
import { Command } from "commander";
import ora from "ora";
import { error, printTable, printTxLink, success } from "../../utils/display";
import { loadKeypair } from "../../utils/keypair";

export function mintersCommand(): Command {
	const cmd = new Command("minters");
	cmd.description("Manage minters and their quotas");

	// minters list
	cmd
		.command("list")
		.description("List all registered minters and their quotas")
		.action(async (opts, cmd) => {
			const globals = cmd.parent!.parent!.opts();
			const spinner = ora("Fetching minters...").start();
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
				const minters = await stable.getMinters();
				spinner.stop();

				if (minters.length === 0) {
					success("No minters registered");
					return;
				}

				const rows = minters.map((m: any) => {
					const quotaHuman =
						m.quota === 0n
							? "Unlimited"
							: (Number(m.quota) / 10 ** status.decimals).toLocaleString();
					const mintedHuman = (
						Number(m.minted) /
						10 ** status.decimals
					).toLocaleString();
					return [
						m.minter.toBase58(),
						m.active ? "🟢 Active" : "🔴 Inactive",
						quotaHuman,
						mintedHuman,
					];
				});

				printTable(["Minter", "Status", "Quota", "Minted"], rows);
			} catch (err: any) {
				spinner.fail("Failed to fetch minters");
				error(err.message);
				process.exit(1);
			}
		});

	// minters add
	cmd
		.command("add <minterAddress>")
		.description("Register a new minter with a quota (0 = unlimited)")
		.option(
			"--quota <amount>",
			"Max tokens this minter can mint (0 = unlimited)",
			"0",
		)
		.action(async (minterAddress, opts, cmd) => {
			const globals = cmd.parent!.parent!.opts();
			const spinner = ora("Adding minter...").start();
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
				const rawQuota = BigInt(
					Math.round(parseFloat(opts.quota) * 10 ** status.decimals),
				);
				const sig = await stable.addMinter(
					new PublicKey(minterAddress),
					rawQuota,
				);
				spinner.succeed(`Minter added: ${minterAddress}`);
				success(
					`Quota: ${opts.quota === "0" ? "Unlimited" : opts.quota + " " + status.symbol}`,
				);
				printTxLink(sig);
			} catch (err: any) {
				spinner.fail("Add minter failed");
				error(err.message);
				process.exit(1);
			}
		});

	// minters remove
	cmd
		.command("remove <minterAddress>")
		.description("Remove a minter (closes PDA, reclaims rent)")
		.action(async (minterAddress, opts, cmd) => {
			const globals = cmd.parent!.parent!.opts();
			const spinner = ora("Removing minter...").start();
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
				const sig = await stable.removeMinter(new PublicKey(minterAddress));
				spinner.succeed(`Minter removed: ${minterAddress}`);
				success("MinterQuota PDA closed, rent reclaimed");
				printTxLink(sig);
			} catch (err: any) {
				spinner.fail("Remove minter failed");
				error(err.message);
				process.exit(1);
			}
		});

	// minters update
	cmd
		.command("update <minterAddress>")
		.description(
			"Update a minter's quota, active status, or reset minted counter",
		)
		.requiredOption("--quota <amount>", "New quota (0 = unlimited)")
		.option("--active", "Set minter as active", true)
		.option("--no-active", "Set minter as inactive")
		.option("--reset-minted", "Reset the minted counter to zero", false)
		.action(async (minterAddress, opts, cmd) => {
			const globals = cmd.parent!.parent!.opts();
			const spinner = ora("Updating minter...").start();
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
				const rawQuota = BigInt(
					Math.round(parseFloat(opts.quota) * 10 ** status.decimals),
				);
				const sig = await stable.updateMinter({
					minter: new PublicKey(minterAddress),
					quota: rawQuota,
					active: opts.active,
					resetMinted: opts.resetMinted,
				});
				spinner.succeed(`Minter updated: ${minterAddress}`);
				success(`Quota: ${opts.quota === "0" ? "Unlimited" : opts.quota}`);
				success(`Active: ${opts.active}`);
				if (opts.resetMinted) success("Minted counter reset to 0");
				printTxLink(sig);
			} catch (err: any) {
				spinner.fail("Update minter failed");
				error(err.message);
				process.exit(1);
			}
		});

	return cmd;
}
