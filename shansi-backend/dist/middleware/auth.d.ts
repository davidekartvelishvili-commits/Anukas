import { Context, Next } from "hono";
import type { AppEnv } from "../types.js";
export declare function authMiddleware(c: Context<AppEnv>, next: Next): Promise<(Response & import("hono").TypedResponse<{
    success: false;
    message: string;
}, 401, "json">) | undefined>;
//# sourceMappingURL=auth.d.ts.map