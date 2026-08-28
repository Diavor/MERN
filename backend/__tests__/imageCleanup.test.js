import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";

process.env.STORAGE_DRIVER = "s3";
process.env.S3_BUCKET = "pga-uploads-test";
process.env.S3_REGION = "auto";
process.env.S3_PUBLIC_URL = "https://pub-test.r2.dev";

const { startTestApp, stopTestApp } = await import("./helpers/setup.js");
const {
  collectImageUrls,
  diffRemovedImages,
  isUrlStillReferenced,
  deleteImageIfUnreferenced,
  collectReferencedImageUrls,
  reconcileImageStorage,
} = await import("../services/imageCleanup.js");

let mongo, Product, Page, Order, User;

before(async () => {
  ({ mongo } = await startTestApp());
  ({ default: Product } = await import("../models/productModel.js"));
  ({ default: Page } = await import("../models/pageModel.js"));
  ({ default: Order } = await import("../models/orderModel.js"));
  ({ default: User } = await import("../models/userModel.js"));
});
after(async () => {
  await stopTestApp(mongo);
});

const IMG = (n) => `https://pub-test.r2.dev/products/img-${n}.webp`;

const makeUser = () => User.create({ name: "Admin", email: `a${Date.now()}${Math.random()}@x.com`, password: "x", isAdmin: true });

const makeProduct = (overrides = {}) =>
  Product.create({
    user: overrides.user,
    name: "Test",
    img: IMG(1),
    brand: "B",
    category: "C",
    description: "D",
    ...overrides,
  });

describe("collectImageUrls — recursive scan over free-form CMS block data", () => {
  test("finds a structured {url,name,dim} media object at any nesting depth", () => {
    const blocks = [
      { type: "hero", data: { image: { url: IMG(1), name: "a", dim: "" } } },
      { type: "columns", data: { left: { media: { url: IMG(2) } }, right: { kind: "text" } } },
      { type: "gallery", data: { images: [{ url: IMG(3) }, { url: IMG(4) }] } },
    ];
    const set = collectImageUrls(blocks);
    assert.deepEqual([...set].sort(), [IMG(1), IMG(2), IMG(3), IMG(4)].sort());
  });

  test("extracts an <img src> embedded inside a free-form html/text block", () => {
    const blocks = [
      { type: "html", data: { code: `<section><img src="${IMG(5)}" alt=""></section>` } },
      { type: "text", data: { html: `<p>hello <img src="${IMG(6)}"/></p>` } },
    ];
    const set = collectImageUrls(blocks);
    assert.deepEqual([...set].sort(), [IMG(5), IMG(6)].sort());
  });

  test("ignores static/foreign strings that are not our upload URLs", () => {
    const set = collectImageUrls({ img: "/img/alexa.jpg", note: "https://example.com/x.jpg" });
    assert.equal(set.size, 0);
  });
});

describe("diffRemovedImages", () => {
  test("returns only URLs present before but absent after", () => {
    const removed = diffRemovedImages({ img: IMG(1), images: [IMG(2)] }, { img: IMG(2), images: [] });
    assert.deepEqual(removed, [IMG(1)]);
  });
  test("returns nothing when nothing was removed", () => {
    assert.deepEqual(diffRemovedImages({ img: IMG(1) }, { img: IMG(1) }), []);
  });
});

describe("isUrlStillReferenced / deleteImageIfUnreferenced — the order-snapshot guarantee", () => {
  test("an image still on a product is referenced", async () => {
    const user = await makeUser();
    const p = await makeProduct({ user: user._id, img: IMG(10) });
    assert.equal(await isUrlStillReferenced(IMG(10)), true);
    await p.deleteOne();
  });

  test("an image the PRODUCT no longer uses, but a PAST ORDER still snapshots, is still referenced", async () => {
    const user = await makeUser();
    const replaced = IMG(20);
    await Order.create({
      orderItems: [{ name: "Margherita", qty: 1, image: replaced, price: 8, product: user._id }],
      paymentMethod: "Contanti",
      itemsPrice: 8,
      totalPrice: 8,
    });
    // The product itself has since moved on to a different cover photo — no
    // product/page references `replaced` any more, only the historical order.
    await makeProduct({ user: user._id, img: IMG(21) });

    assert.equal(await isUrlStillReferenced(replaced), true);

    // The job handler must therefore refuse to delete it, and must not even
    // attempt a real S3 call while refusing (no injected client needed/used).
    await assert.doesNotReject(deleteImageIfUnreferenced({ url: replaced }));
  });

  test("an image with no reference anywhere is deleted via the injected client", async () => {
    const orphan = IMG(30);
    const sent = [];
    const s3 = {
      client: { send: async (cmd) => { sent.push(cmd); return {}; } },
      DeleteObjectCommand: class DeleteObjectCommand {
        constructor(input) { this.input = input; }
      },
    };
    assert.equal(await isUrlStillReferenced(orphan), false);
    await deleteImageIfUnreferenced({ url: orphan, s3 });
    assert.equal(sent.length, 1);
    assert.equal(sent[0].input.Key, "products/img-30.webp");
  });
});

describe("collectReferencedImageUrls", () => {
  test("aggregates products + pages + order snapshots into one set", async () => {
    const user = await makeUser();
    await makeProduct({ user: user._id, img: IMG(40) });
    await Page.create({
      title: "T",
      slug: `s-${Date.now()}`,
      featuredImage: IMG(41),
      blocks: [{ id: "1", type: "hero", data: { image: { url: IMG(42) } } }],
    });
    await Order.create({
      orderItems: [{ name: "X", qty: 1, image: IMG(43), price: 1, product: user._id }],
      paymentMethod: "Contanti",
      itemsPrice: 1,
      totalPrice: 1,
    });

    const refs = await collectReferencedImageUrls();
    for (const url of [IMG(40), IMG(41), IMG(42), IMG(43)]) {
      assert.ok(refs.has(url), `expected ${url} to be referenced`);
    }
  });
});

describe("reconcileImageStorage", () => {
  const listResponse = (keys, ageHours) => ({
    Contents: keys.map((Key) => ({
      Key,
      LastModified: new Date(Date.now() - ageHours * 3600 * 1000),
    })),
    IsTruncated: false,
  });

  test("dry-run: reports orphans but sends no DeleteObjectCommand", async () => {
    const user = await makeUser();
    await makeProduct({ user: user._id, img: IMG(50) }); // referenced — must survive

    const sent = [];
    const s3 = {
      client: {
        send: async (cmd) => {
          sent.push(cmd);
          if (cmd instanceof s3.ListObjectsV2Command) {
            return listResponse(["products/img-50.webp", "products/orphan-old.webp"], 200); // both old enough
          }
          return {};
        },
      },
      ListObjectsV2Command: class ListObjectsV2Command {
        constructor(input) { this.input = input; }
      },
      DeleteObjectCommand: class DeleteObjectCommand {
        constructor(input) { this.input = input; }
      },
    };

    const summary = await reconcileImageStorage({ dryRun: true, safetyHours: 48, s3 });
    assert.equal(summary.scanned, 2);
    assert.equal(summary.orphans, 1);
    assert.equal(summary.deleted, 0);
    assert.ok(!sent.some((c) => c instanceof s3.DeleteObjectCommand), "dry-run must never delete");
  });

  test("real mode: deletes only unreferenced objects older than the safety window", async () => {
    const user = await makeUser();
    await makeProduct({ user: user._id, img: IMG(60) }); // referenced

    const deletedKeys = [];
    const s3 = {
      client: {
        send: async (cmd) => {
          if (cmd instanceof s3.ListObjectsV2Command) {
            return {
              Contents: [
                { Key: "products/img-60.webp", LastModified: new Date(Date.now() - 200 * 3600 * 1000) }, // referenced
                { Key: "products/orphan-old.webp", LastModified: new Date(Date.now() - 200 * 3600 * 1000) }, // orphan, old enough
                { Key: "products/orphan-fresh.webp", LastModified: new Date() }, // orphan, but too young
              ],
              IsTruncated: false,
            };
          }
          if (cmd instanceof s3.DeleteObjectCommand) deletedKeys.push(cmd.input.Key);
          return {};
        },
      },
      ListObjectsV2Command: class ListObjectsV2Command {
        constructor(input) { this.input = input; }
      },
      DeleteObjectCommand: class DeleteObjectCommand {
        constructor(input) { this.input = input; }
      },
    };

    const summary = await reconcileImageStorage({ dryRun: false, safetyHours: 48, s3 });
    assert.equal(summary.orphans, 1);
    assert.equal(summary.deleted, 1);
    assert.equal(summary.skippedTooYoung, 1);
    assert.deepEqual(deletedKeys, ["products/orphan-old.webp"]);
  });
});
