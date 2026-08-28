import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import sharp from "sharp";

// Set before any app module (these load config/env.js, which parses and
// FREEZES process.env at import time) — see helpers/setup.js for the full
// rationale. This file never connects to Mongo, but keeping the convention
// uniform is what stops the dangerous variant of this mistake.
process.env.NODE_ENV = "test";
process.env.MONGO_URI = "mongodb://127.0.0.1:1/unused";
process.env.JWT_SECRET = "test-secret-at-least-16-chars-long";

const { optimizeBuffer, optimizeImage, IMAGE_PROFILES } =
  await import("../services/imageProcessor.js");
const { default: logger } = await import("../utils/logger.js");

// A synthetic, noisy (non-solid-color) source image — noise defeats cheap
// compression, so a resize+WebP re-encode reliably shrinks it, without
// needing a binary fixture file checked into the repo.
const noisyImage = async ({ width, height, format = "png" }) => {
  let img = sharp({
    create: {
      width,
      height,
      channels: 3,
      noise: { type: "gaussian", mean: 128, sigma: 40 },
    },
  });
  img = format === "jpeg" ? img.jpeg() : img.png();
  return img.toBuffer();
};

describe("optimizeBuffer", () => {
  test("converts to WebP and downscales to the profile's max width", async () => {
    const input = await noisyImage({ width: 2400, height: 1600 });
    const out = await optimizeBuffer(input, "product");
    const meta = await sharp(out).metadata();

    assert.equal(meta.format, "webp");
    assert.ok(
      meta.width <= IMAGE_PROFILES.product.maxWidth,
      `width ${meta.width} should be <= 1600`
    );
    assert.ok(
      out.length < input.length,
      "optimized output should be smaller than the PNG input"
    );
  });

  test("strips metadata (no EXIF/ICC surviving) beyond baked-in orientation", async () => {
    const input = await noisyImage({ width: 200, height: 150 });
    const out = await optimizeBuffer(input, "product");
    const meta = await sharp(out).metadata();
    assert.ok(!meta.exif, "EXIF should not survive optimization");
    assert.ok(!meta.icc, "ICC profile should not survive optimization");
  });

  test("bakes in EXIF orientation before stripping it", async () => {
    // orientation=6 means "rotate 90° CW to display correctly" — a 40x20
    // pixel buffer tagged this way should, once .rotate() bakes it in,
    // physically become 20x40.
    const input = await sharp({
      create: {
        width: 40,
        height: 20,
        channels: 3,
        background: { r: 10, g: 20, b: 30 },
      },
    })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();
    const inMeta = await sharp(input).metadata();
    assert.equal(
      inMeta.orientation,
      6,
      "fixture should actually carry the EXIF tag under test"
    );

    const out = await optimizeBuffer(input, "product");
    const outMeta = await sharp(out).metadata();
    assert.equal(outMeta.width, 20);
    assert.equal(outMeta.height, 40);
    assert.ok(
      !outMeta.orientation || outMeta.orientation === 1,
      "orientation should be baked in, not re-attached"
    );
  });

  test("never returns a result larger than the input, and logs when the guard trips", async () => {
    // A JPEG of high-entropy noise is a real-world case where WebP loses:
    // JPEG already encodes it near-optimally, so a quality-82 WebP re-encode
    // comes out LARGER (measured: ~448KB in, ~485KB out). The guard must
    // return the original bytes untouched.
    const jpegNoise = await noisyImage({ width: 1200, height: 800, format: "jpeg" });

    const calls = [];
    const originalInfo = logger.info;
    logger.info = (...args) => calls.push(args);
    let out;
    try {
      out = await optimizeBuffer(jpegNoise, "product");
    } finally {
      logger.info = originalInfo;
    }

    assert.ok(Buffer.isBuffer(out));
    assert.equal(
      out.length,
      jpegNoise.length,
      "guard should return the original buffer unchanged"
    );
    assert.ok(
      calls.some(([, msg]) => /did not shrink/i.test(msg || "")),
      "should log when the size guard rejects the optimized version"
    );
  });

  test("rejects a buffer that isn't a valid image with a 400", async () => {
    await assert.rejects(
      () => optimizeBuffer(Buffer.from("not an image"), "product"),
      (err) => {
        assert.equal(err.statusCode, 400);
        return true;
      }
    );
  });
});

describe("optimizeImage (disk-driver job handler)", () => {
  test("writes back under a NEW .webp path and removes the original file/extension", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pga-img-"));
    // A PNG source is the case where conversion clearly wins (measured:
    // ~2.6MB in, ~520KB out), so the handler actually takes its rewrite path.
    const srcPath = path.join(dir, "raw-upload.png");
    const buf = await noisyImage({ width: 1200, height: 800, format: "png" });
    await fs.writeFile(srcPath, buf);

    const result = await optimizeImage({ path: srcPath });

    assert.equal(result.changed, true);
    assert.equal(path.extname(result.path), ".webp");
    assert.notEqual(result.path, srcPath);

    const written = await fs.readFile(result.path);
    const meta = await sharp(written).metadata();
    assert.equal(meta.format, "webp");
    assert.ok(written.length < buf.length);

    await assert.rejects(
      fs.access(srcPath),
      "original .jpg file should have been removed"
    );

    await fs.rm(dir, { recursive: true, force: true });
  });
});
