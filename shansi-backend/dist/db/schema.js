import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
export const users = sqliteTable("users", {
    id: text("id").primaryKey(),
    phone: text("phone").unique().notNull(),
    name: text("name"),
    pinHash: text("pin_hash"),
    balance: real("balance").default(0).notNull(),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    createdAt: text("created_at").default(sql `(datetime('now'))`).notNull(),
    updatedAt: text("updated_at").default(sql `(datetime('now'))`).notNull(),
});
export const sessions = sqliteTable("sessions", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    token: text("token").notNull(),
    deviceInfo: text("device_info"),
    isValid: integer("is_valid", { mode: "boolean" }).default(true).notNull(),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").default(sql `(datetime('now'))`).notNull(),
});
export const otpRateLimits = sqliteTable("otp_rate_limits", {
    id: text("id").primaryKey(),
    phone: text("phone").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    windowStart: text("window_start").default(sql `(datetime('now'))`).notNull(),
});
//# sourceMappingURL=schema.js.map