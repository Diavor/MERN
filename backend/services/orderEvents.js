import { EventEmitter } from "events";

// In-process pub/sub for order lifecycle events. The SSE endpoint subscribes and
// forwards frames to connected admin clients — no external broker needed for a
// single-instance deployment. (For multi-instance, swap this for Redis pub/sub;
// the emit/subscribe surface stays identical.)
const bus = new EventEmitter();
bus.setMaxListeners(0); // many concurrent admin/kitchen tabs may subscribe

export const ORDER_EVENT = "order";

/**
 * Broadcast an order lifecycle event to all subscribers.
 * @param {"created"|"updated"} type
 * @param {object} order  Plain order (already toObject/lean or a mongoose doc).
 */
export const emitOrderEvent = (type, order) => {
  bus.emit(ORDER_EVENT, { type, order, at: Date.now() });
};

// When the MongoDB change stream is active it is the single source of order
// events (it also catches writes from other processes, e.g. the seeder). The
// controllers then stop emitting directly, so each write produces one event,
// not two. If the stream errors (e.g. standalone mongod), the flag flips back
// and controller-side emits resume — live updates degrade, never disappear.
let changeStreamActive = false;

export const setChangeStreamActive = (active) => {
  changeStreamActive = active;
};

/** Controller-side emit: no-ops while the change stream is the event source. */
export const emitFallbackOrderEvent = (type, order) => {
  if (!changeStreamActive) emitOrderEvent(type, order);
};

/**
 * Subscribe to order events. Returns an unsubscribe function.
 * @param {(payload: {type: string, order: object, at: number}) => void} handler
 * @returns {() => void}
 */
export const onOrderEvent = (handler) => {
  bus.on(ORDER_EVENT, handler);
  return () => bus.off(ORDER_EVENT, handler);
};
