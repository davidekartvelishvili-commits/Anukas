import { z } from "zod";
declare const envSchema: z.ZodObject<{
    TURSO_DATABASE_URL: z.ZodString;
    TURSO_AUTH_TOKEN: z.ZodString;
    TWILIO_ACCOUNT_SID: z.ZodString;
    TWILIO_AUTH_TOKEN: z.ZodString;
    TWILIO_VERIFY_SERVICE_SID: z.ZodString;
    JWT_SECRET: z.ZodString;
    PORT: z.ZodDefault<z.ZodString>;
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    FRONTEND_URL: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    TURSO_DATABASE_URL: string;
    TURSO_AUTH_TOKEN: string;
    TWILIO_ACCOUNT_SID: string;
    TWILIO_AUTH_TOKEN: string;
    TWILIO_VERIFY_SERVICE_SID: string;
    JWT_SECRET: string;
    PORT: string;
    NODE_ENV: "development" | "production" | "test";
    FRONTEND_URL?: string | undefined;
}, {
    TURSO_DATABASE_URL: string;
    TURSO_AUTH_TOKEN: string;
    TWILIO_ACCOUNT_SID: string;
    TWILIO_AUTH_TOKEN: string;
    TWILIO_VERIFY_SERVICE_SID: string;
    JWT_SECRET: string;
    PORT?: string | undefined;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    FRONTEND_URL?: string | undefined;
}>;
export type Env = z.infer<typeof envSchema>;
export declare function getEnv(): Env;
export {};
//# sourceMappingURL=env.d.ts.map