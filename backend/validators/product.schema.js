import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const productIdParams = z.object({ id: objectId });

export const listProductsQuery = z.object({
  keyword: z.string().max(120).optional(),
  pageNumber: z.coerce.number().int().positive().optional(),
  category: z.string().max(60).optional(),
});

// A priced add-on (topping) or dough variant. Same shape in both cases.
const variantInput = z.object({
  name: z.string().trim().min(1).max(120),
  price: z.coerce.number().nonnegative(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200),
  price: z.coerce.number().nonnegative(),
  description: z.string().min(1),
  img: z.string().min(1),
  // Optional gallery; when present it replaces the stored array wholesale.
  images: z.array(z.string().min(1)).max(12).optional(),
  brand: z.string().min(1),
  category: z.string().min(1),
  countInStock: z.coerce.number().int().nonnegative(),
  // Optional so callers that don't manage add-ons leave the existing arrays
  // untouched; when present, they replace the stored arrays wholesale.
  toppings: z.array(variantInput).max(50).optional(),
  doughVariants: z.array(variantInput).max(50).optional(),
});

export const createReviewSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().trim().min(1, "Comment is required").max(2000),
});
