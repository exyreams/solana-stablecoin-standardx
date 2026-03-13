import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema.js";

const client = createClient({
	url: process.env.DATABASE_URL || "file:./db/dev.db",
});

export const db = drizzle(client, { schema });
