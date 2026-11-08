import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  centreHealthOf,
  centreTypeClass,
  coverageOf,
  departmentHealthOf,
  itemHealthOf,
  lineStatusOf,
  locationStatusOf
} from "../src/lib/master";
import {
  DEFAULT_CENTRE_FILTERS,
  DEFAULT_DEPARTMENT_FILTERS,
  DEFAULT_ITEM_FILTERS,
  centreHref,
  departmentHref,
  itemHref,
  parseCentreFilters,
  parseDepartmentFilters,
  parseItemFilters
} from "../src/lib/url";

describe("master-data status helpers", () => {
  it("classifies requirement lines by on-hand cover", () => {
    assert.equal(lineStatusOf(10, 10), "covered");
    assert.equal(lineStatusOf(10, 12), "covered");
    assert.equal(lineStatusOf(10, 0), "missing");
    assert.equal(lineStatusOf(10, 4), "short");
  });

  it("classifies location cover from shortfall and on hand", () => {
    assert.equal(locationStatusOf(0, 5), "covered");
    assert.equal(locationStatusOf(4, 0), "missing");
    assert.equal(locationStatusOf(4, 5), "short");
  });

  it("rounds coverage and treats an empty set as fully covered", () => {
    assert.equal(coverageOf(0, 0), 100);
    assert.equal(coverageOf(1, 3), 33);
    assert.equal(coverageOf(2, 3), 67);
  });

  it("marks a centre healthy only when nothing is short", () => {
    const base = { requiredUnits: 100, shortfallUnits: 0, coveredCount: 10, missingCount: 0, lineCount: 10 };
    assert.equal(centreHealthOf(base), "healthy");
    assert.equal(centreHealthOf({ ...base, shortfallUnits: 5, coveredCount: 8 }), "needs");
    assert.equal(centreHealthOf({ ...base, shortfallUnits: 5, coveredCount: 8, missingCount: 2 }), "critical");
    assert.equal(centreHealthOf({ ...base, shortfallUnits: 50, coveredCount: 8 }), "critical");
    assert.equal(centreHealthOf({ ...base, shortfallUnits: 5, coveredCount: 4 }), "critical");
  });

  it("marks items critical for wide misses or low coverage", () => {
    assert.equal(itemHealthOf({ shortfallUnits: 0, missingCount: 0, coverage: 100 }), "healthy");
    assert.equal(itemHealthOf({ shortfallUnits: 2, missingCount: 1, coverage: 80 }), "needs");
    assert.equal(itemHealthOf({ shortfallUnits: 2, missingCount: 4, coverage: 80 }), "critical");
    assert.equal(itemHealthOf({ shortfallUnits: 2, missingCount: 1, coverage: 49 }), "critical");
  });

  it("marks departments critical for low cover or missing-line share", () => {
    assert.equal(departmentHealthOf({ shortfallUnits: 0, coverage: 100, missingCount: 0, lineCount: 20 }), "healthy");
    assert.equal(departmentHealthOf({ shortfallUnits: 2, coverage: 80, missingCount: 1, lineCount: 20 }), "needs");
    assert.equal(departmentHealthOf({ shortfallUnits: 2, coverage: 50, missingCount: 1, lineCount: 20 }), "critical");
    assert.equal(departmentHealthOf({ shortfallUnits: 2, coverage: 80, missingCount: 3, lineCount: 20 }), "critical");
  });

  it("normalizes centre type classes", () => {
    assert.equal(centreTypeClass("SubCentre"), "subcentre");
    assert.equal(centreTypeClass("Point"), "point");
    assert.equal(centreTypeClass(""), "centre");
  });
});

describe("master filter parsing", () => {
  it("returns defaults for an empty query", () => {
    assert.deepEqual(parseCentreFilters({}), DEFAULT_CENTRE_FILTERS);
    assert.deepEqual(parseItemFilters({}), DEFAULT_ITEM_FILTERS);
    assert.deepEqual(parseDepartmentFilters({}), DEFAULT_DEPARTMENT_FILTERS);
  });

  it("trims text and uses the first repeated value", () => {
    assert.deepEqual(parseCentreFilters({ q: ["  dlf ", "gurgaon"], type: "Point" }), {
      q: "dlf",
      status: "all",
      type: "Point"
    });
    assert.equal(parseItemFilters({ q: " chair " }).q, "chair");
    assert.equal(parseDepartmentFilters({ q: ["canteen", "store"] }).q, "canteen");
  });

  it("falls back on invalid master filters", () => {
    assert.deepEqual(parseCentreFilters({ status: "broken", type: "broken" }), DEFAULT_CENTRE_FILTERS);
    assert.deepEqual(parseItemFilters({ status: "broken" }), DEFAULT_ITEM_FILTERS);
    assert.deepEqual(parseDepartmentFilters({ status: "broken" }), DEFAULT_DEPARTMENT_FILTERS);
  });
});

describe("master links", () => {
  it("uses bare paths for default filters", () => {
    assert.equal(centreHref(DEFAULT_CENTRE_FILTERS), "/centres");
    assert.equal(itemHref(DEFAULT_ITEM_FILTERS), "/items");
    assert.equal(departmentHref(DEFAULT_DEPARTMENT_FILTERS), "/departments");
  });

  it("serializes q, status, and type in a stable order", () => {
    assert.equal(
      centreHref(DEFAULT_CENTRE_FILTERS, { q: "dlf city", status: "needs", type: "Centre" }),
      "/centres?q=dlf+city&status=needs&type=Centre"
    );
    assert.equal(itemHref(DEFAULT_ITEM_FILTERS, { q: "chair", status: "ready" }), "/items?q=chair&status=ready");
    assert.equal(
      departmentHref(DEFAULT_DEPARTMENT_FILTERS, { q: "pandal", status: "needs" }),
      "/departments?q=pandal&status=needs"
    );
  });

  it("keeps filters while patching one value", () => {
    const centreFilters = parseCentreFilters({ q: "dlf", type: "SubCentre" });
    assert.equal(
      centreHref(centreFilters, { status: "needs" }),
      "/centres?q=dlf&status=needs&type=SubCentre"
    );
    const itemFilters = parseItemFilters({ q: "chair" });
    assert.equal(itemHref(itemFilters, { status: "ready" }), "/items?q=chair&status=ready");
  });
});
