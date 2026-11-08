-- CreateTable
CREATE TABLE "Centre" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Centre',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Centre_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Centre" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CatalogueItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "costCents" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CentreRequirement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "centreId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "required" INTEGER NOT NULL,
    "onHand" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CentreRequirement_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Centre" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CentreRequirement_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CatalogueItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DepartmentItem" (
    "departmentId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,

    PRIMARY KEY ("departmentId", "itemId"),
    CONSTRAINT "DepartmentItem_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DepartmentItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CatalogueItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Centre_name_key" ON "Centre"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Centre_slug_key" ON "Centre"("slug");

-- CreateIndex
CREATE INDEX "Centre_type_idx" ON "Centre"("type");

-- CreateIndex
CREATE INDEX "Centre_parentId_idx" ON "Centre"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogueItem_slug_key" ON "CatalogueItem"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogueItem_sku_key" ON "CatalogueItem"("sku");

-- CreateIndex
CREATE INDEX "CatalogueItem_category_idx" ON "CatalogueItem"("category");

-- CreateIndex
CREATE INDEX "CatalogueItem_name_idx" ON "CatalogueItem"("name");

-- CreateIndex
CREATE INDEX "CentreRequirement_itemId_idx" ON "CentreRequirement"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "CentreRequirement_centreId_itemId_key" ON "CentreRequirement"("centreId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_slug_key" ON "Department"("slug");

-- CreateIndex
CREATE INDEX "Department_name_idx" ON "Department"("name");

-- CreateIndex
CREATE INDEX "DepartmentItem_itemId_idx" ON "DepartmentItem"("itemId");
