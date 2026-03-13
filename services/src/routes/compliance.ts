import {
	getOrCreateAssociatedTokenAccount,
	TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { and, count, desc, eq, gte, inArray, like, lte, or } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import {
	auditLogs,
	blacklist,
	burnRequests,
	eventLogs,
	mintRequests,
} from "../db/schema.js";
import { authority, connection, getStable, log } from "../index.js";
import { adminAuth } from "../middleware/auth.js";

const app = new Hono();

// Protect all compliance routes
app.use("/*", adminAuth);

// ---- BLACKLIST (SSS-2) ----

app.get("/blacklist", async (c) => {
	const mintAddress = c.req.query("mintAddress");
	if (!mintAddress) {
		c.status(400);
		return c.json({ error: "mintAddress query param required" });
	}

	try {
		const sync = c.req.query("sync") === "true";

		// 1. Get from DB
		let entries = await db
			.select()
			.from(blacklist)
			.where(eq(blacklist.mintAddress, mintAddress))
			.orderBy(desc(blacklist.timestamp));

		// 2. Sync from on-chain if force requested or DB is empty
		if (sync || entries.length === 0) {
			try {
				const s = await getStable(mintAddress);
				const programId = s.programId;

				const discriminator = Buffer.from([
					218, 179, 231, 40, 141, 25, 168, 189,
				]);

				const accounts = await connection.getProgramAccounts(programId, {
					filters: [
						{ memcmp: { offset: 0, bytes: bs58.encode(discriminator) } },
						{ memcmp: { offset: 8, bytes: mintAddress } },
					],
				});

				if (accounts.length > 0) {
					const onChainEntries = accounts.map((account) => {
						const data = account.account.data;
						const address = new PublicKey(data.slice(40, 72)).toBase58();
						const reasonLen = data.readUInt32LE(72);
						const reason = data
							.slice(76, 76 + Math.min(reasonLen, 128))
							.toString("utf8")
							.replace(/\0/g, ""); // Clean null bytes
						const timestamp = Number(data.readBigInt64LE(76 + reasonLen));

						return {
							mintAddress,
							address,
							reason,
							timestamp: new Date(timestamp * 1000),
						};
					});

					// Batch insert to DB
					for (const entry of onChainEntries) {
						await db
							.insert(blacklist)
							.values(entry)
							.onConflictDoUpdate({
								target: [blacklist.mintAddress, blacklist.address],
								set: { reason: entry.reason, timestamp: entry.timestamp },
							});
					}

					// Re-fetch from DB to get sorted results
					entries = await db
						.select()
						.from(blacklist)
						.where(eq(blacklist.mintAddress, mintAddress))
						.orderBy(desc(blacklist.timestamp));
				}
			} catch (syncErr: any) {
				log.warn(
					{ err: syncErr.message, mintAddress },
					"On-chain sync failed, falling back to DB",
				);
			}
		}

		return c.json({
			entries: entries.map((e) => ({
				...e,
				timestamp: e.timestamp.getTime(),
			})),
		});
	} catch (err: any) {
		log.error({ err: err.message, mintAddress }, "Failed to fetch blacklist");
		c.status(500);
		return c.json({ error: err.message });
	}
});

app.post("/blacklist", async (c) => {
	const { mintAddress, address, reason } = await c.req.json();
	if (!address) {
		c.status(400);
		return c.json({ error: "address required" });
	}

	try {
		const finalReason = reason || "Manual addition";
		const s = await getStable(mintAddress);
		const sig = await s.compliance.blacklistAdd(
			new PublicKey(address),
			finalReason,
			authority,
		);

		await db.insert(auditLogs).values({
			action: "BLACKLIST_ADD",
			address,
			reason: finalReason,
			signature: sig,
		});

		// Sync to blacklist table
		await db
			.insert(blacklist)
			.values({
				mintAddress: s.mint.toBase58(),
				address,
				reason: finalReason,
				timestamp: new Date(),
			})
			.onConflictDoUpdate({
				target: [blacklist.mintAddress, blacklist.address],
				set: { reason: finalReason, timestamp: new Date() },
			});

		log.info({ address, finalReason, sig }, "Address blacklisted");
		return c.json({ success: true, signature: sig });
	} catch (err: any) {
		log.error({ err: err.message, address }, "Failed to add to blacklist");
		c.status(500);
		return c.json({ error: err.message });
	}
});

app.delete("/blacklist/:address", async (c) => {
	const address = c.req.param("address");
	const mintAddress = c.req.query("mintAddress");
	try {
		const s = await getStable(mintAddress);
		const sig = await s.compliance.blacklistRemove(
			new PublicKey(address),
			authority,
		);

		await db.insert(auditLogs).values({
			action: "BLACKLIST_REMOVE",
			address,
			reason: "Removed by admin",
			signature: sig,
		});

		// Remove from blacklist table
		await db
			.delete(blacklist)
			.where(
				and(
					eq(blacklist.mintAddress, mintAddress!),
					eq(blacklist.address, address),
				),
			);

		log.info({ address, sig }, "Address removed from blacklist");
		return c.json({ success: true, signature: sig });
	} catch (err: any) {
		log.error({ err: err.message, address }, "Failed to remove from blacklist");
		c.status(500);
		return c.json({ error: err.message });
	}
});

app.get("/blacklist/:address", async (c) => {
	const address = c.req.param("address");
	const mintAddress = c.req.query("mintAddress");
	try {
		const s = await getStable(mintAddress);
		const entry = await s.compliance.getBlacklistEntry(new PublicKey(address));
		if (!entry) {
			return c.json({ blacklisted: false });
		}
		return c.json({
			blacklisted: true,
			entry: { reason: entry.reason, timestamp: entry.timestamp.toString() },
		});
	} catch (err: any) {
		c.status(500);
		return c.json({ error: err.message });
	}
});

// ---- SEIZE (SSS-2) ----

app.post("/seize", async (c) => {
	const { mintAddress, fromTokenAccount, toTokenAccount, amount, reason } =
		await c.req.json();
	if (!fromTokenAccount || !toTokenAccount || !amount) {
		c.status(400);
		return c.json({
			error: "fromTokenAccount, toTokenAccount, and amount are required",
		});
	}
	try {
		const s = await getStable(mintAddress);

		// SMART RESOLUTION: If toTokenAccount is a wallet, get/create its ATA
		const toAddressPk = new PublicKey(toTokenAccount);
		const toAta = await getOrCreateAssociatedTokenAccount(
			connection,
			authority,
			new PublicKey(s.mint),
			toAddressPk,
			false,
			"confirmed",
			{},
			TOKEN_2022_PROGRAM_ID,
		);

		const sig = await s.compliance.seize({
			fromTokenAccount: new PublicKey(fromTokenAccount),
			toTokenAccount: toAta.address,
			amount: BigInt(amount),
			seizer: authority,
		});

		await db.insert(auditLogs).values({
			action: "SEIZE",
			address: fromTokenAccount,
			reason: JSON.stringify({
				amount: amount,
				destination: toTokenAccount,
				note: reason || "Manual seizure",
			}),
			signature: sig,
		});
		log.info(
			{ fromTokenAccount, toTokenAccount, amount, sig },
			"Tokens seized",
		);
		return c.json({ success: true, signature: sig });
	} catch (err: any) {
		log.error({ err: err.message }, "Failed to seize tokens");
		c.status(500);
		return c.json({ error: err.message });
	}
});

// ---- FREEZE / THAW (SSS-1) ----

app.post("/freeze", async (c) => {
	const { mintAddress, address, reason } = await c.req.json();
	if (!address) {
		c.status(400);
		return c.json({ error: "address required" });
	}
	try {
		const s = await getStable(mintAddress);
		const sig = await s.freeze(new PublicKey(address));

		await db.insert(auditLogs).values({
			action: "FREEZE",
			address,
			reason: reason || "Manual freeze",
			signature: sig,
		});
		log.info({ address, sig }, "Address frozen");
		return c.json({ success: true, signature: sig });
	} catch (err: any) {
		log.error({ err: err.message, address }, "Failed to freeze address");
		c.status(500);
		return c.json({ error: err.message });
	}
});

app.post("/thaw", async (c) => {
	const { mintAddress, address, reason } = await c.req.json();
	if (!address) {
		c.status(400);
		return c.json({ error: "address required" });
	}
	try {
		const s = await getStable(mintAddress);
		const sig = await s.thaw(new PublicKey(address));

		await db.insert(auditLogs).values({
			action: "THAW",
			address,
			reason: reason || "Manual thaw",
			signature: sig,
		});
		log.info({ address, sig }, "Address thawed");
		return c.json({ success: true, signature: sig });
	} catch (err: any) {
		log.error({ err: err.message, address }, "Failed to thaw address");
		c.status(500);
		return c.json({ error: err.message });
	}
});

// ---- PAUSE / UNPAUSE (SSS-1) ----

app.post("/pause", async (c) => {
	const { reason } = await c.req.json();
	try {
		const s = await getStable();
		const sig = await s.pause(reason);

		await db.insert(auditLogs).values({
			action: "PAUSE",
			address: "GLOBAL",
			reason: reason || "Manual pause",
			signature: sig,
		});
		log.info({ sig }, "Stablecoin paused");
		return c.json({ success: true, signature: sig });
	} catch (err: any) {
		log.error({ err: err.message }, "Failed to pause stablecoin");
		c.status(500);
		return c.json({ error: err.message });
	}
});

app.post("/unpause", async (c) => {
	const { reason } = await c.req.json();
	try {
		const s = await getStable();
		const sig = await s.unpause();

		await db.insert(auditLogs).values({
			action: "UNPAUSE",
			address: "GLOBAL",
			reason: reason || "Manual unpause",
			signature: sig,
		});
		log.info({ sig }, "Stablecoin unpaused");
		return c.json({ success: true, signature: sig });
	} catch (err: any) {
		log.error({ err: err.message }, "Failed to unpause stablecoin");
		c.status(500);
		return c.json({ error: err.message });
	}
});

// ---- AUDIT LOGS ----

app.get("/audit", async (c) => {
	try {
		const limit = parseInt(c.req.query("limit") || "100");
		const offset = parseInt(c.req.query("offset") || "0");
		const action = c.req.query("action");
		const address = c.req.query("address");
		const startDate = c.req.query("startDate");
		const endDate = c.req.query("endDate");
		const status = c.req.query("status"); // success, failed

		// 1. Fetch Audit Logs (Admin Actions)
		const aConditions = [];
		if (action) {
			if (action === "BLACKLIST") {
				aConditions.push(
					or(
						like(auditLogs.action, "BLACKLIST_%"),
						eq(auditLogs.action, "BLACKLIST"),
					),
				);
			} else {
				aConditions.push(eq(auditLogs.action, action));
			}
		}
		if (address) aConditions.push(like(auditLogs.address, `%${address}%`));
		if (startDate)
			aConditions.push(gte(auditLogs.timestamp, new Date(startDate)));
		if (endDate) aConditions.push(lte(auditLogs.timestamp, new Date(endDate)));

		// If filtering specifically for "failed", return empty as we currently only record successes in these tables
		if (status === "failed") {
			return c.json({ count: 0, entries: [] });
		}

		const aLogs = await db
			.select()
			.from(auditLogs)
			.where(aConditions.length > 0 ? and(...aConditions) : undefined)
			.orderBy(desc(auditLogs.timestamp))
			.limit(limit + offset);

		// 2. Fetch Event Logs (On-Chain Events)
		const eConditions = [];
		if (action) {
			if (action === "BLACKLIST") {
				// On-chain event for blacklist might be different, but follow pattern
				eConditions.push(like(eventLogs.name, "BLACKLIST%"));
			} else {
				eConditions.push(eq(eventLogs.name, action));
			}
		}
		if (address) eConditions.push(like(eventLogs.data, `%${address}%`));
		if (startDate)
			eConditions.push(gte(eventLogs.timestamp, new Date(startDate)));
		if (endDate) eConditions.push(lte(eventLogs.timestamp, new Date(endDate)));

		const eLogs = await db
			.select()
			.from(eventLogs)
			.where(eConditions.length > 0 ? and(...eConditions) : undefined)
			.orderBy(desc(eventLogs.timestamp))
			.limit(limit + offset);

		// 3. Get Accurate Total Count
		let aCount = 0;
		let eCount = 0;
		try {
			const aCountResult = await db
				.select({ value: count() })
				.from(auditLogs)
				.where(aConditions.length > 0 ? and(...aConditions) : undefined);
			aCount = aCountResult[0]?.value || 0;

			const eCountResult = await db
				.select({ value: count() })
				.from(eventLogs)
				.where(eConditions.length > 0 ? and(...eConditions) : undefined);
			eCount = eCountResult[0]?.value || 0;
		} catch (err) {
			log.error({ err }, "Failed to count audit logs");
		}

		const totalCount = aCount + eCount;

		const s = await getStable();
		let decimals = 6;
		try {
			const status = await s.getStatus();
			decimals = status.decimals;
		} catch (_e) {
			// use default
		}
		const div = Math.pow(10, decimals);

		// 4. Merge and Unify
		const merged = [
			...aLogs.map((l) => {
				let amount: string | undefined = undefined;
				try {
					const trimmedReason = l.reason?.trim() || "";
					if (trimmedReason.startsWith("{")) {
						const data = JSON.parse(trimmedReason);
						if (data.amount !== undefined) {
							amount = (Number(data.amount) / div).toLocaleString(undefined, {
								minimumFractionDigits: 2,
							});
						}
					}
				} catch (_e) {
					// Reason is not JSON or invalid
				}
				return {
					id: l.id,
					type: "ADMIN",
					action: l.action,
					address: l.address,
					reason: l.reason,
					signature: l.signature,
					timestamp: l.timestamp,
					amount,
					status: "success" as const,
				};
			}),
			...eLogs.map((l) => {
				const data = JSON.parse(l.data);
				let amount: string | undefined = undefined;
				if (data.amount !== undefined) {
					amount = (Number(data.amount) / div).toLocaleString(undefined, {
						minimumFractionDigits: 2,
					});
				}
				return {
					id: l.id,
					type: "EVENT",
					action: l.name.toUpperCase(),
					address: data.to || data.address || data.from || "—",
					reason: `On-chain event: ${l.name}`,
					signature: l.signature,
					timestamp: l.timestamp,
					amount,
					status: "success" as const,
				};
			}),
		]
			.sort(
				(a, b) =>
					new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
			)
			.slice(offset, offset + limit);

		return c.json({ count: totalCount, entries: merged });
	} catch (err: any) {
		log.error({ err: err.message }, "Audit log fetch failed");
		c.status(500);
		return c.json({ error: err.message });
	}
});

// ---- ACCOUNT HISTORY (On-Chain) ----

app.get("/history/:address", async (c) => {
	const addressString = c.req.param("address");
	try {
		const address = new PublicKey(addressString);
		const limit = parseInt(c.req.query("limit") || "20");

		// 1. Fetch Audit Logs from DB first (fastest, no rate limit)
		const dbLogs = await db
			.select()
			.from(auditLogs)
			.where(eq(auditLogs.address, addressString))
			.orderBy(desc(auditLogs.timestamp))
			.limit(limit);

		// 2. Fetch Mint/Burn requests from DB
		// we fetch mints where recipient is this address, and burns where fromTokenAccount is this address
		const [mints, burns] = await Promise.all([
			db
				.select()
				.from(mintRequests)
				.where(eq(mintRequests.recipient, addressString))
				.orderBy(desc(mintRequests.createdAt))
				.limit(limit),
			db
				.select()
				.from(burnRequests)
				.where(eq(burnRequests.fromTokenAccount, addressString))
				.orderBy(desc(burnRequests.createdAt))
				.limit(limit),
		]);

		const s = await getStable();
		let decimals = 6;
		try {
			const status = await s.getStatus();
			decimals = status.decimals;
		} catch (_e) {
			// Intentional - use default decimals
		}
		const div = Math.pow(10, decimals);

		// 3. Map DB logs to UI format
		const history = dbLogs.map((log) => {
			let details = log.reason || "";
			let amountStr = "";

			if (
				log.action === "FREEZE" ||
				log.action === "THAW" ||
				log.action === "BLACKLIST_ADD"
			) {
				details = log.signature
					? `${log.signature.slice(0, 8)}...${log.signature.slice(-8)}`
					: "Pending";
			} else if (log.action === "SEIZE") {
				try {
					const parsed = JSON.parse(log.reason || "{}");
					const readableAmount = (Number(parsed.amount) / div).toLocaleString(
						undefined,
						{ minimumFractionDigits: 2 },
					);
					amountStr = `-${readableAmount}`;
					details = `Rec: ${parsed.destination?.slice(0, 4)}...${parsed.destination?.slice(-4)}${parsed.note ? ` (${parsed.note})` : ""}`;
				} catch (_e) {
					details = `Seizure: ${log.reason}`;
				}
			}

			return {
				signature: log.signature || "pending",
				action: log.action,
				amount: amountStr,
				details,
				authority: "ADMIN",
				status: log.signature ? "FINALIZED" : "PENDING",
				timestamp: log.timestamp.toISOString(),
			};
		});

		// Add Mint/Burn to records
		mints.forEach((m) => {
			const readableAmount = (Number(m.amount) / div).toLocaleString(
				undefined,
				{ minimumFractionDigits: 2 },
			);
			history.push({
				signature: m.signature || "pending",
				action: "MINT",
				amount: `+${readableAmount}`,
				details: m.signature
					? `${m.signature.slice(0, 8)}...${m.signature.slice(-8)}`
					: "Pending",
				authority: m.minter
					? `${m.minter.slice(0, 4)}...${m.minter.slice(-4)}`
					: "ADMIN",
				status: m.status === "COMPLETED" ? "FINALIZED" : m.status || "PENDING",
				timestamp: m.createdAt.toISOString(),
			});
		});

		burns.forEach((b) => {
			const readableAmount = (Number(b.amount) / div).toLocaleString(
				undefined,
				{ minimumFractionDigits: 2 },
			);
			history.push({
				signature: b.signature || "pending",
				action: "BURN",
				amount: `-${readableAmount}`,
				details: b.signature
					? `${b.signature.slice(0, 8)}...${b.signature.slice(-8)}`
					: "Pending",
				authority: b.minter
					? `${b.minter.slice(0, 4)}...${b.minter.slice(-4)}`
					: "ADMIN",
				status: b.status === "COMPLETED" ? "FINALIZED" : b.status || "PENDING",
				timestamp: b.createdAt.toISOString(),
			});
		});

		// 3. Optional: Fetch on-chain signatures only if we have room in the limit
		// and wrap in try-catch to ignore 429 errors
		if (history.length < limit) {
			try {
				const signatures = await connection.getSignaturesForAddress(address, {
					limit: limit - history.length,
				});

				const dbSignatures = new Set(dbLogs.map((l) => l.signature));
				const newSigs = signatures.filter(
					(s) => !dbSignatures.has(s.signature),
				);

				if (newSigs.length > 0) {
					const txs = await connection.getParsedTransactions(
						newSigs.map((s) => s.signature),
						{
							maxSupportedTransactionVersion: 0,
							commitment: "confirmed",
						},
					);

					for (let i = 0; i < txs.length; i++) {
						const tx = txs[i];
						if (!tx) continue;

						const sig = newSigs[i].signature;
						const logs = tx.meta?.logMessages || [];
						let action = "TRANSACTION";

						if (logs.some((l) => l.includes("Instruction: Mint")))
							action = "MINT";
						else if (logs.some((l) => l.includes("Instruction: Burn")))
							action = "BURN";
						else if (logs.some((l) => l.includes("Instruction: Transfer")))
							action = "TRANSFER";

						history.push({
							signature: sig,
							timestamp: tx.blockTime
								? new Date(tx.blockTime * 1000).toISOString()
								: new Date().toISOString(),
							action,
							amount: "",
							details: sig.slice(0, 8) + "...",
							authority: "USER",
							status: tx.meta?.err ? "FAILED" : "FINALIZED",
						});
					}
				}
			} catch (rpcErr) {
				log.warn(
					{ err: rpcErr, address: addressString },
					"RPC history fetch suppressed (likely 429)",
				);
			}
		}

		// Final sort and slice
		const sorted = history
			.sort(
				(a, b) =>
					new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
			)
			.slice(0, limit);

		return c.json({ entries: sorted });
	} catch (err: any) {
		log.error(
			{ err: err.message, address: addressString },
			"Failed to fetch history",
		);
		c.status(500);
		return c.json({ error: err.message });
	}
});

export default app;
