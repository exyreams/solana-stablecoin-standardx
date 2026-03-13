import { Connection, PublicKey } from "@solana/web3.js";
import { SolanaStablecoin } from "@stbr/sss-token-sdk";
import { Command } from "commander";
import ora from "ora";
import { error, printTable } from "../../utils/display";
import { loadKeypair } from "../../utils/keypair";

export function statusCommand(): Command {
	const cmd = new Command("status");
	cmd
		.description("Show stablecoin status, configuration, and roles")
		.action(async (opts, cmd) => {
			const globals = cmd.parent!.opts();
			const spinner = ora("Fetching status...").start();
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

				const [status, supply, roles] = await Promise.all([
					stable.getStatus(),
					stable.getTotalSupply(),
					stable.getRoles(),
				]);

				spinner.stop();
				const humanSupply = (
					Number(supply) /
					10 ** status.decimals
				).toLocaleString();

				// Determine preset label
				let preset = "SSS-1 (Minimal)";
				if (
					status.enablePermanentDelegate &&
					status.enableTransferHook &&
					status.enableConfidentialTransfers
				) {
					preset = "SSS-2 + SSS-3 (Hybrid)";
				} else if (
					status.enablePermanentDelegate &&
					status.enableTransferHook
				) {
					preset = "SSS-2 (Compliant)";
				} else if (status.enableConfidentialTransfers) {
					preset = "SSS-3 (Private)";
				}

				// Token info
				console.log("\n📊 Token Info");
				printTable(
					["Field", "Value"],
					[
						["Mint", status.mint.toBase58()],
						["Name", status.name],
						["Symbol", status.symbol],
						["Decimals", String(status.decimals)],
						["Version", String(status.version)],
						["Preset", preset],
						["Total Supply", `${humanSupply} ${status.symbol}`],
						["Paused", status.paused ? "🔴 YES" : "🟢 NO"],
					],
				);

				// Extensions
				console.log("\n🔧 Extensions");
				printTable(
					["Extension", "Status"],
					[
						[
							"Permanent Delegate",
							status.enablePermanentDelegate ? "✅ Enabled" : "❌ Disabled",
						],
						[
							"Transfer Hook",
							status.enableTransferHook ? "✅ Enabled" : "❌ Disabled",
						],
						[
							"Default Frozen",
							status.defaultAccountFrozen ? "✅ Enabled" : "❌ Disabled",
						],
						[
							"Confidential Transfers",
							status.enableConfidentialTransfers ? "✅ Enabled" : "❌ Disabled",
						],
						[
							"CT Auto-Approve",
							status.confidentialTransferAutoApprove
								? "✅ Enabled"
								: "❌ Disabled",
						],
					],
				);

				// Roles
				console.log("\n👤 Roles");
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
						["Blacklister", roles.blacklister.toBase58()],
						["Seizer", roles.seizer.toBase58()],
					],
				);
			} catch (err: any) {
				spinner.fail("Status fetch failed");
				error(err.message);
				process.exit(1);
			}
		});
	return cmd;
}
