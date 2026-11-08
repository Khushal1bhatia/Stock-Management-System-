import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_INVENTORY_FILTERS,
  DEFAULT_MOVEMENT_FILTERS,
  exportHref,
  inventoryHref,
  movementHref,
  parseInventoryFilters,
  parseMovementFilters
} from "../src/lib/url";

describe("inventory filter parsing", () => {
  it("returns defaults for an empty query", () => {
    assert.deepEqual(parseInventoryFilters({}), DEFAULT_INVENTORY_FILTERS);
  });

  it("uses the first value of repeated parameters", () => {
    assert.equal(parseInventoryFilters({ q: ["lamp", "desk"] }).q, "lamp");
    assert.equal(parseInventoryFilters({ page: ["2", "4"] }).page, 2);
  });

  it("trims text and converts the page number", () => {
    const filters = parseInventoryFilters({ q: "  lamp ", category: "Lighting", page: "3" });
    assert.equal(filters.q, "lamp");
    assert.equal(filters.category, "Lighting");
    assert.equal(filters.page, 3);
  });

  it("falls back to defaults for invalid values", () => {
    const filters = parseInventoryFilters({
      status: "broken",
      sort: "broken",
      dir: "broken",
      page: "0"
    });
    assert.equal(filters.status, "all");
    assert.equal(filters.sort, "name");
    assert.equal(filters.dir, "asc");
    assert.equal(filters.page, 1);
  });
});

describe("movement filter parsing", () => {
  it("returns defaults for an empty query", () => {
    assert.deepEqual(parseMovementFilters({}), DEFAULT_MOVEMENT_FILTERS);
  });

  it("parses valid values", () => {
    assert.deepEqual(parseMovementFilters({ q: "PO-1", type: "in", page: "2" }), {
      q: "PO-1",
      type: "in",
      page: 2
    });
  });

  it("falls back for invalid values", () => {
    assert.deepEqual(parseMovementFilters({ type: "sideways", page: "x" }), DEFAULT_MOVEMENT_FILTERS);
  });
});

describe("inventory links", () => {
  it("uses the bare path for default filters", () => {
    assert.equal(inventoryHref(DEFAULT_INVENTORY_FILTERS), "/inventory");
  });

  it("serializes non-default filters in a stable order", () => {
    const href = inventoryHref(DEFAULT_INVENTORY_FILTERS, {
      q: "desk lamp",
      category: "Lighting",
      supplier: "Harbor & Co.",
      status: "low",
      sort: "stock",
      dir: "desc",
      page: 2
    });
    assert.equal(
      href,
      "/inventory?q=desk+lamp&category=Lighting&supplier=Harbor+%26+Co.&status=low&sort=stock&dir=desc&page=2"
    );
  });

  it("omits the first page and default sorting", () => {
    assert.equal(inventoryHref(DEFAULT_INVENTORY_FILTERS, { q: "lamp", page: 1 }), "/inventory?q=lamp");
  });

  it("keeps filters while patching one value", () => {
    const base = parseInventoryFilters({ q: "lamp", category: "Lighting" });
    assert.equal(
      inventoryHref(base, { page: 3 }),
      "/inventory?q=lamp&category=Lighting&page=3"
    );
  });
});

describe("movement links", () => {
  it("uses the bare path for default filters", () => {
    assert.equal(movementHref(DEFAULT_MOVEMENT_FILTERS), "/movements");
  });

  it("serializes q, type, and page", () => {
    assert.equal(
      movementHref(DEFAULT_MOVEMENT_FILTERS, { q: "PO-1", type: "in", page: 4 }),
      "/movements?q=PO-1&type=in&page=4"
    );
  });
});

describe("export links", () => {
  it("uses the bare API path for default filters", () => {
    assert.equal(exportHref(DEFAULT_INVENTORY_FILTERS), "/api/inventory/export");
  });

  it("passes supported filters and omits the page", () => {
    const filters = parseInventoryFilters({
      q: "lamp",
      category: "Lighting",
      status: "attention",
      page: "3"
    });
    assert.equal(
      exportHref(filters),
      "/api/inventory/export?q=lamp&category=Lighting&status=attention"
    );
  });
});
