import type { Category, StockStatus, Unit } from "@/lib/constants";
import type { ProductView } from "@/lib/types";

export function statusOf(stock: number, reorder: number): StockStatus {
  if (Number(stock) <= 0) return "out";
  if (Number(stock) <= Number(reorder)) return "low";
  return "healthy";
}

export function statusLabel(status: StockStatus) {
  if (status === "out") return "Out of stock";
  if (status === "low") return "Low stock";
  return "Healthy";
}

export function statusClass(status: StockStatus) {
  return `status--${status}`;
}

export function categoryClass(category: string) {
  const slug = String(category).toLowerCase().replace(/[^a-z]/g, "");
  const known = new Set([
    "audio",
    "workspace",
    "accessories",
    "lighting",
    "storage",
    "furniture",
    "crockery",
    "painting",
    "security",
    "stationery"
  ]);
  return known.has(slug) ? slug : "storage";
}

export function initials(name: string) {
  return String(name)
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] || "")
    .join("")
    .toUpperCase();
}

export function railMetrics(stock: number, reorder: number) {
  const safeReorder = Math.max(1, Number(reorder));
  const max = Math.max(safeReorder * 2.4, Number(stock), 1);
  return {
    fill: Math.max(0, Math.min(100, (Number(stock) / max) * 100)),
    tick: Math.max(0, Math.min(100, (safeReorder / max) * 100))
  };
}

export function toProductView(product: {
  id: string;
  name: string;
  sku: string;
  category: string;
  supplierId: string;
  supplier: { name: string };
  unit: string;
  costCents: number;
  priceCents: number;
  stock: number;
  reorder: number;
  updatedAt: Date;
}): ProductView {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    category: product.category as Category,
    supplierId: product.supplierId,
    supplierName: product.supplier.name,
    unit: product.unit as Unit,
    costCents: product.costCents,
    priceCents: product.priceCents,
    stock: product.stock,
    reorder: product.reorder,
    updatedAt: product.updatedAt.toISOString(),
    status: statusOf(product.stock, product.reorder)
  };
}
