import { z } from "zod";
import { CATEGORIES, INVENTORY_SORTS, UNITS } from "@/lib/constants";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Enter your username.").max(40),
  password: z.string().min(1, "Enter your password.").max(128)
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password.").max(128),
    newPassword: z
      .string()
      .min(12, "Use at least 12 characters.")
      .max(128, "Use 128 characters or fewer.")
      .regex(/[A-Za-z]/, "Include at least one letter.")
      .regex(/[0-9]/, "Include at least one number."),
    confirmPassword: z.string().min(1, "Confirm the new password.").max(128)
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "The new passwords do not match."
  });

export const productSchema = z.object({
  name: z.string().trim().min(2, "Give the product a name.").max(80, "Use 80 characters or fewer."),
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .min(3, "Enter a SKU.")
    .max(24, "Use 24 characters or fewer.")
    .regex(/^[A-Z0-9][A-Z0-9-]*$/, "Use letters, numbers, and hyphens only."),
  category: z.enum(CATEGORIES, { message: "Choose a category." }),
  supplierId: z.string().min(1, "Choose a supplier."),
  unit: z.enum(UNITS, { message: "Choose a unit." }),
  cost: z.coerce.number().min(0, "Enter a cost of 0 or more.").max(1_000_000, "Cost is too large."),
  price: z.coerce.number().min(0, "Enter a price of 0 or more.").max(1_000_000, "Price is too large."),
  openingStock: z.coerce.number().int("Use a whole number.").min(0, "Stock cannot be negative.").max(1_000_000).default(0),
  reorder: z.coerce.number().int("Use a whole number.").min(0, "Reorder point cannot be negative.").max(1_000_000)
});

export const updateProductSchema = productSchema.omit({ openingStock: true });

export const adjustSchema = z.object({
  productId: z.string().min(1, "Choose a product."),
  type: z.enum(["in", "out", "set"], { message: "Choose a movement type." }),
  qty: z.coerce.number().int("Use a whole number.").min(0, "Quantity cannot be negative.").max(1_000_000, "Quantity is too large."),
  reference: z.string().trim().max(24, "Use 24 characters or fewer.").optional().default(""),
  note: z.string().trim().max(80, "Use 80 characters or fewer.").optional().default("")
});

export const inventoryFilterSchema = z.object({
  q: z.string().trim().max(100).catch(""),
  category: z.string().trim().max(40).catch("all"),
  supplier: z.string().trim().max(40).catch("all"),
  status: z.enum(["all", "attention", "healthy", "low", "out"]).catch("all"),
  sort: z.enum(INVENTORY_SORTS).catch("name"),
  dir: z.enum(["asc", "desc"]).catch("asc"),
  page: z.coerce.number().int().min(1).max(10_000).catch(1)
});

export const movementFilterSchema = z.object({
  q: z.string().trim().max(100).catch(""),
  type: z.enum(["all", "in", "out", "adjust"]).catch("all"),
  page: z.coerce.number().int().min(1).max(10_000).catch(1)
});

const masterStatusSchema = z.enum(["all", "needs", "ready"]).catch("all");

export const centreFilterSchema = z.object({
  q: z.string().trim().max(100).catch(""),
  status: masterStatusSchema,
  type: z.enum(["all", "Centre", "SubCentre", "Point"]).catch("all")
});

export const itemFilterSchema = z.object({
  q: z.string().trim().max(100).catch(""),
  status: masterStatusSchema
});

export const departmentFilterSchema = z.object({
  q: z.string().trim().max(100).catch(""),
  status: masterStatusSchema
});

export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}

export function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
