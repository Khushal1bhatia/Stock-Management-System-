"use server";

import { randomInt } from "node:crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { writeAudit } from "@/lib/audit";
import { getRequestMeta } from "@/lib/request";
import { formString, productSchema, adjustSchema, zodFieldErrors } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

function toCents(value: number) {
  return Math.round(value * 100);
}

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function saveProductAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Your session has expired. Sign in again." };

  const id = formString(formData, "id").trim();
  const isEdit = Boolean(id);
  const raw = {
    name: formString(formData, "name"),
    sku: formString(formData, "sku"),
    category: formString(formData, "category"),
    supplierId: formString(formData, "supplierId"),
    unit: formString(formData, "unit"),
    cost: formString(formData, "cost"),
    price: formString(formData, "price"),
    openingStock: formString(formData, "openingStock") || "0",
    reorder: formString(formData, "reorder")
  };

  // The opening stock field is ignored for edits; stock only changes through
  // the adjustment action below so every change produces a movement record.
  const parsed = productSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      error: "Check the highlighted fields and try again.",
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  const data = parsed.data;
  const supplier = await prisma.supplier.findUnique({ where: { id: data.supplierId }, select: { id: true, name: true } });
  if (!supplier) {
    return { ok: false, error: "Choose a valid supplier.", fieldErrors: { supplierId: "That supplier is not available." } };
  }

  const duplicate = await prisma.product.findFirst({
    where: { sku: data.sku, ...(isEdit ? { id: { not: id } } : {}) },
    select: { id: true }
  });
  if (duplicate) {
    return { ok: false, error: "That SKU is already in use.", fieldErrors: { sku: "That SKU is already in use." } };
  }

  const meta = await getRequestMeta();

  try {
    if (isEdit) {
      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) return { ok: false, error: "This product no longer exists." };

      await prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id },
          data: {
            name: data.name,
            sku: data.sku,
            category: data.category,
            supplierId: data.supplierId,
            unit: data.unit,
            costCents: toCents(data.cost),
            priceCents: toCents(data.price),
            reorder: data.reorder
          }
        });
        await writeAudit(
          {
            actorId: user.id,
            actorName: user.name,
            action: "PRODUCT_UPDATED",
            entityType: "Product",
            entityId: id,
            detail: `${data.name} (${data.sku}) updated. Stock unchanged at ${existing.stock}.`,
            ipAddress: meta.ipAddress
          },
          tx
        );
      }, { timeout: 10_000 });

      revalidatePath("/", "layout");
      return { ok: true, message: `${data.name} updated.` };
    }

    const created = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: data.name,
          sku: data.sku,
          category: data.category,
          supplierId: data.supplierId,
          unit: data.unit,
          costCents: toCents(data.cost),
          priceCents: toCents(data.price),
          stock: data.openingStock,
          reorder: data.reorder
        }
      });

      if (data.openingStock > 0) {
        await tx.movement.create({
          data: {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            unit: product.unit,
            type: "in",
            qty: data.openingStock,
            reference: "OPENING",
            note: "Opening stock",
            actorId: user.id,
            actorName: user.name
          }
        });
      }

      await writeAudit(
        {
          actorId: user.id,
          actorName: user.name,
          action: "PRODUCT_CREATED",
          entityType: "Product",
          entityId: product.id,
          detail: `${data.name} (${data.sku}) created with ${data.openingStock} opening stock.`,
          ipAddress: meta.ipAddress
        },
        tx
      );

      return product;
    }, { timeout: 10_000 });

    revalidatePath("/", "layout");
    return { ok: true, message: `${created.name} added with ${created.stock} ${created.unit} on hand.` };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: false, error: "That SKU is already in use.", fieldErrors: { sku: "That SKU is already in use." } };
    }
    console.error("saveProductAction failed", error);
    return { ok: false, error: "The product could not be saved. Try again." };
  }
}

export async function deleteProductAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Your session has expired. Sign in again." };
  if (user.role !== "ADMIN") return { ok: false, error: "Only administrators can delete products." };

  const id = formString(formData, "id").trim();
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return { ok: false, error: "This product no longer exists." };

  const meta = await getRequestMeta();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.delete({ where: { id } });
      await writeAudit(
        {
          actorId: user.id,
          actorName: user.name,
          action: "PRODUCT_DELETED",
          entityType: "Product",
          entityId: id,
          detail: `${product.name} (${product.sku}) removed. Movement history retained.`,
          ipAddress: meta.ipAddress
        },
        tx
      );
    }, { timeout: 10_000 });
  } catch (error) {
    console.error("deleteProductAction failed", error);
    return { ok: false, error: "The product could not be removed. Try again." };
  }

  revalidatePath("/", "layout");
  return { ok: true, message: `${product.name} removed. Movement history retained.` };
}

export async function adjustStockAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Your session has expired. Sign in again." };

  const parsed = adjustSchema.safeParse({
    productId: formString(formData, "productId"),
    type: formString(formData, "type"),
    qty: formString(formData, "qty"),
    reference: formString(formData, "reference"),
    note: formString(formData, "note")
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Check the quantity and try again.",
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  const input = parsed.data;
  const meta = await getRequestMeta();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: input.productId } });
      if (!product) return { ok: false as const, error: "This product no longer exists." };

      let delta: number;
      if (input.type === "in") {
        if (input.qty <= 0) return { ok: false as const, error: "Quantity must be greater than zero.", field: "qty" };
        delta = input.qty;
      } else if (input.type === "out") {
        if (input.qty <= 0) return { ok: false as const, error: "Quantity must be greater than zero.", field: "qty" };
        if (input.qty > product.stock) {
          return { ok: false as const, error: `Only ${product.stock} ${product.unit} on hand.`, field: "qty" };
        }
        delta = -input.qty;
      } else {
        delta = input.qty - product.stock;
        if (delta === 0) {
          return { ok: false as const, error: "This count matches the current stock, so there is nothing to record.", field: "qty" };
        }
      }

      const update = await tx.product.updateMany({
        where: {
          id: product.id,
          ...(input.type === "out" ? { stock: { gte: input.qty } } : {}),
          ...(input.type === "set" ? { stock: product.stock } : {})
        },
        data: {
          stock: { increment: delta },
          updatedAt: new Date()
        }
      });

      if (update.count !== 1) {
        return { ok: false as const, error: "Stock changed while you were editing. Refresh and try again." };
      }

      const updated = await tx.product.findUnique({ where: { id: product.id } });
      if (!updated) return { ok: false as const, error: "This product no longer exists." };

      const prefix = input.type === "in" ? "PO" : input.type === "out" ? "SO" : "COUNT";
      const reference = input.reference || `${prefix}-${randomInt(1000, 10000)}`;
      const defaultNote = input.type === "in" ? "Stock received" : input.type === "out" ? "Stock dispatched" : "Physical count";
      const movementType = input.type === "set" ? "adjust" : input.type;

      await tx.movement.create({
        data: {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          unit: product.unit,
          type: movementType,
          qty: delta,
          reference,
          note: input.note || defaultNote,
          actorId: user.id,
          actorName: user.name
        }
      });

      await writeAudit(
        {
          actorId: user.id,
          actorName: user.name,
          action: input.type === "set" ? "STOCK_COUNTED" : input.type === "in" ? "STOCK_RECEIVED" : "STOCK_DISPATCHED",
          entityType: "Product",
          entityId: product.id,
          detail: `${product.name} (${product.sku}): ${delta > 0 ? "+" : ""}${delta} ${product.unit} → ${updated.stock}. Ref ${reference}.`,
          ipAddress: meta.ipAddress
        },
        tx
      );

      return { ok: true as const, name: product.name, unit: product.unit, delta, newStock: updated.stock };
    }, { timeout: 10_000 });

    if (!result.ok) {
      return {
        ok: false,
        error: result.error,
        fieldErrors: "field" in result && result.field ? { [result.field]: result.error } : undefined
      };
    }

    revalidatePath("/", "layout");
    const sign = result.delta > 0 ? "+" : "−";
    return {
      ok: true,
      message: `${result.name} · ${sign}${Math.abs(result.delta)} ${result.unit} · ${result.newStock} on hand`
    };
  } catch (error) {
    console.error("adjustStockAction failed", error);
    return { ok: false, error: "The stock movement could not be recorded. Try again." };
  }
}
