import { MongoMemoryServer } from "mongodb-memory-server";

// Boot an isolated in-memory Mongo and a fresh app instance for a test file.
//
// Environment MUST be set before app/env modules are first imported (env.js
// validates process.env at import time), so this uses dynamic import() after
// assigning the vars. Test files should import ONLY from this helper, never
// statically from ../../app.js.
export const startTestApp = async () => {
  const mongo = await MongoMemoryServer.create();

  process.env.NODE_ENV = "test";
  process.env.MONGO_URI = mongo.getUri();
  process.env.JWT_SECRET = "test-secret-at-least-16-chars-long";
  process.env.JWT_REFRESH_SECRET = "test-refresh-at-least-16-chars-long";

  const { default: connectDB } = await import("../../config/db.js");
  const { default: app } = await import("../../app.js");
  await connectDB();

  return { app, mongo };
};

export const stopTestApp = async (mongo) => {
  const mongoose = (await import("mongoose")).default;
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongo.stop();
};

// Create a user directly (bypasses the register endpoint) — handy for seeding an
// admin. Password is hashed by the model's pre-save hook.
export const createUser = async ({ name, email, password, isAdmin = false }) => {
  const { default: User } = await import("../../models/userModel.js");
  return User.create({ name, email, password, isAdmin });
};
