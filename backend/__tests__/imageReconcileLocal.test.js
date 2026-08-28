import { test, describe } from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";
process.env.MONGO_URI = "mongodb://127.0.0.1:1/unused"; // never connected in this file
process.env.JWT_SECRET = "test-secret-at-least-16-chars-long";
// STORAGE_DRIVER left unset → "local", the case under test.

const { reconcileImageStorage } = await import("../services/imageCleanup.js");

describe("reconcileImageStorage — local driver", () => {
  test("no-ops with a clear skipped result instead of touching S3 or Mongo", async () => {
    // No Mongo connection exists in this process at all — if the local-driver
    // guard didn't short-circuit before collectReferencedImageUrls() ran a
    // query, this would hang/reject instead of resolving cleanly.
    const summary = await reconcileImageStorage();
    assert.deepEqual(summary, { skipped: true, scanned: 0, orphans: 0, deleted: 0 });
  });
});
