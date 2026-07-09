import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const money = z.number().nonnegative();

const toppingSchema = z.object({
  name: z.string(),
  price: money,
});

const orderItemSchema = z.object({
  name: z.string().min(1),
  qty: z.number().int().positive(),
  image: z.string().min(1),
  price: money,
  toppings: z.array(toppingSchema).optional().default([]),
  product: objectId,
});

// Snapshot of where/how the order is fulfilled. Kept permissive (many optional
// fields) to match the existing checkout contract, but typed and bounded.
const shippingAddressSchema = z
  .object({
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    orderType: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    street: z.string().optional(),
    buildingNumber: z.string().optional(),
    floor: z.string().optional(),
    deliveryDate: z.string().optional(),
    deliverySlot: z.string().optional(),
    deliveryPrice: z.number().optional(),
    notes: z.string().max(1000).optional(),
  })
  .passthrough();

export const createOrderSchema = z.object({
  orderItems: z.array(orderItemSchema).min(1, "No order items"),
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.string().min(1, "Payment method is required"),
  itemsNum: z.number().int().nonnegative().optional(),
  itemsPrice: money,
  taxPrice: money.optional().default(0),
  shippingPrice: money.optional().default(0),
  totalPrice: money,
});

export const orderIdParams = z.object({ id: objectId });

// Payment confirmation body — all optional (manual/cash payments send little).
export const payOrderSchema = z
  .object({
    id: z.string().optional(),
    status: z.string().optional(),
    update_time: z.string().optional(),
    payer: z.object({ email_address: z.string().optional() }).optional(),
  })
  .passthrough();
