import { Context, Next } from "hono";
import jwt from "jsonwebtoken";
import { getEnv } from "../utils/env.js";

interface AdminPayload {
  adminId: string;
  role: string;
}

export async function adminMiddleware(c: Context, next: Next) {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ success: false, message: "Unauthorized" }, 401);
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, getEnv().JWT_SECRET) as AdminPayload;
    if (!decoded.adminId || !decoded.role) {
      return c.json({ success: false, message: "Invalid admin token" }, 401);
    }
    if (decoded.role !== "admin" && decoded.role !== "super_admin") {
      return c.json({ success: false, message: "Insufficient permissions" }, 403);
    }
    c.set("adminId", decoded.adminId);
    c.set("adminRole", decoded.role);
    await next();
  } catch {
    return c.json({ success: false, message: "Invalid or expired token" }, 401);
  }
}
