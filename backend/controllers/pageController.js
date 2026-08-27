import asyncHandler from "express-async-handler";
import Page from "../models/pageModel.js";

const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

// @desc     List pages (admin — all statuses)
// @route    GET /api/pages
// @access   Private/Admin
export const getPages = asyncHandler(async (req, res) => {
  const pages = await Page.find({}).sort({ updatedAt: -1 });
  res.json(pages);
});

// @desc     Fetch a published page by slug (storefront)
// @route    GET /api/pages/slug/:slug
// @access   Public
export const getPageBySlug = asyncHandler(async (req, res) => {
  const page = await Page.findOne({ slug: req.params.slug, status: "published" });

  // A page is publicly readable only when it's published AND its visibility
  // allows it right now:
  //   • public    — always visible
  //   • private   — never served on the storefront (admin/preview only)
  //   • scheduled — visible only once publishDate has passed
  // Anything else is indistinguishable from "not found" to the public.
  const isPublic =
    page &&
    (page.visibility === "public" ||
      !page.visibility ||
      (page.visibility === "scheduled" &&
        page.publishDate &&
        new Date(page.publishDate).getTime() <= Date.now()));

  if (isPublic) {
    res.json(page);
  } else {
    res.status(404);
    throw new Error("Page not found");
  }
});

// @desc     Fetch a page by id (admin editor)
// @route    GET /api/pages/:id
// @access   Private/Admin
export const getPageById = asyncHandler(async (req, res) => {
  const page = await Page.findById(req.params.id);
  if (page) {
    res.json(page);
  } else {
    res.status(404);
    throw new Error("Page not found");
  }
});

// @desc     Create a page
// @route    POST /api/pages
// @access   Private/Admin
export const createPage = asyncHandler(async (req, res) => {
  const title = req.body.title || "Pagina senza titolo";
  let slug = req.body.slug ? slugify(req.body.slug) : slugify(title) || "pagina";
  // Ensure slug uniqueness by suffixing when needed.
  let candidate = slug;
  let n = 1;
  while (await Page.findOne({ slug: candidate })) {
    candidate = `${slug}-${n++}`;
  }
  const page = new Page({
    ...req.body,
    title,
    slug: candidate,
    user: req.user._id,
  });
  const created = await page.save();
  res.status(201).json(created);
});

// @desc     Update a page
// @route    PUT /api/pages/:id
// @access   Private/Admin
export const updatePage = asyncHandler(async (req, res) => {
  const page = await Page.findById(req.params.id);
  if (!page) {
    res.status(404);
    throw new Error("Page not found");
  }
  const fields = [
    "title",
    "status",
    "visibility",
    "publishDate",
    "featuredImage",
    "blocks",
    "seo",
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) page[f] = req.body[f];
  });
  if (req.body.slug !== undefined) {
    const slug = slugify(req.body.slug);
    if (slug && slug !== page.slug) {
      const clash = await Page.findOne({ slug, _id: { $ne: page._id } });
      if (clash) {
        res.status(400);
        throw new Error("Slug già in uso");
      }
      page.slug = slug;
    }
  }
  const updated = await page.save();
  res.json(updated);
});

// @desc     Delete a page
// @route    DELETE /api/pages/:id
// @access   Private/Admin
export const deletePage = asyncHandler(async (req, res) => {
  const page = await Page.findById(req.params.id);
  if (!page) {
    res.status(404);
    throw new Error("Page not found");
  }
  await page.deleteOne();
  res.json({ message: "Page removed" });
});
