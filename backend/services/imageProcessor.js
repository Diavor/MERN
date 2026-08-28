import { promises as fs } from "fs";
import sharp from "sharp";
import logger from "../utils/logger.js";

// Every optimized image is converted to WebP (25–35% smaller than JPEG at
// equivalent visual quality, far smaller than PNG for photographic content),
// regardless of the upload's original format. Nothing in this codebase needs
// a non-WebP asset back: the receipt/kitchen-ticket templates
// (frontend/src/services/print.js) and the confirmation email
// (backend/services/email.service.js) are text-only — no <img>, no embedded
// image — and WebP has effectively universal browser support today. If a
// consumer that can't handle .webp is ever added (an export/PDF pipeline, a
// third-party feed), special-case it there rather than reverting this.
//
// Quality/max-width are configurable PER USE CASE via named profiles rather
// than one global constant. Only one use case exists today — product cover +
// gallery photos, and (per the CMS block registry) page hero/gallery/column
// images reuse the same upload pipeline — so there's one profile. Add a new
// key here (e.g. `thumbnail`) if/when the frontend grows a distinct smaller
// rendition; nothing elsewhere needs to change to support that.
export const IMAGE_PROFILES = {
  product: { maxWidth: 1600, quality: 82 },
};
const DEFAULT_PROFILE = "product";

/**
 * Downscale, strip metadata, and re-encode as WebP.
 *
 * sharp drops EXIF/ICC/XMP by default — nothing here calls `.withMetadata()`,
 * so no accidental metadata bloat survives. `.rotate()` (EXIF-orientation
 * bake-in) runs first specifically because it must read the orientation tag
 * *before* that metadata is dropped by the encode step.
 *
 * Never returns a result larger than the input (matches the pre-WebP guard);
 * logs when the guard rejects the optimized version, since that would
 * indicate a quality setting too high for the content being uploaded.
 *
 * @param {Buffer} buffer
 * @param {keyof IMAGE_PROFILES} [profileName]
 * @returns {Promise<Buffer>}
 */
export const optimizeBuffer = async (buffer, profileName = DEFAULT_PROFILE) => {
  const profile = IMAGE_PROFILES[profileName] || IMAGE_PROFILES[DEFAULT_PROFILE];

  let out;
  try {
    out = await sharp(buffer)
      .rotate()
      .resize({ width: profile.maxWidth, withoutEnlargement: true })
      .webp({ quality: profile.quality })
      .toBuffer();
  } catch (err) {
    const wrapped = new Error("Uploaded file is not a valid image");
    wrapped.statusCode = 400;
    wrapped.cause = err;
    throw wrapped;
  }

  if (out.length < buffer.length) return out;

  logger.info(
    {
      profile: profileName,
      originalKB: Math.round(buffer.length / 1024),
      webpKB: Math.round(out.length / 1024),
    },
    "WebP optimization did not shrink the file — keeping the original"
  );
  return buffer;
};

/**
 * Disk-driver job handler: optimize a file already on disk and rewrite it as
 * WebP. Since the output format changes, the file is written under a NEW
 * `.webp` path and the original is removed — callers that need the final URL
 * must use the returned `path`, not the one they passed in.
 *
 * ⚠ This must only run BEFORE any URL derived from the input path has been
 * handed to a client — once a URL is returned, it's persisted (into Mongo,
 * into a browser's in-flight form state) and can no longer safely change
 * out from under the caller. storage.service.js therefore calls this
 * synchronously, inline in the upload request, rather than via the
 * fire-and-forget queue the pre-WebP version used.
 *
 * @param {{ path: string, profile?: string }} args
 * @returns {Promise<{ path: string, changed: boolean }>} the file's final path.
 */
export const optimizeImage = async ({ path: filePath, profile }) => {
  const before = await fs.readFile(filePath);
  const buf = await optimizeBuffer(before, profile);

  if (buf.length >= before.length) {
    // Guard already logged inside optimizeBuffer; nothing changed on disk.
    return { path: filePath, changed: false };
  }

  const webpPath = filePath.replace(/\.[a-z0-9]+$/i, ".webp");
  await fs.writeFile(webpPath, buf);
  if (webpPath !== filePath) await fs.unlink(filePath).catch(() => {});

  logger.info(
    {
      path: filePath,
      newPath: webpPath,
      beforeKB: Math.round(before.length / 1024),
      afterKB: Math.round(buf.length / 1024),
    },
    "Image optimized"
  );
  return { path: webpPath, changed: true };
};
