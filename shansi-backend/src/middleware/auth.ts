import { Context, Next } from "hono";
import type { AppEnv } from "../types.js";
import { verifyToken } from "../services/token.js";
import { getDb } from "../db/client.js";
import { sessions } from "../db/schema.js";
import { eq, and } from "drizzle-orm";

export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ success: false, message: "Unauthorized" }, 401);
  }

  const token = header.slice(7);

  try {
    const decoded = verifyToken(token);
    const db = getDb();

    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.token, token), eq(sessions.isValid, true)))
      .limit(1);

    if (!session) {
      return c.json({ success: false, message: "Session expired" }, 401);
    }

    if (new Date(session.expiresAt) < new Date()) {
      return c.json({ success: false, message: "Session expired" }, 401);
    }

    c.set("userId", decoded.userId);
    c.set("phone", decoded.phone);
    await next();
  } catch {
    return c.json({ success: false, message: "Invalid token" }, 401);
  }
}
