// Promo codes. BRACE10 is the code referenced across the storefront/checkout.
const coupons = [
  { code: "BRACE10", type: "percent", value: 10, minOrder: 0, maxUses: null, active: true },
  {
    code: "WELCOME15",
    type: "percent",
    value: 15,
    minOrder: 20,
    maxUses: 5000,
    uses: 892,
    active: true,
  },
  {
    code: "STAGIONE",
    type: "fixed",
    value: 5,
    minOrder: 25,
    maxUses: 500,
    uses: 118,
    active: true,
  },
];

export default coupons;
