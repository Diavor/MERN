import { z } from "zod";

const email = z.string().trim().toLowerCase().email("A valid email is required");

// Password policy: length is the dominant strength factor; require a mix without
// being hostile. Enforced on register and password change.
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(200)
  .refine((v) => /[a-zA-Z]/.test(v) && /[0-9]/.test(v), {
    message: "Password must contain letters and numbers",
  });

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email,
  password,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: email.optional(),
  password: password.optional(),
});

export const adminUpdateUserSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: email.optional(),
  isAdmin: z.boolean().optional(),
});
