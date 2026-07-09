import path from "path";
import multer from "multer";
import env from "../config/env.js";

// Storage abstraction so the upload route doesn't care where bytes land.
// - local: writes to uploads/ on disk (fine for a single box / dev)
// - s3:    keeps the file in memory and streams it to an S3-compatible bucket
//          (the production choice — object storage is durable and CDN-frontable)
//
// Switch drivers with STORAGE_DRIVER; no route changes required.

const ALLOWED = /jpe?g|png|webp/;

const fileFilter = (req, file, cb) => {
  const okExt = ALLOWED.test(path.extname(file.originalname).toLowerCase());
  const okMime = ALLOWED.test(file.mimetype);
  if (okExt && okMime) return cb(null, true);
  cb(new Error("Only image files (jpg, jpeg, png, webp) are allowed"));
};

const filename = (file) =>
  `img-${Date.now()}${path.extname(file.originalname).toLowerCase()}`;

const localStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, filename(file)),
});

// Multer instance: memory buffer for S3, disk for local. 5 MB cap.
export const upload = multer({
  storage: env.STORAGE_DRIVER === "s3" ? multer.memoryStorage() : localStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Persist an uploaded file and return its public URL/path.
export const persistUpload = async (file) => {
  if (env.STORAGE_DRIVER !== "s3") {
    // multer already wrote it to uploads/; mirror the original response shape.
    return `/${file.path.replace(/\\/g, "/")}`;
  }

  // S3 path — lazy-import the SDK so local deploys don't need it installed.
  let S3Client, PutObjectCommand;
  try {
    ({ S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3"));
  } catch {
    throw new Error(
      "STORAGE_DRIVER=s3 requires @aws-sdk/client-s3 — run: npm i @aws-sdk/client-s3"
    );
  }

  const key = `products/${filename(file)}`;
  const client = new S3Client({ region: env.S3_REGION });
  await client.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  // Canonical object URL. Front with a CDN in production.
  return `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${key}`;
};
