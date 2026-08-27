import path from "path";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import pinoHttp from "pino-http";

import env from "./config/env.js";
import logger from "./utils/logger.js";
import { isDbReady } from "./config/db.js";
import requestId from "./middleware/requestId.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { notFound, errorHandler } from "./middleware/error.js";
import { adminPage } from "./middleware/authMiddleware.js";
import { queuesEnabled, getQueues } from "./services/queue.service.js";

import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import slotRoutes from "./routes/slotRoutes.js";
import pizzaOrderRoutes from "./routes/pizzaOrderRoutes.js";
import zoneRoutes from "./routes/zoneRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import pageRoutes from "./routes/pageRoutes.js";
import settingRoutes from "./routes/settingRoutes.js";

const app = express();

// Behind a reverse proxy / load balancer: trust X-Forwarded-* so rate limiting
// and secure cookies see the real client IP and protocol.
app.set("trust proxy", 1);

// --- Observability & tracing -------------------------------------------------
app.use(requestId);
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.id,
    // Health probes are noisy; drop them to debug level.
    customLogLevel: (req, res, err) => {
      if (req.url === "/healthz" || req.url === "/readyz") return "debug";
      if (res.statusCode >= 500 || err) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
  })
);

// --- Security & parsing ------------------------------------------------------
// Extend the default CSP so the Google Identity Services and Sign in with Apple
// SDKs (scripts, iframes, XHRs) load when the SPA is served from this origin in
// production. In dev the SPA is served by Vite, where this CSP doesn't apply.
const cspDefaults = helmet.contentSecurityPolicy.getDefaultDirectives();

// Product images may live on external object storage (Cloudflare R2 / S3);
// allow that origin in img-src or the browser will block every product photo.
let mediaOrigin = null;
if (env.S3_PUBLIC_URL) {
  try {
    mediaOrigin = new URL(env.S3_PUBLIC_URL).origin;
  } catch {
    /* malformed URL — leave CSP untouched rather than crash the boot */
  }
}

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...cspDefaults,
        "img-src": [
          ...(cspDefaults["img-src"] || ["'self'", "data:"]),
          ...(mediaOrigin ? [mediaOrigin] : []),
        ],
        "script-src": [
          ...(cspDefaults["script-src"] || ["'self'"]),
          "https://accounts.google.com",
          "https://appleid.cdn-apple.com",
        ],
        "frame-src": [
          "'self'",
          "https://accounts.google.com",
          "https://appleid.apple.com",
        ],
        "connect-src": [
          ...(cspDefaults["connect-src"] || ["'self'"]),
          "https://accounts.google.com",
          "https://appleid.apple.com",
        ],
        "style-src": [
          ...(cspDefaults["style-src"] || ["'self'", "'unsafe-inline'"]),
          "https://accounts.google.com",
        ],
      },
    },
  })
);
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
// Strip Mongo operator injection ($, .) from user input.
app.use(mongoSanitize());

// Public, credential-less CORS for the embeddable widget endpoints (external
// sites call these). Kept explicit so first-party CORS below can't loosen them.
const widgetCors = (methods) => (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", `${methods}, OPTIONS`);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
};
app.use("/api/slots", widgetCors("GET"));
app.use("/api/pizza-orders", widgetCors("POST"));

// First-party CORS (allowlisted origins, credentials for the refresh cookie).
// Same-origin deployments (prod static + dev proxy) don't need this; it only
// engages when CORS_ORIGINS is configured for a split-origin frontend.
if (env.corsOrigins.length) {
  app.use(cors({ origin: env.corsOrigins, credentials: true }));
}

// --- Health probes (before rate limiting) ------------------------------------
app.get("/healthz", (req, res) => res.json({ status: "ok" }));
app.get("/readyz", (req, res) =>
  isDbReady()
    ? res.json({ status: "ready" })
    : res.status(503).json({ status: "not-ready" })
);

// --- Rate limiting + API routes ----------------------------------------------
app.use("/api", apiLimiter);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/pizza-orders", pizzaOrderRoutes);
app.use("/api/zones", zoneRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/pages", pageRoutes);
app.use("/api/settings", settingRoutes);

app.get("/api/config/paypal", (req, res) => res.send(env.PAYPAL_CLIENT_ID || ""));

// Public client ids for social login. The frontend shows a provider's button
// only when its id is returned here, so unconfigured providers stay hidden.
app.get("/api/config/auth", (req, res) =>
  res.json({
    googleClientId: env.GOOGLE_CLIENT_ID || "",
    appleClientId: env.APPLE_CLIENT_ID || "",
  })
);

// --- Job queue dashboard (bull-board) ----------------------------------------
// Admin-only. Open as /admin/queues?token=<accessToken>; disabled when queues
// are (tests, or no Redis configured).
if (queuesEnabled()) {
  const { createBullBoard } = await import("@bull-board/api");
  const { BullMQAdapter } = await import("@bull-board/api/bullMQAdapter");
  const { ExpressAdapter } = await import("@bull-board/express");

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/admin/queues");
  createBullBoard({
    queues: getQueues().map((q) => new BullMQAdapter(q)),
    serverAdapter,
  });
  app.use("/admin/queues", adminPage, serverAdapter.getRouter());
}

// --- Static assets -----------------------------------------------------------
const __dirname = path.resolve();
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

if (env.isProd) {
  const buildPath = path.join(__dirname, "/frontend/build");
  app.use(express.static(buildPath));
  // SPA fallback: any non-API GET returns index.html.
  app.get("*", (req, res) => res.sendFile(path.resolve(buildPath, "index.html")));
} else {
  app.get("/", (req, res) => res.send("API is running..."));
}

// --- Error handling (last) ---------------------------------------------------
app.use(notFound);
app.use(errorHandler);

export default app;
