// Order state machine — the single authority on legal order status transitions.
// Everything downstream (admin actions, kitchen display, notifications, printing
// triggers, analytics) reads status from here instead of inferring it from the
// legacy isPaid/isDelivered booleans (which can't represent Preparing/Ready/etc).

export const STATUS = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  PAID: "PAID",
  CONFIRMED: "CONFIRMED",
  PREPARING: "PREPARING",
  READY: "READY",
  PACKED: "PACKED",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
  FAILED: "FAILED",
};

export const STATUSES = Object.values(STATUS);

// Directed graph of allowed transitions. Terminal states map to [].
export const TRANSITIONS = {
  [STATUS.PENDING_PAYMENT]: [STATUS.PAID, STATUS.CONFIRMED, STATUS.CANCELLED, STATUS.FAILED],
  [STATUS.PAID]: [STATUS.CONFIRMED, STATUS.CANCELLED, STATUS.REFUNDED],
  [STATUS.CONFIRMED]: [STATUS.PREPARING, STATUS.CANCELLED, STATUS.REFUNDED],
  [STATUS.PREPARING]: [STATUS.READY, STATUS.CANCELLED],
  [STATUS.READY]: [STATUS.PACKED, STATUS.OUT_FOR_DELIVERY, STATUS.COMPLETED, STATUS.CANCELLED],
  [STATUS.PACKED]: [STATUS.OUT_FOR_DELIVERY, STATUS.COMPLETED],
  [STATUS.OUT_FOR_DELIVERY]: [STATUS.COMPLETED, STATUS.FAILED],
  [STATUS.COMPLETED]: [],
  [STATUS.CANCELLED]: [STATUS.REFUNDED],
  [STATUS.REFUNDED]: [],
  [STATUS.FAILED]: [],
};

/** @param {string} status @returns {boolean} */
export const isValidStatus = (status) => STATUSES.includes(status);

/** @param {string} from @param {string} to @returns {boolean} */
export const canTransition = (from, to) => (TRANSITIONS[from] || []).includes(to);

/** @param {string} from @returns {string[]} legal next states */
export const nextStates = (from) => TRANSITIONS[from] || [];

// Short human code for pickup counter hand-off (e.g. "A47").
const pickupCode = () =>
  "A" + Math.floor(10 + Math.random() * 89) + String.fromCharCode(65 + Math.floor(Math.random() * 26));

/**
 * Apply a status transition to an order document in place: validates the move,
 * mirrors the legacy booleans for backward compatibility, appends to the audit
 * trail, and derives side-effects (paidAt, deliveredAt, pickupCode).
 *
 * @param {import('mongoose').Document} order  Order document (mutated, not saved).
 * @param {string} to                          Target status.
 * @param {{ by?: string, note?: string }} [ctx]
 * @returns {import('mongoose').Document} the same order, or throws on illegal move.
 */
export const applyTransition = (order, to, ctx = {}) => {
  const from = order.status;
  if (!isValidStatus(to)) {
    const err = new Error(`Unknown status: ${to}`);
    err.statusCode = 400;
    throw err;
  }
  if (from === to) return order; // idempotent no-op
  if (!canTransition(from, to)) {
    const err = new Error(`Illegal transition ${from} → ${to}`);
    err.statusCode = 409;
    throw err;
  }

  order.status = to;
  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({ status: to, at: new Date(), by: ctx.by || null, note: ctx.note || "" });

  // Side-effects keep the legacy fields (and reads that still use them) correct.
  if (to === STATUS.PAID && !order.isPaid) {
    order.isPaid = true;
    order.paidAt = order.paidAt || new Date();
  }
  if (to === STATUS.READY && order.shippingAddress?.orderType === "pickup" && !order.pickupCode) {
    order.pickupCode = pickupCode();
  }
  if (to === STATUS.COMPLETED) {
    order.isDelivered = true;
    order.deliveredAt = order.deliveredAt || new Date();
  }

  return order;
};
