import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { promises as fs } from "fs";
import { startTestApp, stopTestApp, createUser } from "./helpers/setup.js";

let app;
let mongo;
let adminToken;

const createPage = (body) =>
  request(app)
    .post("/api/pages")
    .set("Authorization", `Bearer ${adminToken}`)
    .send(body);

// See product.test.js for why a real settle delay is needed — deletion runs
// through enqueue()'s inline (setImmediate) fallback, not awaited inline.
const settleQueue = () => new Promise((r) => setTimeout(r, 150));
let seq = 0;
const seedUpload = async () => {
  const name = `cleanup-page-${Date.now()}-${seq++}.webp`;
  await fs.writeFile(`uploads/${name}`, "fake webp bytes");
  return `/uploads/${name}`;
};
const fileExists = (url) =>
  fs.access(url.replace(/^\/+/, "")).then(
    () => true,
    () => false
  );

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

describe("orphaned image cleanup", () => {
  test("replacing featuredImage deletes the old file", async () => {
    const oldImg = await seedUpload();
    const newImg = await seedUpload();
    const created = await createPage({
      title: "Con foto",
      slug: `foto-${Date.now()}`,
      featuredImage: oldImg,
    });
    const id = created.body._id;

    await request(app)
      .put(`/api/pages/${id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ featuredImage: newImg });
    await settleQueue();

    assert.equal(await fileExists(oldImg), false);
    assert.equal(await fileExists(newImg), true);
  });

  test("removing an image nested inside a block (hero) deletes it", async () => {
    const heroImg = await seedUpload();
    const created = await createPage({
      title: "Hero",
      slug: `hero-${Date.now()}`,
      blocks: [
        {
          id: "b1",
          type: "hero",
          data: { image: { url: heroImg, name: "x", dim: "" } },
        },
      ],
    });
    const id = created.body._id;

    await request(app)
      .put(`/api/pages/${id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ blocks: [{ id: "b1", type: "hero", data: { image: null } }] });
    await settleQueue();

    assert.equal(await fileExists(heroImg), false);
  });

  test("deleting a page deletes its featuredImage and block images", async () => {
    const featured = await seedUpload();
    const gallery = await seedUpload();
    const created = await createPage({
      title: "Con tutto",
      slug: `tutto-${Date.now()}`,
      featuredImage: featured,
      blocks: [{ id: "b1", type: "gallery", data: { images: [{ url: gallery }] } }],
    });
    const id = created.body._id;

    await request(app)
      .delete(`/api/pages/${id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    await settleQueue();

    assert.equal(await fileExists(featured), false);
    assert.equal(await fileExists(gallery), false);
  });
});
