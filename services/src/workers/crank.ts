import cron from "node-cron";
import { authority, getStable, log } from "../index.js";

let crankRunning = false;

async function fetchPriceMock(): Promise<number> {
	return 1.0 + (Math.random() * 0.02 - 0.01);
}

const task = cron.schedule("* * * * *", async () => {
	if (crankRunning) {
		log.warn("Previous crank job still running, skipping");
		return;
	}
	crankRunning = true;

	try {
		const s = await getStable();
		const price = await fetchPriceMock();

		const feeds = await s.oracle.getFeeds();

		if (feeds.length === 0) {
			log.info("No oracle feeds configured to crank.");
		}

		for (let i = 0; i < feeds.length; i++) {
			log.info({ feedIndex: i, price }, "Cranking oracle feed");

			// @ts-ignore - method signature may vary slightly, fallback if needed
			const sig = await s.oracle.crankFeed({
				feedIndex: i,
				price: BigInt(Math.floor(price * 1_000_000_000)), // Using 9 decimals for high precision input
				confidence: BigInt(0),
				cranker: authority,
			});
			log.info({ sig }, "Oracle cranked successfully");
		}
	} catch (err: any) {
		log.error({ err: err.message }, "Failed to crank oracle");
	} finally {
		crankRunning = false;
	}
});

export function startOracleCrank() {
	log.info("Starting Oracle Crank cron schedule");
	task.start();
}
