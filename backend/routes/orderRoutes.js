import express from "express";
import { admin, protect, optionalAuth } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import {
  createOrderSchema,
  orderIdParams,
  payOrderSchema,
} from "../validators/order.schema.js";
import {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  getMyOrders,
  getOrders,
  updateOrderToDelivered,
} from "../controllers/orderController.js";

const router = express.Router();

router
  .route("/")
  .post(optionalAuth, validate({ body: createOrderSchema }), addOrderItems)
  .get(protect, admin, getOrders);
router.route("/myorders").get(protect, getMyOrders);
router
  .route("/:id")
  .get(optionalAuth, validate({ params: orderIdParams }), getOrderById);
router
  .route("/:id/pay")
  .put(
    protect,
    validate({ params: orderIdParams, body: payOrderSchema }),
    updateOrderToPaid
  );
router.route("/:id/deliver").put(protect, admin, updateOrderToDelivered);

export default router;
