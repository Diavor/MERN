import mongoose from "mongoose";

const reviewSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
    },
    comment: { type: String, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const toppingSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const productSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    name: {
      type: String,
      required: true,
    },
    // Primary/cover image. Kept required for back-compat: menu cards, cart lines
    // and order items all read `img`. It mirrors images[0] when a gallery exists.
    img: {
      type: String,
      required: true,
    },
    // Optional additional photos (gallery). First entry is treated as the cover.
    images: {
      type: [String],
      default: [],
    },
    brand: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    toppings: [toppingSchema],
    doughVariants: [toppingSchema],
    reviews: [reviewSchema],
    rating: {
      type: Number,
      required: true,
      default: 0,
    },
    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    countInStock: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Text index backs keyword search (name/brand); rating index backs /top.
productSchema.index({ name: "text", brand: "text" });
productSchema.index({ rating: -1 });

const Product = mongoose.model("Product", productSchema);

export default Product;
