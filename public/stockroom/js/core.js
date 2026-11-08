"use strict";

/* ------------------------------------------------------------------
   Stock Management System · core state, seed data, and shared helpers
   Data lives in localStorage. No network, no accounts.
------------------------------------------------------------------- */

const STORAGE_KEY = "stockroom.state.v1";
const LOCK_STORAGE_KEY = "stockroom.locks.v1";
const THEME_STORAGE_KEY = "stockroom.theme.v1";
const CENTRE_STORAGE_KEY = "stockroom.centres.v1";
const CATEGORY_ORDER = ["Audio", "Workspace", "Accessories", "Lighting", "Storage"];
const SUPPLIER_DIRECTORY = {
  "Northwind Supply": { contact: "Dana Whitfield", email: "dana@northwindsupply.co", lead: 5, initials: "NS" },
  "Kestrel Trading": { contact: "Marco Lin", email: "marco@kestreltrading.com", lead: 7, initials: "KT" },
  "Harbor & Co.": { contact: "Priya Shah", email: "priya@harborco.com", lead: 3, initials: "HC" },
  "Meridian Wholesale": { contact: "Jonas Reed", email: "jonas@meridianwholesale.com", lead: 10, initials: "MW" },
  "Atlas Goods": { contact: "Elif Demir", email: "elif@atlasgoods.co", lead: 4, initials: "AG" }
};
const inr0 = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const inr2 = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const timeFmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
const dateFmt = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" });
const shortDateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const fullDateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

const STATUS = {
  healthy: { label: "Healthy", className: "status--healthy" },
  low: { label: "Low stock", className: "status--low" },
  out: { label: "Out of stock", className: "status--out" }
};

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value, decimals = 0) {
  return (decimals === 2 ? inr2 : inr0).format(Number(value) || 0);
}
function num(value) {
  return num0.format(Number(value) || 0);
}
function initials(name) {
  return String(name)
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] || "")
    .join("")
    .toUpperCase();
}
function categoryClass(category) {
  const slug = String(category).toLowerCase().replace(/[^a-z]/g, "");
  const known = {
    audio: "audio",
    workspace: "workspace",
    accessories: "accessories",
    lighting: "lighting",
    storage: "storage",
    furniture: "furniture",
    crockery: "crockery",
    painting: "painting",
    security: "security",
    stationery: "stationery"
  };
  return known[slug] || "storage";
}
function statusOf(product) {
  if (Number(product.stock) <= 0) return "out";
  if (Number(product.stock) <= Number(product.reorder)) return "low";
  return "healthy";
}
function formatDateLong(date = new Date()) {
  return dateFmt.format(date);
}
function formatDateShort(date) {
  return shortDateFmt.format(new Date(date));
}
function formatTime(date) {
  return timeFmt.format(new Date(date));
}
function formatFullDate(date) {
  return fullDateFmt.format(new Date(date));
}
function relativeWhen(iso) {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfThat = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDiff = Math.round((startOfToday - startOfThat) / 86400000);
  let day;
  if (dayDiff === 0) day = "Today";
  else if (dayDiff === 1) day = "Yesterday";
  else if (dayDiff > 1 && dayDiff < 7) day = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
  else day = formatDateShort(date);
  return `${day}, ${formatTime(date)}`;
}
function hoursAgo(hours) {
  return new Date(Date.now() - hours * 3600000).toISOString();
}
function daysAgo(days, hour = 10, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}
function dayKey(value) {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function plural(count, singular, pluralForm) {
  return Number(count) === 1 ? singular : (pluralForm || `${singular}s`);
}

const PRODUCT_SEEDS = [
  { id: "p-aeris", name: "Aeris Wireless Headphones", sku: "AUD-4821", category: "Audio", supplier: "Northwind Supply", unit: "pcs", cost: 78, price: 129, stock: 124, reorder: 40 },
  { id: "p-monitors", name: "Kestrel Studio Monitors", sku: "AUD-1904", category: "Audio", supplier: "Northwind Supply", unit: "pairs", cost: 146, price: 249, stock: 18, reorder: 20 },
  { id: "p-nimbus", name: "Nimbus Bluetooth Speaker", sku: "AUD-7730", category: "Audio", supplier: "Kestrel Trading", unit: "pcs", cost: 42, price: 79, stock: 0, reorder: 15 },
  { id: "p-meridian-lamp", name: "Meridian Desk Lamp", sku: "LGT-2210", category: "Lighting", supplier: "Harbor & Co.", unit: "pcs", cost: 34, price: 69, stock: 56, reorder: 20 },
  { id: "p-halo-light", name: "Halo Task Light", sku: "LGT-3382", category: "Lighting", supplier: "Harbor & Co.", unit: "pcs", cost: 58, price: 119, stock: 9, reorder: 12 },
  { id: "p-vale-chair", name: "Vale Ergonomic Chair", sku: "FUR-1108", category: "Workspace", supplier: "Meridian Wholesale", unit: "pcs", cost: 189, price: 349, stock: 23, reorder: 8 },
  { id: "p-ridge-desk", name: "Ridge Standing Desk", sku: "FUR-2044", category: "Workspace", supplier: "Meridian Wholesale", unit: "pcs", cost: 310, price: 599, stock: 7, reorder: 5 },
  { id: "p-fold-riser", name: "Fold Laptop Riser", sku: "WRK-5561", category: "Workspace", supplier: "Atlas Goods", unit: "pcs", cost: 18, price: 39, stock: 84, reorder: 30 },
  { id: "p-loop-organizer", name: "Loop Cable Organizer", sku: "ACC-8820", category: "Accessories", supplier: "Atlas Goods", unit: "packs", cost: 4.5, price: 12, stock: 212, reorder: 60 },
  { id: "p-arc-hub", name: "Arc USB-C Hub", sku: "ACC-4417", category: "Accessories", supplier: "Kestrel Trading", unit: "pcs", cost: 29, price: 59, stock: 31, reorder: 25 },
  { id: "p-slate-sleeve", name: "Slate Laptop Sleeve 14\"", sku: "ACC-1290", category: "Accessories", supplier: "Atlas Goods", unit: "pcs", cost: 16, price: 35, stock: 0, reorder: 20 },
  { id: "p-orbit-mouse", name: "Orbit Wireless Mouse", sku: "ACC-6673", category: "Accessories", supplier: "Kestrel Trading", unit: "pcs", cost: 21, price: 45, stock: 67, reorder: 25 },
  { id: "p-stack-bin", name: "Stack Storage Bin", sku: "STO-3305", category: "Storage", supplier: "Harbor & Co.", unit: "boxes", cost: 9, price: 22, stock: 145, reorder: 50 },
  { id: "p-archive-box", name: "Archive Document Box", sku: "STO-7742", category: "Storage", supplier: "Harbor & Co.", unit: "boxes", cost: 7, price: 16, stock: 12, reorder: 18 },
  { id: "p-riff-mic", name: "Riff Podcast Microphone", sku: "AUD-5529", category: "Audio", supplier: "Northwind Supply", unit: "pcs", cost: 64, price: 119, stock: 26, reorder: 10 },
  { id: "p-beacon-arm", name: "Beacon Monitor Arm", sku: "WRK-2081", category: "Workspace", supplier: "Meridian Wholesale", unit: "pcs", cost: 48, price: 95, stock: 4, reorder: 10 },
  { id: "p-drift-board", name: "Drift Whiteboard 900", sku: "WRK-9940", category: "Workspace", supplier: "Atlas Goods", unit: "pcs", cost: 37, price: 79, stock: 19, reorder: 8 },
  { id: "p-pulse-strip", name: "Pulse Power Strip", sku: "ACC-7712", category: "Accessories", supplier: "Kestrel Trading", unit: "pcs", cost: 14, price: 29, stock: 58, reorder: 20 },
  { id: "p-kite-pad", name: "Kite Desk Pad", sku: "ACC-3048", category: "Accessories", supplier: "Atlas Goods", unit: "pcs", cost: 11, price: 26, stock: 73, reorder: 30 }
];

function seedState() {
  const byId = Object.fromEntries(PRODUCT_SEEDS.map((p) => [p.id, p]));
  const products = PRODUCT_SEEDS.map((p, index) => ({
    ...p,
    updatedAt: hoursAgo(2 + index * 1.7)
  }));

  const movementSeeds = [
    ["p-aeris", "in", 60, 2.2, "PO-2481", "Weekly replenishment", "Khushal Bhatia.1"],
    ["p-orbit-mouse", "out", -8, 3.5, "SO-8821", "Order #8821", "ASO"],
    ["p-halo-light", "out", -3, 5.2, "SO-8820", "Order #8820", "Nina Patel"],
    ["p-nimbus", "in", 24, 6.8, "PO-2479", "Supplier delivery", "Khushal Bhatia.1"],
    ["p-meridian-lamp", "out", -6, 8.9, "SO-8817", "Order #8817", "ASO"],
    ["p-loop-organizer", "in", 120, 21.5, "PO-2478", "Weekly replenishment", "Khushal Bhatia.1"],
    ["p-archive-box", "out", -5, 25.8, "SO-8814", "Order #8814", "Nina Patel"],
    ["p-slate-sleeve", "out", -6, 27.4, "SO-8813", "Order #8813", "ASO"],
    ["p-ridge-desk", "in", 5, 30.2, "PO-2476", "Floor model return", "Khushal Bhatia.1"],
    ["p-arc-hub", "out", -9, 32.9, "SO-8810", "Order #8810", "Nina Patel"],
    ["p-nimbus", "out", -14, 46.4, "SO-8806", "Order #8806", "ASO"],
    ["p-monitors", "adjust", -4, 48.6, "COUNT-118", "Cycle count correction", "Khushal Bhatia.1"],
    ["p-stack-bin", "in", 80, 54.3, "PO-2472", "Bulk delivery", "Khushal Bhatia.1"],
    ["p-vale-chair", "out", -2, 58.1, "SO-8802", "Order #8802", "Nina Patel"],
    ["p-riff-mic", "in", 18, 69.9, "PO-2469", "Supplier delivery", "Khushal Bhatia.1"],
    ["p-kite-pad", "out", -12, 72.6, "SO-8798", "Order #8798", "ASO"],
    ["p-archive-box", "in", 30, 78.2, "PO-2467", "Monthly restock", "Khushal Bhatia.1"],
    ["p-halo-light", "in", 12, 93.7, "PO-2463", "Supplier delivery", "Khushal Bhatia.1"],
    ["p-fold-riser", "out", -18, 96.5, "SO-8793", "Order #8793", "Nina Patel"],
    ["p-slate-sleeve", "out", -7, 101.8, "SO-8791", "Order #8791", "ASO"],
    ["p-kite-pad", "out", -8, 117.9, "SO-8786", "Order #8786", "ASO"],
    ["p-beacon-arm", "adjust", -2, 120.4, "COUNT-109", "Cycle count correction", "Nina Patel"],
    ["p-pulse-strip", "out", -15, 126.1, "SO-8782", "Order #8782", "Nina Patel"],
    ["p-meridian-lamp", "in", 24, 129.8, "PO-2451", "Supplier delivery", "Khushal Bhatia.1"],
    ["p-aeris", "out", -10, 138.6, "SO-8779", "Order #8779", "ASO"],
    ["p-monitors", "out", -6, 141.2, "SO-8778", "Order #8778", "Nina Patel"],
    ["p-nimbus", "adjust", -1, 145.4, "COUNT-104", "Damaged unit write-off", "Khushal Bhatia.1"],
    ["p-stack-bin", "out", -20, 149.7, "SO-8774", "Order #8774", "ASO"]
  ];

  const movements = movementSeeds.map(([productId, type, qty, hours, ref, note, user], index) => {
    const product = byId[productId];
    return {
      id: `m-seed-${index + 1}`,
      productId,
      productName: product.name,
      sku: product.sku,
      unit: product.unit,
      type,
      qty,
      at: hoursAgo(hours),
      ref,
      note,
      user
    };
  });

  return {
    version: 1,
    products,
    movements,
    createdAt: new Date().toISOString()
  };
}

function validState(value) {
  return Boolean(
    value &&
    value.version === 1 &&
    Array.isArray(value.products) &&
    Array.isArray(value.movements)
  );
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (validState(parsed)) return parsed;
    }
  } catch (error) {
    console.warn("Could not read saved stock data.", error);
  }
  const seeded = seedState();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  } catch (error) {
    console.warn("Could not save seed data.", error);
  }
  return seeded;
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Could not save stock data.", error);
  }
}

let state = loadState();

/* ------------------------------------------------------------------ */
/* Centre Master                                                      */
/*                                                                    */
/* Deduplicated from the supplied centre list. Names keep their        */
/* first-seen order and original spelling; each centre appears once.   */
/* Centre requirement lines are seeded demo data because no real       */
/* centre-item dataset was supplied.                                   */
/* ------------------------------------------------------------------ */

const CENTRE_AREA_NAME = "Faridabad";

const CENTRE_NAMES = [
  "DLF CITY GURGAON",
  "ABHEYPUR",
  "SOHNA",
  "NUH",
  "FIROZPUR JHIRKA",
  "PUNAHANA",
  "TAORU",
  "SECTOR-15-A",
  "DHATIR",
  "PRITHLA",
  "GREATER FARIDABAD",
  "GURGAON",
  "FARUKH NAGAR",
  "PATAUDI",
  "KASAN",
  "JATAULA",
  "DUNDAHERA",
  "BADHA SIKENDERPUR",
  "BILASPUR",
  "BUDHERA",
  "SURAJ KUND",
  "RAJENDRA PARK",
  "PALWAL",
  "BAROLI",
  "NAYAGAON",
  "HATHIN",
  "SIHA",
  "HASANPUR",
  "MANDKOLA",
  "BAHIN",
  "HODAL",
  "ANKHEER",
  "NANGLA GUJRAN",
  "TIGAON",
  "NACHAULI",
  "BALLABGARH",
  "MACHHGAR",
  "NIT - 2",
  "MOHANA",
  "FATEHPUR BILLOCH",
  "ZAIBABAD KHERLI"
];

const CENTRE_META = {
  "DLF CITY GURGAON": { code: "5971", type: "Centre", parent: null },
  "ABHEYPUR": { code: "5972", type: "Point", parent: "DLF CITY GURGAON" },
  "SOHNA": { code: "5973", type: "SubCentre", parent: "DLF CITY GURGAON" },
  "NUH": { code: "5974", type: "Point", parent: "DLF CITY GURGAON" },
  "FIROZPUR JHIRKA": { code: "5975", type: "Centre", parent: null },
  "PUNAHANA": { code: "5976", type: "SubCentre", parent: "DLF CITY GURGAON" },
  "TAORU": { code: "5977", type: "Centre", parent: null },
  "SECTOR-15-A": { code: "5978", type: "Centre", parent: null },
  "DHATIR": { code: "5979", type: "SubCentre", parent: "SECTOR-15-A" },
  "PRITHLA": { code: "5980", type: "Centre", parent: null },
  "GREATER FARIDABAD": { code: "5981", type: "SubCentre", parent: "SECTOR-15-A" },
  "GURGAON": { code: "5982", type: "Centre", parent: null },
  "FARUKH NAGAR": { code: "5983", type: "SubCentre", parent: "GURGAON" },
  "PATAUDI": { code: "5984", type: "SubCentre", parent: "GURGAON" },
  "KASAN": { code: "5985", type: "Point", parent: "GURGAON" },
  "JATAULA": { code: "5986", type: "Point", parent: "GURGAON" },
  "DUNDAHERA": { code: "5987", type: "SubCentre", parent: "GURGAON" },
  "BADHA SIKENDERPUR": { code: "5988", type: "SubCentre", parent: "GURGAON" },
  "BILASPUR": { code: "5989", type: "SubCentre", parent: "GURGAON" },
  "BUDHERA": { code: "5990", type: "Point", parent: "GURGAON" },
  "SURAJ KUND": { code: "5991", type: "Centre", parent: null },
  "RAJENDRA PARK": { code: "5992", type: "Centre", parent: null },
  "PALWAL": { code: "5993", type: "Centre", parent: null },
  "BAROLI": { code: "5994", type: "Centre", parent: null },
  "NAYAGAON": { code: "5995", type: "Point", parent: "PALWAL" },
  "HATHIN": { code: "5996", type: "SubCentre", parent: "PALWAL" },
  "SIHA": { code: "5997", type: "SubCentre", parent: "PALWAL" },
  "HASANPUR": { code: "5998", type: "SubCentre", parent: "PALWAL" },
  "MANDKOLA": { code: "5999", type: "SubCentre", parent: "PALWAL" },
  "BAHIN": { code: "6000", type: "Point", parent: "PALWAL" },
  "HODAL": { code: "6001", type: "Centre", parent: null },
  "ANKHEER": { code: "6002", type: "Centre", parent: null },
  "NANGLA GUJRAN": { code: "6003", type: "Centre", parent: null },
  "TIGAON": { code: "6004", type: "Centre", parent: null },
  "NACHAULI": { code: "6005", type: "SubCentre", parent: "TIGAON" },
  "BALLABGARH": { code: "6006", type: "Centre", parent: null },
  "MACHHGAR": { code: "6007", type: "SubCentre", parent: "BALLABGARH" },
  "NIT - 2": { code: "6008", type: "Centre", parent: null },
  "MOHANA": { code: "6009", type: "Centre", parent: null },
  "FATEHPUR BILLOCH": { code: "6010", type: "Point", parent: "MOHANA" },
  "ZAIBABAD KHERLI": { code: "6011", type: "Centre", parent: null }
};

const CENTRE_TYPE_ORDER = { Centre: 0, SubCentre: 1, Point: 2 };

const CENTRE_LINE_STATUS = {
  covered: { label: "Covered", className: "status--healthy" },
  short: { label: "Short", className: "status--low" },
  missing: { label: "Missing", className: "status--out" }
};

const CENTRE_HEALTH = {
  healthy: { label: "Ready", className: "status--healthy" },
  needs: { label: "Needs stock", className: "status--low" },
  critical: { label: "Critical", className: "status--out" }
};

const ITEM_HEALTH = {
  healthy: { label: "Covered", className: "status--healthy" },
  needs: { label: "Needs stock", className: "status--low" },
  critical: { label: "Critical", className: "status--out" }
};

/* ------------------------------------------------------------------ */
/* ASO item catalogue                                                 */
/*                                                                    */
/* One shared catalogue powers both Centre Master and Item Master,    */
/* so a line shown in a centre is the same requirement shown on the   */
/* item. Quantities vary by centre; costs are per unit in INR.        */
/* ------------------------------------------------------------------ */

const CENTRE_ITEMS = [
  { id: "ci-bistra-shed", name: "Bistra Shed", sku: "ASO-SHD-001", category: "Furniture", unit: "pcs", cost: 540, reqMin: 1, reqMax: 2, reqStep: 1 },
  { id: "ci-cup", name: "Cup", sku: "ASO-CRP-002", category: "Crockery", unit: "pcs", cost: 2.75, reqMin: 24, reqMax: 72, reqStep: 6 },
  { id: "ci-plate", name: "Plate", sku: "ASO-CRP-003", category: "Crockery", unit: "pcs", cost: 4.25, reqMin: 18, reqMax: 54, reqStep: 6 },
  { id: "ci-glass", name: "Glass", sku: "ASO-CRP-004", category: "Crockery", unit: "pcs", cost: 3.4, reqMin: 18, reqMax: 48, reqStep: 6 },
  { id: "ci-spoon", name: "Spoon", sku: "ASO-CRP-005", category: "Crockery", unit: "pcs", cost: 1.2, reqMin: 30, reqMax: 90, reqStep: 6 },
  { id: "ci-paint-bucket", name: "Paint Bucket (with paint)", sku: "ASO-PNT-006", category: "Painting", unit: "pcs", cost: 24.5, reqMin: 2, reqMax: 8, reqStep: 1 },
  { id: "ci-chair-white", name: "ASO Chair — White", sku: "ASO-CHR-007", category: "Furniture", unit: "pcs", cost: 39, reqMin: 8, reqMax: 26, reqStep: 2 },
  { id: "ci-chair-grey", name: "ASO Chair — Grey", sku: "ASO-CHR-008", category: "Furniture", unit: "pcs", cost: 41.5, reqMin: 6, reqMax: 22, reqStep: 2 },
  { id: "ci-small-stool", name: "Small Stool", sku: "ASO-FUR-009", category: "Furniture", unit: "pcs", cost: 16.75, reqMin: 6, reqMax: 18, reqStep: 2 },
  { id: "ci-mobile-token", name: "Mobile Token", sku: "ASO-SEC-010", category: "Security", unit: "pcs", cost: 25, reqMin: 4, reqMax: 16, reqStep: 2 },
  { id: "ci-security-register", name: "Security Register", sku: "ASO-SEC-011", category: "Stationery", unit: "pcs", cost: 65, reqMin: 1, reqMax: 4, reqStep: 1 }
];

function centreSeed(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let value = seed >>> 0;
  return function next() {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithRandom(items, random) {
  const copy = items.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    const value = copy[index];
    copy[index] = copy[swap];
    copy[swap] = value;
  }
  return copy;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function centreSlug(name) {
  return slugify(name);
}

function itemSlug(name) {
  return slugify(name);
}

function centreLine(item, required, onHand) {
  const shortfall = Math.max(0, required - onHand);
  return {
    id: item.id,
    name: item.name,
    slug: itemSlug(item.name),
    sku: item.sku,
    category: item.category,
    unit: item.unit,
    cost: item.cost,
    required,
    onHand,
    shortfall,
    status: shortfall === 0 ? "covered" : onHand === 0 ? "missing" : "short"
  };
}

function buildCentre(name, index) {
  const meta = CENTRE_META[name] || { code: "", type: "Centre", parent: null };
  const random = seededRandom(centreSeed(name) ^ Math.imul(index + 1, 2654435761));
  const ready = index > 0 && index % 9 === 8;
  const targetShortRatio = 0.2 + random() * 0.4;

  const lines = CENTRE_ITEMS.map((item) => {
    const steps = Math.floor((item.reqMax - item.reqMin) / item.reqStep) + 1;
    const required = item.reqMin + Math.floor(random() * steps) * item.reqStep;
    let onHand;
    if (!ready && random() < targetShortRatio) {
      const shortOnHand = Math.max(0, Math.min(required - 1, Math.round(required * (0.24 + random() * 0.52))));
      onHand = random() < 0.24 ? 0 : shortOnHand;
    } else {
      onHand = required + Math.max(1, Math.round(required * (0.08 + random() * 0.18)));
    }
    return centreLine(item, required, onHand);
  });

  if (!ready) {
    const needing = lines.filter((line) => line.status !== "covered");
    if (needing.length < 2) {
      const covered = lines.filter((line) => line.status === "covered");
      for (let index2 = 0; index2 < 2 - needing.length && index2 < covered.length; index2 += 1) {
        const line = covered[index2];
        line.onHand = Math.max(0, Math.min(line.required - 1, Math.round(line.required * 0.35)));
        line.shortfall = line.required - line.onHand;
        line.status = line.onHand === 0 ? "missing" : "short";
      }
    }
  }

  const requiredUnits = lines.reduce((total, line) => total + line.required, 0);
  const onHandUnits = lines.reduce((total, line) => total + line.onHand, 0);
  const shortfallUnits = lines.reduce((total, line) => total + line.shortfall, 0);
  const coveredCount = lines.filter((line) => line.status === "covered").length;
  const shortCount = lines.filter((line) => line.status === "short").length;
  const missingCount = lines.filter((line) => line.status === "missing").length;
  const coverage = Math.round((coveredCount / lines.length) * 100);
  let status = "healthy";
  if (shortfallUnits > 0) {
    const shortfallShare = shortfallUnits / Math.max(1, requiredUnits);
    status = missingCount >= 2 || shortfallShare >= 0.4 || coveredCount / lines.length < 0.5
      ? "critical"
      : "needs";
  }

  return {
    name,
    slug: centreSlug(name),
    code: meta.code,
    type: meta.type,
    parent: meta.parent,
    areaName: CENTRE_AREA_NAME,
    incharge: "",
    inchargePhone: "",
    gmail: "",
    lines,
    requiredUnits,
    onHandUnits,
    shortfallUnits,
    coveredCount,
    shortCount,
    missingCount,
    coverage,
    status
  };
}

function buildCentreChildrenMap() {
  return CENTRES.reduce((map, centre) => {
    if (!centre.parent) return map;
    if (!map[centre.parent]) map[centre.parent] = [];
    map[centre.parent].push(centre);
    return map;
  }, {});
}

function validCentreSnapshot(value) {
  return Array.isArray(value) && value.length > 0 && value.every((centre) => (
    centre &&
    typeof centre.name === "string" &&
    typeof centre.slug === "string" &&
    typeof centre.code === "string" &&
    ["Centre", "SubCentre", "Point"].includes(centre.type) &&
    Array.isArray(centre.lines) &&
    centre.lines.length === CENTRE_ITEMS.length
  ));
}

function loadCentreSnapshot() {
  try {
    const raw = localStorage.getItem(CENTRE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (validCentreSnapshot(parsed)) return parsed;
  } catch (error) {
    console.warn("Could not read saved centre data.", error);
  }
  return null;
}

function saveCentreSnapshot() {
  try {
    localStorage.setItem(CENTRE_STORAGE_KEY, JSON.stringify(CENTRES));
  } catch (error) {
    console.warn("Could not save centre data.", error);
  }
}

let CENTRES = (loadCentreSnapshot() || CENTRE_NAMES.map(buildCentre)).map((centre) => ({
  ...centre,
  areaName: CENTRE_AREA_NAME,
  incharge: typeof centre.incharge === "string" ? centre.incharge : "",
  inchargePhone: typeof centre.inchargePhone === "string" ? centre.inchargePhone : "",
  gmail: typeof centre.gmail === "string" ? centre.gmail : ""
}));

let CENTRE_CHILDREN = buildCentreChildrenMap();

function getCentreChildren(centre) {
  return (CENTRE_CHILDREN[centre.name] || []).slice().sort((a, b) => (
    CENTRE_TYPE_ORDER[a.type] - CENTRE_TYPE_ORDER[b.type] || a.name.localeCompare(b.name)
  ));
}

function getCentreParent(centre) {
  return centre.parent ? CENTRES.find((candidate) => candidate.name === centre.parent) || null : null;
}

function uniqueCentreSlug(name, currentCentre = null) {
  const base = centreSlug(name) || "centre";
  let slug = base;
  let suffix = 2;
  while (CENTRES.some((centre) => centre !== currentCentre && centre.slug === slug)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

function nextCentreCode() {
  const highest = CENTRES.reduce((max, centre) => Math.max(max, Number(centre.code) || 0), 6000);
  return String(highest + 1).padStart(4, "0");
}

function createCentre({ name, code, type, parent, incharge, inchargePhone, gmail }) {
  const centre = buildCentre(name, CENTRES.length);
  centre.name = name;
  centre.slug = uniqueCentreSlug(name);
  centre.code = String(code || nextCentreCode());
  centre.type = type;
  centre.parent = type === "Centre" ? null : (parent || null);
  centre.incharge = String(incharge || "").trim();
  centre.inchargePhone = String(inchargePhone || "").trim();
  centre.gmail = String(gmail || "").trim();
  CENTRES.push(centre);
  rebuildCentreDerived();
  saveCentreSnapshot();
  return centre;
}

function updateCentre(originalName, { name, code, type, parent, incharge, inchargePhone, gmail }) {
  const centre = CENTRES.find((candidate) => candidate.name === originalName);
  if (!centre) return null;
  const nextName = name.trim();
  const renamed = nextName !== centre.name;
  if (renamed) {
    CENTRES.forEach((candidate) => {
      if (candidate.parent === centre.name) candidate.parent = nextName;
    });
  }
  centre.name = nextName;
  centre.slug = uniqueCentreSlug(nextName, centre);
  centre.code = String(code || centre.code);
  centre.type = type;
  centre.parent = type === "Centre" ? null : (parent || null);
  centre.incharge = String(incharge || "").trim();
  centre.inchargePhone = String(inchargePhone || "").trim();
  centre.gmail = String(gmail || "").trim();
  rebuildCentreDerived();
  saveCentreSnapshot();
  return centre;
}


function removeCentre(name) {
  const centre = CENTRES.find((candidate) => candidate.name === name);
  if (!centre || getCentreChildren(centre).length) return false;
  CENTRES = CENTRES.filter((candidate) => candidate !== centre);
  rebuildCentreDerived();
  saveCentreSnapshot();
  return true;
}

function buildCentreStats() {
  const ready = CENTRES.filter((centre) => centre.status === "healthy").length;
  const critical = CENTRES.filter((centre) => centre.status === "critical").length;
  const needs = CENTRES.filter((centre) => centre.status === "needs").length;
  return {
    total: CENTRES.length,
    centreCount: CENTRES.filter((centre) => centre.type === "Centre").length,
    subCentreCount: CENTRES.filter((centre) => centre.type === "SubCentre").length,
    pointCount: CENTRES.filter((centre) => centre.type === "Point").length,
    ready,
    needs,
    critical,
    withNeeds: needs + critical,
    trackedItems: CENTRES.reduce((total, centre) => total + centre.lines.length, 0),
    requiredUnits: CENTRES.reduce((total, centre) => total + centre.requiredUnits, 0),
    onHandUnits: CENTRES.reduce((total, centre) => total + centre.onHandUnits, 0),
    shortfallUnits: CENTRES.reduce((total, centre) => total + centre.shortfallUnits, 0)
  };
}

let CENTRE_STATS = buildCentreStats();

function findCentreBySlug(slug) {
  return CENTRES.find((centre) => centre.slug === slug) || null;
}

/* ------------------------------------------------------------------ */
/* Item Master                                                        */
/*                                                                    */
/* Derived from the same centre lines, so each item's requirement in  */
/* every centre always matches Centre Master.                         */
/* ------------------------------------------------------------------ */

function buildItemMaster() {
  return CENTRE_ITEMS.map((item) => {
    const lines = CENTRES.map((centre) => {
      const line = centre.lines.find((candidate) => candidate.id === item.id);
      return {
        centreName: centre.name,
        centreSlug: centre.slug,
        centreType: centre.type,
        centreCode: centre.code,
        centreParent: centre.parent,
        required: line.required,
        onHand: line.onHand,
        shortfall: line.shortfall,
        status: line.status
      };
    });
    const requiredUnits = lines.reduce((total, line) => total + line.required, 0);
    const onHandUnits = lines.reduce((total, line) => total + line.onHand, 0);
    const shortfallUnits = lines.reduce((total, line) => total + line.shortfall, 0);
    const coveredCount = lines.filter((line) => line.status === "covered").length;
    const missingCount = lines.filter((line) => line.status === "missing").length;
    const coverage = Math.round((coveredCount / lines.length) * 100);
    let status = "healthy";
    if (shortfallUnits > 0) {
      status = missingCount >= 4 || coverage < 50 ? "critical" : "needs";
    }
    return {
      ...item,
      slug: itemSlug(item.name),
      lines,
      requiredUnits,
      onHandUnits,
      shortfallUnits,
      coveredCount,
      shortCentreCount: lines.length - coveredCount,
      missingCentreCount: missingCount,
      coverage,
      status
    };
  });
}

let ITEMS = buildItemMaster();

function buildItemStats() {
  const withNeeds = ITEMS.filter((item) => item.status !== "healthy").length;
  return {
    total: ITEMS.length,
    ready: ITEMS.length - withNeeds,
    withNeeds,
    critical: ITEMS.filter((item) => item.status === "critical").length,
    centres: CENTRES.length,
    requiredUnits: ITEMS.reduce((total, item) => total + item.requiredUnits, 0),
    shortfallUnits: ITEMS.reduce((total, item) => total + item.shortfallUnits, 0)
  };
}

let ITEM_STATS = buildItemStats();

function rebuildCentreDerived() {
  CENTRE_CHILDREN = buildCentreChildrenMap();
  CENTRE_STATS = buildCentreStats();
  ITEMS = buildItemMaster();
  ITEM_STATS = buildItemStats();
}

function findItemBySlug(slug) {
  return ITEMS.find((item) => item.slug === slug) || null;
}

/* ------------------------------------------------------------------ */
/* Document Master                                                    */
/*                                                                    */
/* A read-only library of six reference PDFs. The files live beside    */
/* the portal under assets/documents so the workspace stays offline.  */
/* ------------------------------------------------------------------ */

const MAX_REFERENCE_DOCUMENTS = 6;

const REFERENCE_DOCUMENTS = [
  {
    title: "Stock Management System: User Guide",
    slug: "stock-system-user-guide",
    description: "Sign-in, workspace navigation, inventory controls, quick find, and access controls.",
    category: "Guide",
    fileName: "stock-system-user-guide.pdf",
    pages: 1
  },
  {
    title: "Receiving Stock: Quick Reference",
    slug: "receiving-stock-quick-reference",
    description: "Check a delivery, record a receipt, verify the new balance, and handle exceptions.",
    category: "Procedure",
    fileName: "receiving-stock-quick-reference.pdf",
    pages: 1
  },
  {
    title: "Dispatch and Issue: Quick Reference",
    slug: "dispatch-issue-quick-reference",
    description: "Confirm a request, issue stock, record the reference, and close out a dispatch.",
    category: "Procedure",
    fileName: "dispatch-issue-quick-reference.pdf",
    pages: 1
  },
  {
    title: "Physical Stock Counts: Quick Reference",
    slug: "physical-stock-count-quick-reference",
    description: "Prepare, count, record a physical count, investigate variances, and keep controls tight.",
    category: "Procedure",
    fileName: "physical-stock-count-quick-reference.pdf",
    pages: 1
  },
  {
    title: "Centre and Item Master: Reference",
    slug: "centre-item-master-reference",
    description: "How centre hierarchy, item requirements, coverage, shortfall, and health are calculated.",
    category: "Reference",
    fileName: "centre-item-master-reference.pdf",
    pages: 1
  },
  {
    title: "Roles, Permissions and Audit: Reference",
    slug: "roles-permissions-audit-reference",
    description: "Administrator and operator boundaries, server-side permissions, sessions, and what the audit trail records.",
    category: "Reference",
    fileName: "roles-permissions-audit-reference.pdf",
    pages: 1
  }
];

function referenceDocumentHref(document) {
  return `assets/documents/${document.fileName}`;
}

/* ------------------------------------------------------------------ */
/* Departments                                                        */
/*                                                                    */
/* Departments group the shared catalogue by how stock is used. An    */
/* item can belong to more than one department (the ASO chairs serve  */
/* both Pandal and ASO), so department totals count assignments.      */
/* ------------------------------------------------------------------ */

const DEPARTMENT_SEEDS = [
  {
    id: "pandal",
    name: "Pandal",
    description: "Seating, shelter, and floor furniture for the pandal.",
    itemIds: ["ci-bistra-shed", "ci-chair-white", "ci-chair-grey", "ci-small-stool"]
  },
  {
    id: "aso",
    name: "ASO",
    description: "ASO chairs used for office and duty seating.",
    itemIds: ["ci-chair-white", "ci-chair-grey"]
  },
  {
    id: "canteen-kitchen",
    name: "Canteen / Kitchen",
    description: "Crockery and service stock for the canteen and kitchen.",
    itemIds: ["ci-cup", "ci-plate", "ci-glass", "ci-spoon"]
  },
  {
    id: "security",
    name: "Security",
    description: "Mobile tokens and registers used to note information at the gate.",
    itemIds: ["ci-mobile-token", "ci-security-register"]
  },
  {
    id: "store",
    name: "Store",
    description: "Paint and maintenance stock held in the store.",
    itemIds: ["ci-paint-bucket"]
  }
];

function buildDepartmentLocations(items) {
  const map = new Map();
  for (const item of items) {
    for (const line of item.lines) {
      if (!map.has(line.centreSlug)) {
        map.set(line.centreSlug, {
          centreName: line.centreName,
          centreSlug: line.centreSlug,
          centreType: line.centreType,
          centreCode: line.centreCode,
          required: 0,
          onHand: 0,
          shortfall: 0,
          lineCount: 0,
          coveredCount: 0
        });
      }
      const row = map.get(line.centreSlug);
      row.required += line.required;
      row.onHand += line.onHand;
      row.shortfall += line.shortfall;
      row.lineCount += 1;
      if (line.status === "covered") row.coveredCount += 1;
    }
  }
  return [...map.values()].map((row) => ({
    ...row,
    coverage: Math.round((row.coveredCount / Math.max(1, row.lineCount)) * 100),
    status: row.shortfall === 0 ? "covered" : row.onHand === 0 ? "missing" : "short"
  })).sort((a, b) => b.shortfall - a.shortfall || a.centreName.localeCompare(b.centreName));
}

function buildDepartment(seed) {
  const items = seed.itemIds
    .map((id) => ITEMS.find((item) => item.id === id))
    .filter(Boolean);
  const lines = items.flatMap((item) => item.lines);
  const requiredUnits = items.reduce((total, item) => total + item.requiredUnits, 0);
  const onHandUnits = items.reduce((total, item) => total + item.onHandUnits, 0);
  const shortfallUnits = items.reduce((total, item) => total + item.shortfallUnits, 0);
  const coveredCount = lines.filter((line) => line.status === "covered").length;
  const shortCount = lines.filter((line) => line.status === "short").length;
  const missingCount = lines.filter((line) => line.status === "missing").length;
  const coverage = lines.length ? Math.round((coveredCount / lines.length) * 100) : 100;
  const locations = buildDepartmentLocations(items);
  const affectedLocations = locations.filter((location) => location.shortfall > 0).length;
  const withNeeds = items.filter((item) => item.status !== "healthy").length;
  let status = "healthy";
  if (shortfallUnits > 0) {
    status = coverage < 55 || missingCount / Math.max(1, lines.length) >= 0.12 ? "critical" : "needs";
  }
  return {
    ...seed,
    slug: seed.id,
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
    affectedLocations,
    withNeeds,
    status
  };
}

const DEPARTMENTS = DEPARTMENT_SEEDS.map(buildDepartment);

const DEPARTMENT_STATS = {
  total: DEPARTMENTS.length,
  items: new Set(DEPARTMENTS.flatMap((dept) => dept.items.map((item) => item.id))).size,
  assignments: DEPARTMENTS.reduce((total, dept) => total + dept.itemCount, 0),
  lines: DEPARTMENTS.reduce((total, dept) => total + dept.lines.length, 0),
  withNeeds: DEPARTMENTS.filter((dept) => dept.status !== "healthy").length,
  ready: DEPARTMENTS.filter((dept) => dept.status === "healthy").length,
  critical: DEPARTMENTS.filter((dept) => dept.status === "critical").length,
  shortfallUnits: DEPARTMENTS.reduce((total, dept) => total + dept.shortfallUnits, 0)
};

function findDepartmentBySlug(slug) {
  return DEPARTMENTS.find((dept) => dept.slug === slug) || null;
}

function departmentsForItem(item) {
  return DEPARTMENTS.filter((dept) => dept.itemIds.includes(item.id));
}

const ui = {
  route: "overview",
  centreSlug: null,
  itemSlug: null,
  departmentSlug: null,
  centres: { q: "", status: "all", type: "all", sort: "name", dir: "asc" },
  items: { q: "", status: "all" },
  departments: { q: "", status: "all" },
  inventory: { q: "", category: "all", supplier: "all", status: "all", sort: "name", dir: "asc" },
  movements: { q: "", type: "all" },
  adjust: { productId: null, type: "in" },
  palette: { index: 0, results: [] },
  pendingConfirm: null,
  flashProductId: null,
  lastFocus: null
};

/* ------------------------------------------------------------------ */
/* Derived data                                                       */
/* ------------------------------------------------------------------ */

function getProduct(id) {
  return state.products.find((product) => product.id === id) || null;
}

function attentionProducts() {
  return state.products
    .filter((product) => statusOf(product) !== "healthy")
    .sort((a, b) => {
      const aRatio = a.stock / Math.max(1, a.reorder);
      const bRatio = b.stock / Math.max(1, b.reorder);
      if (statusOf(a) === "out" && statusOf(b) !== "out") return -1;
      if (statusOf(b) === "out" && statusOf(a) !== "out") return 1;
      return aRatio - bRatio || a.name.localeCompare(b.name);
    });
}

function getStats() {
  const products = state.products;
  const units = products.reduce((total, p) => total + Number(p.stock), 0);
  const value = products.reduce((total, p) => total + Number(p.stock) * Number(p.cost), 0);
  const retail = products.reduce((total, p) => total + Number(p.stock) * Number(p.price), 0);
  const low = products.filter((p) => statusOf(p) === "low").length;
  const out = products.filter((p) => statusOf(p) === "out").length;
  return {
    skus: products.length,
    units,
    value,
    retail,
    low,
    out,
    attention: low + out,
    categories: new Set(products.map((p) => p.category)).size,
    suppliers: new Set(products.map((p) => p.supplier)).size
  };
}

function categoryBreakdown() {
  const map = new Map();
  for (const product of state.products) {
    if (!map.has(product.category)) map.set(product.category, { name: product.category, units: 0, value: 0, count: 0 });
    const row = map.get(product.category);
    row.units += Number(product.stock);
    row.value += Number(product.stock) * Number(product.cost);
    row.count += 1;
  }
  return [...map.values()].sort((a, b) => b.value - a.value);
}

function supplierBreakdown() {
  const map = new Map();
  for (const product of state.products) {
    if (!map.has(product.supplier)) {
      map.set(product.supplier, {
        name: product.supplier,
        count: 0,
        units: 0,
        value: 0,
        low: 0,
        lowItems: []
      });
    }
    const row = map.get(product.supplier);
    row.count += 1;
    row.units += Number(product.stock);
    row.value += Number(product.stock) * Number(product.cost);
    if (statusOf(product) !== "healthy") {
      row.low += 1;
      row.lowItems.push(product);
    }
  }
  return [...map.values()].sort((a, b) => {
    if (a.low !== b.low) return b.low - a.low;
    return a.name.localeCompare(b.name);
  });
}

function lastSevenDaysFlow() {
  const days = [];
  const now = new Date();
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    days.push({
      key: dayKey(date),
      date,
      label: offset === 0 ? "Today" : new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date),
      dateLabel: offset === 0 ? "Today" : `${new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date)} ${date.getDate()}`,
      in: 0,
      out: 0
    });
  }
  const lookup = Object.fromEntries(days.map((day) => [day.key, day]));
  const since = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).getTime();
  for (const movement of state.movements) {
    const time = new Date(movement.at).getTime();
    if (time < since) continue;
    const bucket = lookup[dayKey(movement.at)];
    if (!bucket) continue;
    if (movement.type === "in") bucket.in += Math.abs(Number(movement.qty));
    if (movement.type === "out") bucket.out += Math.abs(Number(movement.qty));
  }
  const totalIn = days.reduce((total, day) => total + day.in, 0);
  const totalOut = days.reduce((total, day) => total + day.out, 0);
  return { days, totalIn, totalOut, net: totalIn - totalOut };
}

function recentMovements(limit = 6) {
  return [...state.movements]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, limit);
}

function movementIcon(type) {
  if (type === "in") return "i-in";
  if (type === "out") return "i-out";
  return "i-sliders";
}

function movementLabel(type) {
  if (type === "in") return "Received";
  if (type === "out") return "Dispatched";
  return "Adjusted";
}

function signedQty(qty, type) {
  const value = Number(qty);
  if (type === "out") return `−${num(Math.abs(value))}`;
  if (type === "adjust") return value > 0 ? `+${num(value)}` : `−${num(Math.abs(value))}`;
  return `+${num(Math.abs(value))}`;
}

function qtyClass(type) {
  if (type === "in") return "qty-in";
  if (type === "adjust") return "qty-adjust";
  return "qty-out";
}

function railMarkup(product, width = "") {
  const status = statusOf(product);
  const reorder = Math.max(1, Number(product.reorder));
  const max = Math.max(reorder * 2.4, Number(product.stock), 1);
  const fill = Math.max(0, Math.min(100, (Number(product.stock) / max) * 100));
  const tick = Math.max(0, Math.min(100, (reorder / max) * 100));
  return `<span class="stock-rail ${width}" aria-hidden="true"><span class="stock-rail__fill is-${status}" style="width:${fill.toFixed(1)}%"></span><span class="stock-rail__tick" style="left:${tick.toFixed(1)}%"></span></span>`;
}

function attentionSummary() {
  const stats = getStats();
  if (stats.attention === 0) return "All stock above reorder point.";
  const bits = [];
  if (stats.low) bits.push(`${stats.low} low`);
  if (stats.out) bits.push(`${stats.out} out of stock`);
  return bits.join(" · ");
}

/* ------------------------------------------------------------------ */
/* Chrome, routing, toasts                                            */
/* ------------------------------------------------------------------ */

const PAGE_TITLES = { overview: "Overview", inventory: "Inventory", movements: "Movements", suppliers: "Suppliers", departments: "Departments", centres: "Centre Master", items: "Item Master", documents: "Document Master" };

const MASTER_ROUTES = new Set(["centres", "items", "documents"]);
let mastersMenu = { route: null, open: false };

const LOCKABLE_SECTIONS = ["overview", "inventory", "movements", "suppliers", "departments", "centres", "items"];
const LOCK_SECTION_LABELS = {
  overview: "Overview",
  inventory: "Inventory",
  movements: "Movements",
  suppliers: "Suppliers",
  departments: "Departments",
  centres: "Centre Master",
  items: "Item Master"
};

function readSectionLocks() {
  try {
    const raw = localStorage.getItem(LOCK_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(LOCKABLE_SECTIONS.map((section) => [section, parsed[section] === true]));
  } catch (error) {
    console.warn("Could not read section locks.", error);
    return {};
  }
}

let sectionLocks = readSectionLocks();

function isSectionLocked(section = ui.route) {
  return sectionLocks[section] === true;
}

function saveSectionLocks() {
  try {
    localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(sectionLocks));
  } catch (error) {
    console.warn("Could not save section locks.", error);
  }
}

function setSectionLock(section, locked) {
  if (!LOCKABLE_SECTIONS.includes(section)) return false;
  sectionLocks = { ...sectionLocks, [section]: Boolean(locked) };
  saveSectionLocks();
  return true;
}

function getCentreSlugFromHash() {
  const raw = location.hash.replace(/^#\/?/, "").split("?")[0];
  const match = raw.match(/^centres\/([^/]+)\/?$/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch (error) {
    return match[1];
  }
}

function getItemSlugFromHash() {
  const raw = location.hash.replace(/^#\/?/, "").split("?")[0];
  const match = raw.match(/^items\/([^/]+)\/?$/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch (error) {
    return match[1];
  }
}

function getDepartmentSlugFromHash() {
  const raw = location.hash.replace(/^#\/?/, "").split("?")[0];
  const match = raw.match(/^departments\/([^/]+)\/?$/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch (error) {
    return match[1];
  }
}

function getRouteFromHash() {
  const raw = location.hash.replace(/^#\/?/, "").split("?")[0].replace(/\/+$/, "");
  if (raw === "departments" || raw.startsWith("departments/")) return "departments";
  if (raw === "centres" || raw.startsWith("centres/")) return "centres";
  if (raw === "items" || raw.startsWith("items/")) return "items";
  return PAGE_TITLES[raw] ? raw : "overview";
}

function currentCentre() {
  return ui.centreSlug ? findCentreBySlug(ui.centreSlug) : null;
}

function currentItem() {
  return ui.itemSlug ? findItemBySlug(ui.itemSlug) : null;
}

function currentDepartment() {
  return ui.departmentSlug ? findDepartmentBySlug(ui.departmentSlug) : null;
}

function pageTitle() {
  const department = ui.route === "departments" ? currentDepartment() : null;
  if (department) return department.name;
  const centre = ui.route === "centres" ? currentCentre() : null;
  if (centre) return centre.name;
  const item = ui.route === "items" ? currentItem() : null;
  return item ? item.name : PAGE_TITLES[ui.route];
}

function navigate(route) {
  const target = `#/${route}`;
  if (location.hash === target) {
    if (ui.route === route) render();
    return;
  }
  location.hash = target;
}

function updateNav() {
  document.querySelectorAll("[data-nav]").forEach((link) => {
    const isActive = link.dataset.nav === ui.route;
    link.classList.toggle("is-active", isActive);
    if (isActive) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  const group = document.querySelector("[data-masters-group]");
  if (!group) return;
  const open = mastersMenu.route === ui.route ? mastersMenu.open : MASTER_ROUTES.has(ui.route);
  group.classList.toggle("is-open", open);
  group.classList.toggle("is-active", MASTER_ROUTES.has(ui.route));
  const toggle = group.querySelector("[data-action='toggle-masters']");
  if (toggle) toggle.setAttribute("aria-expanded", String(open));
}

function toggleMastersGroup() {
  const open = mastersMenu.route === ui.route ? mastersMenu.open : MASTER_ROUTES.has(ui.route);
  mastersMenu = { route: ui.route, open: !open };
  updateNav();
}

function pageSubtitle() {
  if (ui.route === "overview") return formatDateLong();
  if (ui.route === "departments") {
    const department = currentDepartment();
    if (ui.departmentSlug && !department) return "That department is not in the master list";
    if (department) {
      return `${department.itemCount} ${plural(department.itemCount, "item")} · ${department.affectedLocations ? `${department.affectedLocations} locations need stock` : "all requirements covered"}`;
    }
    return `${DEPARTMENT_STATS.total} departments · ${DEPARTMENT_STATS.assignments} item assignments · ${num(DEPARTMENT_STATS.shortfallUnits)} units short`;
  }
  if (ui.route === "centres") {
    const centre = currentCentre();
    if (ui.centreSlug && !centre) return "That centre is not in the master list";
    if (centre) {
      const needing = centre.shortCount + centre.missingCount;
      return `${centre.lines.length} ${plural(centre.lines.length, "item")} tracked · ${needing ? `${needing} need restocking` : "all requirements covered"}`;
    }
    return `${CENTRE_STATS.total} locations · ${CENTRE_STATS.withNeeds} need stock · ${num(CENTRE_STATS.shortfallUnits)} units short`;
  }
  if (ui.route === "items") {
    const item = currentItem();
    if (ui.itemSlug && !item) return "That item is not in the master catalogue";
    if (item) {
      return `${money(item.cost, 2)} unit cost · ${item.shortCentreCount} of ${item.lines.length} locations need stock`;
    }
    return `${ITEM_STATS.total} items · ${ITEM_STATS.withNeeds} need stock · ${num(ITEM_STATS.shortfallUnits)} units short`;
  }
  if (ui.route === "documents") {
    const categories = new Set(REFERENCE_DOCUMENTS.map((document) => document.category)).size;
    return `${REFERENCE_DOCUMENTS.length} reference PDFs · ${categories} ${plural(categories, "category", "categories")} · read-only library`;
  }
  const stats = getStats();
  if (ui.route === "inventory") {
    const base = `${stats.skus} ${plural(stats.skus, "product")} across ${stats.categories} ${plural(stats.categories, "category", "categories")}`;
    return stats.attention ? `${base} · ${stats.attention} need restock` : base;
  }
  if (ui.route === "movements") return "Audit trail for every stock change";
  const suppliers = supplierBreakdown();
  const withAlerts = suppliers.filter((supplier) => supplier.low > 0).length;
  return `${suppliers.length} supply ${plural(suppliers.length, "partner")} · ${withAlerts} with restock items`;
}

function renderChrome() {
  const title = pageTitle();
  const department = ui.route === "departments" ? currentDepartment() : null;
  const centre = ui.route === "centres" ? currentCentre() : null;
  const item = ui.route === "items" ? currentItem() : null;
  const titleEl = document.getElementById("page-title");
  const subtitleEl = document.getElementById("page-subtitle");
  if (titleEl) titleEl.textContent = title;
  if (subtitleEl) subtitleEl.textContent = pageSubtitle();
  document.title = department
    ? `${department.name} · Departments · Stock Management System`
    : centre
      ? `${centre.name} · Centre Master · Stock Management System`
      : item
        ? `${item.name} · Item Master · Stock Management System`
        : `${title} · Stock Management System`;
  updateNav();
  syncAttention();
  renderNotifications();
  syncLockUI();
}

function syncLockUI() {
  const locked = isSectionLocked(ui.route);
  const label = LOCK_SECTION_LABELS[ui.route] || "Section";
  const banner = document.getElementById("section-lock-banner");
  if (banner) {
    banner.hidden = !locked;
    const title = banner.querySelector("[data-lock-title]");
    if (title) title.textContent = `${label} is locked`;
    const copy = banner.querySelector("[data-lock-copy]");
    if (copy) {
      copy.textContent = isAdministrator()
        ? "Adding, editing, and removing records is paused for everyone. Use Unlock section in the top bar to resume."
        : "An administrator has paused adding, editing, and removing records in this section. You can still browse everything.";
    }
  }
  const button = document.querySelector("[data-action='toggle-section-lock']");
  if (button) {
    button.hidden = !isAdministrator() || !LOCKABLE_SECTIONS.includes(ui.route);
    button.classList.toggle("is-locked", locked);
    button.setAttribute("aria-pressed", String(locked));
    button.setAttribute("aria-label", locked ? `Unlock section for ${label}` : `Lock section for ${label}`);
    button.title = locked ? `Unlock ${label} — administrators only` : `Lock ${label} — administrators only`;
    const text = button.querySelector("[data-lock-label]");
    if (text) text.textContent = locked ? "Unlock section" : "Lock section";
    const use = button.querySelector("use");
    if (use) use.setAttribute("href", locked ? "#i-unlock" : "#i-lock");
  }
  document.body.dataset.sectionLocked = locked ? "true" : "false";
  document.body.dataset.lockedSection = locked ? ui.route : "";
}

function syncAttention() {
  const stats = getStats();
  const items = attentionProducts();
  document.querySelectorAll("[data-attention-count]").forEach((el) => {
    el.textContent = stats.attention;
  });
  const side = document.querySelector("[data-side-attention]");
  if (side) {
    side.classList.toggle("is-clear", stats.attention === 0);
    const copy = side.querySelector("[data-attention-copy]");
    if (copy) {
      copy.textContent = stats.attention === 0
        ? "Everything is above its reorder point."
        : `${stats.low} low · ${stats.out} out of stock`;
    }
    const strong = side.querySelector("strong");
    if (strong) strong.innerHTML = stats.attention === 0
      ? "No restock needed"
      : `<span data-attention-count>${stats.attention}</span> items need restock`;
  }
  const dot = document.querySelector("[data-notif-dot]");
  if (dot) dot.hidden = items.length === 0;
  const count = document.querySelector("[data-palette-count]");
  if (count) count.textContent = `${state.products.length} ${plural(state.products.length, "product")}`;
}

function renderNotifications() {
  const items = attentionProducts();
  const list = document.querySelector("[data-notif-list]");
  const caption = document.querySelector("[data-notif-caption]");
  if (caption) caption.textContent = items.length ? `${items.length} below reorder point` : "Nothing below reorder point";
  if (!list) return;
  if (!items.length) {
    list.innerHTML = `<div class="notif-empty">No stock alerts. Every shelf is above its reorder point.</div>`;
    return;
  }
  list.innerHTML = items.slice(0, 4).map((product) => {
    const status = statusOf(product);
    return `
      <button class="notif-item" type="button" data-action="receive-stock" data-id="${esc(product.id)}">
        <span class="tile tile--tiny tile--${categoryClass(product.category)}" aria-hidden="true">${esc(initials(product.name))}</span>
        <span class="notif-item__main">
          <strong>${esc(product.name)}</strong>
          <span>${esc(product.stock)} on hand · reorder at ${esc(product.reorder)}</span>
        </span>
        <span class="notif-item__qty ${status === "out" ? "is-out" : ""}">${status === "out" ? "Out" : "Low"}</span>
      </button>`;
  }).join("");
}

function render() {
  renderChrome();
  const app = document.getElementById("app");
  if (!app) return;
  if (ui.route === "overview") app.innerHTML = overviewTemplate();
  else if (ui.route === "inventory") app.innerHTML = inventoryTemplate();
  else if (ui.route === "movements") app.innerHTML = movementsTemplate();
  else if (ui.route === "suppliers") app.innerHTML = suppliersTemplate();
  else if (ui.route === "departments") app.innerHTML = ui.departmentSlug ? departmentDetailTemplate() : departmentsTemplate();
  else if (ui.route === "centres") app.innerHTML = ui.centreSlug ? centreDetailTemplate() : centresTemplate();
  else if (ui.route === "items") app.innerHTML = ui.itemSlug ? itemDetailTemplate() : itemsTemplate();
  else if (ui.route === "documents") app.innerHTML = documentsTemplate();
  afterRender();
}

function afterRender() {
  if (ui.route === "inventory") wireInventory();
  if (ui.route === "movements") wireMovements();
  if (ui.route === "departments" && !ui.departmentSlug) wireDepartments();
  if (ui.route === "centres" && !ui.centreSlug) wireCentreMasterPage();
  if (ui.route === "overview") wireCentres();
  if (ui.route === "items" && !ui.itemSlug) wireItems();
  if (ui.flashProductId) {
    const row = document.querySelector(`tr[data-id="${CSS.escape(ui.flashProductId)}"]`);
    if (row) {
      row.classList.add("is-flash");
      row.scrollIntoView({ block: "center", behavior: "smooth" });
      setTimeout(() => row.classList.remove("is-flash"), 1700);
    }
    ui.flashProductId = null;
  }
}

let toastCounter = 0;
function showToast(title, detail = "", type = "success") {
  const stack = document.getElementById("toast-stack");
  if (!stack) return;
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.dataset.toastId = String(++toastCounter);
  const icon = type === "error" ? "i-alert" : type === "info" ? "i-receipt" : "i-check";
  toast.innerHTML = `
    <span class="toast__icon" aria-hidden="true"><svg class="icon"><use href="#${icon}"/></svg></span>
    <span class="toast__main"><strong>${esc(title)}</strong>${detail ? `<span>${esc(detail)}</span>` : ""}</span>
    <button class="toast__close" type="button" aria-label="Dismiss notification"><svg class="icon" aria-hidden="true"><use href="#i-close"/></svg></button>`;
  stack.appendChild(toast);
  const remove = () => {
    toast.classList.add("is-leaving");
    setTimeout(() => toast.remove(), 170);
  };
  const timeout = setTimeout(remove, 4500);
  toast.querySelector(".toast__close").addEventListener("click", () => {
    clearTimeout(timer);
    remove();
  });
  const timer = timeout;
  while (stack.children.length > 3) stack.firstElementChild.remove();
}

function flashProduct(id) {
  ui.flashProductId = id;
}
