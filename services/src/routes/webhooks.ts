import { Queue } from "bullmq";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { deliveryLogs, subscribers } from "../db/schema.js";
import { log } from "../index.js";
import { adminAuth } from "../middleware/auth.js";
import { redisConnection } from "./mint-burn.js";

// @ts-ignore - pnpm ioredis version mismatch
const dispatchQueue = new Queue("webhook-dispatch", {
	connection: redisConnection,
});
const app = new Hono();

// Protect all webhooks routes
app.use("/*", adminAuth);

app.post("/subscribe", async (c) => {
	const { url, events } = await c.req.json();
	if (!url || !events || !Array.isArray(events)) {
		c.status(400);
		return c.json({ error: "url and events (array) required" });
	}

	try {
		const [subscriber] = await db
			.insert(subscribers)
			.values({
				url,
				events: events.join(","),
			})
			.returning();

		log.info({ id: subscriber.id, url, events }, "Subscriber registered");
		c.status(201);
		return c.json({ id: subscriber.id });
	} catch (err: any) {
		c.status(500);
		return c.json({ error: err.message });
	}
});

app.delete("/subscribe/:id", async (c) => {
	try {
		await db.delete(subscribers).where(eq(subscribers.id, c.req.param("id")));
		return c.json({ success: true });
	} catch (_err: any) {
		c.status(404);
		return c.json({ error: "Subscriber not found" });
	}
});

app.post("/dispatch", async (c) => {
	const { event, data } = await c.req.json();
	if (!event) {
		c.status(400);
		return c.json({ error: "event required" });
	}

	try {
		const subscriberList = await db.select().from(subscribers);
		const targets = subscriberList.filter((s) => {
			const evts = s.events.split(",");
			return evts.includes("*") || evts.includes(event);
		});

		const payload = { event, data, timestamp: new Date().toISOString() };
		let dispatched = 0;

		for (const target of targets) {
			const [deliveryLog] = await db
				.insert(deliveryLogs)
				.values({
					url: target.url,
					event,
					status: "START",
				})
				.returning();

			await dispatchQueue.add(
				"dispatch-job",
				{
					targetUrl: target.url,
					event,
					payload,
					deliveryLogId: deliveryLog.id,
				},
				{
					attempts: 3,
					backoff: { type: "exponential", delay: 2000 },
				},
			);
			dispatched++;
		}

		return c.json({ success: true, dispatchedTo: dispatched });
	} catch (err: any) {
		log.error({ err: err.message }, "Dispatch failed");
		c.status(500);
		return c.json({ error: err.message });
	}
});

export default app;
