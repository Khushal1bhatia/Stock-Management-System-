import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCatalog, getSupplierOptions } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [products, suppliers] = await Promise.all([getCatalog(), getSupplierOptions()]);

  return NextResponse.json(
    { products, suppliers },
    { headers: { "Cache-Control": "no-store" } }
  );
}
