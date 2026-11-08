import type { Metadata } from "next";
import { getReferenceDocuments, MAX_REFERENCE_DOCUMENTS } from "@/lib/documents";
import { DocumentCard } from "@/components/master-ui";
import { Icon } from "@/components/icons";

export const metadata: Metadata = { title: "Document Master" };

export default async function DocumentsPage() {
  const documents = await getReferenceDocuments();
  const categories = new Set(documents.map((document) => document.category)).size;
  const pages = documents.reduce((total, document) => total + document.pages, 0);

  return (
    <div className="view">
      <div className="page-tools">
        <p className="page-tools__note">
          Signed-in users can open every reference PDF. The document master is a read-only library and
          is capped at {MAX_REFERENCE_DOCUMENTS} documents.
        </p>
        <div className="page-tools__actions">
          <span className="lead-chip">
            <Icon name="i-document" />
            {documents.length} of {MAX_REFERENCE_DOCUMENTS} reference PDFs
          </span>
        </div>
      </div>

      <section className="doc-summary" aria-label="Document master summary">
        <div className="doc-summary__cell">
          <span>Reference PDFs</span>
          <strong>{documents.length}</strong>
          <em>limit {MAX_REFERENCE_DOCUMENTS} documents</em>
        </div>
        <div className="doc-summary__cell">
          <span>Categories</span>
          <strong>{categories}</strong>
          <em>guides, procedures, references</em>
        </div>
        <div className="doc-summary__cell">
          <span>Pages</span>
          <strong>{pages}</strong>
          <em>across the library</em>
        </div>
        <div className="doc-summary__cell">
          <span>Format</span>
          <strong>PDF</strong>
          <em>opens in a new tab</em>
        </div>
      </section>

      <section className="panel docs-panel" aria-label="Document master list">
        <div className="panel__head">
          <div>
            <h2 className="panel__title">Reference library</h2>
            <p className="panel__sub">
              Guides and quick references for receiving, dispatching, counting, and master data. Only the
              six listed PDFs are part of this library.
            </p>
          </div>
          <span className="lead-chip">
            <Icon name="i-lock" />
            Read-only
          </span>
        </div>

        {documents.length ? (
          <div className="doc-grid">
            {documents.map((document, index) => (
              <DocumentCard document={document} index={index} key={document.id} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state__icon">
              <Icon name="i-document" />
            </div>
            <h3>No reference documents yet</h3>
            <p>Upload the reference PDFs, then map them into the document master.</p>
          </div>
        )}

        <div className="table-foot">
          <span>
            Showing <b>{documents.length}</b> of {MAX_REFERENCE_DOCUMENTS} reference PDFs
          </span>
          <span className="table-foot__right">
            <span className="foot-note">Reference PDFs open in a new tab</span>
          </span>
        </div>
      </section>
    </div>
  );
}
