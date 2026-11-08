import type {
  CentreFilters,
  DepartmentFilters,
  InventoryFilters,
  ItemFilters,
  MovementFilters
} from "@/lib/types";
import {
  centreFilterSchema,
  departmentFilterSchema,
  inventoryFilterSchema,
  itemFilterSchema,
  movementFilterSchema
} from "@/lib/validation";

export const DEFAULT_INVENTORY_FILTERS: InventoryFilters = {
  q: "",
  category: "all",
  supplier: "all",
  status: "all",
  sort: "name",
  dir: "asc",
  page: 1
};

export const DEFAULT_MOVEMENT_FILTERS: MovementFilters = {
  q: "",
  type: "all",
  page: 1
};

export const DEFAULT_CENTRE_FILTERS: CentreFilters = {
  q: "",
  status: "all",
  type: "all"
};

export const DEFAULT_ITEM_FILTERS: ItemFilters = {
  q: "",
  status: "all"
};

export const DEFAULT_DEPARTMENT_FILTERS: DepartmentFilters = {
  q: "",
  status: "all"
};

type SearchParamsInput = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function parseInventoryFilters(params: SearchParamsInput): InventoryFilters {
  const parsed = inventoryFilterSchema.safeParse({
    q: first(params.q),
    category: first(params.category) || "all",
    supplier: first(params.supplier) || "all",
    status: first(params.status) || "all",
    sort: first(params.sort) || "name",
    dir: first(params.dir) || "asc",
    page: first(params.page) || "1"
  });
  return parsed.success ? parsed.data : DEFAULT_INVENTORY_FILTERS;
}

export function parseMovementFilters(params: SearchParamsInput): MovementFilters {
  const parsed = movementFilterSchema.safeParse({
    q: first(params.q),
    type: first(params.type) || "all",
    page: first(params.page) || "1"
  });
  return parsed.success ? parsed.data : DEFAULT_MOVEMENT_FILTERS;
}

export function inventoryHref(filters: InventoryFilters, patch: Partial<InventoryFilters> = {}) {
  const next = { ...filters, ...patch };
  const params = new URLSearchParams();

  if (next.q) params.set("q", next.q);
  if (next.category !== "all") params.set("category", next.category);
  if (next.supplier !== "all") params.set("supplier", next.supplier);
  if (next.status !== "all") params.set("status", next.status);
  if (next.sort !== "name") params.set("sort", next.sort);
  if (next.dir !== "asc") params.set("dir", next.dir);
  if (next.page > 1) params.set("page", String(next.page));

  const query = params.toString();
  return query ? `/inventory?${query}` : "/inventory";
}

export function parseCentreFilters(params: SearchParamsInput): CentreFilters {
  const parsed = centreFilterSchema.safeParse({
    q: first(params.q),
    status: first(params.status) || "all",
    type: first(params.type) || "all"
  });
  return parsed.success ? parsed.data : DEFAULT_CENTRE_FILTERS;
}

export function parseItemFilters(params: SearchParamsInput): ItemFilters {
  const parsed = itemFilterSchema.safeParse({
    q: first(params.q),
    status: first(params.status) || "all"
  });
  return parsed.success ? parsed.data : DEFAULT_ITEM_FILTERS;
}

export function parseDepartmentFilters(params: SearchParamsInput): DepartmentFilters {
  const parsed = departmentFilterSchema.safeParse({
    q: first(params.q),
    status: first(params.status) || "all"
  });
  return parsed.success ? parsed.data : DEFAULT_DEPARTMENT_FILTERS;
}

function masterHref(path: string, filters: { q: string; status: string; type?: string }, patch: Partial<{ q: string; status: string; type: string }> = {}) {
  const next = { ...filters, ...patch };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.status !== "all") params.set("status", next.status);
  if ("type" in next && next.type && next.type !== "all") params.set("type", next.type);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function centreHref(filters: CentreFilters, patch: Partial<CentreFilters> = {}) {
  return masterHref("/centres", filters, patch);
}

export function itemHref(filters: ItemFilters, patch: Partial<ItemFilters> = {}) {
  return masterHref("/items", filters, patch);
}

export function departmentHref(filters: DepartmentFilters, patch: Partial<DepartmentFilters> = {}) {
  return masterHref("/departments", filters, patch);
}

export function movementHref(filters: MovementFilters, patch: Partial<MovementFilters> = {}) {
  const next = { ...filters, ...patch };
  const params = new URLSearchParams();

  if (next.q) params.set("q", next.q);
  if (next.type !== "all") params.set("type", next.type);
  if (next.page > 1) params.set("page", String(next.page));

  const query = params.toString();
  return query ? `/movements?${query}` : "/movements";
}

export function exportHref(filters: InventoryFilters) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category !== "all") params.set("category", filters.category);
  if (filters.supplier !== "all") params.set("supplier", filters.supplier);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.sort !== "name") params.set("sort", filters.sort);
  if (filters.dir !== "asc") params.set("dir", filters.dir);
  const query = params.toString();
  return query ? `/api/inventory/export?${query}` : "/api/inventory/export";
}
