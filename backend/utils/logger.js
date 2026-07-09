import pino from "pino";
import env from "../config/env.js";

// Structured JSON logs to stdout. In development, pretty-print if `pino-pretty`
// is available; in prod/test emit raw JSON for log aggregators.
const logger = pino({
  level: env.isTest ? "silent" : env.LOG_LEVEL,
  base: undefined, // drop pid/hostname noise; the aggregator adds those
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
      "*.password",
      "*.token",
    ],
    remove: true,
  },
  transport: env.isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:HH:MM:ss",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});

export default logger;
