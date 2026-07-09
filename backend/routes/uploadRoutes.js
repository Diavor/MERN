import express from "express";
import asyncHandler from "express-async-handler";
import { protect, admin } from "../middleware/authMiddleware.js";
import { upload, persistUpload } from "../services/storage.service.js";

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
    res.status(201).json({ url });
  })
);

export default router;
