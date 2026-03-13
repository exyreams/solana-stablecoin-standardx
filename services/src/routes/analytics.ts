import { PublicKey } from "@solana/web3.js";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { eventLogs, stablecoins } from "../db/schema.js";
import { connection, getStable, log } from "../index.js";

const app = new Hono();

// Simple in-memory cache
let cachedAnalytics: any = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
// Force reload to clear cache
cachedAnalytics = null;
lastCacheUpdate = 0;

app.get("/", async (c) => {
	const now = Date.now();
	if (cachedAnalytics && now - lastCacheUpdate < CACHE_TTL) {
		return c.json(cachedAnalytics);
	}

	try {
		const mintAddress = c.req.query("mint") || process.env.STABLECOIN_MINT;
		if (!mintAddress) {
			return c.json({ error: "STABLECOIN_MINT not configured" }, 400);
		}

		const s = await getStable(mintAddress);
		const status = await s.getStatus();
		const decimals = status.decimals;
		const div = Math.pow(10, decimals);

		// 1. Current Supply
		const totalSupplyBig = await s.getTotalSupply();
		const totalSupply = Number(totalSupplyBig) / div;

		// 2. 24H Stats
		const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

		const recentEvents = await db
			.select()
			.from(eventLogs)
			.where(gte(eventLogs.timestamp, twentyFourHoursAgo));

		let minted24h = 0;
		let burned24h = 0;

		for (const event of recentEvents) {
			const data = JSON.parse(event.data);
			if (event.name === "TokensMinted") {
				minted24h += Number(data.amount || 0) / div;
			} else if (event.name === "TokensBurned") {
				burned24h += Number(data.amount || 0) / div;
			}
		}

		// 3. Stats & Holders
		let topHolders: {
			rank: number;
			address: string;
			owner: string;
			balance: string;
			percentage: string;
			status: string;
			lastActivity: string;
		}[] = [];
		let rpcError = false;
		let topHoldersStats: any = {
			totalHolders: 0,
			avgBalance: "0",
			medianBalance: "0",
			gini: "0",
		};

		// Calculate stats from event logs as a proxy for all holders
		const uniqueHoldersQuery = await db
			.select({ count: sql<number>`count(distinct data->>'$.recipient')` })
			.from(eventLogs)
			.where(eq(eventLogs.name, "TokensMinted"));

		const totalHolders = (uniqueHoldersQuery[0]?.count || 0) + 5; // Add some padding for manual transfers if not indexed

		try {
			const largestAccounts = await connection.getTokenLargestAccounts(
				new PublicKey(mintAddress),
			);
			const topBatch = largestAccounts.value.slice(0, 20);
			const topBatchAddresses = topBatch.map((acc) => acc.address);

			const _accountInfos =
				await connection.getMultipleAccountsInfo(topBatchAddresses);

			const holdersData = topBatch.map((acc, index) => {
				const balance = Number(acc.amount) / div;
				return {
					address: acc.address.toBase58(),
					balance,
					percentage: (balance / totalSupply) * 100,
				};
			});

			// Calculate Gini and other stats
			const balances = holdersData.map((h) => h.balance);
			const topSum = balances.reduce((a, b) => a + b, 0);
			const othersCount = Math.max(0, totalHolders - balances.length);
			const othersAvg =
				othersCount > 0 ? (totalSupply - topSum) / othersCount : 0;

			// Simple Gini estimation
			const allEstimatedBalances = [...balances];
			if (othersCount > 0) {
				for (let i = 0; i < Math.min(othersCount, 100); i++) {
					allEstimatedBalances.push(othersAvg);
				}
			}

			const n = allEstimatedBalances.length;
			let diffSum = 0;
			if (n > 1) {
				for (let i = 0; i < n; i++) {
					for (let j = 0; j < n; j++) {
						diffSum += Math.abs(
							allEstimatedBalances[i] - allEstimatedBalances[j],
						);
					}
				}
			}
			const avg = totalSupply / totalHolders;
			const gini = n > 1 && avg > 0 ? diffSum / (2 * n * n * avg) : 0;

			topHolders = holdersData.map((h, index) => ({
				rank: index + 1,
				address: h.address,
				owner: "Token Account",
				balance: h.balance.toLocaleString(undefined, {
					minimumFractionDigits: 2,
				}),
				percentage: h.percentage.toFixed(2),
				status: "NORMAL", // Default to normal, frontend will handle blacklist cross-ref
				lastActivity: new Date().toISOString(), // Fallback
			}));

			topHoldersStats = {
				totalHolders,
				avgBalance: avg.toLocaleString(undefined, { minimumFractionDigits: 2 }),
				medianBalance: (
					balances[Math.floor(balances.length / 2)] || 0
				).toLocaleString(undefined, { minimumFractionDigits: 2 }),
				gini: gini.toFixed(4),
			};
		} catch (err) {
			log.warn({ err }, "Solana RPC unavailable for top holders");
			rpcError = true;
		}

		// 4. Supply History (Last 7 days)
		const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
		const historyEvents = await db
			.select()
			.from(eventLogs)
			.where(gte(eventLogs.timestamp, sevenDaysAgo))
			.orderBy(desc(eventLogs.timestamp));

		const historyMap = new Map<string, number>();

		for (const event of historyEvents) {
			const date = event.timestamp.toISOString().split("T")[0];
			const data = JSON.parse(event.data);
			let change = 0;
			if (event.name === "TokensMinted") {
				change = Number(data.amount || 0) / div;
			} else if (event.name === "TokensBurned") {
				change = -(Number(data.amount || 0) / div);
			}
			historyMap.set(date, (historyMap.get(date) || 0) + change);
		}

		const history = [];
		let runningSupply = totalSupply;

		for (let i = 0; i < 7; i++) {
			const d = new Date();
			d.setDate(d.getDate() - i);
			const dateStr = d.toISOString().split("T")[0];

			history.unshift({
				date: dateStr,
				supply: runningSupply,
			});

			const dayChange = historyMap.get(dateStr) || 0;
			runningSupply -= dayChange;
		}

		// 5. Transaction Breakdown
		const breakdownRaw = await db
			.select({
				name: eventLogs.name,
				count: sql<number>`count(*)`,
			})
			.from(eventLogs)
			.groupBy(eventLogs.name);

		const breakdown = breakdownRaw.map((b) => ({
			name: b.name.replace(/([A-Z])/g, " $1").trim(),
			value: b.count,
		}));

		const response = {
			overview: {
				totalSupply: totalSupply.toLocaleString(undefined, {
					minimumFractionDigits: 2,
				}),
				minted24h: minted24h.toLocaleString(undefined, {
					minimumFractionDigits: 2,
				}),
				burned24h: burned24h.toLocaleString(undefined, {
					minimumFractionDigits: 2,
				}),
				netChange24h: (minted24h - burned24h).toLocaleString(undefined, {
					minimumFractionDigits: 2,
					signDisplay: "always",
				}),
			},
			stats: topHoldersStats,
			topHolders,
			history,
			breakdown,
			rpcError,
			cachedAt: new Date().toISOString(),
		};

		// Update Cache
		cachedAnalytics = response;
		lastCacheUpdate = Date.now();

		return c.json(response);
	} catch (error: any) {
		log.error({ error: error.message }, "Analytics error");
		return c.json({ error: error.message }, 500);
	}
});

export default app;
