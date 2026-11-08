import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  categoryClass,
  initials,
  railMetrics,
  statusClass,
  statusLabel,
  statusOf,
  toProductView
} from "../src/lib/products";

describe("stock status", () => {
  it("marks zero and negative stock as out", () => {
    assert.equal(statusOf(0, 10), "out");
    assert.equal(statusOf(-4, 10), "out");
  });

  it("marks stock at or below the reorder point as low", () => {
    assert.equal(statusOf(10, 10), "low");
    assert.equal(statusOf(1, 10), "low");
  });

  it("marks stock above the reorder point as healthy", () => {
    assert.equal(statusOf(11, 10), "healthy");
    assert.equal(statusOf(100, 0), "healthy");
  });

  it("returns matching labels and classes", () => {
    assert.equal(statusLabel("out"), "Out of stock");
    assert.equal(statusLabel("low"), "Low stock");
    assert.equal(statusLabel("healthy"), "Healthy");
    assert.equal(statusClass("out"), "status--out");
    assert.equal(statusClass("low"), "status--low");
    assert.equal(statusClass("healthy"), "status--healthy");
  });
});

describe("stock rail metrics", () => {
  it("maps an empty product to a zero fill", () => {
    assert.deepEqual(railMetrics(0, 0), { fill: 0, tick: 100 / 2.4 });
  });

  it("fills the rail when stock reaches the scale maximum", () => {
    assert.deepEqual(railMetrics(24, 10), { fill: 100, tick: (10 / 24) * 100 });
  });

  it("positions the reorder tick proportionally", () => {
    const metrics = railMetrics(5, 10);
    assert.equal(metrics.fill, (5 / 24) * 100);
    assert.equal(metrics.tick, (10 / 24) * 100);
  });

  it("never exceeds 100 percent", () => {
    assert.deepEqual(railMetrics(500, 10), { fill: 100, tick: 2 });
  });

  it("clamps negative stock to zero fill", () => {
    assert.deepEqual(railMetrics(-5, 10), { fill: 0, tick: (10 / 24) * 100 });
  });
});

describe("product presentation helpers", () => {
  it("maps known categories and falls back to storage", () => {
    assert.equal(categoryClass("Audio"), "audio");
    assert.equal(categoryClass("Workspace"), "workspace");
    assert.equal(categoryClass("Unknown"), "storage");
  });

  it("builds two-letter initials", () => {
    assert.equal(initials("Sam Okafor"), "SO");
    assert.equal(initials("Harbor & Co."), "HC");
    assert.equal(initials("Avery"), "A");
  });

  it("converts a database row into a product view", () => {
    const updatedAt = new Date("2026-01-02T03:04:05.000Z");
    const view = toProductView({
      id: "p1",
      name: "Desk Lamp",
      sku: "LGT-1",
      category: "Lighting",
      supplierId: "s1",
      supplier: { name: "Harbor & Co." },
      unit: "pcs",
      costCents: 3400,
      priceCents: 6900,
      stock: 9,
      reorder: 12,
      updatedAt
    });

    assert.deepEqual(view, {
      id: "p1",
      name: "Desk Lamp",
      sku: "LGT-1",
      category: "Lighting",
      supplierId: "s1",
      supplierName: "Harbor & Co.",
      unit: "pcs",
      costCents: 3400,
      priceCents: 6900,
      stock: 9,
      reorder: 12,
      updatedAt: updatedAt.toISOString(),
      status: "low"
    });
  });
});
