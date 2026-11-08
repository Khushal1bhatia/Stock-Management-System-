import "server-only";
import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { coverageOf, centreHealthOf, departmentHealthOf, itemHealthOf, lineStatusOf, locationStatusOf } from "@/lib/master";
import type {
  CatalogueItemView,
  CentreFilters,
  CentreLineView,
  CentreMasterData,
  CentreStats,
  CentreView,
  DepartmentFilters,
  DepartmentLocationView,
  DepartmentMasterData,
  DepartmentStats,
  DepartmentView,
  ItemFilters,
  ItemLineView,
  ItemMasterData,
  ItemStats,
  MasterStatusFilter
} from "@/lib/types";

const centreInclude = {
  requirements: { include: { item: true } },
  parent: { select: { id: true, name: true, slug: true } }
} satisfies Prisma.CentreInclude;

type CentreRow = Prisma.CentreGetPayload<{ include: typeof centreInclude }>;

const itemInclude = {
  requirements: { include: { centre: true } },
  departments: { include: { department: true } }
} satisfies Prisma.CatalogueItemInclude;

type ItemRow = Prisma.CatalogueItemGetPayload<{ include: typeof itemInclude }>;

const departmentInclude = {
  items: { include: { item: { select: { id: true } } } }
} satisfies Prisma.DepartmentInclude;

type DepartmentRow = Prisma.DepartmentGetPayload<{ include: typeof departmentInclude }>;

const CENTRE_TYPE_ORDER = { Centre: 0, SubCentre: 1, Point: 2 } as const;

function toCentreLine(requirement: CentreRow["requirements"][number]): CentreLineView {
  const required = requirement.required;
  const onHand = requirement.onHand;
  const shortfall = Math.max(0, required - onHand);
  return {
    itemId: requirement.item.id,
    itemName: requirement.item.name,
    itemSlug: requirement.item.slug,
    sku: requirement.item.sku,
    category: requirement.item.category,
    unit: requirement.item.unit,
    costCents: requirement.item.costCents,
    required,
    onHand,
    shortfall,
    status: lineStatusOf(required, onHand)
  };
}

function buildCentreView(row: CentreRow, childCount: number): CentreView {
  const lines = row.requirements
    .map(toCentreLine)
    .sort((a, b) => a.itemName.localeCompare(b.itemName));
  const requiredUnits = lines.reduce((total, line) => total + line.required, 0);
  const onHandUnits = lines.reduce((total, line) => total + line.onHand, 0);
  const shortfallUnits = lines.reduce((total, line) => total + line.shortfall, 0);
  const coveredCount = lines.filter((line) => line.status === "covered").length;
  const shortCount = lines.filter((line) => line.status === "short").length;
  const missingCount = lines.filter((line) => line.status === "missing").length;
  const coverage = coverageOf(coveredCount, lines.length);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    code: row.code,
    type: row.type as CentreView["type"],
    sortOrder: row.sortOrder,
    parentId: row.parentId,
    parentName: row.parent?.name ?? null,
    parentSlug: row.parent?.slug ?? null,
    lines,
    requiredUnits,
    onHandUnits,
    shortfallUnits,
    coveredCount,
    shortCount,
    missingCount,
    coverage,
    status: centreHealthOf({
      requiredUnits,
      shortfallUnits,
      coveredCount,
      missingCount,
      lineCount: lines.length
    }),
    childCount
  };
}

const getAllCentreViews = cache(async (): Promise<CentreView[]> => {
  const rows = await prisma.centre.findMany({
    include: centreInclude,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
  });

  const childCounts = new Map<string, number>();
  for (const row of rows) {
    if (row.parentId) childCounts.set(row.parentId, (childCounts.get(row.parentId) ?? 0) + 1);
  }

  return rows.map((row) => buildCentreView(row, childCounts.get(row.id) ?? 0));
});

function buildCentreStats(centres: CentreView[]): CentreStats {
  const ready = centres.filter((centre) => centre.status === "healthy").length;
  const critical = centres.filter((centre) => centre.status === "critical").length;
  const needs = centres.filter((centre) => centre.status === "needs").length;
  return {
    total: centres.length,
    centreCount: centres.filter((centre) => centre.type === "Centre").length,
    subCentreCount: centres.filter((centre) => centre.type === "SubCentre").length,
    pointCount: centres.filter((centre) => centre.type === "Point").length,
    ready,
    needs,
    critical,
    withNeeds: needs + critical,
    trackedItems: centres.reduce((total, centre) => total + centre.lines.length, 0),
    requiredUnits: centres.reduce((total, centre) => total + centre.requiredUnits, 0),
    onHandUnits: centres.reduce((total, centre) => total + centre.onHandUnits, 0),
    shortfallUnits: centres.reduce((total, centre) => total + centre.shortfallUnits, 0)
  };
}

function matchesStatus(status: CentreView["status"], filter: MasterStatusFilter) {
  if (filter === "needs") return status !== "healthy";
  if (filter === "ready") return status === "healthy";
  return true;
}

export async function getCentreMasterData(filters: CentreFilters): Promise<CentreMasterData> {
  const allCentres = await getAllCentreViews();
  const query = filters.q.trim().toLowerCase();
  const centres = allCentres.filter((centre) => {
    if (!matchesStatus(centre.status, filters.status)) return false;
    if (filters.type !== "all" && centre.type !== filters.type) return false;
    if (!query) return true;
    return [centre.name, centre.code, centre.parentName ?? ""].join(" ").toLowerCase().includes(query);
  });

  return { centres, allCentres, stats: buildCentreStats(allCentres), filters };
}

export async function getCentreDetail(slug: string) {
  const allCentres = await getAllCentreViews();
  const centre = allCentres.find((candidate) => candidate.slug === slug) ?? null;
  if (!centre) return null;

  const children = allCentres
    .filter((candidate) => candidate.parentId === centre.id)
    .sort(
      (a, b) =>
        CENTRE_TYPE_ORDER[a.type] - CENTRE_TYPE_ORDER[b.type] || a.name.localeCompare(b.name)
    );

  return { centre, children };
}

function toItemLine(requirement: ItemRow["requirements"][number]): ItemLineView {
  const required = requirement.required;
  const onHand = requirement.onHand;
  const shortfall = Math.max(0, required - onHand);
  return {
    centreId: requirement.centre.id,
    centreName: requirement.centre.name,
    centreSlug: requirement.centre.slug,
    centreType: requirement.centre.type as ItemLineView["centreType"],
    centreCode: requirement.centre.code,
    required,
    onHand,
    shortfall,
    status: lineStatusOf(required, onHand)
  };
}

function buildItemView(row: ItemRow): CatalogueItemView {
  const lines = row.requirements
    .map(toItemLine)
    .sort((a, b) => a.centreName.localeCompare(b.centreName));
  const requiredUnits = lines.reduce((total, line) => total + line.required, 0);
  const onHandUnits = lines.reduce((total, line) => total + line.onHand, 0);
  const shortfallUnits = lines.reduce((total, line) => total + line.shortfall, 0);
  const coveredCount = lines.filter((line) => line.status === "covered").length;
  const shortCount = lines.filter((line) => line.status === "short").length;
  const missingCount = lines.filter((line) => line.status === "missing").length;
  const coverage = coverageOf(coveredCount, lines.length);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    category: row.category,
    unit: row.unit,
    costCents: row.costCents,
    sortOrder: row.sortOrder,
    departments: row.departments
      .slice()
      .sort((a, b) => a.department.sortOrder - b.department.sortOrder)
      .map((entry) => ({ name: entry.department.name, slug: entry.department.slug })),
    lines,
    requiredUnits,
    onHandUnits,
    shortfallUnits,
    coveredCount,
    shortCount,
    missingCount,
    shortCentreCount: lines.length - coveredCount,
    coverage,
    status: itemHealthOf({ shortfallUnits, missingCount, coverage })
  };
}

const getAllItemViews = cache(async (): Promise<CatalogueItemView[]> => {
  const rows = await prisma.catalogueItem.findMany({
    include: itemInclude,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
  });
  return rows.map(buildItemView);
});

function buildItemStats(items: CatalogueItemView[]): ItemStats {
  const withNeeds = items.filter((item) => item.status !== "healthy").length;
  const centres = new Set<string>();
  for (const item of items) {
    for (const line of item.lines) centres.add(line.centreId);
  }
  return {
    total: items.length,
    ready: items.length - withNeeds,
    withNeeds,
    critical: items.filter((item) => item.status === "critical").length,
    centres: centres.size,
    requiredUnits: items.reduce((total, item) => total + item.requiredUnits, 0),
    shortfallUnits: items.reduce((total, item) => total + item.shortfallUnits, 0)
  };
}

export async function getItemMasterData(filters: ItemFilters): Promise<ItemMasterData> {
  const allItems = await getAllItemViews();
  const query = filters.q.trim().toLowerCase();
  const items = allItems.filter((item) => {
    if (!matchesStatus(item.status, filters.status)) return false;
    if (!query) return true;
    return [item.name, item.sku, item.category].join(" ").toLowerCase().includes(query);
  });

  return { items, allItems, stats: buildItemStats(allItems), filters };
}

export async function getItemDetail(slug: string) {
  const allItems = await getAllItemViews();
  return allItems.find((item) => item.slug === slug) ?? null;
}

function buildDepartmentLocations(items: CatalogueItemView[]): DepartmentLocationView[] {
  const map = new Map<string, DepartmentLocationView>();

  for (const item of items) {
    for (const line of item.lines) {
      const existing = map.get(line.centreId) ?? {
        centreId: line.centreId,
        centreName: line.centreName,
        centreSlug: line.centreSlug,
        centreType: line.centreType,
        centreCode: line.centreCode,
        required: 0,
        onHand: 0,
        shortfall: 0,
        lineCount: 0,
        coveredCount: 0,
        coverage: 0,
        status: "covered" as const
      };
      existing.required += line.required;
      existing.onHand += line.onHand;
      existing.shortfall += line.shortfall;
      existing.lineCount += 1;
      if (line.status === "covered") existing.coveredCount += 1;
      map.set(line.centreId, existing);
    }
  }

  return [...map.values()]
    .map((location) => ({
      ...location,
      coverage: coverageOf(location.coveredCount, location.lineCount),
      status: locationStatusOf(location.shortfall, location.onHand)
    }))
    .sort((a, b) => b.shortfall - a.shortfall || a.centreName.localeCompare(b.centreName));
}

function buildDepartmentView(row: DepartmentRow, itemViews: Map<string, CatalogueItemView>): DepartmentView {
  const items = row.items
    .map((entry) => itemViews.get(entry.item.id))
    .filter((item): item is CatalogueItemView => Boolean(item))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const lines = items.flatMap((item) => item.lines);
  const requiredUnits = items.reduce((total, item) => total + item.requiredUnits, 0);
  const onHandUnits = items.reduce((total, item) => total + item.onHandUnits, 0);
  const shortfallUnits = items.reduce((total, item) => total + item.shortfallUnits, 0);
  const coveredCount = lines.filter((line) => line.status === "covered").length;
  const shortCount = lines.filter((line) => line.status === "short").length;
  const missingCount = lines.filter((line) => line.status === "missing").length;
  const coverage = coverageOf(coveredCount, lines.length);
  const locations = buildDepartmentLocations(items);
  const withNeeds = items.filter((item) => item.status !== "healthy").length;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    sortOrder: row.sortOrder,
    items,
    itemCount: items.length,
    lines,
    locations,
    requiredUnits,
    onHandUnits,
    shortfallUnits,
    coveredCount,
    shortCount,
    missingCount,
    coverage,
    affectedLocations: locations.filter((location) => location.shortfall > 0).length,
    withNeeds,
    status: departmentHealthOf({ shortfallUnits, coverage, missingCount, lineCount: lines.length })
  };
}

const getAllDepartmentViews = cache(async (): Promise<DepartmentView[]> => {
  const [rows, itemViews] = await Promise.all([
    prisma.department.findMany({
      include: departmentInclude,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    }),
    getAllItemViews()
  ]);
  const itemMap = new Map(itemViews.map((item) => [item.id, item]));
  return rows.map((row) => buildDepartmentView(row, itemMap));
});

function buildDepartmentStats(departments: DepartmentView[]): DepartmentStats {
  return {
    total: departments.length,
    items: new Set(departments.flatMap((department) => department.items.map((item) => item.id))).size,
    assignments: departments.reduce((total, department) => total + department.itemCount, 0),
    lines: departments.reduce((total, department) => total + department.lines.length, 0),
    withNeeds: departments.filter((department) => department.status !== "healthy").length,
    ready: departments.filter((department) => department.status === "healthy").length,
    critical: departments.filter((department) => department.status === "critical").length,
    shortfallUnits: departments.reduce((total, department) => total + department.shortfallUnits, 0)
  };
}

export async function getDepartmentMasterData(filters: DepartmentFilters): Promise<DepartmentMasterData> {
  const allDepartments = await getAllDepartmentViews();
  const query = filters.q.trim().toLowerCase();
  const departments = allDepartments.filter((department) => {
    if (!matchesStatus(department.status, filters.status)) return false;
    if (!query) return true;
    return [
      department.name,
      department.description,
      ...department.items.flatMap((item) => [item.name, item.sku, item.category])
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  return {
    departments,
    allDepartments,
    stats: buildDepartmentStats(allDepartments),
    filters
  };
}

export async function getDepartmentDetail(slug: string) {
  const allDepartments = await getAllDepartmentViews();
  return allDepartments.find((department) => department.slug === slug) ?? null;
}
