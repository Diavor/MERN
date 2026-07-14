import express from "express";
import {
  getProducts,
  getProductById,
  deleteProduct,
  createProduct,
  updateProduct,
  createProductReview,
  getTopProducts,
  getProductCategories,
} from "../controllers/productController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import {
  listProductsQuery,
  updateProductSchema,
  createReviewSchema,
} from "../validators/product.schema.js";

const router = express.Router();

router
  .route("/")
  .get(validate({ query: listProductsQuery }), getProducts)
  .post(protect, admin, createProduct);
router
  .route("/:id/reviews")
  .post(protect, validate({ body: createReviewSchema }), createProductReview);
router.get("/top", getTopProducts);
router.get("/categories", getProductCategories);
router
  .route("/:id")
  .get(getProductById)
  .delete(protect, admin, deleteProduct)
  .put(protect, admin, validate({ body: updateProductSchema }), updateProduct);

export default router;
