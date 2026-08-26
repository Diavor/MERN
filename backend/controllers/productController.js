import asyncHandler from "express-async-handler";
import Product from "../models/productModel.js";

const PAGE_SIZE = 12;

// @desc     Fetch all products
// @route    GET /api/products
// @access   Public
export const getProducts = asyncHandler(async (req, res) => {
  const page = Number(req.query.pageNumber) || 1;
  const keyword = req.query.keyword
    ? {
        $or: [
          { name: { $regex: req.query.keyword, $options: "i" } },
          { brand: { $regex: req.query.keyword, $options: "i" } },
        ],
      }
    : {};

  // Optional exact-category filter (e.g. "Bevande") used by the menu tabs and
  // the admin catalog filter.
  const category =
    req.query.category && req.query.category !== "all"
      ? { category: req.query.category }
      : {};

  const filter = { ...keyword, ...category };

  const count = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .limit(PAGE_SIZE)
    .skip(PAGE_SIZE * (page - 1));

  res.json({ products, page, pages: Math.ceil(count / PAGE_SIZE) });
});

// @desc     Distinct product categories (for menu tabs + admin filter)
// @route    GET /api/products/categories
// @access   Public
export const getProductCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct("category");
  res.json(categories.filter(Boolean).sort());
});

// @desc     Fetch single product
// @route    GET /api/products/:id
// @access   Public
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc     Delete a product
// @route    DELETE /api/products/:id
// @access   Private/Admin
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    // Mongoose 7+ removed Document.prototype.remove().
    await product.deleteOne();
    res.json({ message: "Product removed" });
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc     Create a product
// @route    POST /api/products
// @access   Private/Admin
export const createProduct = asyncHandler(async (req, res) => {
  const product = new Product({
    name: "Sample name",
    price: 0,
    user: req.user._id,
    img: "/img/alexa.jpg",
    brand: "Sample brand",
    category: "Sample category",
    countInStock: 0,
    numReviews: 0,
    description: "Sample description",
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});

// @desc     Update a product
// @route    PUT /api/products/:id
// @access   Private/Admin
export const updateProduct = asyncHandler(async (req, res) => {
  const { name, price, description, img, images, brand, category, countInStock, toppings, doughVariants } =
    req.body;

  const product = await Product.findById(req.params.id);
  if (product) {
    product.name = name;
    product.price = price;
    product.description = description;
    product.img = img;
    // Gallery is optional in the payload; when sent, replace it and keep the
    // cover (img) in sync with the first photo.
    if (images !== undefined) {
      product.images = images;
      if (images.length > 0) product.img = images[0];
    }
    product.brand = brand;
    product.category = category;
    product.countInStock = countInStock;
    // Priced add-ons + dough variants are optional in the payload; only replace
    // them when the client actually sends them, so partial updates don't wipe
    // existing menu configuration.
    if (toppings !== undefined) product.toppings = toppings;
    if (doughVariants !== undefined) product.doughVariants = doughVariants;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc     Create new review
// @route    POST /api/products/:id/reviews
// @access   Private
export const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);
  if (product) {
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
      res.status(400);
      throw new Error("Product already reviewed");
    }

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ message: "Review added" });
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc     Get top rated products
// @route    GET /api/products/top
// @access   Public
export const getTopProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({}).sort({ rating: -1 }).limit(3);
  res.json(products);
});
