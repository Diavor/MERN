import { promises as fs } from "fs";
import sharp from "sharp";
import logger from "../utils/logger.js";

// Post-upload image optimization (local storage driver). Runs as a background
// job so the upload request returns immediately; the file is optimized in
// place, so the URL already handed to the client keeps working.
const MAX_WIDTH = 1600;

/**
 * Downscale + re-encode an image buffer. Returns the smaller of the optimized
 * and original buffers, so optimization can never inflate a file.
 */
export const optimizeBuffer = async (buffer) => {
  const out = await sharp(buffer)
    .rotate() // bake in EXIF orientation
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .toBuffer();
  return out.length < buffer.length ? out : buffer;
};

/** Job handler: downscale + re-encode an uploaded image in place. */
export const optimizeImage = async ({ path }) => {
  const before = await fs.readFile(path);
  const buf = await optimizeBuffer(before);

  // Only replace the file when optimization actually shrank it.
  if (buf.length < before.length) {
    await fs.writeFile(path, buf);
  }

  logger.info(
    {
      path,
      beforeKB: Math.round(before.length / 1024),
      afterKB: Math.round(buf.length / 1024),
    },
    "Image optimized"
  );
};
