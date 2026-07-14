import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const productIdParams = z.object({ id: objectId });

export const listProductsQuery = z.object({
  keyword: z.string().max(120).optional(),
  pageNumber: z.coerce.number().int().positive().optional(),
  category: z.string().max(60).optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200),
  price: z.coerce.number().nonnegative(),
  description: z.string().min(1),
  img: z.string().min(1),
  brand: z.string().min(1),
  category: z.string().min(1),
  countInStock: z.coerce.number().int().nonnegative(),
});

export const createReviewSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().trim().min(1, "Comment is required").max(2000),
});
