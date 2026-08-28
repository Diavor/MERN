import env from "../config/env.js";
import logger from "../utils/logger.js";

// 404 for unmatched routes → forwarded to errorHandler.
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Central error handler. Normalizes framework/driver errors into a consistent
// JSON envelope and picks a sane status code.
export const errorHandler = (err, req, res, next) => {
  // Start from whatever the controller set (via res.status(...).throw), else 500.
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || "Server Error";

  // Services that throw from outside a request handler can't call res.status(),
  // so they attach the intended code to the error itself (e.g.
  // services/oauth.service.js → 501 when a provider isn't configured, 401 on a
  // bad token; services/storage.service.js → 400 on an oversized image).
  // Without this, those all collapsed into a generic 500.
  if (
    Number.isInteger(err.statusCode) &&
    err.statusCode >= 400 &&
    err.statusCode <= 599
  ) {
    statusCode = err.statusCode;
  }

  // Mongoose: malformed ObjectId → 404 (resource can't exist).
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    message = "Resource not found";
  }
  // Mongoose: schema validation → 422 with field messages.
  else if (err.name === "ValidationError") {
    statusCode = 422;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join("; ");
  }
  // Mongo: duplicate unique key → 409.
  else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `A record with that ${field} already exists`;
  }
  // JWT verification failures → 401.
  else if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Not authorized, token failed";
  }

  const payload = { message, requestId: req.id };
  if (!env.isProd) payload.stack = err.stack;

  // 5xx are real faults; 4xx are client problems. Call the pino method directly
  // (destructuring it would detach `this` and crash pino).
  const meta = {
    err,
    requestId: req.id,
    statusCode,
    path: req.originalUrl,
    method: req.method,
  };
  if (statusCode >= 500) logger.error(meta, message);
  else logger.warn(meta, message);

  res.status(statusCode).json(payload);
};
