import express from "express";
import { admin, protect, optionalAuth } from "../middleware/authMiddleware.js";
const router = express.Router();
import {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  getMyOrders,
  getOrders,
  updateOrderToDelivered,
} from "../controlers/orderController.js";

router.route("/").post(optionalAuth, addOrderItems).get(protect, admin, getOrders);
router.route("/myorders").get(protect, getMyOrders);
router.route("/:id").get(optionalAuth, getOrderById);
router.route("/:id/pay").put(protect, updateOrderToPaid);
router.route("/:id/deliver").put(protect, admin, updateOrderToDelivered);

export default router;
