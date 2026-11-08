import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  adjustSchema,
  changePasswordSchema,
  inventoryFilterSchema,
  loginSchema,
  movementFilterSchema,
  productSchema,
  updateProductSchema,
  zodFieldErrors
} from "../src/lib/validation";

const validProduct = {
  name: "Aeris Wireless Headphones",
  sku: "aud-4821",
  category: "Audio",
  supplierId: "supplier-1",
  unit: "pcs",
  cost: "78.00",
  price: "129.00",
  openingStock: "4",
  reorder: "2"
};

describe("login schema", () => {
  it("trims the username and accepts a password", () => {
    const result = loginSchema.parse({ username: "  aso.admin  ", password: "secret" });
    assert.equal(result.username, "aso.admin");
    assert.equal(result.password, "secret");
  });

  it("rejects empty credentials", () => {
    assert.equal(loginSchema.safeParse({ username: "  ", password: "x" }).success, false);
    assert.equal(loginSchema.safeParse({ username: "aso.admin", password: "" }).success, false);
  });

  it("rejects overlong input", () => {
    assert.equal(loginSchema.safeParse({ username: "a".repeat(41), password: "x" }).success, false);
    assert.equal(loginSchema.safeParse({ username: "aso.admin", password: "a".repeat(129) }).success, false);
  });
});

describe("change password schema", () => {
  const valid = {
    currentPassword: "old-password-1",
    newPassword: "correcthorse1",
    confirmPassword: "correcthorse1"
  };

  it("accepts a matching, strong-enough password", () => {
    assert.equal(changePasswordSchema.safeParse(valid).success, true);
  });

  it("requires at least 12 characters", () => {
    assert.equal(
      changePasswordSchema.safeParse({ ...valid, newPassword: "short1", confirmPassword: "short1" }).success,
      false
    );
  });

  it("requires a letter and a number", () => {
    assert.equal(
      changePasswordSchema.safeParse({ ...valid, newPassword: "onlyletters!!", confirmPassword: "onlyletters!!" }).success,
      false
    );
    assert.equal(
      changePasswordSchema.safeParse({ ...valid, newPassword: "123456789012", confirmPassword: "123456789012" }).success,
      false
    );
  });

  it("reports mismatched confirmation on the confirm field", () => {
    const result = changePasswordSchema.safeParse({ ...valid, confirmPassword: "correcthorse2" });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(zodFieldErrors(result.error).confirmPassword, "The new passwords do not match.");
    }
  });
});

describe("product schema", () => {
  it("normalizes the SKU and coerces numeric fields", () => {
    const result = productSchema.parse(validProduct);
    assert.equal(result.sku, "AUD-4821");
    assert.equal(result.cost, 78);
    assert.equal(result.price, 129);
    assert.equal(result.openingStock, 4);
    assert.equal(result.reorder, 2);
  });

  it("defaults opening stock to zero", () => {
    const withoutOpeningStock = Object.fromEntries(
      Object.entries(validProduct).filter(([key]) => key !== "openingStock")
    );
    assert.equal(productSchema.parse(withoutOpeningStock).openingStock, 0);
  });

  it("rejects unknown categories, units, and invalid SKUs", () => {
    assert.equal(productSchema.safeParse({ ...validProduct, category: "Garden" }).success, false);
    assert.equal(productSchema.safeParse({ ...validProduct, unit: "kg" }).success, false);
    assert.equal(productSchema.safeParse({ ...validProduct, sku: "AUD 4821" }).success, false);
    assert.equal(productSchema.safeParse({ ...validProduct, sku: "-AUD" }).success, false);
  });

  it("rejects negative stock and fractional reorder points", () => {
    assert.equal(productSchema.safeParse({ ...validProduct, openingStock: -1 }).success, false);
    assert.equal(productSchema.safeParse({ ...validProduct, reorder: 1.5 }).success, false);
  });

  it("rejects an overlong name", () => {
    assert.equal(productSchema.safeParse({ ...validProduct, name: "a".repeat(81) }).success, false);
  });

  it("does not allow opening stock when updating", () => {
    const result = updateProductSchema.safeParse(validProduct);
    assert.equal(result.success, true);
    if (result.success) assert.equal("openingStock" in result.data, false);
  });
});

describe("stock adjustment schema", () => {
  it("coerces quantity and defaults optional text", () => {
    const result = adjustSchema.parse({ productId: "p1", type: "in", qty: "6" });
    assert.equal(result.qty, 6);
    assert.equal(result.reference, "");
    assert.equal(result.note, "");
  });

  it("rejects unknown types and negative quantities", () => {
    assert.equal(adjustSchema.safeParse({ productId: "p1", type: "move", qty: 1 }).success, false);
    assert.equal(adjustSchema.safeParse({ productId: "p1", type: "in", qty: -1 }).success, false);
    assert.equal(adjustSchema.safeParse({ productId: "p1", type: "in", qty: 1.5 }).success, false);
  });

  it("caps overlong text fields", () => {
    assert.equal(
      adjustSchema.safeParse({ productId: "p1", type: "in", qty: 1, reference: "a".repeat(25) }).success,
      false
    );
    assert.equal(adjustSchema.safeParse({ productId: "p1", type: "in", qty: 1, note: "a".repeat(81) }).success, false);
  });
});

describe("filter schemas", () => {
  it("falls back instead of failing on bad inventory filters", () => {
    const result = inventoryFilterSchema.parse({
      q: "lamp",
      category: "Lighting",
      supplier: "All",
      status: "nonsense",
      sort: "nonsense",
      dir: "sideways",
      page: "0"
    });
    assert.deepEqual(result, {
      q: "lamp",
      category: "Lighting",
      supplier: "All",
      status: "all",
      sort: "name",
      dir: "asc",
      page: 1
    });
  });

  it("accepts valid inventory filters", () => {
    const result = inventoryFilterSchema.parse({
      q: "",
      category: "all",
      supplier: "all",
      status: "attention",
      sort: "stock",
      dir: "desc",
      page: "3"
    });
    assert.equal(result.status, "attention");
    assert.equal(result.sort, "stock");
    assert.equal(result.dir, "desc");
    assert.equal(result.page, 3);
  });

  it("falls back on bad movement filters", () => {
    assert.deepEqual(
      movementFilterSchema.parse({ q: "PO-1", type: "nonsense", page: "-2" }),
      { q: "PO-1", type: "all", page: 1 }
    );
  });
});

describe("field errors", () => {
  it("keeps only the first message per field", () => {
    const result = loginSchema.safeParse({ username: "", password: "" });
    assert.equal(result.success, false);
    if (!result.success) {
      const errors = zodFieldErrors(result.error);
      assert.equal(errors.username, "Enter your username.");
      assert.equal(errors.password, "Enter your password.");
    }
  });
});
