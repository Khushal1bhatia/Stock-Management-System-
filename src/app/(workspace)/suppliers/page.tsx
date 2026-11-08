import type { Metadata } from "next";
import Link from "next/link";
import { getSupplierData } from "@/lib/queries";
import { money, num, plural } from "@/lib/format";
import { Icon } from "@/components/icons";

export const metadata: Metadata = { title: "Suppliers" };

export default async function SuppliersPage() {
  const { suppliers, lowestLead } = await getSupplierData();

  return (
    <div className="view">
      <div className="page-tools">
        <p className="page-tools__note">
          Lead times, contacts, and current stock exposure across {suppliers.length} supply{" "}
          {plural(suppliers.length, "partner")}.
        </p>
        <div className="page-tools__actions">
          <span className="lead-chip">
            <Icon name="i-clock" />
            Shortest lead: {lowestLead} days
          </span>
        </div>
      </div>

      {suppliers.length ? (
        <div className="supplier-grid">
          {suppliers.map((supplier) => {
            const preview = supplier.lowProducts.slice(0, 2).join(", ");
            const more = supplier.lowProducts.length > 2 ? ` +${supplier.lowProducts.length - 2} more` : "";

            return (
              <article className="supplier-card" key={supplier.id}>
                <header className="supplier-card__head">
                  <span className="supplier-mark" aria-hidden="true">
                    {supplier.initials}
                  </span>
                  <div className="supplier-card__id">
                    <h3>{supplier.name}</h3>
                    <p className="supplier-card__contact">{supplier.contact}</p>
                  </div>
                  <span className="lead-chip">
                    <Icon name="i-clock" />
                    {supplier.leadDays}-day lead
                  </span>
                </header>

                <div className="supplier-card__stats">
                  <div className="supplier-card__stat">
                    <span>SKUs</span>
                    <strong>{supplier.productCount}</strong>
                  </div>
                  <div className="supplier-card__stat">
                    <span>On hand</span>
                    <strong>{num(supplier.units)}</strong>
                  </div>
                  <div className="supplier-card__stat">
                    <span>Value</span>
                    <strong>{money(supplier.valueCents)}</strong>
                  </div>
                </div>

                {supplier.lowCount ? (
                  <div className="supplier-alert supplier-alert--attention">
                    <Icon name="i-alert" />
                    <span>
                      <strong>
                        {supplier.lowCount} {plural(supplier.lowCount, "item")} below reorder:
                      </strong>{" "}
                      {preview}
                      {more}
                    </span>
                  </div>
                ) : (
                  <div className="supplier-alert supplier-alert--clear">
                    <Icon name="i-check-circle" />
                    <span>All stock is above its reorder point.</span>
                  </div>
                )}

                <div className="supplier-card__foot">
                  <span className="supplier-contact">
                    {supplier.email ? (
                      <>
                        Orders: <a href={`mailto:${supplier.email}`}>{supplier.email}</a>
                      </>
                    ) : (
                      "No email on file"
                    )}
                  </span>
                  <Link className="text-btn" href={`/inventory?supplier=${encodeURIComponent(supplier.name)}`}>
                    View products →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="panel">
          <div className="empty-state">
            <div className="empty-state__icon">
              <Icon name="i-truck" />
            </div>
            <h3>No suppliers yet</h3>
            <p>Add a product and assign a supplier to see it here.</p>
          </div>
        </div>
      )}
    </div>
  );
}
