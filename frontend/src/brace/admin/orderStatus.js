// Frontend mirror of the backend order state machine (services/orderStateMachine.js).
// Keeps status labels, colors and the legal-transition graph in one place so the
// admin order detail, kitchen display and order list stay consistent. The backend
// remains the authority — it re-validates every transition — this just drives the UI.

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

export const STATUS_LABEL = {
  PENDING_PAYMENT: "In attesa di pagamento",
  PAID: "Pagato",
  CONFIRMED: "Confermato",
  PREPARING: "In preparazione",
  READY: "Pronto",
  PACKED: "Impacchettato",
  OUT_FOR_DELIVERY: "In consegna",
  COMPLETED: "Completato",
  CANCELLED: "Annullato",
  REFUNDED: "Rimborsato",
  FAILED: "Fallito",
};

export const STATUS_COLOR = {
  PENDING_PAYMENT: "var(--gold)",
  PAID: "#6f9ae0",
  CONFIRMED: "var(--gold)",
  PREPARING: "var(--accent)",
  READY: "var(--ok)",
  PACKED: "#6f9ae0",
  OUT_FOR_DELIVERY: "#6f9ae0",
  COMPLETED: "var(--ok)",
  CANCELLED: "var(--text-faint)",
  REFUNDED: "var(--text-faint)",
  FAILED: "var(--danger, #c0392b)",
};

export const TRANSITIONS = {
  PENDING_PAYMENT: ["PAID", "CONFIRMED", "CANCELLED", "FAILED"],
  PAID: ["CONFIRMED", "CANCELLED", "REFUNDED"],
  CONFIRMED: ["PREPARING", "CANCELLED", "REFUNDED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["PACKED", "OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"],
  PACKED: ["OUT_FOR_DELIVERY", "COMPLETED"],
  OUT_FOR_DELIVERY: ["COMPLETED", "FAILED"],
  COMPLETED: [],
  CANCELLED: ["REFUNDED"],
  REFUNDED: [],
  FAILED: [],
};

/** @param {string} from @returns {string[]} legal next statuses */
export const nextStates = (from) => TRANSITIONS[from] || [];

export const labelOf = (s) => STATUS_LABEL[s] || s || "—";
export const colorOf = (s) => STATUS_COLOR[s] || "var(--text-faint)";

// Shared order-card helpers used by the Kitchen and Delivery boards. Kept here
// so the two screens can't drift apart. "GA" = Grani Antichi (short ticket id).
export const shortId = (o) => "GA-" + String(o?._id || "").slice(-8).toUpperCase();
export const minsSince = (d) =>
  Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 60000));

// Active kitchen queue = accepted and still cooking. Once READY the order leaves
// the kitchen and moves to the delivery/handoff board.
export const KITCHEN_STATUSES = [STATUS.CONFIRMED, STATUS.PREPARING];
// Delivery/courier board = cooked and awaiting hand-off or in transit.
export const DELIVERY_STATUSES = [STATUS.READY, STATUS.PACKED, STATUS.OUT_FOR_DELIVERY];
export const isTerminal = (s) => nextStates(s).length === 0;
