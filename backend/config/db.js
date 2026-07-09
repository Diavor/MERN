import mongoose from "mongoose";
import env from "./env.js";
import logger from "../utils/logger.js";

// Fail fast on bad queries; don't buffer forever when disconnected.
mongoose.set("strictQuery", true);
mongoose.set("bufferTimeoutMS", 10000);
// Never auto-build indexes in production (a foreground build can stall the app);
// run `syncIndexes` as a deploy step instead. Auto-index in dev/test for DX.
mongoose.set("autoIndex", !env.isProd);

const connectDB = async () => {
  mongoose.connection.on("error", (err) =>
    logger.error({ err }, "MongoDB connection error")
  );
  mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));
  mongoose.connection.on("reconnected", () => logger.info("MongoDB reconnected"));

  const conn = await mongoose.connect(env.MONGO_URI, {
    // Pool sized for a single API replica; total connections = poolSize × replicas.
    maxPoolSize: 20,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 45000,
  });

  logger.info(`MongoDB connected: ${conn.connection.host}`);
  return conn;
};

// Used by the readiness probe. 1 === connected.
export const isDbReady = () => mongoose.connection.readyState === 1;

export const disconnectDB = () => mongoose.connection.close(false);

export default connectDB;
