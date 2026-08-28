import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "fs";

process.env.NODE_ENV = "test";
process.env.MONGO_URI = "mongodb://127.0.0.1:1/unused"; // never connected in this file
process.env.JWT_SECRET = "test-secret-at-least-16-chars-long";
// STORAGE_DRIVER intentionally left unset — defaults to "local", matching
// every other test file (and real dev/single-box deployments).

const { assertReasonableDimensions, isOurUploadUrl, deleteUpload } =
  await import("../services/storage.service.js");

describe("assertReasonableDimensions", () => {
  test("passes ordinary photo sizes, including high-end mirrorless output", () => {
    assert.doesNotThrow(() =>
      assertReasonableDimensions({ width: 1600, height: 1200 })
    );
    assert.doesNotThrow(() =>
      assertReasonableDimensions({ width: 9504, height: 6336 })
    ); // ~60MP
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
  // Must live under the real uploads/ dir: isOurUploadUrl() only recognizes
  // "/uploads/..." for this driver, and deleteUpload deliberately refuses
  // anything it doesn't recognize as its own (proven by the last test here).
  const created = [];
  const seed = async (name) => {
    const rel = `uploads/${name}`;
    await fs.writeFile(rel, "bytes");
    created.push(rel);
    return `/${rel}`;
  };
  after(async () => {
    await Promise.all(created.map((f) => fs.rm(f, { force: true })));
  });

  test("removes a real file given its /uploads/-style URL", async () => {
    const url = await seed(`storage-test-${Date.now()}.webp`);
    await deleteUpload(url);
    await assert.rejects(fs.access(url.replace(/^\//, "")));
  });

  test("is a safe no-op on a URL that's already gone", async () => {
    await assert.doesNotReject(deleteUpload("/uploads/does-not-exist-xyz.webp"));
  });

  test("refuses a path outside uploads/ (never deletes what it doesn't own)", async () => {
    const rel = `not-uploads-${Date.now()}.webp`;
    await fs.writeFile(rel, "bytes");
    try {
      await deleteUpload(`/${rel}`);
      await assert.doesNotReject(fs.access(rel), "file outside uploads/ must survive");
    } finally {
      await fs.rm(rel, { force: true });
    }
  });
});
