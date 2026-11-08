import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { REFERENCE_DOCUMENTS } from "../src/lib/reference-documents";

const prisma = new PrismaClient();

const HOUR = 60 * 60 * 1000;

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * HOUR);
}

const suppliers = [
  { name: "Northwind Supply", contact: "Dana Whitfield", email: "dana@northwindsupply.co", leadDays: 5, initials: "NS" },
  { name: "Kestrel Trading", contact: "Marco Lin", email: "marco@kestreltrading.com", leadDays: 7, initials: "KT" },
  { name: "Harbor & Co.", contact: "Priya Shah", email: "priya@harborco.com", leadDays: 3, initials: "HC" },
  { name: "Meridian Wholesale", contact: "Jonas Reed", email: "jonas@meridianwholesale.com", leadDays: 10, initials: "MW" },
  { name: "Atlas Goods", contact: "Elif Demir", email: "elif@atlasgoods.co", leadDays: 4, initials: "AG" }
];

const products = [
  { sku: "AUD-4821", name: "Aeris Wireless Headphones", category: "Audio", supplier: "Northwind Supply", unit: "pcs", costCents: 7800, priceCents: 12900, stock: 124, reorder: 40 },
  { sku: "AUD-1904", name: "Kestrel Studio Monitors", category: "Audio", supplier: "Northwind Supply", unit: "pairs", costCents: 14600, priceCents: 24900, stock: 18, reorder: 20 },
  { sku: "AUD-7730", name: "Nimbus Bluetooth Speaker", category: "Audio", supplier: "Kestrel Trading", unit: "pcs", costCents: 4200, priceCents: 7900, stock: 0, reorder: 15 },
  { sku: "LGT-2210", name: "Meridian Desk Lamp", category: "Lighting", supplier: "Harbor & Co.", unit: "pcs", costCents: 3400, priceCents: 6900, stock: 56, reorder: 20 },
  { sku: "LGT-3382", name: "Halo Task Light", category: "Lighting", supplier: "Harbor & Co.", unit: "pcs", costCents: 5800, priceCents: 11900, stock: 9, reorder: 12 },
  { sku: "FUR-1108", name: "Vale Ergonomic Chair", category: "Workspace", supplier: "Meridian Wholesale", unit: "pcs", costCents: 18900, priceCents: 34900, stock: 23, reorder: 8 },
  { sku: "FUR-2044", name: "Ridge Standing Desk", category: "Workspace", supplier: "Meridian Wholesale", unit: "pcs", costCents: 31000, priceCents: 59900, stock: 7, reorder: 5 },
  { sku: "WRK-5561", name: "Fold Laptop Riser", category: "Workspace", supplier: "Atlas Goods", unit: "pcs", costCents: 1800, priceCents: 3900, stock: 84, reorder: 30 },
  { sku: "ACC-8820", name: "Loop Cable Organizer", category: "Accessories", supplier: "Atlas Goods", unit: "packs", costCents: 450, priceCents: 1200, stock: 212, reorder: 60 },
  { sku: "ACC-4417", name: "Arc USB-C Hub", category: "Accessories", supplier: "Kestrel Trading", unit: "pcs", costCents: 2900, priceCents: 5900, stock: 31, reorder: 25 },
  { sku: "ACC-1290", name: "Slate Laptop Sleeve 14\"", category: "Accessories", supplier: "Atlas Goods", unit: "pcs", costCents: 1600, priceCents: 3500, stock: 0, reorder: 20 },
  { sku: "ACC-6673", name: "Orbit Wireless Mouse", category: "Accessories", supplier: "Kestrel Trading", unit: "pcs", costCents: 2100, priceCents: 4500, stock: 67, reorder: 25 },
  { sku: "STO-3305", name: "Stack Storage Bin", category: "Storage", supplier: "Harbor & Co.", unit: "boxes", costCents: 900, priceCents: 2200, stock: 145, reorder: 50 },
  { sku: "STO-7742", name: "Archive Document Box", category: "Storage", supplier: "Harbor & Co.", unit: "boxes", costCents: 700, priceCents: 1600, stock: 12, reorder: 18 },
  { sku: "AUD-5529", name: "Riff Podcast Microphone", category: "Audio", supplier: "Northwind Supply", unit: "pcs", costCents: 6400, priceCents: 11900, stock: 26, reorder: 10 },
  { sku: "WRK-2081", name: "Beacon Monitor Arm", category: "Workspace", supplier: "Meridian Wholesale", unit: "pcs", costCents: 4800, priceCents: 9500, stock: 4, reorder: 10 },
  { sku: "WRK-9940", name: "Drift Whiteboard 900", category: "Workspace", supplier: "Atlas Goods", unit: "pcs", costCents: 3700, priceCents: 7900, stock: 19, reorder: 8 },
  { sku: "ACC-7712", name: "Pulse Power Strip", category: "Accessories", supplier: "Kestrel Trading", unit: "pcs", costCents: 1400, priceCents: 2900, stock: 58, reorder: 20 },
  { sku: "ACC-3048", name: "Kite Desk Pad", category: "Accessories", supplier: "Atlas Goods", unit: "pcs", costCents: 1100, priceCents: 2600, stock: 73, reorder: 30 }
];

const centreNames = [
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
] as const;

const centreMeta: Record<string, { code: string; type: string; parent: string | null }> = {
  "DLF CITY GURGAON": { code: "5971", type: "Centre", parent: null },
  ABHEYPUR: { code: "5972", type: "Point", parent: "DLF CITY GURGAON" },
  SOHNA: { code: "5973", type: "SubCentre", parent: "DLF CITY GURGAON" },
  NUH: { code: "5974", type: "Point", parent: "DLF CITY GURGAON" },
  "FIROZPUR JHIRKA": { code: "5975", type: "Centre", parent: null },
  PUNAHANA: { code: "5976", type: "SubCentre", parent: "DLF CITY GURGAON" },
  TAORU: { code: "5977", type: "Centre", parent: null },
  "SECTOR-15-A": { code: "5978", type: "Centre", parent: null },
  DHATIR: { code: "5979", type: "SubCentre", parent: "SECTOR-15-A" },
  PRITHLA: { code: "5980", type: "Centre", parent: null },
  "GREATER FARIDABAD": { code: "5981", type: "SubCentre", parent: "SECTOR-15-A" },
  GURGAON: { code: "5982", type: "Centre", parent: null },
  "FARUKH NAGAR": { code: "5983", type: "SubCentre", parent: "GURGAON" },
  PATAUDI: { code: "5984", type: "SubCentre", parent: "GURGAON" },
  KASAN: { code: "5985", type: "Point", parent: "GURGAON" },
  JATAULA: { code: "5986", type: "Point", parent: "GURGAON" },
  DUNDAHERA: { code: "5987", type: "SubCentre", parent: "GURGAON" },
  "BADHA SIKENDERPUR": { code: "5988", type: "SubCentre", parent: "GURGAON" },
  BILASPUR: { code: "5989", type: "SubCentre", parent: "GURGAON" },
  BUDHERA: { code: "5990", type: "Point", parent: "GURGAON" },
  "SURAJ KUND": { code: "5991", type: "Centre", parent: null },
  "RAJENDRA PARK": { code: "5992", type: "Centre", parent: null },
  PALWAL: { code: "5993", type: "Centre", parent: null },
  BAROLI: { code: "5994", type: "Centre", parent: null },
  NAYAGAON: { code: "5995", type: "Point", parent: "PALWAL" },
  HATHIN: { code: "5996", type: "SubCentre", parent: "PALWAL" },
  SIHA: { code: "5997", type: "SubCentre", parent: "PALWAL" },
  HASANPUR: { code: "5998", type: "SubCentre", parent: "PALWAL" },
  MANDKOLA: { code: "5999", type: "SubCentre", parent: "PALWAL" },
  BAHIN: { code: "6000", type: "Point", parent: "PALWAL" },
  HODAL: { code: "6001", type: "Centre", parent: null },
  ANKHEER: { code: "6002", type: "Centre", parent: null },
  "NANGLA GUJRAN": { code: "6003", type: "Centre", parent: null },
  TIGAON: { code: "6004", type: "Centre", parent: null },
  NACHAULI: { code: "6005", type: "SubCentre", parent: "TIGAON" },
  BALLABGARH: { code: "6006", type: "Centre", parent: null },
  MACHHGAR: { code: "6007", type: "SubCentre", parent: "BALLABGARH" },
  "NIT - 2": { code: "6008", type: "Centre", parent: null },
  MOHANA: { code: "6009", type: "Centre", parent: null },
  "FATEHPUR BILLOCH": { code: "6010", type: "Point", parent: "MOHANA" },
  "ZAIBABAD KHERLI": { code: "6011", type: "Centre", parent: null }
};

const catalogueItems = [
  { key: "ci-bistra-shed", name: "Bistra Shed", sku: "ASO-SHD-001", category: "Furniture", unit: "pcs", costCents: 54000, reqMin: 1, reqMax: 2, reqStep: 1 },
  { key: "ci-cup", name: "Cup", sku: "ASO-CRP-002", category: "Crockery", unit: "pcs", costCents: 275, reqMin: 24, reqMax: 72, reqStep: 6 },
  { key: "ci-plate", name: "Plate", sku: "ASO-CRP-003", category: "Crockery", unit: "pcs", costCents: 425, reqMin: 18, reqMax: 54, reqStep: 6 },
  { key: "ci-glass", name: "Glass", sku: "ASO-CRP-004", category: "Crockery", unit: "pcs", costCents: 340, reqMin: 18, reqMax: 48, reqStep: 6 },
  { key: "ci-spoon", name: "Spoon", sku: "ASO-CRP-005", category: "Crockery", unit: "pcs", costCents: 120, reqMin: 30, reqMax: 90, reqStep: 6 },
  { key: "ci-paint-bucket", name: "Paint Bucket (with paint)", sku: "ASO-PNT-006", category: "Painting", unit: "pcs", costCents: 2450, reqMin: 2, reqMax: 8, reqStep: 1 },
  { key: "ci-chair-white", name: "ASO Chair — White", sku: "ASO-CHR-007", category: "Furniture", unit: "pcs", costCents: 3900, reqMin: 8, reqMax: 26, reqStep: 2 },
  { key: "ci-chair-grey", name: "ASO Chair — Grey", sku: "ASO-CHR-008", category: "Furniture", unit: "pcs", costCents: 4150, reqMin: 6, reqMax: 22, reqStep: 2 },
  { key: "ci-small-stool", name: "Small Stool", sku: "ASO-FUR-009", category: "Furniture", unit: "pcs", costCents: 1675, reqMin: 6, reqMax: 18, reqStep: 2 },
  { key: "ci-mobile-token", name: "Mobile Token", sku: "ASO-SEC-010", category: "Security", unit: "pcs", costCents: 2500, reqMin: 4, reqMax: 16, reqStep: 2 },
  { key: "ci-security-register", name: "Security Register", sku: "ASO-SEC-011", category: "Stationery", unit: "pcs", costCents: 6500, reqMin: 1, reqMax: 4, reqStep: 1 }
];

const departmentSeeds = [
  {
    id: "pandal",
    name: "Pandal",
    description: "Seating, shelter, and floor furniture for the pandal.",
    itemKeys: ["ci-bistra-shed", "ci-chair-white", "ci-chair-grey", "ci-small-stool"]
  },
  {
    id: "aso",
    name: "ASO",
    description: "ASO chairs used for office and duty seating.",
    itemKeys: ["ci-chair-white", "ci-chair-grey"]
  },
  {
    id: "canteen-kitchen",
    name: "Canteen / Kitchen",
    description: "Crockery and service stock for the canteen and kitchen.",
    itemKeys: ["ci-cup", "ci-plate", "ci-glass", "ci-spoon"]
  },
  {
    id: "security",
    name: "Security",
    description: "Mobile tokens and registers used to note information at the gate.",
    itemKeys: ["ci-mobile-token", "ci-security-register"]
  },
  {
    id: "store",
    name: "Store",
    description: "Paint and maintenance stock held in the store.",
    itemKeys: ["ci-paint-bucket"]
  }
];

function slugify(value: string) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function centreSeed(text: string) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return function next() {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildCentreLines(index: number, name: string) {
  const random = seededRandom(centreSeed(name) ^ Math.imul(index + 1, 2654435761));
  const ready = index > 0 && index % 9 === 8;
  const targetShortRatio = 0.2 + random() * 0.4;

  const lines = catalogueItems.map((item) => {
    const steps = Math.floor((item.reqMax - item.reqMin) / item.reqStep) + 1;
    const required = item.reqMin + Math.floor(random() * steps) * item.reqStep;
    let onHand: number;
    if (!ready && random() < targetShortRatio) {
      const shortOnHand = Math.max(0, Math.min(required - 1, Math.round(required * (0.24 + random() * 0.52))));
      onHand = random() < 0.24 ? 0 : shortOnHand;
    } else {
      onHand = required + Math.max(1, Math.round(required * (0.08 + random() * 0.18)));
    }
    return { item, required, onHand };
  });

  if (!ready) {
    const needing = lines.filter((line) => line.onHand < line.required);
    if (needing.length < 2) {
      const covered = lines.filter((line) => line.onHand >= line.required);
      for (let coveredIndex = 0; coveredIndex < 2 - needing.length && coveredIndex < covered.length; coveredIndex += 1) {
        const line = covered[coveredIndex];
        line.onHand = Math.max(0, Math.min(line.required - 1, Math.round(line.required * 0.35)));
      }
    }
  }

  return lines;
}

const movements = [
  ["AUD-4821", "in", 60, 2.2, "PO-2481", "Weekly replenishment", "Avery Morgan"],
  ["ACC-6673", "out", -8, 3.5, "SO-8821", "Order #8821", "Sam Okafor"],
  ["LGT-3382", "out", -3, 5.2, "SO-8820", "Order #8820", "Nina Patel"],
  ["AUD-7730", "in", 24, 6.8, "PO-2479", "Supplier delivery", "Avery Morgan"],
  ["LGT-2210", "out", -6, 8.9, "SO-8817", "Order #8817", "Sam Okafor"],
  ["ACC-8820", "in", 120, 21.5, "PO-2478", "Weekly replenishment", "Avery Morgan"],
  ["STO-7742", "out", -5, 25.8, "SO-8814", "Order #8814", "Nina Patel"],
  ["ACC-1290", "out", -6, 27.4, "SO-8813", "Order #8813", "Sam Okafor"],
  ["FUR-2044", "in", 5, 30.2, "PO-2476", "Floor model return", "Avery Morgan"],
  ["ACC-4417", "out", -9, 32.9, "SO-8810", "Order #8810", "Nina Patel"],
  ["AUD-7730", "out", -14, 46.4, "SO-8806", "Order #8806", "Sam Okafor"],
  ["AUD-1904", "adjust", -4, 48.6, "COUNT-118", "Cycle count correction", "Avery Morgan"],
  ["STO-3305", "in", 80, 54.3, "PO-2472", "Bulk delivery", "Avery Morgan"],
  ["FUR-1108", "out", -2, 58.1, "SO-8802", "Order #8802", "Nina Patel"],
  ["AUD-5529", "in", 18, 69.9, "PO-2469", "Supplier delivery", "Avery Morgan"],
  ["ACC-3048", "out", -12, 72.6, "SO-8798", "Order #8798", "Sam Okafor"],
  ["STO-7742", "in", 30, 78.2, "PO-2467", "Monthly restock", "Avery Morgan"],
  ["LGT-3382", "in", 12, 93.7, "PO-2463", "Supplier delivery", "Avery Morgan"],
  ["WRK-5561", "out", -18, 96.5, "SO-8793", "Order #8793", "Nina Patel"],
  ["ACC-1290", "out", -7, 101.8, "SO-8791", "Order #8791", "Sam Okafor"],
  ["ACC-3048", "out", -8, 117.9, "SO-8786", "Order #8786", "Sam Okafor"],
  ["WRK-2081", "adjust", -2, 120.4, "COUNT-109", "Cycle count correction", "Nina Patel"],
  ["ACC-7712", "out", -15, 126.1, "SO-8782", "Order #8782", "Nina Patel"],
  ["LGT-2210", "in", 24, 129.8, "PO-2451", "Supplier delivery", "Avery Morgan"],
  ["AUD-4821", "out", -10, 138.6, "SO-8779", "Order #8779", "Sam Okafor"],
  ["AUD-1904", "out", -6, 141.2, "SO-8778", "Order #8778", "Nina Patel"],
  ["AUD-7730", "adjust", -1, 145.4, "COUNT-104", "Damaged unit write-off", "Avery Morgan"],
  ["STO-3305", "out", -20, 149.7, "SO-8774", "Order #8774", "Sam Okafor"]
] as const;

async function main() {
  const adminUsername = (process.env.SEED_ADMIN_USERNAME || "aso.admin").trim().toLowerCase();
  const operatorUsername = (process.env.SEED_OPERATOR_USERNAME || "aso.user").trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const operatorPassword = process.env.SEED_OPERATOR_PASSWORD;

  if (!adminPassword || adminPassword.length < 12 || !operatorPassword || operatorPassword.length < 12) {
    throw new Error("Set SEED_ADMIN_PASSWORD and SEED_OPERATOR_PASSWORD (12+ characters) in .env before seeding.");
  }

  console.log("Resetting local development data…");
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.movement.deleteMany(),
    prisma.session.deleteMany(),
    prisma.departmentItem.deleteMany(),
    prisma.centreRequirement.deleteMany(),
    prisma.department.deleteMany(),
    prisma.document.deleteMany(),
    prisma.catalogueItem.deleteMany(),
    prisma.centre.deleteMany(),
    prisma.product.deleteMany(),
    prisma.supplier.deleteMany(),
    prisma.user.deleteMany()
  ]);

  const [adminHash, operatorHash] = await Promise.all([
    hashPassword(adminPassword),
    hashPassword(operatorPassword)
  ]);

  const admin = await prisma.user.create({
    data: {
      username: adminUsername,
      name: process.env.SEED_ADMIN_NAME || "Avery Morgan",
      initials: "AM",
      passwordHash: adminHash,
      role: "ADMIN"
    }
  });

  const operator = await prisma.user.create({
    data: {
      username: operatorUsername,
      name: process.env.SEED_OPERATOR_NAME || "Sam Okafor",
      initials: "SO",
      passwordHash: operatorHash,
      role: "OPERATOR"
    }
  });

  const supplierRows = new Map<string, string>();
  for (const supplier of suppliers) {
    const row = await prisma.supplier.create({ data: supplier });
    supplierRows.set(row.name, row.id);
  }

  const productRows = new Map<string, { id: string; name: string; unit: string }>();
  for (const [index, product] of products.entries()) {
    const supplierId = supplierRows.get(product.supplier);
    if (!supplierId) throw new Error(`Missing supplier ${product.supplier}`);

    const row = await prisma.product.create({
      data: {
        name: product.name,
        sku: product.sku,
        category: product.category,
        supplierId,
        unit: product.unit,
        costCents: product.costCents,
        priceCents: product.priceCents,
        stock: product.stock,
        reorder: product.reorder,
        updatedAt: hoursAgo(2 + index * 1.7)
      }
    });
    productRows.set(row.sku, { id: row.id, name: row.name, unit: row.unit });
  }

  const actorIds: Record<string, string | null> = {
    "Avery Morgan": admin.id,
    "Sam Okafor": operator.id,
    "Nina Patel": null
  };

  for (const [sku, type, qty, hours, reference, note, actorName] of movements) {
    const product = productRows.get(sku);
    if (!product) throw new Error(`Missing product ${sku}`);

    await prisma.movement.create({
      data: {
        productId: product.id,
        productName: product.name,
        sku,
        unit: product.unit,
        type,
        qty,
        reference,
        note,
        actorId: actorIds[actorName] ?? null,
        actorName,
        createdAt: hoursAgo(hours)
      }
    });
  }

  const itemIdByKey = new Map<string, string>();
  for (const [index, item] of catalogueItems.entries()) {
    const row = await prisma.catalogueItem.create({
      data: {
        name: item.name,
        slug: slugify(item.name),
        sku: item.sku,
        category: item.category,
        unit: item.unit,
        costCents: item.costCents,
        sortOrder: index
      }
    });
    itemIdByKey.set(item.key, row.id);
  }

  const centreIdByName = new Map<string, string>();
  for (const [index, name] of centreNames.entries()) {
    const meta = centreMeta[name] ?? { code: "", type: "Centre", parent: null };
    const row = await prisma.centre.create({
      data: {
        name,
        slug: slugify(name),
        code: meta.code,
        type: meta.type,
        sortOrder: index
      }
    });
    centreIdByName.set(name, row.id);
  }

  for (const name of centreNames) {
    const parentName = centreMeta[name]?.parent;
    if (!parentName) continue;
    const parentId = centreIdByName.get(parentName);
    if (!parentId) throw new Error(`Missing parent centre ${parentName}`);
    await prisma.centre.update({ where: { name }, data: { parentId } });
  }

  const requirementRows = [];
  let requiredUnitTotal = 0;
  let shortfallUnitTotal = 0;
  for (const [index, name] of centreNames.entries()) {
    const centreId = centreIdByName.get(name);
    if (!centreId) throw new Error(`Missing centre ${name}`);

    for (const line of buildCentreLines(index, name)) {
      const itemId = itemIdByKey.get(line.item.key);
      if (!itemId) throw new Error(`Missing catalogue item ${line.item.name}`);
      requirementRows.push({
        centreId,
        itemId,
        required: line.required,
        onHand: line.onHand
      });
      requiredUnitTotal += line.required;
      shortfallUnitTotal += Math.max(0, line.required - line.onHand);
    }
  }
  await prisma.centreRequirement.createMany({ data: requirementRows });

  let assignmentCount = 0;
  for (const [index, department] of departmentSeeds.entries()) {
    await prisma.department.create({
      data: {
        id: department.id,
        name: department.name,
        slug: department.id,
        description: department.description,
        sortOrder: index
      }
    });

    await prisma.departmentItem.createMany({
      data: department.itemKeys.map((key) => {
        const itemId = itemIdByKey.get(key);
        if (!itemId) throw new Error(`Missing department item ${key}`);
        assignmentCount += 1;
        return { departmentId: department.id, itemId };
      })
    });
  }

  await prisma.document.createMany({
    data: REFERENCE_DOCUMENTS.map((document, index) => ({ ...document, sortOrder: index }))
  });

  console.log(`Seeded ${products.length} products, ${movements.length} movements, ${suppliers.length} suppliers.`);
  console.log(
    `Seeded ${centreNames.length} centres, ${catalogueItems.length} catalogue items, ${requirementRows.length} requirement lines, and ${departmentSeeds.length} departments.`
  );
  console.log(`Master totals: ${requiredUnitTotal} units required, ${shortfallUnitTotal} units short, ${assignmentCount} department assignments.`);
  console.log(`Reference library: ${REFERENCE_DOCUMENTS.length} PDFs (maximum 6).`);
  console.log(`Admin account: ${adminUsername}`);
  console.log(`Operator account: ${operatorUsername}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
