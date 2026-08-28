import dotenv from "dotenv";
import { z } from "zod";

// Load .env once, before anything reads process.env.
dotenv.config();

// Single source of truth for configuration. The process refuses to boot with an
// invalid environment rather than failing deep in a request handler later.
const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(5001),

    MONGO_URI: z.string().min(1, "MONGO_URI is required"),

    JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
    // Refresh secret is optional in dev (falls back to JWT_SECRET) but should be
    // set independently in production.
    JWT_REFRESH_SECRET: z.string().min(16).optional(),
    ACCESS_TOKEN_TTL: z.string().default("15m"),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),

    // Comma-separated allowlist of first-party origins for CORS. Empty ⇒ same-origin only.
    CORS_ORIGINS: z.string().default(""),

    // Redis backs the BullMQ job queues (emails, image processing). Empty ⇒
    // queues disabled and jobs run inline (also the test-suite behaviour).
    REDIS_URL: z.string().default("redis://127.0.0.1:6379"),
    EMAIL_FROM: z
      .string()
      .default("Pizzeria Grani Antichi <noreply@graniantichi.local>"),

    // Storage: "local" (uploads/ on disk) or "s3" (any S3-compatible store).
    // For Cloudflare R2: S3_REGION=auto, S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com,
    // S3_PUBLIC_URL=the bucket's public base URL (r2.dev subdomain or custom domain).
    STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
    S3_BUCKET: z.string().optional(),
    S3_REGION: z.string().optional(),
    S3_ENDPOINT: z.string().optional(),
    S3_PUBLIC_URL: z.string().optional(),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),

    // Weekly safety-net job: lists the R2 bucket and deletes objects with no
    // matching reference anywhere in Mongo. Only runs when STORAGE_DRIVER=s3
    // (local disk isn't the storage-cost concern this exists for) and only
    // when Redis is configured (it's a BullMQ repeatable job) — see
    // services/imageCleanup.js. DRY_RUN defaults to true: a bug here would
    // silently destroy real product photos, so real deletion is opt-in.
    IMAGE_RECONCILE_SCHEDULE: z.string().default("0 4 * * 0"), // weekly, Sun 04:00
    IMAGE_RECONCILE_DRY_RUN: z
      .enum(["true", "false"]) // NOT z.coerce.boolean() — Boolean("false") is true
      .default("true")
      .transform((v) => v === "true"),
    IMAGE_RECONCILE_SAFETY_HOURS: z.coerce.number().int().positive().default(48),

    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),

    RATE_LIMIT_WINDOW_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(15 * 60 * 1000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),

    PAYPAL_CLIENT_ID: z.string().optional(),

    // Social login. Each provider is optional — its button only appears when the
    // corresponding client id is configured. GOOGLE_CLIENT_ID is the OAuth 2.0
    // Web client id; APPLE_CLIENT_ID is the Sign in with Apple *Service ID*.
    GOOGLE_CLIENT_ID: z.string().optional(),
    APPLE_CLIENT_ID: z.string().optional(),
  })
  // In production, a dedicated refresh secret is mandatory.
  .superRefine((val, ctx) => {
    if (val.NODE_ENV === "production" && !val.JWT_REFRESH_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_REFRESH_SECRET"],
        message: "JWT_REFRESH_SECRET is required in production",
      });
    }
    if (
      val.NODE_ENV === "production" &&
      val.STORAGE_DRIVER === "s3" &&
      (!val.S3_BUCKET || !val.S3_REGION)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["S3_BUCKET"],
        message: "S3_BUCKET and S3_REGION are required when STORAGE_DRIVER=s3",
      });
    }
  });

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // Do not use the structured logger here — it depends on this module.
  const issues = parsed.error.issues
    .map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
  console.error(`\n✖ Invalid environment configuration:\n${issues}\n`);
  process.exit(1);
}

const env = Object.freeze({
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === "production",
  isTest: parsed.data.NODE_ENV === "test",
  isDev: parsed.data.NODE_ENV === "development",
  refreshSecret: parsed.data.JWT_REFRESH_SECRET || parsed.data.JWT_SECRET,
  corsOrigins: parsed.data.CORS_ORIGINS.split(",")
    .map((s) => s.trim())
    .filter(Boolean),
});

export default env;
