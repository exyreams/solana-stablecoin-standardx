import { PublicKey } from "@solana/web3.js";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { auditLogs } from "../db/schema.js";
import { getStable, log } from "../index.js";
import { adminAuth } from "../middleware/auth.js";

const app = new Hono();

// Protect all privacy routes
app.use("/*", adminAuth);

// SSS-3 (Privacy / Confidential Transfers)
app.post("/approve", async (c) => {
	const { tokenAccount, reason } = await c.req.json();
	if (!tokenAccount) {
		c.status(400);
		return c.json({ error: "tokenAccount required" });
	}
	try {
		const s = await getStable();
		const sig = await s.privacy.approveAccount(new PublicKey(tokenAccount));

		await db.insert(auditLogs).values({
			action: "PRIVACY_APPROVE",
			address: tokenAccount,
			reason: reason || "Approved for confidential transfers",
			signature: sig,
		});
		log.info({ tokenAccount, sig }, "Confidential transfer approved");
		return c.json({ success: true, signature: sig });
	} catch (err: any) {
		log.error({ err: err.message }, "Failed to approve confidential transfer");
		c.status(500);
		return c.json({ error: err.message });
	}
});

app.post("/enable-credits", async (c) => {
	const { tokenAccount, reason } = await c.req.json();
	if (!tokenAccount) {
		c.status(400);
		return c.json({ error: "tokenAccount required" });
	}
	try {
		const s = await getStable();
		const sig = await s.privacy.enableCredits(new PublicKey(tokenAccount));

		await db.insert(auditLogs).values({
			action: "PRIVACY_ENABLE_CREDITS",
			address: tokenAccount,
			reason: reason || "Enabled confidential credits",
			signature: sig,
		});
		log.info({ tokenAccount, sig }, "Confidential credits enabled");
		return c.json({ success: true, signature: sig });
	} catch (err: any) {
		log.error({ err: err.message }, "Failed to enable confidential credits");
		c.status(500);
		return c.json({ error: err.message });
	}
});

app.post("/disable-credits", async (c) => {
	const { tokenAccount, reason } = await c.req.json();
	if (!tokenAccount) {
		c.status(400);
		return c.json({ error: "tokenAccount required" });
	}
	try {
		const s = await getStable();
		const sig = await s.privacy.disableCredits(new PublicKey(tokenAccount));

		await db.insert(auditLogs).values({
			action: "PRIVACY_DISABLE_CREDITS",
			address: tokenAccount,
			reason: reason || "Disabled confidential credits",
			signature: sig,
		});
		log.info({ tokenAccount, sig }, "Confidential credits disabled");
		return c.json({ success: true, signature: sig });
	} catch (err: any) {
		log.error({ err: err.message }, "Failed to disable confidential credits");
		c.status(500);
		return c.json({ error: err.message });
	}
});

export default app;
