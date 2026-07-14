import mongoose from "mongoose";
import { STATUSES, STATUS } from "../services/orderStateMachine.js";

// One entry per status change — the order's audit trail / timeline.
const statusEventSchema = mongoose.Schema(
  {
    status: { type: String, enum: STATUSES, required: true },
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    note: { type: String, default: "" },
  },
  { _id: false }
);

const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "User",
    },
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        toppings: [{ name: { type: String }, price: { type: Number } }],
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "Product",
        },
      },
    ],
    shippingAddress: {
      name: { type: String },
      phone: { type: String },
      email: { type: String },
      orderType: { type: String, default: "delivery" },
      country: { type: String },
      city: { type: String },
      street: { type: String },
      buildingNumber: { type: String },
      floor: { type: String },
      deliveryDate: { type: String },
      deliverySlot: { type: String },
      deliveryPrice: { type: Number },
      notes: { type: String },
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
    },
    // Lifecycle status (see orderStateMachine.js). Legacy isPaid/isDelivered are
    // kept in sync as side-effects for backward compatibility.
    status: {
      type: String,
      enum: STATUSES,
      default: STATUS.PENDING_PAYMENT,
      index: true,
    },
    statusHistory: { type: [statusEventSchema], default: [] },
    pickupCode: { type: String, default: "" },

    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    discountPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    couponCode: {
      type: String,
      default: "",
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    itemsNum: {
      type: Number,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for the hot read paths: a user's own orders, the admin list/dashboard,
// and status filters.
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ isPaid: 1 });
orderSchema.index({ isDelivered: 1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;
