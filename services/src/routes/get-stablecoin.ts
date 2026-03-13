import { Connection, PublicKey } from "@solana/web3.js";
import { SolanaStablecoin } from "@stbr/sss-token-sdk";
import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { burnRequests, mintRequests, stablecoins } from "../db/schema.js";
import { authority, connection, log } from "../index.js";

const app = new Hono();

/**
 * GET /:mintAddress
 * Get a specific stablecoin by mint address with on-chain data
 */
app.get("/:mintAddress", async (c) => {
	try {
		const mintAddress = c.req.param("mintAddress");

		// Get basic info from DB
		const dbResults = await db
			.select()
			.from(stablecoins)
			.where(eq(stablecoins.mintAddress, mintAddress))
			.limit(1);

		if (dbResults.length === 0) {
			c.status(404);
			return c.json({ error: "Stablecoin not found" });
		}

		const dbInfo = dbResults[0];

		// Fetch on-chain data
		try {
			const mintPubkey = new PublicKey(mintAddress);

			log.info(`Loading SDK for mint: ${mintAddress}`);
			const sdk = await SolanaStablecoin.load(
				connection,
				mintPubkey,
				authority,
			);

			log.info(`Fetching status for ${mintAddress}`);
			const status = await sdk.getStatus();

			log.info(`Fetching roles for ${mintAddress}`);
			const roles = await sdk.getRoles();

			log.info(`Fetching supply for ${mintAddress}`);
			const totalSupply = await sdk.getTotalSupply();

			return c.json({
				...dbInfo,
				onChain: {
					supply: totalSupply.toString(),
					decimals: status.decimals,
					name: status.name,
					symbol: status.symbol,
					uri: status.uri,
					paused: status.paused,
					roles: {
						masterAuthority: roles.masterAuthority.toBase58(),
						pendingMaster: roles.pendingMaster?.toBase58() || null,
						pauser: roles.pauser.toBase58(),
						blacklister: roles.blacklister.toBase58(),
						burner: roles.burner.toBase58(),
						seizer: roles.seizer.toBase58(),
					},
					extensions: {
						transferHook: status.enableTransferHook,
						permanentDelegate: status.enablePermanentDelegate,
						defaultAccountFrozen: status.defaultAccountFrozen,
						confidentialTransfers: status.enableConfidentialTransfers,
					},
				},
			});
		} catch (sdkError: any) {
			log.error(`SDK Error for ${mintAddress}: ${sdkError.message}`);
			if (sdkError.stack) log.error(sdkError.stack);

			// Return DB info even if on-chain fetch fails
			return c.json({
				...dbInfo,
				onChain: null,
				warning: `On-chain data unavailable: ${sdkError.message}`,
			});
		}
	} catch (error: any) {
		log.error("Error fetching stablecoin:", error);
		c.status(500);
		return c.json({
			error: error.message || "Failed to fetch stablecoin",
		});
	}
});

app.get("/:mintAddress/history", async (c) => {
	const mintAddress = c.req.param("mintAddress");

	const mints = await db
		.select()
		.from(mintRequests)
		.where(eq(mintRequests.mintAddress, mintAddress))
		.orderBy(desc(mintRequests.createdAt))
		.limit(10);

	const burns = await db
		.select()
		.from(burnRequests)
		.where(eq(burnRequests.mintAddress, mintAddress))
		.orderBy(desc(burnRequests.createdAt))
		.limit(10);

	return c.json({ mints, burns });
});

export default app;
