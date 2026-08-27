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

// One client per process. Lazy so local-driver deploys never load the SDK.
let s3ClientPromise = null;
const getS3 = () => {
  if (!s3ClientPromise) {
    s3ClientPromise = import("@aws-sdk/client-s3")
      .then(({ S3Client, PutObjectCommand }) => ({
        PutObjectCommand,
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
      }))
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

// Persist an uploaded file and return its public URL/path.
export const persistUpload = async (file) => {
  if (env.STORAGE_DRIVER !== "s3") {
    // multer already wrote it to uploads/; mirror the original response shape.
    return `/${file.path.replace(/\\/g, "/")}`;
  }

  const { client, PutObjectCommand } = await getS3();

  // Object storage has no in-place background job (that path is disk-only), so
  // optimize the buffer before it leaves the process.
  const { optimizeBuffer } = await import("./imageProcessor.js");
  const body = await optimizeBuffer(file.buffer).catch(() => file.buffer);

  const key = `products/${filename(file)}`;
  await client.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: file.mimetype,
    })
  );

  // Public URL: explicit base (R2's r2.dev subdomain or a custom domain wired
  // to the bucket), falling back to AWS's canonical object URL.
  if (env.S3_PUBLIC_URL) {
    return `${env.S3_PUBLIC_URL.replace(/\/+$/, "")}/${key}`;
  }
  return `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${key}`;
};
