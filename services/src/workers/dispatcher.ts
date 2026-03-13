import { Job, Worker } from "bullmq";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { deliveryLogs } from "../db/schema.js";
import { log } from "../index.js";
import { redisConnection } from "../routes/mint-burn.js";

export const webhookWorker = new Worker(
	"webhook-dispatch",
	async (job: Job) => {
		const { targetUrl, event, payload, deliveryLogId } = job.data;
		const maxAttempt = job.opts.attempts || 3;

		try {
			const res = await fetch(targetUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (res.ok) {
				log.info({ targetUrl, event }, "Webhook delivered");
				await db
					.update(deliveryLogs)
					.set({ status: "SUCCESS" })
					.where(eq(deliveryLogs.id, deliveryLogId));

				return { ok: true };
			} else {
				throw new Error(`HTTP ${res.status}`);
			}
		} catch (err: any) {
			log.warn(
				{ targetUrl, attempt: job.attemptsMade + 1, err: err.message },
				"Webhook failed",
			);
			if (job.attemptsMade + 1 >= maxAttempt) {
				await db
					.update(deliveryLogs)
					.set({ status: "FAILED", error: err.message })
					.where(eq(deliveryLogs.id, deliveryLogId));
			}
			throw err; // Trigger retry
		}
	},
	{
		// @ts-ignore - pnpm ioredis version mismatch
		connection: redisConnection,
		limiter: { max: 10, duration: 1000 },
	},
);

webhookWorker.on("failed", (job, err) => {
	if (job) log.error({ job: job.id, err: err.message }, "Job failed entirely");
});
