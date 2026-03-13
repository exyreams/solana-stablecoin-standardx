import { PublicKey } from "@solana/web3.js";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { auditLogs, eventLogs, stablecoins } from "../db/schema.js";
import { connection, getStable, log } from "../index.js";

const app = new Hono();

app.get("/summary", async (c) => {
	try {
		const mintAddress = c.req.query("mint") || process.env.STABLECOIN_MINT;
		if (!mintAddress) {
			return c.json({ error: "STABLECOIN_MINT not configured" }, 400);
		}

		// Helper to parse BN/Hex/String into Number
		const parseSmallNumber = (val: any) => {
			if (!val) return 0;
			if (typeof val === "number") return val;
			if (typeof val === "string") {
				// Handle BN stringify behavior (which can be hex or decimal)
				if (val.match(/^[0-9a-fA-F]+$/) && val.length > 5) {
					return parseInt(val, 16);
				}
				return parseFloat(val);
			}
			return 0;
		};

		// Helper to ensure we have a proper Date object from DB (handle seconds vs ms)
		const normalizeDate = (d: any): Date => {
			if (d instanceof Date) {
				// If it's 1970, it might be seconds stored as ms
				if (d.getFullYear() < 2000) return new Date(d.getTime() * 1000);
				return d;
			}
			const num = Number(d);
			if (num < 1e11) return new Date(num * 1000); // Seconds
			return new Date(num); // Milliseconds
		};

		const s = await getStable(mintAddress);
		const status = await s.getStatus();
		const roles = await s.getRoles();

		const decimals = status.decimals;
		const div = Math.pow(10, decimals);

		// 1. Core Metrics (Live from on-chain)
		const totalSupplyBig = await s.getTotalSupply();
		const totalSupply = Number(totalSupplyBig) / div;
		const isPaused = status.paused;

		log.info(
			{ mint: mintAddress, totalSupply, decimals },
			"Status fetched for dashboard",
		);

		// 1b. Oracle Price
		let oraclePrice = "1.0000";
		try {
			const oracleStatus = await s.oracle.getStatus();
			oraclePrice = (Number(oracleStatus.lastAggregatedPrice) / 1e9).toFixed(4);
		} catch (_e) {
			log.warn({ mint: mintAddress }, "Failed to fetch oracle status");
		}

		// 2. Aggregate Data Filtering & Stats
		const allEvents = await db
			.select()
			.from(eventLogs)
			.orderBy(desc(eventLogs.timestamp));
		const allAudits = await db
			.select()
			.from(auditLogs)
			.orderBy(desc(auditLogs.timestamp));

		// Filter events for THIS mint only
		const mintEvents = allEvents
			.filter((e) => {
				try {
					const data = JSON.parse(e.data);
					// Log helpfully if names match but mints don't (debug)
					if (e.name.includes("Tokens") && data.mint !== mintAddress) {
						// log.debug({ eventMint: data.mint, targetMint: mintAddress }, "Mint mismatch in event filtering");
					}
					return data.mint === mintAddress;
				} catch {
					return false;
				}
			})
			.map((e) => ({ ...e, timestamp: normalizeDate(e.timestamp) }));

		// Filter audits for THIS mint (matching by address usually)
		const mintAudits = allAudits
			.filter((a) => {
				return true; // Keep all for now since audits don't have mint_address yet
			})
			.map((a) => ({ ...a, timestamp: normalizeDate(a.timestamp) }));

		// Calculate Stats
		const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
		let change24h = 0;
		let totalMinted = 0;
		let totalBurned = 0;
		let mintCount = 0;
		let burnCount = 0;

		for (const event of mintEvents) {
			try {
				const data = JSON.parse(event.data);
				const amount = parseSmallNumber(data.amount) / div;

				if (event.name === "TokensMinted") {
					totalMinted += amount;
					mintCount++;
					if (event.timestamp >= twentyFourHoursAgo) change24h += amount;
				} else if (event.name === "TokensBurned") {
					totalBurned += amount;
					burnCount++;
					if (event.timestamp >= twentyFourHoursAgo) change24h -= amount;
				}
			} catch (_e) {
				log.error(
					{ signature: event.signature },
					"Failed to parse event data in summary",
				);
			}
		}

		const changePercent24h =
			totalSupply > 0 ? (change24h / (totalSupply - change24h)) * 100 : 0;

		// 2b. Role-based counts (Frozen/Blacklisted)
		// Usually these are tracked in specific tables or queried from the blockchain
		// For now, we derive them from audit logs or placeholders
		const frozenCount = mintAudits.filter(
			(a) => a.action === "FREEZE_ACCOUNT",
		).length;
		const blacklistCount = mintAudits.filter(
			(a) => a.action === "BLACKLIST_ADDRESS",
		).length;

		const activities = [
			...mintEvents.map((e) => {
				const data = JSON.parse(e.data);
				const amtNum = parseSmallNumber(data.amount) / div;
				let amount = "--";
				if (e.name === "TokensMinted") amount = `+${amtNum.toLocaleString()}`;
				if (e.name === "TokensBurned") amount = `-${amtNum.toLocaleString()}`;

				return {
					timestamp: e.timestamp
						.toISOString()
						.replace("T", " ")
						.slice(0, 16)
						.replace(/-/g, "."),
					action: e.name.replace("Tokens", "").toUpperCase(),
					amount,
					target: data.recipient || data.from || "SYSTEM",
					status: "FINALIZED",
					actionColor:
						e.name === "TokensMinted"
							? "text-(--accent-active)"
							: e.name === "TokensBurned"
								? "text-[#ff4444]"
								: "",
				};
			}),
			...mintAudits.map((a) => ({
				timestamp: a.timestamp
					.toISOString()
					.replace("T", " ")
					.slice(0, 16)
					.replace(/-/g, "."),
				action: a.action.replace("_", " "),
				amount: "--",
				target: a.address,
				status: "CONFIRMED",
				actionColor: "",
			})),
		]
			.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
			.slice(0, 8);

		// 4. Supply Trajectory
		const trajectory = [];
		let runningSupply = totalSupply;
		for (let i = 0; i < 14; i++) {
			// Show 14 days for more context
			const d = new Date();
			d.setHours(0, 0, 0, 0); // Start of day
			d.setDate(d.getDate() - i);
			const dateStr = d.toISOString().split("T")[0];

			// Find changes on THIS date
			const dayChange = mintEvents
				.filter((e) => e.timestamp.toISOString().split("T")[0] === dateStr)
				.reduce((acc, e) => {
					const data = JSON.parse(e.data);
					const amt = parseSmallNumber(data.amount) / div;
					return e.name === "TokensMinted" ? acc + amt : acc - amt;
				}, 0);

			trajectory.unshift({ date: dateStr, supply: runningSupply });
			runningSupply -= dayChange;
		}

		return c.json({
			metrics: {
				totalSupply: totalSupply.toLocaleString(undefined, {
					minimumFractionDigits: 2,
				}),
				totalSupplyRaw: totalSupply,
				change24h: change24h.toLocaleString(undefined, {
					minimumFractionDigits: 2,
					signDisplay: "always",
				}),
				changePercent24h: changePercent24h.toFixed(1),
				isPaused,
				activeMinters: `1 / 12`,
				minterCapacity: "100.00M",
				price: oraclePrice,
			},
			stats: {
				totalMinted: totalMinted.toLocaleString(),
				mintCount: String(mintCount),
				totalBurned: totalBurned.toLocaleString(),
				burnCount: String(burnCount),
				frozenCount: String(frozenCount),
				blacklistCount: String(blacklistCount),
			},
			roles: {
				masterAuthority: roles.masterAuthority.toBase58(),
				pauser: roles.pauser.toBase58(),
				blacklister: roles.blacklister.toBase58(),
				burner: roles.burner.toBase58(),
				seizer: roles.seizer.toBase58(),
			},
			activities,
			trajectory,
		});
	} catch (error: any) {
		log.error({ error: error.message }, "Dashboard summary error");
		return c.json({ error: error.message }, 500);
	}
});

export default app;
