import { test, describe } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";

process.env.NODE_ENV = "test";
process.env.MONGO_URI = "mongodb://127.0.0.1:1/unused"; // never connected in this file
process.env.JWT_SECRET = "test-secret-at-least-16-chars-long";
process.env.STORAGE_DRIVER = "s3";
process.env.S3_BUCKET = "pga-uploads-test";
process.env.S3_REGION = "auto";
process.env.S3_PUBLIC_URL = "https://pub-test.r2.dev";

const { isOurUploadUrl, keyFromUrl, deleteUpload, persistUpload } =
  await import("../services/storage.service.js");

// A fake @aws-sdk/client-s3 client — records every command sent instead of
// making a network call. Matches the real module's shape closely enough for
// storage.service.js's usage (Bucket/Key/Body/ContentType on Put, Bucket/Key
// on Delete).
const fakeS3 = () => {
  const sent = [];
  return {
    sent,
    client: {
      send: async (cmd) => {
        sent.push(cmd);
        return {};
      },
    },
    PutObjectCommand: class PutObjectCommand {
      constructor(input) {
        this.input = input;
      }
    },
    DeleteObjectCommand: class DeleteObjectCommand {
      constructor(input) {
        this.input = input;
      }
    },
    ListObjectsV2Command: class ListObjectsV2Command {
      constructor(input) {
        this.input = input;
      }
    },
  };
};

describe("isOurUploadUrl / keyFromUrl (s3 driver)", () => {
  test("recognizes URLs under S3_PUBLIC_URL as ours", () => {
    assert.equal(isOurUploadUrl("https://pub-test.r2.dev/products/img-1.webp"), true);
    assert.equal(
      keyFromUrl("https://pub-test.r2.dev/products/img-1.webp"),
      "products/img-1.webp"
    );
  });

  test("does not recognize a foreign or malformed URL", () => {
    assert.equal(isOurUploadUrl("https://evil.example.com/products/img-1.webp"), false);
    assert.equal(isOurUploadUrl("/img/alexa.jpg"), false);
    assert.equal(keyFromUrl("not a url"), null);
  });
});

describe("persistUpload (s3 driver, injected client)", () => {
  test("optimizes to WebP, uploads under products/, and returns a public URL built from S3_PUBLIC_URL", async () => {
    const s3 = fakeS3();
    const buffer = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        noise: { type: "gaussian", mean: 128, sigma: 40 },
      },
    })
      .jpeg()
      .toBuffer();
    const file = { buffer, mimetype: "image/jpeg", originalname: "photo.jpg" };

    const url = await persistUpload(file, { s3 });

    assert.equal(s3.sent.length, 1);
    assert.ok(s3.sent[0] instanceof s3.PutObjectCommand);
    assert.equal(s3.sent[0].input.Bucket, "pga-uploads-test");
    assert.match(s3.sent[0].input.Key, /^products\/img-.*\.webp$/);
    assert.equal(s3.sent[0].input.ContentType, "image/webp");
    assert.ok(Buffer.isBuffer(s3.sent[0].input.Body));

    assert.equal(url, `https://pub-test.r2.dev/${s3.sent[0].input.Key}`);
  });

  test("rejects an oversized image before ever touching S3", async () => {
    const s3 = fakeS3();
    // Cheap to synthesize: dimensions matter for the guard, not real pixel data.
    const buffer = await sharp({
      create: {
        width: 12000,
        height: 8000,
        channels: 3,
        background: { r: 0, g: 0, b: 0 },
      },
    })
      .jpeg({ quality: 1 })
      .toBuffer();
    const file = { buffer, mimetype: "image/jpeg", originalname: "huge.jpg" };

    await assert.rejects(
      () => persistUpload(file, { s3 }),
      (err) => {
        assert.equal(err.statusCode, 400);
        return true;
      }
    );
    assert.equal(
      s3.sent.length,
      0,
      "must not upload when the dimension check rejects the file"
    );
  });
});

describe("deleteUpload (s3 driver, injected client)", () => {
  test("sends DeleteObjectCommand for a recognized URL", async () => {
    const s3 = fakeS3();
    await deleteUpload("https://pub-test.r2.dev/products/img-42.webp", { s3 });
    assert.equal(s3.sent.length, 1);
    assert.ok(s3.sent[0] instanceof s3.DeleteObjectCommand);
    assert.equal(s3.sent[0].input.Key, "products/img-42.webp");
    assert.equal(s3.sent[0].input.Bucket, "pga-uploads-test");
  });

  test("also accepts a bare key", async () => {
    const s3 = fakeS3();
    await deleteUpload("products/img-42.webp", { s3 });
    assert.equal(s3.sent[0].input.Key, "products/img-42.webp");
  });

  test("is a no-op (sends nothing) for a URL it doesn't recognize as its own", async () => {
    const s3 = fakeS3();
    await deleteUpload("https://evil.example.com/products/img-42.webp", { s3 });
    assert.equal(s3.sent.length, 0);
  });

  test("swallows a client-side failure rather than throwing", async () => {
    const s3 = fakeS3();
    s3.client.send = async () => {
      throw new Error("NoSuchKey");
    };
    await assert.doesNotReject(
      deleteUpload("https://pub-test.r2.dev/products/gone.webp", { s3 })
    );
  });
});
