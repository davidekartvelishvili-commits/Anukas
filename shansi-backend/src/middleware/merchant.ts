import { Context, Next } from "hono";
import jwt from "jsonwebtoken";
import { getEnv } from "../utils/env.js";

interface MerchantPayload {
  merchantId: string;
}

export async function merchantMiddleware(c: Context, next: Next) {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ success: false, message: "Unauthorized" }, 401);
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, getEnv().JWT_SECRET) as MerchantPayload;
    if (!decoded.merchantId) {
      return c.json({ success: false, message: "Invalid merchant token" }, 401);
    }
    c.set("merchantId", decoded.merchantId);
    await next();
  } catch {
    return c.json({ success: false, message: "Invalid or expired token" }, 401);
  }
}
