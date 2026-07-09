import rateLimit from "express-rate-limit";
import env from "../config/env.js";

const json = (message) => (req, res) =>
  res.status(429).json({ message, requestId: req.id });

// Global limiter for the whole API surface — a coarse abuse backstop.
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json("Too many requests, please try again later."),
  // Never rate-limit health probes.
  skip: (req) => req.path === "/healthz" || req.path === "/readyz",
});

// Strict limiter for credential endpoints — brute-force protection.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.isProd ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only count failed attempts
  handler: json("Too many attempts, please try again in a few minutes."),
});
