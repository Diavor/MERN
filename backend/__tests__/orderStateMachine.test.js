import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { STATUS, applyTransition } from "../services/orderStateMachine.js";

// applyTransition mutates a plain object the same way it mutates a mongoose
// document, so the payment/delivery side-effect rules can be tested directly.
const order = (overrides = {}) => ({
  status: STATUS.PENDING_PAYMENT,
  statusHistory: [],
  isPaid: false,
  isDelivered: false,
  shippingAddress: { orderType: "delivery" },
  ...overrides,
});

describe("order state machine payment side-effects", () => {
  it("PAID transition sets isPaid/paidAt", () => {
    const o = applyTransition(order(), STATUS.PAID);
    assert.equal(o.isPaid, true);
    assert.ok(o.paidAt instanceof Date);
  });

  it("completing an order marks it delivered AND paid (cash at hand-off)", () => {
    const o = order({ status: STATUS.OUT_FOR_DELIVERY });
    applyTransition(o, STATUS.COMPLETED);
    assert.equal(o.isDelivered, true);
    assert.equal(o.isPaid, true);
    assert.ok(o.paidAt instanceof Date);
  });

  it("completing an already-paid order keeps the original paidAt", () => {
    const paidAt = new Date("2026-01-01T12:00:00Z");
    const o = order({ status: STATUS.READY, isPaid: true, paidAt });
    applyTransition(o, STATUS.COMPLETED);
    assert.equal(o.paidAt, paidAt);
  });

  it("rejects an illegal transition", () => {
    assert.throws(
      () => applyTransition(order({ status: STATUS.COMPLETED }), STATUS.PREPARING),
      /Illegal transition/
    );
  });
});
