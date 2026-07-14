import express from "express";
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} from "../controllers/couponController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public: storefront validates a promo code at cart/checkout.
router.post("/validate", validateCoupon);

router.route("/").get(protect, admin, getCoupons).post(protect, admin, createCoupon);
router
  .route("/:id")
  .put(protect, admin, updateCoupon)
  .delete(protect, admin, deleteCoupon);

export default router;
