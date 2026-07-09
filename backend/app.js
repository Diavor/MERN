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

import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import slotRoutes from "./routes/slotRoutes.js";
import pizzaOrderRoutes from "./routes/pizzaOrderRoutes.js";

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
app.use(helmet());
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

app.get("/api/config/paypal", (req, res) => res.send(env.PAYPAL_CLIENT_ID || ""));

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
