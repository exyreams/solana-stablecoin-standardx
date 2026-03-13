import { BorshCoder, EventParser } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { and, eq } from "drizzle-orm";
import fs from "fs";
import { createRequire } from "module";
import { db } from "../db/index.js";
import { burnRequests, eventLogs, mintRequests } from "../db/schema.js";
import { connection, log } from "../index.js";

const require = createRequire(import.meta.url);
const idlPath = require.resolve("@stbr/sss-token-sdk/dist/idl/sss_token.json");
const IDL = JSON.parse(fs.readFileSync(idlPath, "utf8"));
const programId = new PublicKey(
	process.env.SSS_TOKEN_PROGRAM_ID || IDL.address || IDL.metadata?.address,
);

const coder = new BorshCoder(IDL);
const eventParser = new EventParser(programId, coder);

export async function startEventIndexer() {
	log.info({ programId: programId.toBase58() }, "Starting event listener");

	connection.onLogs(
		programId,
		async (logs: any, _ctx: any) => {
			if (logs.err) return;

			try {
				const events = eventParser.parseLogs(logs.logs);
				for (const event of events) {
					log.info(
						{ event: event.name, signature: logs.signature },
						"Captured Anchor event",
					);

					await db.insert(eventLogs).values({
						signature: logs.signature,
						name: event.name,
						data: JSON.stringify(event.data),
					});

					// Sync to mint/burn history tables
					if (event.name === "TokensMinted") {
						const { recipient, amount, minter } = event.data as any;
						// Try to find existing record by signature first (to avoid double entry)
						const existing = await db
							.select()
							.from(mintRequests)
							.where(eq(mintRequests.signature, logs.signature))
							.limit(1);

						if (existing.length === 0) {
							// If no record with this signature, insert one
							// We divide by decimals if we want to store as "human readable" or keep as base units?
							// Schema says amount is text. Logic in routes uses base units string.
							await db.insert(mintRequests).values({
								recipient: recipient.toBase58(),
								amount: amount.toString(),
								mintAddress:
									logs.mint?.toBase58() || process.env.STABLECOIN_MINT,
								minter: minter.toBase58(),
								status: "COMPLETED",
								signature: logs.signature,
							});
						}
					} else if (event.name === "TokensBurned") {
						const { fromTokenAccount, amount, burner } = event.data as any;
						const existing = await db
							.select()
							.from(burnRequests)
							.where(eq(burnRequests.signature, logs.signature))
							.limit(1);

						if (existing.length === 0) {
							await db.insert(burnRequests).values({
								fromTokenAccount: fromTokenAccount.toBase58(),
								amount: amount.toString(),
								mintAddress:
									logs.mint?.toBase58() || process.env.STABLECOIN_MINT,
								minter: burner.toBase58(),
								status: "COMPLETED",
								signature: logs.signature,
							});
						}
					}

					// Auto-trigger webhooks for configured events
					try {
						await fetch(
							`http://localhost:${process.env.PORT || "3000"}/webhooks/dispatch`,
							{
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({ event: event.name, data: event.data }),
							},
						);
					} catch (e: any) {
						log.error({ err: e.message }, "Failed to auto-dispatch webhook");
					}
				}
			} catch (err: any) {
				log.error(
					{ err: err.message, signature: logs.signature },
					"Failed to parse event",
				);
			}
		},
		"confirmed",
	);
}
