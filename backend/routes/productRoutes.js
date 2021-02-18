import express from "express";
const router = express.Router();
import {
  getProducts,
  getProductById,
  deleteProduct,
  createProduct,
  updateProduct,
} from "../controlers/productController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

// router.get("/", getProducts());
router.route("/").get(getProducts).post(protect, admin, createProduct);
// router.get("/:id", getProductById());
router
  .route("/:id")
  .get(getProductById)
  .delete(protect, admin, deleteProduct)
  .put(protect, admin, updateProduct);
export default router;
