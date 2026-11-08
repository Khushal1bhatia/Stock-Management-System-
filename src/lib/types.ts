import type { Category, InventorySort, MovementType, Role, StockStatus, Unit } from "@/lib/constants";

export type SessionUser = {
  id: string;
  sessionId: string;
  username: string;
  name: string;
  initials: string;
  role: Role;
};

export type ProductView = {
  id: string;
  name: string;
  sku: string;
  category: Category;
  supplierId: string;
  supplierName: string;
  unit: Unit;
  costCents: number;
  priceCents: number;
  stock: number;
  reorder: number;
  updatedAt: string;
  status: StockStatus;
};

export type MovementView = {
  id: string;
  productId: string | null;
  productName: string;
  sku: string;
  unit: Unit;
  type: MovementType;
  qty: number;
  reference: string;
  note: string;
  actorName: string;
  createdAt: string;
};

export type DocumentView = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  fileName: string;
  pages: number;
  href: string;
};

export type SupplierView = {
  id: string;
  name: string;
  contact: string;
  email: string;
  leadDays: number;
  initials: string;
  productCount: number;
  units: number;
  valueCents: number;
  lowCount: number;
  lowProducts: string[];
};

export type CatalogOption = {
  id: string;
  name: string;
  sku: string;
  category: Category;
  unit: Unit;
  stock: number;
  reorder: number;
  supplierId: string;
  supplierName: string;
};

export type Stats = {
  skus: number;
  units: number;
  valueCents: number;
  retailCents: number;
  low: number;
  out: number;
  attention: number;
  categories: number;
  suppliers: number;
};

export type FlowDay = {
  key: string;
  label: string;
  dateLabel: string;
  received: number;
  dispatched: number;
};

export type Flow = {
  days: FlowDay[];
  totalIn: number;
  totalOut: number;
  net: number;
};

export type CategoryBreakdown = {
  name: Category;
  count: number;
  units: number;
  valueCents: number;
};

export type InventoryFilters = {
  q: string;
  category: string;
  supplier: string;
  status: string;
  sort: InventorySort;
  dir: "asc" | "desc";
  page: number;
};

export type MovementFilters = {
  q: string;
  type: string;
  page: number;
};

export type ActionResult =
  | { ok: true; message?: string; fieldErrors?: undefined }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export type FormActionState = ActionResult | null;

export type OverviewData = {
  stats: Stats;
  attention: ProductView[];
  flow: Flow;
  recent: MovementView[];
  categories: CategoryBreakdown[];
};

export type InventoryData = {
  products: ProductView[];
  total: number;
  page: number;
  pageCount: number;
  rangeStart: number;
  rangeEnd: number;
  stats: Stats;
  filters: InventoryFilters;
};

export type MovementData = {
  movements: MovementView[];
  total: number;
  page: number;
  pageCount: number;
  rangeStart: number;
  rangeEnd: number;
  counts: { all: number; in: number; out: number; adjust: number };
  flow: Flow;
  weekCount: number;
  filters: MovementFilters;
};

export type SupplierData = {
  suppliers: SupplierView[];
  lowestLead: number;
};

export type CentreType = "Centre" | "SubCentre" | "Point";
export type MasterHealth = "healthy" | "needs" | "critical";
export type LineStatus = "covered" | "short" | "missing";
export type MasterStatusFilter = "all" | "needs" | "ready";
export type CentreTypeFilter = "all" | CentreType;

export type CentreFilters = {
  q: string;
  status: MasterStatusFilter;
  type: CentreTypeFilter;
};

export type ItemFilters = {
  q: string;
  status: MasterStatusFilter;
};

export type DepartmentFilters = {
  q: string;
  status: MasterStatusFilter;
};

export type CentreLineView = {
  itemId: string;
  itemName: string;
  itemSlug: string;
  sku: string;
  category: string;
  unit: string;
  costCents: number;
  required: number;
  onHand: number;
  shortfall: number;
  status: LineStatus;
};

export type CentreView = {
  id: string;
  name: string;
  slug: string;
  code: string;
  type: CentreType;
  sortOrder: number;
  parentId: string | null;
  parentName: string | null;
  parentSlug: string | null;
  lines: CentreLineView[];
  requiredUnits: number;
  onHandUnits: number;
  shortfallUnits: number;
  coveredCount: number;
  shortCount: number;
  missingCount: number;
  coverage: number;
  status: MasterHealth;
  childCount: number;
};

export type CentreStats = {
  total: number;
  centreCount: number;
  subCentreCount: number;
  pointCount: number;
  ready: number;
  needs: number;
  critical: number;
  withNeeds: number;
  trackedItems: number;
  requiredUnits: number;
  onHandUnits: number;
  shortfallUnits: number;
};

export type CentreMasterData = {
  centres: CentreView[];
  allCentres: CentreView[];
  stats: CentreStats;
  filters: CentreFilters;
};

export type ItemLineView = {
  centreId: string;
  centreName: string;
  centreSlug: string;
  centreType: CentreType;
  centreCode: string;
  required: number;
  onHand: number;
  shortfall: number;
  status: LineStatus;
};

export type CatalogueItemView = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category: string;
  unit: string;
  costCents: number;
  sortOrder: number;
  departments: Array<{ name: string; slug: string }>;
  lines: ItemLineView[];
  requiredUnits: number;
  onHandUnits: number;
  shortfallUnits: number;
  coveredCount: number;
  shortCount: number;
  missingCount: number;
  shortCentreCount: number;
  coverage: number;
  status: MasterHealth;
};

export type ItemStats = {
  total: number;
  ready: number;
  withNeeds: number;
  critical: number;
  centres: number;
  requiredUnits: number;
  shortfallUnits: number;
};

export type ItemMasterData = {
  items: CatalogueItemView[];
  allItems: CatalogueItemView[];
  stats: ItemStats;
  filters: ItemFilters;
};

export type DepartmentLocationView = {
  centreId: string;
  centreName: string;
  centreSlug: string;
  centreType: CentreType;
  centreCode: string;
  required: number;
  onHand: number;
  shortfall: number;
  lineCount: number;
  coveredCount: number;
  coverage: number;
  status: LineStatus;
};

export type DepartmentView = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  items: CatalogueItemView[];
  itemCount: number;
  lines: ItemLineView[];
  locations: DepartmentLocationView[];
  requiredUnits: number;
  onHandUnits: number;
  shortfallUnits: number;
  coveredCount: number;
  shortCount: number;
  missingCount: number;
  coverage: number;
  affectedLocations: number;
  withNeeds: number;
  status: MasterHealth;
};

export type DepartmentStats = {
  total: number;
  items: number;
  assignments: number;
  lines: number;
  withNeeds: number;
  ready: number;
  critical: number;
  shortfallUnits: number;
};

export type DepartmentMasterData = {
  departments: DepartmentView[];
  allDepartments: DepartmentView[];
  stats: DepartmentStats;
  filters: DepartmentFilters;
};

