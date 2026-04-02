import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import auth from "./routes/auth.js";
import user from "./routes/user.js";
import { AppError } from "./utils/errors.js";
import { getEnv } from "./utils/env.js";

const app = new Hono();

// ── Middleware ──
app.use("*", cors());
app.use("*", logger());

// ── Request timing ──
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  c.header("X-Response-Time", `${ms}ms`);
});

// ── Routes ──
app.route("/auth", auth);
app.route("/user", user);

// ── Health check ──
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Global error handler ──
app.onError((err, c) => {
  console.error(`[ERROR] ${err.message}`);

  if (err instanceof AppError) {
    return c.json({ success: false, message: err.message }, err.statusCode as any);
  }

  const status = 500;
  const message = getEnv().NODE_ENV === "production" ? "Internal server error" : err.message;
  return c.json({ success: false, message }, status);
});

// ── 404 ──
app.notFound((c) => {
  return c.json({ success: false, message: "Not found" }, 404);
});

// ── Start ──
const env = getEnv();
const port = parseInt(env.PORT);

serve({ fetch: app.fetch, port }, () => {
  console.log(`Shansi backend running on http://localhost:${port}`);
});
