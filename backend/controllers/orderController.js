import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import Order from "../models/orderModel.js";
import Coupon from "../models/couponModel.js";
import User from "../models/userModel.js";
import { STATUS, applyTransition, nextStates } from "../services/orderStateMachine.js";
import { emitOrderEvent, onOrderEvent } from "../services/orderEvents.js";

// @desc     Create new order
// @route    POST /api/orders
// @access   Optional (guest or authenticated)
export const addOrderItems = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    itemsNum,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    discountPrice,
    couponCode,
    totalPrice,
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error("No order items");
  }

  const order = new Order({
    orderItems,
    user: req.user?._id || null,
    shippingAddress,
    itemsNum,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    discountPrice: discountPrice || 0,
    couponCode: couponCode || "",
    totalPrice,
    // Seed the audit trail with the opening state.
    status: STATUS.PENDING_PAYMENT,
    statusHistory: [{ status: STATUS.PENDING_PAYMENT, by: req.user?._id || null }],
  });

  const createdOrder = await order.save();
  emitOrderEvent("created", createdOrder.toObject());

  // Count the redemption so coupon usage limits (maxUses) stay accurate. Best
  // effort — a missing/renamed code must never block a paid order.
  if (couponCode) {
    await Coupon.updateOne(
      { code: String(couponCode).toUpperCase().trim() },
      { $inc: { uses: 1 } }
    ).catch(() => {});
  }

  res.status(201).json(createdOrder);
});

// @desc     Get order by ID
// @route    GET /api/orders/:id
// @access   Optional (owner, admin, or guest-by-id for confirmation page)
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // A guest order (order.user == null) is readable by anyone holding its
  // unguessable id — that powers the post-checkout confirmation page. An order
  // that belongs to a user may only be read by that user or an admin.
  if (order.user) {
    const requesterId = req.user?._id?.toString();
    const isOwner = requesterId && order.user._id.toString() === requesterId;
    if (!isOwner && !req.user?.isAdmin) {
      res.status(403);
      throw new Error("Not authorized to view this order");
    }
  }

  res.json(order);
});

// @desc     Update order to paid
// @route    PUT /api/orders/:id/pay
// @access   Private (owner or admin)
export const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const requesterId = req.user?._id?.toString();
  const isOwner = order.user && order.user.toString() === requesterId;
  if (!isOwner && !req.user?.isAdmin) {
    res.status(403);
    throw new Error("Not authorized to update this order");
  }

  order.paymentResult = {
    id: req.body.id,
    status: req.body.status,
    update_time: req.body.update_time,
    // Guard against a missing payer object (manual/cash payments have none).
    email_address: req.body.payer?.email_address,
  };
  // Advance through the state machine (also sets isPaid/paidAt as a side-effect).
  if (order.status === STATUS.PENDING_PAYMENT) applyTransition(order, STATUS.PAID, { by: req.user?._id });

  const updatedOrder = await order.save();
  emitOrderEvent("updated", updatedOrder.toObject());
  res.json(updatedOrder);
});

// @desc     Update order to delivered
// @route    PUT /api/orders/:id/deliver
// @access   Private/Admin
export const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  // COMPLETED is the terminal "delivered" state; jump legal intermediate hops so
  // the audit trail stays consistent regardless of where the order was.
  const path = [STATUS.CONFIRMED, STATUS.PREPARING, STATUS.READY, STATUS.COMPLETED];
  for (const s of path) {
    if (order.status === STATUS.COMPLETED) break;
    if (nextStates(order.status).includes(s)) applyTransition(order, s, { by: req.user?._id });
  }
  if (order.status !== STATUS.COMPLETED) {
    // Fallback for legacy/unknown states: force the terminal booleans.
    order.isDelivered = true;
    order.deliveredAt = order.deliveredAt || Date.now();
  }
  const updatedOrder = await order.save();
  emitOrderEvent("updated", updatedOrder.toObject());
  res.json(updatedOrder);
});

// @desc     Update order status (state-machine transition)
// @route    PUT /api/orders/:id/status
// @access   Private/Admin
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  try {
    applyTransition(order, req.body.status, { by: req.user?._id, note: req.body.note });
  } catch (e) {
    res.status(e.statusCode || 409);
    throw e;
  }
  const updatedOrder = await order.save();
  emitOrderEvent("updated", updatedOrder.toObject());
  res.json(updatedOrder);
});

// @desc     Live order stream for admin/kitchen (Server-Sent Events)
// @route    GET /api/orders/stream?token=...
// @access   Private/Admin (token via query — EventSource can't set headers)
export const streamOrders = asyncHandler(async (req, res) => {
  // Authenticate from the query token (EventSource cannot send Authorization).
  let user = null;
  try {
    const decoded = jwt.verify(req.query.token || "", process.env.JWT_SECRET);
    user = await User.findById(decoded.id).select("isAdmin");
  } catch {
    /* fall through to 401 */
  }
  if (!user?.isAdmin) {
    res.status(401);
    throw new Error("Not authorized");
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // disable proxy buffering so frames flush immediately
  });
  res.write("retry: 3000\n\n");

  const send = (payload) => res.write(`data: ${JSON.stringify(payload)}\n\n`);
  send({ type: "connected" });

  const unsubscribe = onOrderEvent(send);
  // Heartbeat keeps intermediaries from closing an idle connection.
  const heartbeat = setInterval(() => res.write(": ping\n\n"), 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

// @desc     Get logged in user orders
// @route    GET /api/orders/myorders
// @access   Private
export const getMyOrders = asyncHandler(async (req, res) => {
  // Match both orders attributed to this account AND guest orders placed with the
  // account's email — the latter happens when the access token wasn't valid at
  // checkout (the create endpoint is optionalAuth and degrades to guest silently).
  const or = [{ user: req.user._id }];
  if (req.user.email) or.push({ "shippingAddress.email": req.user.email });
  const orders = await Order.find({ $or: or }).sort({ createdAt: -1 });
  res.json(orders);
});

// @desc     Get all orders
// @route    GET /api/orders
// @access   Private/Admin
export const getOrders = asyncHandler(async (req, res) => {
  // Optional, additive filters. With no query params this returns every order
  // (unchanged behaviour for existing callers).
  const { status, orderType, paymentMethod } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (orderType) filter["shippingAddress.orderType"] = orderType;
  if (paymentMethod) filter.paymentMethod = paymentMethod;

  const orders = await Order.find(filter)
    .populate("user", "id name")
    .sort({ createdAt: -1 });
  res.json(orders);
});
