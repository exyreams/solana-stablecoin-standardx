import { BorshCoder, EventParser } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import fs from "fs";
import { createRequire } from "module";
import { db } from "./db/index.js";
import { eventLogs } from "./db/schema.js";
import "dotenv/config";

const require = createRequire(import.meta.url);
const idlPath = require.resolve("@stbr/sss-token-sdk/dist/idl/sss_token.json");
const IDL = JSON.parse(fs.readFileSync(idlPath, "utf8"));
const programId = new PublicKey(
	process.env.SSS_TOKEN_PROGRAM_ID || IDL.address,
);

const connection = new Connection(process.env.SOLANA_RPC_URL!, "confirmed");
const coder = new BorshCoder(IDL);
const eventParser = new EventParser(programId, coder);

async function backfill() {
	console.log(`Starting backfill for program: ${programId.toBase58()}`);

	// Fetch signatures for the program
	let signatures = await connection.getSignaturesForAddress(programId, {
		limit: 100,
	});
	console.log(`Found ${signatures.length} transactions`);

	for (const sigInfo of signatures) {
		try {
			const tx = await connection.getTransaction(sigInfo.signature, {
				commitment: "confirmed",
				maxSupportedTransactionVersion: 0,
			});

			if (!tx || !tx.meta || !tx.meta.logMessages) continue;

			const events = eventParser.parseLogs(tx.meta.logMessages);
			for (const event of events) {
				console.log(`Found event: ${event.name} in ${sigInfo.signature}`);

				await db
					.insert(eventLogs)
					.values({
						signature: sigInfo.signature,
						name: event.name,
						data: JSON.stringify(event.data),
						timestamp: new Date(sigInfo.blockTime! * 1000),
					})
					.onConflictDoNothing();
			}
		} catch (e: any) {
			console.error(`Failed to process ${sigInfo.signature}:`, e.message);
		}
	}
	console.log("Backfill complete");
}

backfill();
