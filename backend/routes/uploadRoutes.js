import express from "express";
import asyncHandler from "express-async-handler";
import { protect, admin } from "../middleware/authMiddleware.js";
import { upload, persistUpload } from "../services/storage.service.js";

const router = express.Router();

// persistUpload optimizes (resize + WebP) and enforces the dimension ceiling
// synchronously — see storage.service.js's file header for why that can't
// safely be a background job once format conversion is involved. The errors it
// throws carry their own `statusCode` (400 for an invalid or oversized image),
// which middleware/error.js honours, so no per-route translation is needed.

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
    res.status(201).json({ urls });
  })
);

export default router;
