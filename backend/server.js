import env from "./config/env.js";
import logger from "./utils/logger.js";
import connectDB, { disconnectDB } from "./config/db.js";
import app from "./app.js";

// Boot sequence: connect to Mongo, then start accepting traffic. If the DB is
// unreachable at startup we crash loudly so the orchestrator restarts us.
const start = async () => {
  try {
    await connectDB();
  } catch (err) {
    logger.fatal({ err }, "Failed to connect to MongoDB on startup");
    process.exit(1);
  }

  const server = app.listen(env.PORT, () =>
    logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`)
  );

  // Graceful shutdown: stop accepting connections, drain in-flight requests,
  // close the DB pool, then exit. Prevents dropped orders on deploy/rollout.
  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      try {
        await disconnectDB();
      } catch (err) {
        logger.error({ err }, "Error during DB disconnect");
      }
      logger.info("Shutdown complete");
      process.exit(0);
    });
    // Failsafe: force-exit if draining hangs.
    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000).unref();
  };

  ["SIGTERM", "SIGINT"].forEach((sig) => process.on(sig, () => shutdown(sig)));

  process.on("unhandledRejection", (reason) => {
    logger.error({ reason }, "Unhandled promise rejection");
  });
  process.on("uncaughtException", (err) => {
    logger.fatal({ err }, "Uncaught exception — exiting");
    process.exit(1);
  });
};

start();
