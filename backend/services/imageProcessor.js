import { promises as fs } from "fs";
import sharp from "sharp";
import logger from "../utils/logger.js";

// Post-upload image optimization (local storage driver). Runs as a background
// job so the upload request returns immediately; the file is optimized in
// place, so the URL already handed to the client keeps working.
const MAX_WIDTH = 1600;

/** Job handler: downscale + re-encode an uploaded image in place. */
export const optimizeImage = async ({ path }) => {
  const before = (await fs.stat(path)).size;

  const buf = await sharp(path)
    .rotate() // bake in EXIF orientation
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .toBuffer();

  // Only replace the file when optimization actually shrank it.
  if (buf.length < before) {
    await fs.writeFile(path, buf);
  }

  logger.info(
    {
      path,
      beforeKB: Math.round(before / 1024),
      afterKB: Math.round(Math.min(buf.length, before) / 1024),
    },
    "Image optimized"
  );
};
