import { Connection, PublicKey } from "@solana/web3.js";
import { SolanaStablecoin } from "@stbr/sss-token-sdk";
import { Command } from "commander";
import ora from "ora";
import { error, printTable, printTxLink, success } from "../../utils/display";
import { loadKeypair } from "../../utils/keypair";

export function rolesCommand(): Command {
	const cmd = new Command("roles");
	cmd.description("Manage role assignments and authority transfer");

	// roles show
	cmd
		.command("show")
		.description("Display current role assignments")
		.action(async (opts, cmd) => {
			const globals = cmd.parent!.parent!.opts();
			const spinner = ora("Fetching roles...").start();
			try {
				const authority = loadKeypair(globals.keypair);
				const connection = new Connection(globals.url, "confirmed");
				const stable = await SolanaStablecoin.load(
					connection,
					new PublicKey(globals.mint),
					authority,
				);
				const roles = await stable.getRoles();
				spinner.stop();

				printTable(
					["Role", "Address"],
					[
						["Master Authority", roles.masterAuthority.toBase58()],
						[
							"Pending Master",
							roles.pendingMaster ? roles.pendingMaster.toBase58() : "(none)",
						],
						["Burner", roles.burner.toBase58()],
						["Pauser", roles.pauser.toBase58()],
						["Blacklister (SSS-2)", roles.blacklister.toBase58()],
						["Seizer (SSS-2)", roles.seizer.toBase58()],
					],
				);
			} catch (err: any) {
				spinner.fail("Failed to fetch roles");
				error(err.message);
				process.exit(1);
			}
		});

	// roles update
	cmd
		.command("update")
		.description("Update role assignments (master authority only)")
		.option("--burner <address>", "New burner address")
		.option("--pauser <address>", "New pauser address")
		.option("--blacklister <address>", "New blacklister address (SSS-2)")
		.option("--seizer <address>", "New seizer address (SSS-2)")
		.action(async (opts, cmd) => {
			const globals = cmd.parent!.parent!.opts();
			const spinner = ora("Updating roles...").start();
			try {
				const authority = loadKeypair(globals.keypair);
				const connection = new Connection(globals.url, "confirmed");
				const stable = await SolanaStablecoin.load(
					connection,
					new PublicKey(globals.mint),
					authority,
				);

				const update: any = {};
				if (opts.burner) update.burner = new PublicKey(opts.burner);
				if (opts.pauser) update.pauser = new PublicKey(opts.pauser);
				if (opts.blacklister)
					update.blacklister = new PublicKey(opts.blacklister);
				if (opts.seizer) update.seizer = new PublicKey(opts.seizer);

				if (Object.keys(update).length === 0) {
					spinner.fail(
						"No roles specified. Use --burner, --pauser, --blacklister, or --seizer",
					);
					process.exit(1);
				}

				const sig = await stable.updateRoles(update);
				spinner.succeed("Roles updated");
				for (const [role, addr] of Object.entries(update)) {
					success(`${role}: ${(addr as PublicKey).toBase58()}`);
				}
				printTxLink(sig);
			} catch (err: any) {
				spinner.fail("Role update failed");
				error(err.message);
				process.exit(1);
			}
		});

	// roles transfer (step 1 — initiate)
	cmd
		.command("transfer <newMaster>")
		.description("Initiate master authority transfer (step 1 of 2)")
		.action(async (newMaster, opts, cmd) => {
			const globals = cmd.parent!.parent!.opts();
			const spinner = ora("Initiating authority transfer...").start();
			try {
				const authority = loadKeypair(globals.keypair);
				const connection = new Connection(globals.url, "confirmed");
				const stable = await SolanaStablecoin.load(
					connection,
					new PublicKey(globals.mint),
					authority,
				);
				const sig = await stable.transferAuthority(new PublicKey(newMaster));
				spinner.succeed(`Authority transfer initiated → ${newMaster}`);
				success(
					'The new master must call "sss-token roles accept" to complete the transfer',
				);
				printTxLink(sig);
			} catch (err: any) {
				spinner.fail("Authority transfer failed");
				error(err.message);
				process.exit(1);
			}
		});

	// roles accept (step 2 — accept)
	cmd
		.command("accept")
		.description("Accept pending master authority transfer (step 2 of 2)")
		.action(async (opts, cmd) => {
			const globals = cmd.parent!.parent!.opts();
			const spinner = ora("Accepting authority transfer...").start();
			try {
				const authority = loadKeypair(globals.keypair);
				const connection = new Connection(globals.url, "confirmed");
				const stable = await SolanaStablecoin.load(
					connection,
					new PublicKey(globals.mint),
					authority,
				);
				const sig = await stable.acceptAuthority();
				spinner.succeed(
					"Authority transfer accepted — you are now the master authority",
				);
				printTxLink(sig);
			} catch (err: any) {
				spinner.fail("Authority accept failed");
				error(err.message);
				process.exit(1);
			}
		});

	return cmd;
}
