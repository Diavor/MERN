import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    qty: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const pizzaOrderSchema = new mongoose.Schema(
  {
    items: [itemSchema],
    deliveryDate: { type: String, required: true },
    deliverySlot: { type: String, required: true },
    totalQty: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const PizzaOrder = mongoose.model("PizzaOrder", pizzaOrderSchema);
export default PizzaOrder;
