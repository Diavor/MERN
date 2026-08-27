import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { startTestApp, stopTestApp, createUser } from "./helpers/setup.js";

let app;
let mongo;
let adminToken;

const createPage = (body) =>
  request(app)
    .post("/api/pages")
    .set("Authorization", `Bearer ${adminToken}`)
    .send(body);

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
});
after(async () => {
  await stopTestApp(mongo);
});

describe("CMS page visibility", () => {
  test("a published public page is served by slug", async () => {
    await createPage({
      title: "Storia",
      slug: "storia",
      status: "published",
      visibility: "public",
    });
    const res = await request(app).get("/api/pages/slug/storia");
    assert.equal(res.status, 200);
    assert.equal(res.body.slug, "storia");
  });

  test("a draft page is not served publicly", async () => {
    await createPage({
      title: "Bozza",
      slug: "bozza",
      status: "draft",
      visibility: "public",
    });
    const res = await request(app).get("/api/pages/slug/bozza");
    assert.equal(res.status, 404);
  });

  test("a private published page is hidden from the storefront", async () => {
    await createPage({
      title: "Riservata",
      slug: "riservata",
      status: "published",
      visibility: "private",
    });
    const res = await request(app).get("/api/pages/slug/riservata");
    assert.equal(res.status, 404);
  });

  test("a scheduled page is hidden until its publishDate has passed", async () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    await createPage({
      title: "Futura",
      slug: "futura",
      status: "published",
      visibility: "scheduled",
      publishDate: future,
    });
    const hidden = await request(app).get("/api/pages/slug/futura");
    assert.equal(hidden.status, 404);

    const past = new Date(Date.now() - 86400000).toISOString();
    await createPage({
      title: "Passata",
      slug: "passata",
      status: "published",
      visibility: "scheduled",
      publishDate: past,
    });
    const shown = await request(app).get("/api/pages/slug/passata");
    assert.equal(shown.status, 200);
  });
});
