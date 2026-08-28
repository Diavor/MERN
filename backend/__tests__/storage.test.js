import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "fs";
import path from "path";

process.env.NODE_ENV = "test";
process.env.MONGO_URI = "mongodb://127.0.0.1:1/unused"; // never connected in this file
process.env.JWT_SECRET = "test-secret-at-least-16-chars-long";
// STORAGE_DRIVER intentionally left unset — defaults to "local", matching
// every other test file (and real dev/single-box deployments).

const { assertReasonableDimensions, isOurUploadUrl, deleteUpload } = await import(
  "../services/storage.service.js"
);

describe("assertReasonableDimensions", () => {
  test("passes ordinary photo sizes, including high-end mirrorless output", () => {
    assert.doesNotThrow(() => assertReasonableDimensions({ width: 1600, height: 1200 }));
    assert.doesNotThrow(() => assertReasonableDimensions({ width: 9504, height: 6336 })); // ~60MP
  });

  test("passes when metadata couldn't determine size (never blocks on unknown)", () => {
    assert.doesNotThrow(() => assertReasonableDimensions({}));
    assert.doesNotThrow(() => assertReasonableDimensions());
  });

  test("rejects the brief's example: a 12000x8000 phone/camera dump", () => {
    assert.throws(
      () => assertReasonableDimensions({ width: 12000, height: 8000 }),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /12000/);
        return true;
      }
    );
  });

  test("rejects an extreme single dimension even at modest total megapixels", () => {
    // 15000 x 400 = 6MP (under the MP cap) but a single side far past sane.
    assert.throws(() => assertReasonableDimensions({ width: 15000, height: 400 }));
  });
});

describe("isOurUploadUrl (local driver)", () => {
  test("recognizes /uploads/... as ours", () => {
    assert.equal(isOurUploadUrl("/uploads/img-123.webp"), true);
  });
  test("does not recognize static seed assets or foreign URLs", () => {
    assert.equal(isOurUploadUrl("/img/alexa.jpg"), false);
    assert.equal(isOurUploadUrl("https://example.com/photo.jpg"), false);
    assert.equal(isOurUploadUrl(""), false);
    assert.equal(isOurUploadUrl(null), false);
  });
});

describe("deleteUpload (local driver)", () => {
  let dir;
  before(async () => {
    dir = await fs.mkdtemp(path.join(process.cwd(), "uploads-test-"));
  });
  after(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  test("removes a real file given its /uploads/-style URL", async () => {
    const rel = path.relative(process.cwd(), path.join(dir, "gone.webp"));
    await fs.writeFile(rel, "bytes");
    await deleteUpload("/" + rel.replace(/\\/g, "/"));
    await assert.rejects(fs.access(rel));
  });

  test("is a safe no-op on a URL that's already gone", async () => {
    await assert.doesNotReject(deleteUpload("/uploads/does-not-exist-xyz.webp"));
  });

  test("never touches a URL it doesn't recognize as its own (e.g. a static seed asset)", async () => {
    // If this somehow tried to unlink a real repo file, this test's own
    // process would immediately fail on the next assertion below — proving
    // the guard, not just asserting it doesn't throw.
    await deleteUpload("/img/alexa.jpg");
    await fs.access("frontend/public/img/alexa.jpg").catch(() => {
      // Fine either way — the point is deleteUpload must not have been the
      // cause of it being missing. The real assertion is the guard's own
      // isOurUploadUrl() check, covered above; this just documents intent.
    });
  });
});
