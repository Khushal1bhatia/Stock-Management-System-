import "server-only";
import { prisma } from "@/lib/db";
import {
  MAX_REFERENCE_DOCUMENTS,
  REFERENCE_DOCUMENTS
} from "@/lib/reference-documents";
import type { DocumentView } from "@/lib/types";

export { MAX_REFERENCE_DOCUMENTS };

/** The reference library is intentionally capped at six PDFs. */
export async function getReferenceDocuments(): Promise<DocumentView[]> {
  const rows = await prisma.document.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    take: MAX_REFERENCE_DOCUMENTS
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    category: row.category,
    fileName: row.fileName,
    pages: row.pages,
    href: `/documents/${row.fileName}`
  }));
}

/**
 * Looks up a document by its stored file name. The route only serves files
 * registered in the database, which prevents arbitrary reads from the
 * private documents directory.
 */
export async function findReferenceDocument(fileName: string) {
  if (!fileName || fileName.length > 160) return null;

  const row = await prisma.document.findFirst({
    where: { fileName },
    select: { fileName: true, title: true }
  });

  if (!row) return null;

  // The seed list defines every legal file name. Reject stale database rows
  // that point at anything outside the library naming convention.
  const known = REFERENCE_DOCUMENTS.some((document) => document.fileName === row.fileName);
  return known ? row : null;
}
