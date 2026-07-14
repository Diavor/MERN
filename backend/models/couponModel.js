import mongoose from "mongoose";

// Promo codes applied at cart/checkout. `type` is either a percentage off the
// subtotal or a fixed amount. Status (active/expiring/expired) is derived, not
// stored, so it never goes stale.
const couponSchema = mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: { type: String, enum: ["percent", "fixed"], default: "percent" },
    value: { type: Number, required: true, default: 0 },
    minOrder: { type: Number, default: 0 },
    maxUses: { type: Number, default: null }, // null = unlimited
    uses: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Derived status used by the admin table + validation.
couponSchema.methods.derivedStatus = function () {
  if (!this.active) return "expired";
  if (this.maxUses != null && this.uses >= this.maxUses) return "expired";
  if (this.expiresAt) {
    const now = Date.now();
    const exp = new Date(this.expiresAt).getTime();
    if (exp < now) return "expired";
    // "expiring" when within 14 days of lapsing.
    if (exp - now < 14 * 24 * 60 * 60 * 1000) return "expiring";
  }
  return "active";
};

// Discount this coupon yields on a given subtotal (0 if not applicable).
couponSchema.methods.discountFor = function (subtotal) {
  if (this.derivedStatus() === "expired") return 0;
  if (subtotal < (this.minOrder || 0)) return 0;
  const raw = this.type === "percent" ? (subtotal * this.value) / 100 : this.value;
  return Math.min(raw, subtotal);
};

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
