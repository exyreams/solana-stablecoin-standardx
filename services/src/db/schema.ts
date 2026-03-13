import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

// ── Mint & Burn ──────────────────────────────────────────────────────────────
export const mintRequests = sqliteTable("mint_requests", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	recipient: text("recipient").notNull(),
	mintAddress: text("mint_address"),
	minter: text("minter"), // The minter authority used for this request
	amount: text("amount").notNull(),
	status: text("status").notNull().default("PENDING"), // PENDING, PROCESSING, COMPLETED, FAILED
	signature: text("signature"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export const burnRequests = sqliteTable("burn_requests", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	fromTokenAccount: text("from_token_account").notNull(),
	mintAddress: text("mint_address"),
	minter: text("minter"), // The burner authority used for this request
	amount: text("amount").notNull(),
	status: text("status").notNull().default("PENDING"), // PENDING, PROCESSING, COMPLETED, FAILED
	signature: text("signature"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

// ── Event Indexer ─────────────────────────────────────────────────────────────
export const eventLogs = sqliteTable("event_logs", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	signature: text("signature").notNull(),
	name: text("name").notNull(),
	data: text("data").notNull(), // JSON stringified event data
	timestamp: integer("timestamp", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

// ── Compliance ────────────────────────────────────────────────────────────────
export const blacklist = sqliteTable(
	"blacklist",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		mintAddress: text("mint_address").notNull(),
		address: text("address").notNull(),
		reason: text("reason"),
		timestamp: integer("timestamp", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [unique().on(table.mintAddress, table.address)],
);

export const auditLogs = sqliteTable("audit_logs", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	action: text("action").notNull(), // BLACKLIST_ADD, BLACKLIST_REMOVE, SEIZE
	address: text("address").notNull(),
	reason: text("reason"),
	signature: text("signature"),
	timestamp: integer("timestamp", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

// ── Stablecoins ───────────────────────────────────────────────────────────────
export const stablecoins = sqliteTable("stablecoins", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	mintAddress: text("mint_address").notNull().unique(),
	preset: text("preset").notNull(), // sss1, sss2, sss3
	name: text("name").notNull(),
	symbol: text("symbol").notNull(),
	decimals: integer("decimals").notNull().default(6),
	uri: text("uri"),
	signature: text("signature"), // Creation transaction signature
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

// ── Webhooks ──────────────────────────────────────────────────────────────────
export const subscribers = sqliteTable("subscribers", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	url: text("url").notNull(),
	events: text("events").notNull(), // Comma separated list of events, e.g. "mint,burn" or "*"
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export const deliveryLogs = sqliteTable("delivery_logs", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	url: text("url").notNull(),
	event: text("event").notNull(),
	status: text("status").notNull(), // START, SUCCESS, FAILED
	error: text("error"),
	timestamp: integer("timestamp", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

// ── Authentication ────────────────────────────────────────────────────────────
export const admins = sqliteTable("admins", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	username: text("username").notNull().unique(),
	passwordHash: text("password_hash").notNull(),
	role: text("role").notNull().default("ADMIN"), // 'ADMIN', 'MINTER'
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});
