import express from "express";
import { getSettings, updateSettings } from "../controllers/settingController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Singleton resource: no :id. GET is public (storefront may read hours/contact),
// PUT is admin-only.
router.route("/").get(getSettings).put(protect, admin, updateSettings);

export default router;
