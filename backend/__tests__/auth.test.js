import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { startTestApp, stopTestApp } from "./helpers/setup.js";

let app;
let mongo;

before(async () => {
  ({ app, mongo } = await startTestApp());
});
after(async () => {
  await stopTestApp(mongo);
});

describe("auth", () => {
  test("registers a user and returns an access token", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ name: "Mario", email: "mario@example.com", password: "pizza123" });

    assert.equal(res.status, 201);
    assert.ok(res.body.token, "expected an access token");
    assert.equal(res.body.email, "mario@example.com");
    assert.equal(res.body.isAdmin, false);
    // Refresh cookie must be set httpOnly.
    const cookie = res.headers["set-cookie"]?.[0] || "";
    assert.match(cookie, /refreshToken=/);
    assert.match(cookie, /HttpOnly/i);
  });

  test("rejects a weak password with 422", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ name: "Weak", email: "weak@example.com", password: "short" });
    assert.equal(res.status, 422);
  });

  test("rejects duplicate registration", async () => {
    await request(app)
      .post("/api/users")
      .send({ name: "Dup", email: "dup@example.com", password: "pizza123" });
    const res = await request(app)
      .post("/api/users")
      .send({ name: "Dup2", email: "dup@example.com", password: "pizza123" });
    assert.equal(res.status, 400);
  });

  test("logs in with correct credentials, rejects wrong password", async () => {
    await request(app)
      .post("/api/users")
      .send({ name: "Luigi", email: "luigi@example.com", password: "pizza123" });

    const ok = await request(app)
      .post("/api/users/login")
      .send({ email: "luigi@example.com", password: "pizza123" });
    assert.equal(ok.status, 200);
    assert.ok(ok.body.token);

    const bad = await request(app)
      .post("/api/users/login")
      .send({ email: "luigi@example.com", password: "wrongpass" });
    assert.equal(bad.status, 401);
  });

  test("profile update does not lock the user out (password re-hash bug)", async () => {
    const email = "profile@example.com";
    const reg = await request(app)
      .post("/api/users")
      .send({ name: "Prof", email, password: "pizza123" });
    const token = reg.body.token;

    // Update a non-password field.
    const upd = await request(app)
      .put("/api/users/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Prof Renamed" });
    assert.equal(upd.status, 200);
    assert.equal(upd.body.name, "Prof Renamed");

    // The original password must still work.
    const relogin = await request(app)
      .post("/api/users/login")
      .send({ email, password: "pizza123" });
    assert.equal(relogin.status, 200, "password must survive a profile update");
  });

  test("rotates the refresh cookie into a new access token", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/users")
      .send({ name: "Refr", email: "refr@example.com", password: "pizza123" });

    const res = await agent.post("/api/users/refresh").send();
    assert.equal(res.status, 200);
    assert.ok(res.body.token, "refresh should return a new access token");
  });
});
