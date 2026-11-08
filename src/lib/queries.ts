import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { PAGE_SIZE } from "@/lib/constants";
import type { Category, MovementType, Unit } from "@/lib/constants";
import { statusOf, toProductView } from "@/lib/products";
import type {
  CatalogOption,
  CategoryBreakdown,
  Flow,
  InventoryData,
  InventoryFilters,
  MovementData,
  MovementFilters,
  MovementView,
  OverviewData,
  ProductView,
  Stats,
  SupplierData,
  SupplierView
} from "@/lib/types";

const productInclude = {
  supplier: { select: { name: true } }
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;
type MovementRow = Prisma.MovementGetPayload<Record<string, never>>;
type ProductSummary = {
  stock: number;
  reorder: number;
  costCents: number;
  priceCents: number;
  category: string;
  supplierId: string;
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysAgoStart(days: number) {
  const date = startOfDay(new Date());
  date.setDate(date.getDate() - days);
  return date;
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function buildStats(products: ProductSummary[]): Stats {
  let units = 0;
  let valueCents = 0;
  let retailCents = 0;
  let low = 0;
  let out = 0;
  const categories = new Set<string>();
  const suppliers = new Set<string>();

  for (const product of products) {
    units += product.stock;
    valueCents += product.stock * product.costCents;
    retailCents += product.stock * product.priceCents;
    const status = statusOf(product.stock, product.reorder);
    if (status === "low") low += 1;
    if (status === "out") out += 1;
    categories.add(product.category);
    suppliers.add(product.supplierId);
  }

  return {
    skus: products.length,
    units,
    valueCents,
    retailCents,
    low,
    out,
    attention: low + out,
    categories: categories.size,
    suppliers: suppliers.size
  };
}

function sortAttention(products: ProductRow[]) {
  return products
    .filter((product) => statusOf(product.stock, product.reorder) !== "healthy")
    .sort((a, b) => {
      const aStatus = statusOf(a.stock, a.reorder);
      const bStatus = statusOf(b.stock, b.reorder);
      if (aStatus === "out" && bStatus !== "out") return -1;
      if (bStatus === "out" && aStatus !== "out") return 1;
      const aRatio = a.stock / Math.max(1, a.reorder);
      const bRatio = b.stock / Math.max(1, b.reorder);
      return aRatio - bRatio || a.name.localeCompare(b.name);
    });
}

function normalizedType(type: string): string {
  return type.toLowerCase();
}

function buildFlow(rows: Array<{ type: string; qty: number; createdAt: Date }>): Flow {
  const days = [];
  const now = new Date();

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
    days.push({
      key: dayKey(date),
      label: offset === 0 ? "Today" : weekday,
      dateLabel: offset === 0 ? "Today" : `${weekday} ${date.getDate()}`,
      received: 0,
      dispatched: 0
    });
  }

  const lookup = new Map(days.map((day) => [day.key, day]));

  for (const row of rows) {
    const bucket = lookup.get(dayKey(row.createdAt));
    if (!bucket) continue;
    const type = normalizedType(row.type);
    if (type === "in") bucket.received += Math.abs(row.qty);
    if (type === "out") bucket.dispatched += Math.abs(row.qty);
  }

  const totalIn = days.reduce((total, day) => total + day.received, 0);
  const totalOut = days.reduce((total, day) => total + day.dispatched, 0);

  return { days, totalIn, totalOut, net: totalIn - totalOut };
}

function buildCategories(products: ProductRow[]): CategoryBreakdown[] {
  const map = new Map<string, CategoryBreakdown>();

  for (const product of products) {
    const existing = map.get(product.category) ?? {
      name: product.category as Category,
      count: 0,
      units: 0,
      valueCents: 0
    };
    existing.count += 1;
    existing.units += product.stock;
    existing.valueCents += product.stock * product.costCents;
    map.set(product.category, existing);
  }

  return [...map.values()].sort((a, b) => b.valueCents - a.valueCents);
}

function toMovementView(movement: MovementRow): MovementView {
  return {
    id: movement.id,
    productId: movement.productId,
    productName: movement.productName,
    sku: movement.sku,
    unit: movement.unit as Unit,
    type: normalizedType(movement.type) as MovementType,
    qty: movement.qty,
    reference: movement.reference,
    note: movement.note,
    actorName: movement.actorName,
    createdAt: movement.createdAt.toISOString()
  };
}

function buildAttentionViews(products: ProductRow[]): ProductView[] {
  return sortAttention(products).map(toProductView);
}

export async function getStats(): Promise<Stats> {
  const products = await prisma.product.findMany({
    select: { stock: true, reorder: true, costCents: true, priceCents: true, category: true, supplierId: true }
  });
  return buildStats(products);
}

export async function getAttentionProducts(): Promise<ProductView[]> {
  const products = await prisma.product.findMany({
    include: productInclude,
    orderBy: { name: "asc" }
  });
  return buildAttentionViews(products);
}

export async function getOverviewData(): Promise<OverviewData> {
  const since = daysAgoStart(6);

  const [products, flowRows, recentRows] = await Promise.all([
    prisma.product.findMany({ include: productInclude, orderBy: { name: "asc" } }),
    prisma.movement.findMany({
      where: { createdAt: { gte: since }, type: { in: ["in", "out"] } },
      select: { type: true, qty: true, createdAt: true }
    }),
    prisma.movement.findMany({
      orderBy: { createdAt: "desc" },
      take: 6
    })
  ]);

  const stats = buildStats(products);

  return {
    stats,
    attention: buildAttentionViews(products),
    flow: buildFlow(flowRows),
    recent: recentRows.map(toMovementView),
    categories: buildCategories(products)
  };
}

function buildInventoryWhere(filters: InventoryFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q } },
      { sku: { contains: filters.q } },
      { category: { contains: filters.q } },
      { supplier: { is: { name: { contains: filters.q } } } }
    ];
  }
  if (filters.category !== "all") where.category = filters.category;
  if (filters.supplier !== "all") where.supplier = { is: { name: filters.supplier } };

  return where;
}

function inventoryOrderBy(filters: InventoryFilters): Prisma.ProductOrderByWithRelationInput[] {
  const direction = filters.dir;
  if (filters.sort === "stock") {
    return [{ stock: direction }, { name: "asc" }];
  }
  if (filters.sort === "price") {
    return [{ priceCents: direction }, { name: "asc" }];
  }
  if (filters.sort === "updated") {
    return [{ updatedAt: direction }];
  }
  return [{ name: direction }];
}

function matchesStatus(product: { stock: number; reorder: number }, status: string) {
  const value = statusOf(product.stock, product.reorder);
  if (status === "attention") return value !== "healthy";
  return value === status;
}

export async function getInventoryData(filters: InventoryFilters): Promise<InventoryData> {
  const where = buildInventoryWhere(filters);
  const orderBy = inventoryOrderBy(filters);
  const [stats, total] = await Promise.all([getStats(), prisma.product.count({ where })]);

  let products: ProductRow[];
  let visibleTotal: number;
  let page = filters.page;

  if (filters.status === "all") {
    visibleTotal = total;
    page = Math.min(page, Math.max(1, Math.ceil(visibleTotal / PAGE_SIZE)));
    products = await prisma.product.findMany({
      where,
      include: productInclude,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    });
  } else {
    const rows = await prisma.product.findMany({ where, include: productInclude, orderBy });
    const filtered = rows.filter((product) => matchesStatus(product, filters.status));
    visibleTotal = filtered.length;
    const pageCount = Math.max(1, Math.ceil(visibleTotal / PAGE_SIZE));
    page = Math.min(page, pageCount);
    products = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }

  const pageCount = Math.max(1, Math.ceil(visibleTotal / PAGE_SIZE));
  const rangeStart = visibleTotal === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, visibleTotal);

  return {
    products: products.map(toProductView),
    total: visibleTotal,
    page,
    pageCount,
    rangeStart,
    rangeEnd,
    stats,
    filters
  };
}

export async function getInventoryExport(filters: InventoryFilters): Promise<ProductView[]> {
  const rows = await prisma.product.findMany({
    where: buildInventoryWhere(filters),
    include: productInclude,
    orderBy: inventoryOrderBy(filters)
  });
  return rows
    .filter((product) => filters.status === "all" || matchesStatus(product, filters.status))
    .map(toProductView);
}

function buildMovementWhere(filters: MovementFilters): Prisma.MovementWhereInput {
  const where: Prisma.MovementWhereInput = {};
  if (filters.q) {
    where.OR = [
      { productName: { contains: filters.q } },
      { sku: { contains: filters.q } },
      { reference: { contains: filters.q } },
      { note: { contains: filters.q } },
      { actorName: { contains: filters.q } }
    ];
  }
  if (filters.type !== "all") where.type = filters.type;
  return where;
}

export async function getMovementData(filters: MovementFilters): Promise<MovementData> {
  const where = buildMovementWhere(filters);
  const since = daysAgoStart(6);

  const [total, countsRaw, weekRows, allTotal] = await Promise.all([
    prisma.movement.count({ where }),
    prisma.movement.groupBy({ by: ["type"], _count: { _all: true } }),
    prisma.movement.findMany({
      where: { createdAt: { gte: since } },
      select: { type: true, qty: true, createdAt: true }
    }),
    prisma.movement.count()
  ]);

  const counts = { all: allTotal, in: 0, out: 0, adjust: 0 };
  for (const row of countsRaw) {
    const type = normalizedType(row.type);
    if (type === "in" || type === "out" || type === "adjust") {
      counts[type] = row._count._all;
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);
  const pageRows = await prisma.movement.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE
  });

  return {
    movements: pageRows.map(toMovementView),
    total,
    page,
    pageCount,
    rangeStart: total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1,
    rangeEnd: Math.min(page * PAGE_SIZE, total),
    counts,
    flow: buildFlow(weekRows),
    weekCount: weekRows.length,
    filters
  };
}

export async function getSupplierData(): Promise<SupplierData> {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: {
      products: {
        select: { name: true, stock: true, reorder: true, costCents: true }
      }
    }
  });

  const views: SupplierView[] = suppliers.map((supplier) => {
    const attention = supplier.products
      .filter((product) => statusOf(product.stock, product.reorder) !== "healthy")
      .sort((a, b) => {
        const aStatus = statusOf(a.stock, a.reorder);
        const bStatus = statusOf(b.stock, b.reorder);
        if (aStatus === "out" && bStatus !== "out") return -1;
        if (bStatus === "out" && aStatus !== "out") return 1;
        return a.name.localeCompare(b.name);
      });

    return {
      id: supplier.id,
      name: supplier.name,
      contact: supplier.contact,
      email: supplier.email,
      leadDays: supplier.leadDays,
      initials: supplier.initials,
      productCount: supplier.products.length,
      units: supplier.products.reduce((total, product) => total + product.stock, 0),
      valueCents: supplier.products.reduce((total, product) => total + product.stock * product.costCents, 0),
      lowCount: attention.length,
      lowProducts: attention.map((product) => product.name)
    };
  });

  views.sort((a, b) => {
    if (a.lowCount !== b.lowCount) return b.lowCount - a.lowCount;
    return a.name.localeCompare(b.name);
  });

  return {
    suppliers: views,
    lowestLead: suppliers.length ? Math.min(...suppliers.map((supplier) => supplier.leadDays)) : 0
  };
}

export async function getCatalog(): Promise<CatalogOption[]> {
  const products = await prisma.product.findMany({
    include: { supplier: { select: { name: true } } },
    orderBy: { name: "asc" }
  });

  return products.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    category: product.category as Category,
    unit: product.unit as Unit,
    stock: product.stock,
    reorder: product.reorder,
    supplierId: product.supplierId,
    supplierName: product.supplier.name
  }));
}

export async function getSupplierOptions() {
  return prisma.supplier.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });
}

export async function getInventoryFacets() {
  const suppliers = await prisma.supplier.findMany({
    select: { name: true },
    orderBy: { name: "asc" }
  });
  return suppliers.map((supplier) => supplier.name);
}
