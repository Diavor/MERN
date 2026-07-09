import asyncHandler from "express-async-handler";
import Order from "../models/orderModel.js";

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
    totalPrice,
  });

  const createdOrder = await order.save();
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

  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentResult = {
    id: req.body.id,
    status: req.body.status,
    update_time: req.body.update_time,
    // Guard against a missing payer object (manual/cash payments have none).
    email_address: req.body.payer?.email_address,
  };

  const updatedOrder = await order.save();
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
  order.isDelivered = true;
  order.deliveredAt = Date.now();
  const updatedOrder = await order.save();
  res.json(updatedOrder);
});

// @desc     Get logged in user orders
// @route    GET /api/orders/myorders
// @access   Private
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

// @desc     Get all orders
// @route    GET /api/orders
// @access   Private/Admin
export const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .populate("user", "id name")
    .sort({ createdAt: -1 });
  res.json(orders);
});
