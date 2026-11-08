import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDepartmentDetail } from "@/lib/master-data";
import { num, plural } from "@/lib/format";
import { initials } from "@/lib/products";
import type { CatalogueItemView, LineStatus } from "@/lib/types";
import { Icon } from "@/components/icons";
import { ItemStatusPill, MasterStatusPill } from "@/components/master-ui";
import { ProductTile } from "@/components/ui";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const department = await getDepartmentDetail(slug);
  return { title: department ? `${department.name} · Departments` : "Department not found" };
}

function sortedItems(items: CatalogueItemView[]) {
  const rank = { critical: 0, needs: 1, healthy: 2 } as const;
  return items
    .slice()
    .sort(
      (a, b) =>
        rank[a.status] - rank[b.status] ||
        b.shortfallUnits - a.shortfallUnits ||
        a.name.localeCompare(b.name)
    );
}

function locationHealth(status: LineStatus) {
  if (status === "covered") return "healthy" as const;
  if (status === "missing") return "critical" as const;
  return "needs" as const;
}

export default async function DepartmentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const department = await getDepartmentDetail(slug);
  if (!department) notFound();

  const items = sortedItems(department.items);
  const needing = department.shortCount + department.missingCount;
  const locations = department.locations.filter((location) => location.shortfall > 0);

  return (
    <div className="view">
      <div className="centre-detail-bar">
        <Link className="back-link" href="/departments">
          ← All departments
        </Link>
        <span className="lead-chip">
          <Icon name="i-departments" />
          Department view
        </span>
      </div>

      <section className="centre-hero dept-hero" aria-labelledby="department-name">
        <header className="centre-hero__head">
          <span className={`centre-mark centre-mark--lg dept-mark dept-mark--${department.id}`} aria-hidden="true">
            {initials(department.name)}
          </span>
          <div className="centre-hero__id">
            <h2 id="department-name">{department.name}</h2>
            <p>{department.description}</p>
            <p className="dept-hero__meta">
              {department.itemCount} {plural(department.itemCount, "item")} · {department.lines.length}{" "}
              requirement lines · {department.coverage}% covered
            </p>
          </div>
          <div className="centre-hero__badges">
            <span className="centre-type centre-type--department">Department</span>
            <MasterStatusPill status={department.status} />
          </div>
        </header>
        <div className="centre-hero__stats">
          <div className="centre-hero__stat">
            <span>Items assigned</span>
            <strong>{department.itemCount}</strong>
            <em>{department.withNeeds} need stock</em>
          </div>
          <div className="centre-hero__stat">
            <span>Units on hand</span>
            <strong>{num(department.onHandUnits)}</strong>
            <em>Across assigned items</em>
          </div>
          <div className="centre-hero__stat">
            <span>Units required</span>
            <strong>{num(department.requiredUnits)}</strong>
            <em>Combined location target</em>
          </div>
          <div className="centre-hero__stat centre-hero__stat--alert">
            <span>Shortfall</span>
            <strong className={department.shortfallUnits ? "is-short" : ""}>
              {department.shortfallUnits ? `−${num(department.shortfallUnits)}` : "0"}
            </strong>
            <em>
              {department.missingCount} missing · {department.shortCount} short
            </em>
          </div>
        </div>
      </section>

      <section className="panel dept-items-panel" aria-labelledby="dept-items-title">
        <header className="panel__head">
          <div>
            <h2 className="panel__title" id="dept-items-title">
              Items in this department
            </h2>
            <p className="panel__sub">
              On-hand stock and location coverage for each assigned catalogue item.
            </p>
          </div>
          <span className="lead-chip">
            <Icon name="i-check" />
            {department.itemCount - department.withNeeds}/{department.itemCount} covered
          </span>
        </header>

        <div className="table-wrap">
          <table className="data-table dept-items-table">
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Category</th>
                <th scope="col" className="num">
                  Locations short
                </th>
                <th scope="col" className="num">
                  On hand
                </th>
                <th scope="col" className="num">
                  Required
                </th>
                <th scope="col" className="num">
                  Shortfall
                </th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="product-cell">
                      <ProductTile name={item.name} category={item.category} />
                      <span className="product-cell__text">
                        <Link className="item-link" href={`/items/${item.slug}`}>
                          {item.name}
                        </Link>
                        <span className="product-cell__sku">{item.sku}</span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="cat-label">{item.category}</span>
                  </td>
                  <td className="num">
                    <span className="centre-qty">{item.shortCentreCount}</span>{" "}
                    <span className="centre-unit">of {item.lines.length}</span>
                  </td>
                  <td className="num">
                    <span className="centre-qty">{num(item.onHandUnits)}</span>{" "}
                    <span className="centre-unit">{item.unit}</span>
                  </td>
                  <td className="num">
                    <span className="centre-qty">{num(item.requiredUnits)}</span>{" "}
                    <span className="centre-unit">{item.unit}</span>
                  </td>
                  <td className="num">
                    <span className={`shortfall ${item.shortfallUnits ? "is-short" : ""}`}>
                      {item.shortfallUnits ? `−${num(item.shortfallUnits)}` : "—"}
                    </span>
                  </td>
                  <td>
                    <ItemStatusPill status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="centre-item-cards dept-item-cards">
          {items.map((item) => (
            <article className="c-item" key={item.id}>
              <div className="c-item__head">
                <ProductTile name={item.name} category={item.category} tiny />
                <span className="c-item__id">
                  <Link className="item-link item-link--strong" href={`/items/${item.slug}`}>
                    {item.name}
                  </Link>
                  <span>
                    {item.sku} · {item.shortCentreCount} of {item.lines.length} locations short
                  </span>
                </span>
                <ItemStatusPill status={item.status} />
              </div>
              <div className="c-item__facts">
                <div>
                  <span>On hand</span>
                  <strong>
                    {num(item.onHandUnits)} <em>{item.unit}</em>
                  </strong>
                </div>
                <div>
                  <span>Required</span>
                  <strong>
                    {num(item.requiredUnits)} <em>{item.unit}</em>
                  </strong>
                </div>
                <div>
                  <span>Shortfall</span>
                  <strong className={item.shortfallUnits ? "is-short" : ""}>
                    {item.shortfallUnits ? `−${num(item.shortfallUnits)}` : "0"}
                  </strong>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="table-foot">
          <span>
            <b>{department.itemCount}</b> {plural(department.itemCount, "item")} · {needing} of{" "}
            {department.lines.length} item lines need stock
          </span>
          <span className="table-foot__right">
            <span className="foot-note">Totals span all {department.locations.length} locations</span>
          </span>
        </div>
      </section>

      <section className="panel dept-locations-panel" aria-labelledby="dept-locations-title">
        <header className="panel__head">
          <div>
            <h2 className="panel__title" id="dept-locations-title">
              Locations needing stock
            </h2>
            <p className="panel__sub">
              {locations.length
                ? `${locations.length} of ${department.locations.length} locations have a shortfall in this department.`
                : "Every location meets the department requirement."}
            </p>
          </div>
          <span className="lead-chip">
            <Icon name="i-alert" />
            {locations.length} short
          </span>
        </header>

        {locations.length ? (
          <div className="centre-child-list">
            {locations.map((location) => (
              <Link
                className="centre-child dept-location"
                href={`/centres/${location.centreSlug}`}
                key={location.centreId}
                aria-label={`Open ${location.centreName}`}
              >
                <span className={`centre-type centre-type--${location.centreType.toLowerCase()}`}>
                  {location.centreType}
                </span>
                <span className="centre-child__id">
                  <strong>{location.centreName}</strong>
                  <span>
                    Badge {location.centreCode} · {location.coveredCount}/{location.lineCount} items covered
                  </span>
                </span>
                <span className="centre-child__shortfall is-short">
                  −{num(location.shortfall)}
                  <em>short</em>
                </span>
                <MasterStatusPill status={locationHealth(location.status)} />
                <Icon name="i-arrow-right" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state dept-empty">
            <div className="empty-state__icon">
              <Icon name="i-check-circle" />
            </div>
            <h3>All locations covered</h3>
            <p>No centre, sub-centre, or point is short in this department.</p>
          </div>
        )}
      </section>
    </div>
  );
}
