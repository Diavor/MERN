import express from "express";
import {
  getPages,
  getPageBySlug,
  getPageById,
  createPage,
  updatePage,
  deletePage,
} from "../controllers/pageController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public: storefront renders a published page by slug.
router.get("/slug/:slug", getPageBySlug);

router.route("/").get(protect, admin, getPages).post(protect, admin, createPage);
router
  .route("/:id")
  .get(protect, admin, getPageById)
  .put(protect, admin, updatePage)
  .delete(protect, admin, deletePage);

export default router;
