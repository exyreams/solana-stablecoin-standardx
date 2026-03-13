import { eq } from "drizzle-orm";
import type { Context, Next } from "hono";
import { jwtVerify, SignJWT } from "jose";
import { db } from "../db/index.js";
import { admins } from "../db/schema.js";

const JWT_SECRET = new TextEncoder().encode(
	process.env.JWT_SECRET || "default-secret-change-me",
);

export async function createToken(adminId: string, role: string) {
	return await new SignJWT({ id: adminId, role })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("24h")
		.sign(JWT_SECRET);
}

export async function adminAuth(c: Context, next: Next) {
	const authHeader = c.req.header("Authorization");
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return c.json({ error: "Unauthorized: Missing or invalid token" }, 401);
	}

	const token = authHeader.split(" ")[1];
	try {
		const { payload } = await jwtVerify(token, JWT_SECRET);
		const adminId = payload.id as string;

		const [admin] = await db
			.select()
			.from(admins)
			.where(eq(admins.id, adminId))
			.limit(1);

		if (!admin) {
			return c.json({ error: "Unauthorized: Admin not found" }, 401);
		}

		c.set("admin", admin);
		c.set("userRole", admin.role);
		await next();
	} catch (_err) {
		return c.json({ error: "Unauthorized: Invalid or expired token" }, 401);
	}
}

export function rbac(allowedRoles: string[]) {
	return async (c: Context, next: Next) => {
		const role = c.get("userRole");
		if (!role || !allowedRoles.includes(role)) {
			return c.json({ error: "Forbidden: Insufficient permissions" }, 403);
		}
		await next();
	};
}
