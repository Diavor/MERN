import path from "path";
import { promises as fsp } from "fs";
import multer from "multer";
import sharp from "sharp";
import env from "../config/env.js";
import logger from "../utils/logger.js";

// Storage abstraction so the upload route doesn't care where bytes land.
// - local: writes to uploads/ on disk (fine for a single box / dev)
// - s3:    keeps the file in memory and streams it to an S3-compatible bucket
//          (the production choice — object storage is durable and CDN-frontable;
//          Cloudflare R2 is the deployed target: S3_REGION=auto,
//          S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com)
//
// Switch drivers with STORAGE_DRIVER; no route changes required.
//
// Every accepted image is converted to WebP and resized (see
// imageProcessor.js) SYNCHRONOUSLY, before persistUpload returns a URL — for
// both drivers. This is deliberate, not incidental: once a URL is handed back
// to the client it gets persisted (into a product/page document, into a
// browser's in-flight form state) and can never safely be renamed out from
// under it afterward. A background "optimize after the fact" job — which is
// what this file used to do for the local driver — is exactly that unsafe
// rename-after-the-URL-is-already-out race once format conversion is in play.

const ALLOWED = /jpe?g|png|webp/;

const fileFilter = (req, file, cb) => {
  const okExt = ALLOWED.test(path.extname(file.originalname).toLowerCase());
  const okMime = ALLOWED.test(file.mimetype);
  if (okExt && okMime) return cb(null, true);
  cb(new Error("Only image files (jpg, jpeg, png, webp) are allowed"));
};

// Output is always WebP now (see imageProcessor.js), so the stored filename's
// extension must always be .webp too — a mismatched extension breaks
// Content-Type sniffing and CDN/browser caching (a .jpg-named file containing
// WebP bytes). The name still embeds a timestamp for unpredictability/uniqueness.
const filename = () => `img-${Date.now()}-${Math.round(Math.random() * 1e6)}.webp`;

const localStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  // Multer needs a name up front, before the bytes are optimized — write under
  // the ORIGINAL extension here; persistUpload renames to the final .webp path
  // once optimization (which decides the real content) has actually run.
  filename: (req, file, cb) =>
    cb(
      null,
      `raw-${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname).toLowerCase()}`
    ),
});

// Multer instance: memory buffer for S3, disk for local. 5 MB cap — the hard
// ceiling; the dimension check below is a second, more targeted filter for
// "technically under 5MB but wastefully large resolution" uploads (a 12+
// megapixel phone/camera photo straight off the device, before any resize).
export const upload = multer({
  storage: env.STORAGE_DRIVER === "s3" ? multer.memoryStorage() : localStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Nothing the storefront displays is ever rendered anywhere near these sizes
// (the optimize step downscales to IMAGE_PROFILES.product.maxWidth = 1600px
// regardless) — this exists purely to reject uploads that would waste
// processing time/memory for no visual benefit. Deliberately generous: a
// 61MP prosumer mirrorless photo (e.g. Sony A7R) must still pass; only
// genuinely extreme uploads (the brief's example: a 12000×8000 = 96MP phone
// dump) get rejected. Checked as two independent limits (megapixels AND a
// single-dimension cap) so an extreme-aspect-ratio image (a very tall/wide
// panorama with modest total megapixels but a huge single dimension) is also
// caught.
const MAX_MEGAPIXELS = 65;
const MAX_DIMENSION_PX = 10000;

/**
 * Pure threshold check — kept separate from the buffer-reading wrapper below
 * so the limits can be unit-tested with plain numbers, without needing to
 * synthesize an actual multi-hundred-megapixel image (expensive/slow in CI).
 * @param {{width?: number, height?: number}} dims
 * @throws {Error & {statusCode: 400}} when dims exceed the configured limits.
 */
export const assertReasonableDimensions = ({ width, height } = {}) => {
  if (!width || !height) return; // metadata couldn't determine size — let it through
  const megapixels = (width * height) / 1_000_000;
  if (
    megapixels > MAX_MEGAPIXELS ||
    width > MAX_DIMENSION_PX ||
    height > MAX_DIMENSION_PX
  ) {
    const err = new Error(
      `Image is ${width}×${height} (${megapixels.toFixed(1)}MP) — please resize before uploading ` +
        `(max ${MAX_MEGAPIXELS}MP, ${MAX_DIMENSION_PX}px per side).`
    );
    err.statusCode = 400;
    throw err;
  }
};

/** Read a multer file's bytes regardless of which storage engine produced it. */
const readFileBuffer = (file) =>
  file.buffer ? Promise.resolve(file.buffer) : fsp.readFile(file.path);

// One S3 client per process, lazily constructed so local-driver deploys never
// load the SDK. Exported (not just used internally) so imageCleanup.js's
// reconciliation job reuses the exact same client/commands rather than
// standing up a second connection.
let s3ClientPromise = null;
export const getS3 = () => {
  if (!s3ClientPromise) {
    s3ClientPromise = import("@aws-sdk/client-s3")
      .then(
        ({
          S3Client,
          PutObjectCommand,
          DeleteObjectCommand,
          ListObjectsV2Command,
        }) => ({
          PutObjectCommand,
          DeleteObjectCommand,
          ListObjectsV2Command,
          client: new S3Client({
            region: env.S3_REGION,
            // S3-compatible stores (Cloudflare R2, MinIO…) need an explicit
            // endpoint; plain AWS resolves it from the region.
            ...(env.S3_ENDPOINT ? { endpoint: env.S3_ENDPOINT } : {}),
            // Explicit credentials (e.g. R2 API tokens). Without these the SDK
            // falls back to its default chain (AWS_* env vars, instance roles).
            ...(env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
              ? {
                  credentials: {
                    accessKeyId: env.S3_ACCESS_KEY_ID,
                    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
                  },
                }
              : {}),
          }),
        })
      )
      .catch((err) => {
        s3ClientPromise = null; // allow a retry after the dep is installed
        throw new Error(
          "STORAGE_DRIVER=s3 requires @aws-sdk/client-s3 — run: npm i @aws-sdk/client-s3",
          { cause: err }
        );
      });
  }
  return s3ClientPromise;
};

const objectKey = (fname) => `products/${fname}`;

// Exported so imageCleanup.js's reconciliation job can reconstruct the same
// public URL persistUpload would have returned, from a bucket key alone (what
// ListObjectsV2Command gives it) — needed to compare "objects in the bucket"
// against "URLs referenced in Mongo" on equal footing.
/** Public URL for a bucket key, matching whichever base persistUpload used. */
export const publicUrlForKey = (key) =>
  env.S3_PUBLIC_URL
    ? `${env.S3_PUBLIC_URL.replace(/\/+$/, "")}/${key}`
    : `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${key}`;

/**
 * Persist an uploaded file and return its public URL/path. Optimizes
 * (resize + WebP) and enforces the dimension ceiling SYNCHRONOUSLY, for both
 * drivers, before any URL is returned — see the file-level comment for why.
 * @throws {Error & {statusCode: 400}} on an invalid image or one that's too large.
 * @param {object} [opts]
 * @param {object} [opts.s3]  injection point for tests — a fake
 *   `{ client, PutObjectCommand }` in place of the real lazy getS3().
 */
export const persistUpload = async (file, { s3 } = {}) => {
  const raw = await readFileBuffer(file);
  const { width, height } = await sharp(raw)
    .metadata()
    .catch(() => ({})); // let optimizeBuffer surface "not a valid image" below
  assertReasonableDimensions({ width, height });

  const { optimizeBuffer } = await import("./imageProcessor.js");
  const optimized = await optimizeBuffer(raw, "product");

  if (env.STORAGE_DRIVER !== "s3") {
    const webpPath = file.path.replace(/\.[a-z0-9]+$/i, ".webp");
    await fsp.writeFile(webpPath, optimized);
    if (webpPath !== file.path) await fsp.unlink(file.path).catch(() => {});
    return `/${webpPath.replace(/\\/g, "/")}`;
  }

  const { client, PutObjectCommand } = s3 || (await getS3());
  const key = objectKey(filename());
  await client.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: optimized,
      ContentType: "image/webp", // always WebP now — not file.mimetype (that's the ORIGINAL, now-stale, format)
    })
  );

  return publicUrlForKey(key);
};

// Recognize a URL as one WE stored, for both drivers. Deliberately
// conservative: anything that doesn't clearly match is left alone rather than
// risk deleting a URL we don't confidently own (a static seed asset like
// /img/alexa.jpg, or an externally-pasted CMS image).
export const isOurUploadUrl = (url) => {
  if (typeof url !== "string" || !url) return false;
  if (env.STORAGE_DRIVER !== "s3") return url.startsWith("/uploads/");
  return (
    Boolean(env.S3_PUBLIC_URL) && url.startsWith(env.S3_PUBLIC_URL.replace(/\/+$/, ""))
  );
};

/** Bucket key for one of our own S3/R2 URLs, or null if it isn't recognized. */
export const keyFromUrl = (url) => {
  if (!isOurUploadUrl(url) || env.STORAGE_DRIVER !== "s3") return null;
  try {
    return new URL(url).pathname.replace(/^\/+/, "") || null;
  } catch {
    return null;
  }
};

/**
 * Delete a previously-persisted upload. Safe to call on a URL that doesn't
 * exist / was already deleted / isn't recognized as ours — never throws;
 * callers (background jobs diffing "no longer referenced" documents) treat a
 * double-delete or already-gone object as an expected, harmless case.
 * @param {string} urlOrKey
 * @param {{ s3?: object }} [opts]  injection point for tests — a fake
 *   `{ client, DeleteObjectCommand }` in place of the real lazy getS3().
 */
export const deleteUpload = async (urlOrKey, { s3 } = {}) => {
  if (!urlOrKey) return;
  try {
    if (env.STORAGE_DRIVER !== "s3") {
      if (!isOurUploadUrl(urlOrKey)) return; // not one of our uploads — never touch it
      const filePath = urlOrKey.replace(/^\/+/, "");
      await fsp.unlink(filePath).catch((err) => {
        if (err.code !== "ENOENT") throw err;
        logger.debug({ filePath }, "deleteUpload: file already gone");
      });
      return;
    }

    const key = urlOrKey.includes("://") ? keyFromUrl(urlOrKey) : urlOrKey;
    if (!key) return; // not a URL we recognize as our own bucket — skip
    const { client, DeleteObjectCommand } = s3 || (await getS3());
    await client.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
  } catch (err) {
    logger.warn({ err: err.message, urlOrKey }, "deleteUpload failed (ignored)");
  }
};
