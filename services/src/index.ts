import { serve } from "@hono/node-server";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { SolanaStablecoin } from "@stbr/sss-token-sdk";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import pino from "pino";
import { db } from "./db/index.js";
import "dotenv/config";
import { sql } from "drizzle-orm";
import { adminAuth, rbac } from "./middleware/auth.js";

// Configure Pino
export const log = pino({ level: process.env.LOG_LEVEL ?? "info" });

// Blockchain configuration
if (!process.env.SOLANA_RPC_URL) {
	log.error("SOLANA_RPC_URL is required");
	process.exit(1);
}
if (!process.env.STABLECOIN_MINT) {
	log.error("STABLECOIN_MINT is required");
	process.exit(1);
}
if (!process.env.AUTHORITY_SECRET_KEY) {
	log.error("AUTHORITY_SECRET_KEY is required");
	process.exit(1);
}

export const connection = new Connection(
	process.env.SOLANA_RPC_URL,
	"confirmed",
);
export const mintPubkey = new PublicKey(process.env.STABLECOIN_MINT);
const authSecret = Uint8Array.from(
	JSON.parse(process.env.AUTHORITY_SECRET_KEY),
);
export let authority = Keypair.fromSecretKey(authSecret);

export async function updateAuthority(newSecret: string) {
	try {
		const secret = Uint8Array.from(JSON.parse(newSecret));
		authority = Keypair.fromSecretKey(secret);
		stableInstances.clear(); // Force reload with new authority
		log.info(
			{ publicKey: authority.publicKey.toBase58() },
			"Backend authority updated",
		);
		return true;
	} catch (_e) {
		// Try base58 if JSON fails
		try {
			const { default: bs58 } = await import("bs58");
			const secret = bs58.decode(newSecret);
			authority = Keypair.fromSecretKey(secret);
			stableInstances.clear();
			log.info(
				{ publicKey: authority.publicKey.toBase58() },
				"Backend authority updated (BS58)",
			);
			return true;
		} catch (_err) {
			log.error("Failed to update authority: Invalid secret key format");
			return false;
		}
	}
}

export const stableInstances = new Map<string, SolanaStablecoin>();
export async function getStable(mintAddress?: string) {
	const mintToLoad = mintAddress || process.env.STABLECOIN_MINT;
	if (!mintToLoad) {
		throw new Error("Mint address is required");
	}

	if (!stableInstances.has(mintToLoad)) {
		const transferHookProgramId = process.env.TRANSFER_HOOK_PROGRAM_ID
			? new PublicKey(process.env.TRANSFER_HOOK_PROGRAM_ID)
			: new PublicKey("HPksBobjquMqBfnCgpqBQDkomJ4HmGB1AbvJnemNBEig");

		const instance = await SolanaStablecoin.load(
			connection,
			new PublicKey(mintToLoad),
			authority,
			{ transferHookProgramId },
		);
		stableInstances.set(mintToLoad, instance);
	}
	return stableInstances.get(mintToLoad)!;
}

import adminRoutes from "./routes/admin.js";
import analyticsRoutes from "./routes/analytics.js";
import complianceRoutes from "./routes/compliance.js";
import createStablecoinRoutes from "./routes/create-stablecoin.js";
import dashboardSummaryRoutes from "./routes/dashboard.js";
import getStablecoinRoutes from "./routes/get-stablecoin.js";
import listStablecoinsRoutes from "./routes/list-stablecoins.js";
// Routes
import mintBurnRoutes from "./routes/mint-burn.js";
import privacyRoutes from "./routes/privacy.js";
import webhookRoutes from "./routes/webhooks.js";
import { startOracleCrank } from "./workers/crank.js";
// Workers
import { startEventIndexer } from "./workers/indexer.js";
import "./workers/mint-burn-worker.js";

const app = new Hono();

// CORS configuration - should be called before routes
if (!process.env.CORS_ORIGINS) {
	log.error("CORS_ORIGINS is required");
	process.exit(1);
}

const corsOrigins = process.env.CORS_ORIGINS.split(",").map((origin) =>
	origin.trim(),
);

app.use(
	"*",
	cors({
		origin: corsOrigins,
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
		maxAge: 600,
	}),
);

app.use("*", logger());

// Dashboard routes protection
const dashboard = new Hono();
dashboard.use("/*", adminAuth);

// Admin-only management routes
dashboard.use("/create-stablecoin/*", rbac(["ADMIN"]));
dashboard.use("/compliance/*", rbac(["ADMIN"]));
dashboard.use("/analytics/*", rbac(["ADMIN", "MINTER"]));
dashboard.use("/privacy/*", rbac(["ADMIN"]));
dashboard.use("/webhooks/*", rbac(["ADMIN"]));
dashboard.use("/dashboard/*", rbac(["ADMIN", "MINTER"]));

dashboard.route("/create-stablecoin", createStablecoinRoutes);
dashboard.route("/analytics", analyticsRoutes);
dashboard.route("/compliance", complianceRoutes);
dashboard.route("/privacy", privacyRoutes);
dashboard.route("/webhooks", webhookRoutes);
dashboard.route("/dashboard", dashboardSummaryRoutes);

// Shared routes (Admin & Minter)
dashboard.use("/list-stablecoins/*", rbac(["ADMIN", "MINTER"]));
dashboard.use("/get-stablecoin/*", rbac(["ADMIN", "MINTER"]));
dashboard.use("/mint-burn/*", rbac(["ADMIN", "MINTER"]));

dashboard.route("/list-stablecoins", listStablecoinsRoutes);
dashboard.route("/get-stablecoin", getStablecoinRoutes);
dashboard.route("/mint-burn", mintBurnRoutes);

// Health check (Public)
app.get("/health", async (c) => {
	try {
		await db.run(sql`SELECT 1`);
		return c.json({ status: "ok", service: "sss-backend" });
	} catch (_error) {
		c.status(503);
		return c.json({ status: "error", service: "sss-backend" });
	}
});

// Admin route handles its own internal auth for login/register
app.route("/admin", adminRoutes);

// Mount dashboard
app.route("/", dashboard);

const port = parseInt(process.env.PORT || "3000", 10);
console.log(`Server is running on port ${port}`);

serve(
	{
		fetch: app.fetch,
		port,
	},
	async () => {
		log.info({ port }, "sss-backend started");

		// Start background workers
		await startEventIndexer();
		startOracleCrank();
		log.info("Mint/Burn worker initialized");
	},
);
