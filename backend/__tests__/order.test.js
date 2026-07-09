import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { startTestApp, stopTestApp, createUser } from "./helpers/setup.js";

let app;
let mongo;
let adminToken;
let productId;

const orderBody = (product) => ({
  orderItems: [
    {
      name: "Margherita",
      qty: 1,
      image: "/img/x.jpg",
      price: 8,
      toppings: [],
      product,
    },
  ],
  shippingAddress: { name: "Guest", orderType: "pickup" },
  paymentMethod: "Contanti",
  itemsNum: 1,
  itemsPrice: 8,
  shippingPrice: 0,
  totalPrice: 8,
});

before(async () => {
  ({ app, mongo } = await startTestApp());
  await createUser({
    name: "Admin",
    email: "admin@example.com",
    password: "admin123",
    isAdmin: true,
  });
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

describe("orders", () => {
  test("guest can create an order (user is null)", async () => {
    const res = await request(app).post("/api/orders").send(orderBody(productId));
    assert.equal(res.status, 201);
    assert.equal(res.body.user, null);
    assert.equal(res.body.totalPrice, 8);
  });

  test("rejects an order with no items (422)", async () => {
    const body = orderBody(productId);
    body.orderItems = [];
    const res = await request(app).post("/api/orders").send(body);
    assert.equal(res.status, 422);
  });

  test("marking paid requires auth", async () => {
    const created = await request(app).post("/api/orders").send(orderBody(productId));
    const res = await request(app).put(`/api/orders/${created.body._id}/pay`).send({});
    assert.equal(res.status, 401);
  });

  test("admin can mark a guest order paid without a payer object", async () => {
    const created = await request(app).post("/api/orders").send(orderBody(productId));
    const res = await request(app)
      .put(`/api/orders/${created.body._id}/pay`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ id: "CASH-1", status: "COMPLETED" }); // no payer → must not crash
    assert.equal(res.status, 200);
    assert.equal(res.body.isPaid, true);
  });

  test("a user cannot read another user's order", async () => {
    // Order owned by a registered user.
    const reg = await request(app)
      .post("/api/users")
      .send({ name: "Owner", email: "owner@example.com", password: "pizza123" });
    const ownerToken = reg.body.token;
    const owned = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send(orderBody(productId));

    // A different, non-admin user tries to read it.
    const reg2 = await request(app)
      .post("/api/users")
      .send({ name: "Nosy", email: "nosy@example.com", password: "pizza123" });
    const res = await request(app)
      .get(`/api/orders/${owned.body._id}`)
      .set("Authorization", `Bearer ${reg2.body.token}`);
    assert.equal(res.status, 403);
  });
});
