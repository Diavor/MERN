import { MongoMemoryServer } from "mongodb-memory-server";

// Boot an isolated in-memory Mongo and a fresh app instance for a test file.
//
// Environment MUST be set before app/env modules are first imported (env.js
// validates process.env at import time AND freezes the result), so this uses
// dynamic import() after assigning the vars. Test files must therefore import
// application modules ONLY from inside a hook that runs after startTestApp()
// — never at module top level. A top-level `import "../services/x.js"` in a
// test file transitively loads env.js too early, which silently leaves
// env.MONGO_URI pointing at whatever .env says: the developer's REAL local
// database. assertUsingMemoryServer() below turns that mistake into a loud
// failure instead of a dropped dev database.
let memoryServerUri = null;

/**
 * Refuse to touch anything that isn't the in-memory server this helper
 * started. Guards the destructive teardown below — a test run must never be
 * able to drop a real database, however the env was mis-sequenced.
 */
const assertUsingMemoryServer = async (op) => {
  const mongoose = (await import("mongoose")).default;
  const { host, port, name } = mongoose.connection;
  const connected = `${host}:${port}`;
  const expected = memoryServerUri ? new URL(memoryServerUri).host : null;

  if (!memoryServerUri || connected !== expected) {
    throw new Error(
      `REFUSING TO ${op}: connected to "${connected}/${name}", which is NOT the ` +
        `in-memory test server (${expected || "none started"}).\n` +
        `This almost always means a test file imported an application module at ` +
        `top level, loading config/env.js before startTestApp() could set ` +
        `MONGO_URI. Move those imports inside before()/the hook that runs after ` +
        `startTestApp().`
    );
  }
};

export const startTestApp = async () => {
  const mongo = await MongoMemoryServer.create();

  process.env.NODE_ENV = "test";
  process.env.MONGO_URI = mongo.getUri();
  process.env.JWT_SECRET = "test-secret-at-least-16-chars-long";
  process.env.JWT_REFRESH_SECRET = "test-refresh-at-least-16-chars-long";
  memoryServerUri = mongo.getUri();

  const { default: connectDB } = await import("../../config/db.js");
  const { default: app } = await import("../../app.js");
  await connectDB();

  // Fail fast and loudly if env.js had already been frozen with a different
  // MONGO_URI — at this point we're connected to the wrong database and every
  // subsequent assertion (and the teardown) would operate on real data.
  await assertUsingMemoryServer("RUN TESTS");

  return { app, mongo };
};

export const stopTestApp = async (mongo) => {
  const mongoose = (await import("mongoose")).default;
  await assertUsingMemoryServer("DROP DATABASE");
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongo.stop();
  memoryServerUri = null;
};

// Create a user directly (bypasses the register endpoint) — handy for seeding an
// admin. Password is hashed by the model's pre-save hook.
export const createUser = async ({ name, email, password, isAdmin = false }) => {
  const { default: User } = await import("../../models/userModel.js");
  return User.create({ name, email, password, isAdmin });
};
