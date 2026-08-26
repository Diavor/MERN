import express from "express";
import asyncHandler from "express-async-handler";
import { protect, admin } from "../middleware/authMiddleware.js";
import { upload, persistUpload } from "../services/storage.service.js";
import { enqueue, QUEUE, JOB } from "../services/queue.service.js";

// Local-driver uploads land on disk first and get optimized (downscale +
// re-encode, in place) by a background job; S3 uploads have no local path.
const optimizeInBackground = (file) => {
  if (file.path) enqueue(QUEUE.IMAGES, JOB.OPTIMIZE_IMAGE, { path: file.path });
};

const router = express.Router();

// Image upload — admin only (was previously unauthenticated). The storage driver
// (local disk or S3) is chosen by env; this route is agnostic to it.
router.post(
  "/",
  protect,
  admin,
  upload.single("img"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400);
      throw new Error("No image file provided");
    }
    const url = await persistUpload(req.file);
    optimizeInBackground(req.file);
    res.status(201).json({ url });
  })
);

// Multiple image upload — admin only. Returns { urls: [...] } in field order.
router.post(
  "/multiple",
  protect,
  admin,
  upload.array("images", 12),
  asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      res.status(400);
      throw new Error("No image files provided");
    }
    const urls = await Promise.all(req.files.map((file) => persistUpload(file)));
    req.files.forEach(optimizeInBackground);
    res.status(201).json({ urls });
  })
);

export default router;
