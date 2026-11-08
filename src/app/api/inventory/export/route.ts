import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getInventoryExport } from "@/lib/queries";
import { inventoryFilterSchema } from "@/lib/validation";
import { statusLabel } from "@/lib/products";

export const dynamic = "force-dynamic";

function csvCell(value: string | number) {
  let text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = inventoryFilterSchema.safeParse({ ...raw, page: "1" });
  if (!parsed.success) {
    return new Response("Invalid filters", { status: 400 });
  }

  const products = await getInventoryExport(parsed.data);
  if (!products.length) {
    return new Response("No products match those filters.", { status: 404 });
  }

  const header = [
    "Product",
    "SKU",
    "Category",
    "Supplier",
    "Unit",
    "On hand",
    "Reorder point",
    "Unit cost",
    "Sale price",
    "Stock value",
    "Status"
  ];

  const rows = products.map((product) =>
    [
      csvCell(product.name),
      csvCell(product.sku),
      csvCell(product.category),
      csvCell(product.supplierName),
      csvCell(product.unit),
      product.stock,
      product.reorder,
      (product.costCents / 100).toFixed(2),
      (product.priceCents / 100).toFixed(2),
      ((product.stock * product.costCents) / 100).toFixed(2),
      csvCell(statusLabel(product.status))
    ].join(",")
  );

  const csv = `\ufeff${header.join(",")}\r\n${rows.join("\r\n")}\r\n`;
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="stock-management-inventory-${stamp}.csv"`,
      "Cache-Control": "no-store"
    }
  });
}
