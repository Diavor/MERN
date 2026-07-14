import express from "express";
import { admin, protect, optionalAuth } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import {
  createOrderSchema,
  orderIdParams,
  payOrderSchema,
  updateStatusSchema,
} from "../validators/order.schema.js";
import {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  getMyOrders,
  getOrders,
  updateOrderToDelivered,
  updateOrderStatus,
  streamOrders,
} from "../controllers/orderController.js";

const router = express.Router();

router
  .route("/")
  .post(optionalAuth, validate({ body: createOrderSchema }), addOrderItems)
  .get(protect, admin, getOrders);
// SSE live stream (auth via ?token= — declared before "/:id" so it isn't shadowed).
router.route("/stream").get(streamOrders);
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
router
  .route("/:id/status")
  .put(
    protect,
    admin,
    validate({ params: orderIdParams, body: updateStatusSchema }),
    updateOrderStatus
  );

export default router;
