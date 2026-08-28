import env from "../config/env.js";
import logger from "../utils/logger.js";
import {
  deleteUpload,
  getS3,
  isOurUploadUrl,
  publicUrlForKey,
} from "./storage.service.js";
import Product from "../models/productModel.js";
import Page from "../models/pageModel.js";
import Order from "../models/orderModel.js";

// Orphan detection and deletion for uploaded images. Two independent
// mechanisms feed into the same safe-delete primitive (deleteUpload):
//
//  1. Targeted, event-driven cleanup — a controller diffs old vs. new image
//     URLs on update/delete and enqueues JOB.DELETE_IMAGE for whatever's no
//     longer referenced BY THAT DOCUMENT. See productController.js /
//     pageController.js.
//  2. A weekly reconciliation sweep (JOB.RECONCILE_IMAGES) — the safety net
//     for anything (1) misses: a crash between the DB write and the enqueue,
//     a manual DB edit, a bug.
//
// Both must agree on one hard rule: an image is never deleted while ANY
// document anywhere still references it — most importantly `Order.orderItems
// [].image`, which is a permanent historical SNAPSHOT taken at checkout time
// and stays valid long after a product's own `img` has moved on. Product
// controller code intentionally does NOT get to unilaterally decide an image
// is safe to delete; deleteImageIfUnreferenced() re-checks against the
// database itself, right before the irreversible delete.

const uploadPrefix = () =>
  env.STORAGE_DRIVER === "s3" ? env.S3_PUBLIC_URL?.replace(/\/+$/, "") : "/uploads/";

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Recursively walk an arbitrary JSON-ish value — a page's `blocks` array, a
 * product doc, anything — collecting every string that looks like one of our
 * upload URLs into `sink`.
 *
 * This exists instead of a fixed list of field paths because CMS page blocks
 * store media in `data`, a `Mixed`/free-form field whose shape differs per
 * block type (`{url,name,dim}` objects nested at different depths for hero /
 * image / gallery / columns blocks — see frontend/src/brace/admin/pageBlocks.js),
 * AND two block types (`html`, `text`) can embed raw `<img src="...">` inside
 * a plain HTML string. A generic recursive scan — match a whole string
 * exactly, or extract the prefix + trailing non-delimiter run from inside a
 * longer string — covers every current shape and any new block type the
 * registry grows later, with no changes needed here.
 */
export const collectImageUrls = (value, sink = new Set()) => {
  const prefix = uploadPrefix();
  if (value == null || !prefix) return sink;

  // Mongoose documents/subdocuments expose their fields via prototype getters,
  // so Object.values() on one yields internals ($__, _doc, …) and NOT the
  // schema fields — silently missing every nested block image. Normalize to a
  // plain object first. (Callers using .lean() are already plain; this is for
  // the controllers, which hold real documents.)
  if (typeof value.toObject === "function") {
    return collectImageUrls(value.toObject(), sink);
  }

  if (typeof value === "string") {
    if (isOurUploadUrl(value)) {
      sink.add(value);
    } else if (value.includes(prefix)) {
      const re = new RegExp(escapeRegExp(prefix) + `[^"'\\s)>]*`, "g");
      for (const m of value.matchAll(re)) sink.add(m[0]);
    }
    return sink;
  }
  if (Array.isArray(value)) {
    value.forEach((v) => collectImageUrls(v, sink));
    return sink;
  }
  if (typeof value === "object") {
    Object.values(value).forEach((v) => collectImageUrls(v, sink));
    return sink;
  }
  return sink;
};

/** Every referenced-image URL removed from `before` but not present in `after`. */
export const diffRemovedImages = (before, after) => {
  const afterSet = collectImageUrls(after);
  return [...collectImageUrls(before)].filter((u) => !afterSet.has(u));
};

/**
 * Authoritative "is it safe to delete this URL right now" check — scans every
 * collection that can hold an image reference. Product/page structured fields
 * are checked with a targeted query first (cheap, covers the common case);
 * page `blocks` (free-form) fall back to an in-memory scan of all pages —
 * acceptable for a single-restaurant CMS's page count, and this only runs
 * once per URL right before an irreversible delete, so correctness matters
 * far more than shaving a query.
 */
export const isUrlStillReferenced = async (url) => {
  const [inProduct, inPageField, inOrder] = await Promise.all([
    Product.exists({ $or: [{ img: url }, { images: url }] }),
    Page.exists({ $or: [{ featuredImage: url }, { "seo.ogImage": url }] }),
    Order.exists({ "orderItems.image": url }),
  ]);
  if (inProduct || inPageField || inOrder) return true;

  const pages = await Page.find({}, "blocks").lean();
  return pages.some((p) => collectImageUrls(p.blocks).has(url));
};

/**
 * JOB.DELETE_IMAGE handler: delete a URL only if nothing references it.
 * @param {{ url: string, s3?: object }} data  `s3` is an injection point for
 *   tests, forwarded to deleteUpload (matches its own `{ s3 }` pattern).
 */
export const deleteImageIfUnreferenced = async ({ url, s3 } = {}) => {
  if (!url || !isOurUploadUrl(url)) return;
  if (await isUrlStillReferenced(url)) {
    logger.info({ url }, "Skipping image delete — still referenced elsewhere");
    return;
  }
  await deleteUpload(url, { s3 });
};

/** Every image URL currently referenced across the whole database. */
export const collectReferencedImageUrls = async () => {
  const [products, pages, orders] = await Promise.all([
    Product.find({}, "img images").lean(),
    Page.find({}, "featuredImage seo blocks").lean(),
    Order.find({}, "orderItems.image").lean(),
  ]);
  const sink = new Set();
  for (const p of products) {
    collectImageUrls(p.img, sink);
    collectImageUrls(p.images, sink);
  }
  for (const pg of pages) {
    collectImageUrls(pg.featuredImage, sink);
    collectImageUrls(pg.seo, sink);
    collectImageUrls(pg.blocks, sink);
  }
  for (const o of orders) collectImageUrls(o.orderItems, sink);
  return sink;
};

const BUCKET_PREFIX = "products/"; // the only key prefix persistUpload ever writes under

/**
 * JOB.RECONCILE_IMAGES handler — safety net for orphaned R2 objects that (1)'s
 * event-driven cleanup missed. Lists every object in the bucket, diffs
 * against every reference in Mongo, and deletes objects that are BOTH
 * unreferenced AND older than `safetyHours` (never younger, regardless of
 * reference state — an upload mid-flight, or a reference not yet committed,
 * must never race a delete).
 *
 * No-ops on the local driver: local disk isn't the storage-cost problem this
 * exists for (see the file header of storage.service.js), and reconciling it
 * would mean walking the local filesystem instead of an S3 ListObjects call —
 * a different, unneeded mechanism for a cost that doesn't apply locally.
 *
 * @param {{ dryRun?: boolean, safetyHours?: number, s3?: object }} [opts]
 *   `s3` is an injection point for tests (a fake `{ client, ListObjectsV2Command,
 *   DeleteObjectCommand }`), matching deleteUpload's pattern.
 */
export const reconcileImageStorage = async ({
  dryRun = env.IMAGE_RECONCILE_DRY_RUN,
  safetyHours = env.IMAGE_RECONCILE_SAFETY_HOURS,
  s3,
} = {}) => {
  if (env.STORAGE_DRIVER !== "s3") {
    logger.info(
      "Image reconciliation skipped — STORAGE_DRIVER is not s3 (local disk isn't the storage-cost concern this job exists for)"
    );
    return { skipped: true, scanned: 0, orphans: 0, deleted: 0 };
  }

  const referenced = await collectReferencedImageUrls();
  const cutoff = Date.now() - safetyHours * 3600 * 1000;
  const { client, ListObjectsV2Command, DeleteObjectCommand } = s3 || (await getS3());

  let scanned = 0;
  let orphans = 0;
  let deleted = 0;
  let skippedTooYoung = 0;
  const errors = [];

  let ContinuationToken;
  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: env.S3_BUCKET,
        Prefix: BUCKET_PREFIX,
        ContinuationToken,
      })
    );
    for (const obj of page.Contents || []) {
      scanned++;
      const url = publicUrlForKey(obj.Key);
      if (referenced.has(url)) continue;

      const age = obj.LastModified
        ? Date.now() - new Date(obj.LastModified).getTime()
        : Infinity;
      if (age < safetyHours * 3600 * 1000) {
        skippedTooYoung++;
        continue;
      }

      orphans++;
      if (dryRun) {
        logger.info({ key: obj.Key, url }, "[dry-run] would delete orphaned image");
        continue;
      }
      try {
        await client.send(
          new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: obj.Key })
        );
        deleted++;
      } catch (err) {
        errors.push({ key: obj.Key, error: err.message });
      }
    }
    ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (ContinuationToken);

  const summary = {
    scanned,
    orphans,
    deleted,
    skippedTooYoung,
    dryRun,
    errors: errors.length,
    cutoff: new Date(cutoff).toISOString(),
  };
  logger.info(summary, "Image reconciliation complete");
  if (errors.length)
    logger.warn({ errors }, "Image reconciliation: some deletes failed");
  return summary;
};
