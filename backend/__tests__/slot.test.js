import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { startTestApp, stopTestApp, createUser } from "./helpers/setup.js";

let app;
let mongo;
let adminToken;
let productId;

// A scheduled order for a given slot. `city` doubles as the delivery-zone name.
const orderBody = ({ date, slot, orderType = "delivery", city = "Centro" }) => ({
  orderItems: [
    { name: "Margherita", qty: 1, image: "/img/x.jpg", price: 8, toppings: [], product: productId },
  ],
  shippingAddress: {
    name: "Guest",
    orderType,
    city,
    street: orderType === "delivery" ? "Via Roma" : "",
    buildingNumber: orderType === "delivery" ? "1" : "",
    deliveryDate: date,
    deliverySlot: slot,
  },
  paymentMethod: "Contanti",
  itemsNum: 1,
  itemsPrice: 8,
  shippingPrice: 0,
  totalPrice: 8,
});

before(async () => {
  ({ app, mongo } = await startTestApp());
  await createUser({ name: "Admin", email: "admin@example.com", password: "admin123", isAdmin: true });
  const login = await request(app)
    .post("/api/users/login")
    .send({ email: "admin@example.com", password: "admin123" });
  adminToken = login.body.token;
  const product = await request(app)
    .post("/api/products")
    .set("Authorization", `Bearer ${adminToken}`);
  productId = product.body._id;
});
after(async () => {
  await stopTestApp(mongo);
});

describe("slot capacity", () => {
  test("a scheduled order decrements slot availability", async () => {
    const date = "2026-08-01";
    const slot = "18:00";

    const before = await request(app).get(`/api/slots?date=${date}`);
    const beforeAvail = before.body.find((s) => s.time === slot).available;

    const res = await request(app).post("/api/orders").send(orderBody({ date, slot, orderType: "pickup" }));
    assert.equal(res.status, 201);

    const after = await request(app).get(`/api/slots?date=${date}`);
    const afterAvail = after.body.find((s) => s.time === slot).available;
    assert.equal(afterAvail, beforeAvail - 1);
  });

  test("a delivery order is capped by its zone's maxOrders (409 when full)", async () => {
    // Zone with a capacity of exactly one order per slot.
    await createZone({ name: "Tightville", maxOrders: 1 });
    const date = "2026-08-02";
    const slot = "19:00";

    const first = await request(app).post("/api/orders").send(orderBody({ date, slot, city: "Tightville" }));
    assert.equal(first.status, 201);

    const second = await request(app).post("/api/orders").send(orderBody({ date, slot, city: "Tightville" }));
    assert.equal(second.status, 409);
  });

  test("an order without a scheduled slot is not blocked", async () => {
    const res = await request(app).post("/api/orders").send({
      orderItems: [{ name: "Margherita", qty: 1, image: "/img/x.jpg", price: 8, toppings: [], product: productId }],
      shippingAddress: { name: "Guest", orderType: "pickup" },
      paymentMethod: "Contanti",
      itemsNum: 1,
      itemsPrice: 8,
      shippingPrice: 0,
      totalPrice: 8,
    });
    assert.equal(res.status, 201);
  });
});

// Seed a delivery zone directly (there's no public create route in these tests).
async function createZone(overrides) {
  const { default: Zone } = await import("../models/zoneModel.js");
  return Zone.create({ fee: 3, ...overrides });
}
