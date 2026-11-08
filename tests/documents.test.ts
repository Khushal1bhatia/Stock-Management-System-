import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import {
  MAX_REFERENCE_DOCUMENTS,
  REFERENCE_DOCUMENTS
} from "../src/lib/reference-documents";

const documentDir = path.join(process.cwd(), "private", "documents");

describe("reference document library", () => {
  it("holds exactly the six allowed documents", () => {
    assert.equal(REFERENCE_DOCUMENTS.length, MAX_REFERENCE_DOCUMENTS);
    assert.equal(MAX_REFERENCE_DOCUMENTS, 6);
  });

  it("uses unique titles, slugs, and file names", () => {
    assert.equal(new Set(REFERENCE_DOCUMENTS.map((item) => item.title)).size, REFERENCE_DOCUMENTS.length);
    assert.equal(new Set(REFERENCE_DOCUMENTS.map((item) => item.slug)).size, REFERENCE_DOCUMENTS.length);
    assert.equal(new Set(REFERENCE_DOCUMENTS.map((item) => item.fileName)).size, REFERENCE_DOCUMENTS.length);
  });

  it("keeps file names safe and PDF-only", () => {
    for (const document of REFERENCE_DOCUMENTS) {
      assert.match(document.fileName, /^[a-z0-9]+(?:-[a-z0-9]+)*\.pdf$/);
      assert.equal(path.basename(document.fileName), document.fileName);
      assert.ok(document.pages >= 1, `${document.slug} must declare at least one page`);
      assert.ok(["Guide", "Procedure", "Reference"].includes(document.category));
    }
  });

  it("ships every listed PDF in the private library", () => {
    for (const document of REFERENCE_DOCUMENTS) {
      const filePath = path.join(documentDir, document.fileName);
      assert.ok(existsSync(filePath), `Missing PDF: ${document.fileName}`);
      assert.equal(readFileSync(filePath).subarray(0, 5).toString("latin1"), "%PDF-");
    }
  });
});
