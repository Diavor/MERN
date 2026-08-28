import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

// The "provider not configured" branch needs GOOGLE_CLIENT_ID/APPLE_CLIENT_ID
// to be ABSENT when config/env.js is parsed — and env.js parses process.env
// exactly once per process and freezes it. So this case can't share a process
// with oauth.test.js (which sets both) and lives in its own file.
//
// .env on a developer machine may legitimately define them, so clear them here
// rather than assuming they're unset.
delete process.env.GOOGLE_CLIENT_ID;
delete process.env.APPLE_CLIENT_ID;

let app, mongo;

before(async () => {
  const { startTestApp } = await import("./helpers/setup.js");
  ({ app, mongo } = await startTestApp());
});
after(async () => {
  const { stopTestApp } = await import("./helpers/setup.js");
  await stopTestApp(mongo);
});

describe("social login when the provider isn't configured", () => {
  test("GET /api/config/auth reports both providers as unavailable", async () => {
    const res = await request(app).get("/api/config/auth");
    assert.equal(res.status, 200);
    // The frontend hides each button on an empty string — this is the contract
    // that makes the whole feature no-op cleanly when unconfigured.
    assert.equal(res.body.googleClientId, "");
    assert.equal(res.body.appleClientId, "");
  });

  test("POST /api/users/google → 501", async () => {
    const res = await request(app)
      .post("/api/users/google")
      .send({ credential: "anything" });
    assert.equal(res.status, 501);
  });

  test("POST /api/users/apple → 501", async () => {
    const res = await request(app)
      .post("/api/users/apple")
      .send({ identityToken: "anything" });
    assert.equal(res.status, 501);
  });

  test("a missing credential is still rejected as 400 before the 501 check", async () => {
    const res = await request(app).post("/api/users/google").send({});
    assert.equal(res.status, 400);
  });
});
