import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getItemDetail } from "@/lib/master-data";
import { money, num } from "@/lib/format";
import { categoryClass, initials } from "@/lib/products";
import type { ItemLineView } from "@/lib/types";
import { Icon } from "@/components/icons";
import { ItemStatusPill, LineStatusPill } from "@/components/master-ui";
import { ProductTile } from "@/components/ui";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getItemDetail(slug);
  return { title: item ? `${item.name} · Item Master` : "Item not found" };
}

function sortedLines(lines: ItemLineView[]) {
  const rank = { missing: 0, short: 1, covered: 2 } as const;
  return lines
    .slice()
    .sort(
      (a, b) =>
        rank[a.status] - rank[b.status] ||
        b.shortfall - a.shortfall ||
        a.centreName.localeCompare(b.centreName)
    );
}

export default async function ItemDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getItemDetail(slug);
  if (!item) notFound();

  const lines = sortedLines(item.lines);

  return (
    <div className="view">
      <div className="centre-detail-bar">
        <Link className="back-link" href="/items">
          ← All items
        </Link>
        <div className="centre-detail-bar__right">
          {item.departments.map((department) => (
            <Link className="lead-chip" href={`/departments/${department.slug}`} key={department.slug}>
              <Icon name="i-departments" />
              {department.name}
            </Link>
          ))}
          <span className="lead-chip">
            <Icon name="i-items" />
            Item Master
          </span>
        </div>
      </div>

      <section className="centre-hero item-hero" aria-labelledby="item-name">
        <header className="centre-hero__head">
          <span className={`tile item-tile-lg tile--${categoryClass(item.category)}`} aria-hidden="true">
            {initials(item.name)}
          </span>
          <div className="centre-hero__id">
            <p className="centre-hero__kicker">Item Master</p>
            <h2 id="item-name">{item.name}</h2>
            <p>
              {item.sku} · {item.category} · {item.unit}
            </p>
          </div>
          <div className="centre-hero__badges">
            <ItemStatusPill status={item.status} />
          </div>
        </header>
        <div className="centre-hero__stats">
          <div className="centre-hero__stat">
            <span>Unit cost</span>
            <strong>{money(item.costCents, 2)}</strong>
            <em>Per {item.unit}</em>
          </div>
          <div className="centre-hero__stat">
            <span>Locations tracked</span>
            <strong>{item.lines.length}</strong>
            <em>Every location in the master</em>
          </div>
          <div className="centre-hero__stat">
            <span>Units required</span>
            <strong>{num(item.requiredUnits)}</strong>
            <em>Combined location target</em>
          </div>
          <div className="centre-hero__stat centre-hero__stat--alert">
            <span>Shortfall</span>
            <strong className={item.shortfallUnits ? "is-short" : ""}>
              {item.shortfallUnits ? `−${num(item.shortfallUnits)}` : "0"}
            </strong>
            <em>{item.shortCentreCount} locations need stock</em>
          </div>
        </div>
      </section>

      <section className="panel item-centres-panel" aria-labelledby="item-centres-title">
        <header className="panel__head">
          <div>
            <h2 className="panel__title" id="item-centres-title">
              Requirement by location
            </h2>
            <p className="panel__sub">
              Required quantity and on-hand stock for this item in every centre, sub-centre, and point.
              The most urgent lines are first.
            </p>
          </div>
          <span className="lead-chip">
            <Icon name="i-check" />
            {item.coveredCount}/{item.lines.length} covered
          </span>
        </header>

        <div className="table-wrap">
          <table className="data-table item-centre-table">
            <thead>
              <tr>
                <th scope="col">Location</th>
                <th scope="col" className="num">
                  Required
                </th>
                <th scope="col" className="num">
                  On hand
                </th>
                <th scope="col" className="num">
                  Shortfall
                </th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.centreId}>
                  <td>
                    <div className="product-cell">
                      <ProductTile name={line.centreName} category="Storage" tiny />
                      <span className="product-cell__text">
                        <Link className="name-link" href={`/centres/${line.centreSlug}`}>
                          {line.centreName}
                        </Link>
                        <span className="product-cell__sku">
                          {line.centreType} · Badge {line.centreCode}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="num">
                    <span className="centre-qty">{num(line.required)}</span>{" "}
                    <span className="centre-unit">{item.unit}</span>
                  </td>
                  <td className="num">
                    <span className="centre-qty">{num(line.onHand)}</span>{" "}
                    <span className="centre-unit">{item.unit}</span>
                  </td>
                  <td className="num">
                    <span className={`shortfall ${line.shortfall ? "is-short" : ""}`}>
                      {line.shortfall ? `−${num(line.shortfall)}` : "—"}
                    </span>
                  </td>
                  <td>
                    <LineStatusPill status={line.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="centre-item-cards">
          {lines.map((line) => (
            <article className="c-item" key={line.centreId}>
              <div className="c-item__head">
                <ProductTile name={line.centreName} category="Storage" tiny />
                <span className="c-item__id">
                  <Link className="item-link item-link--strong" href={`/centres/${line.centreSlug}`}>
                    {line.centreName}
                  </Link>
                  <span>
                    {line.centreType} · Badge {line.centreCode}
                  </span>
                </span>
                <LineStatusPill status={line.status} />
              </div>
              <div className="c-item__facts">
                <div>
                  <span>Required</span>
                  <strong>
                    {num(line.required)} <em>{item.unit}</em>
                  </strong>
                </div>
                <div>
                  <span>On hand</span>
                  <strong>
                    {num(line.onHand)} <em>{item.unit}</em>
                  </strong>
                </div>
                <div>
                  <span>Shortfall</span>
                  <strong className={line.shortfall ? "is-short" : ""}>
                    {line.shortfall ? `−${num(line.shortfall)}` : "0"}
                  </strong>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="table-foot">
          <span>
            <b>{item.lines.length}</b> locations · {item.shortCentreCount} need stock ·{" "}
            {money(item.costCents, 2)} unit cost
          </span>
          <span className="table-foot__right">
            <span className="foot-note">Requirement = location target holding</span>
          </span>
        </div>
      </section>
    </div>
  );
}
