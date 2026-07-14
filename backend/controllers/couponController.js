import asyncHandler from "express-async-handler";
import Coupon from "../models/couponModel.js";

// Serialize a coupon with its derived status for the admin table.
const withStatus = (c) => ({ ...c.toObject(), status: c.derivedStatus() });

// @desc     Fetch all coupons
// @route    GET /api/coupons
// @access   Private/Admin
export const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({}).sort({ createdAt: -1 });
  res.json(coupons.map(withStatus));
});

// @desc     Create a coupon
// @route    POST /api/coupons
// @access   Private/Admin
export const createCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const exists = await Coupon.findOne({ code: String(code || "").toUpperCase() });
  if (exists) {
    res.status(400);
    throw new Error("A coupon with that code already exists");
  }
  const coupon = new Coupon(req.body);
  const created = await coupon.save();
  res.status(201).json(withStatus(created));
});

// @desc     Update a coupon
// @route    PUT /api/coupons/:id
// @access   Private/Admin
export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found");
  }
  const fields = ["code", "type", "value", "minOrder", "maxUses", "expiresAt", "active"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) coupon[f] = req.body[f];
  });
  const updated = await coupon.save();
  res.json(withStatus(updated));
});

// @desc     Delete a coupon
// @route    DELETE /api/coupons/:id
// @access   Private/Admin
export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found");
  }
  await coupon.deleteOne();
  res.json({ message: "Coupon removed" });
});

// @desc     Validate a promo code against a subtotal (used by cart/checkout)
// @route    POST /api/coupons/validate
// @access   Public
export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal = 0 } = req.body;
  const coupon = await Coupon.findOne({ code: String(code || "").toUpperCase().trim() });

  if (!coupon || coupon.derivedStatus() === "expired") {
    res.status(404);
    throw new Error("Codice non valido o scaduto");
  }
  if (subtotal < (coupon.minOrder || 0)) {
    res.status(400);
    throw new Error(`Ordine minimo € ${coupon.minOrder.toFixed(2)} per questo codice`);
  }

  const discount = coupon.discountFor(Number(subtotal));
  res.json({
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discount: Number(discount.toFixed(2)),
  });
});
