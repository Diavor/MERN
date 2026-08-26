import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { startTestApp, stopTestApp, createUser } from "./helpers/setup.js";

let app;
let mongo;
let adminToken;

before(async () => {
  ({ app, mongo } = await startTestApp());
  await createUser({
    name: "Admin",
    email: "admin@example.com",
    password: "admin123",
    isAdmin: true,
  });
  const res = await request(app)
    .post("/api/users/login")
    .send({ email: "admin@example.com", password: "admin123" });
  adminToken = res.body.token;
});
after(async () => {
  await stopTestApp(mongo);
});

describe("products", () => {
  test("lists products with pagination envelope", async () => {
    const res = await request(app).get("/api/products");
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.products));
    assert.equal(typeof res.body.page, "number");
    assert.equal(typeof res.body.pages, "number");
  });

  test("create requires admin auth", async () => {
    const anon = await request(app).post("/api/products");
    assert.equal(anon.status, 401);
  });

  test("admin can create then delete a product (deleteOne, not .remove())", async () => {
    const created = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`);
    assert.equal(created.status, 201);
    const id = created.body._id;

    const del = await request(app)
      .delete(`/api/products/${id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    assert.equal(del.status, 200);
    assert.equal(del.body.message, "Product removed");

    // Gone now.
    const gone = await request(app).get(`/api/products/${id}`);
    assert.equal(gone.status, 404);
  });

  test("malformed id → 404, not 500", async () => {
    const res = await request(app).get("/api/products/not-a-valid-id");
    assert.equal(res.status, 404);
  });

  test("admin can update a product's toppings and dough variants", async () => {
    const created = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`);
    const id = created.body._id;

    const res = await request(app)
      .put(`/api/products/${id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Margherita",
        price: 8,
        description: "Pomodoro e mozzarella",
        img: "/img/x.jpg",
        brand: "Grani Antichi",
        category: "Pizza",
        countInStock: 100,
        doughVariants: [{ name: "Senza glutine", price: 2 }],
        toppings: [{ name: "Bufala", price: 1.5 }],
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.doughVariants.length, 1);
    assert.equal(res.body.doughVariants[0].name, "Senza glutine");
    assert.equal(res.body.toppings[0].price, 1.5);
  });

  test("omitting toppings on update leaves the stored arrays untouched", async () => {
    const created = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`);
    const id = created.body._id;
    const base = {
      name: "Marinara",
      price: 7,
      description: "Pomodoro, aglio, origano",
      img: "/img/y.jpg",
      brand: "Grani Antichi",
      category: "Pizza",
      countInStock: 50,
    };

    await request(app)
      .put(`/api/products/${id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...base, toppings: [{ name: "Acciughe", price: 2 }] });

    // A later update that doesn't mention toppings must not wipe them.
    const res = await request(app)
      .put(`/api/products/${id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...base, price: 7.5 });

    assert.equal(res.status, 200);
    assert.equal(res.body.toppings.length, 1);
    assert.equal(res.body.toppings[0].name, "Acciughe");
  });
});
