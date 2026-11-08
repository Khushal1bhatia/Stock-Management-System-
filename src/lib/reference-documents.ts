/**
 * Reference library metadata. The seed writes these rows into the Document
 * table, and the PDF generator in scripts/ reads the same list, so a document
 * cannot be listed without a matching file.
 */
export const MAX_REFERENCE_DOCUMENTS = 6;

export type ReferenceDocument = {
  title: string;
  slug: string;
  description: string;
  category: "Guide" | "Procedure" | "Reference";
  fileName: string;
  pages: number;
};

export const REFERENCE_DOCUMENTS = [
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
] as const satisfies readonly ReferenceDocument[];
