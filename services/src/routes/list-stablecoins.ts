import { desc } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { stablecoins } from "../db/schema.js";
import { log } from "../index.js";

const app = new Hono();

/**
 * GET /
 * List all created stablecoins
 */
app.get("/", async (c) => {
	try {
		const limit = parseInt(c.req.query("limit") || "50");
		const offset = parseInt(c.req.query("offset") || "0");

		const results = await db
			.select()
			.from(stablecoins)
			.orderBy(desc(stablecoins.createdAt))
			.limit(limit)
			.offset(offset);

		return c.json({
			stablecoins: results,
			count: results.length,
			limit,
			offset,
		});
	} catch (error: any) {
		log.error("Error listing stablecoins:", error);
		c.status(500);
		return c.json({
			error: error.message || "Failed to list stablecoins",
		});
	}
});

export default app;
