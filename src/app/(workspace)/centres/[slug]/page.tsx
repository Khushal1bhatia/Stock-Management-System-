import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCentreDetail } from "@/lib/master-data";
import { MASTER_HEALTH } from "@/lib/master";
import { num, plural } from "@/lib/format";
import { initials } from "@/lib/products";
import type { CentreLineView, CentreView } from "@/lib/types";
import { Icon } from "@/components/icons";
import { CentreTypeBadge, LineStatusPill, MasterStatusPill } from "@/components/master-ui";
import { ProductTile } from "@/components/ui";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getCentreDetail(slug);
  return { title: detail ? `${detail.centre.name} · Centre Master` : "Centre not found" };
}

function sortedLines(lines: CentreLineView[]) {
  const rank = { missing: 0, short: 1, covered: 2 } as const;
  return lines
    .slice()
    .sort((a, b) => rank[a.status] - rank[b.status] || b.shortfall - a.shortfall || a.itemName.localeCompare(b.itemName));
}

function ChildRow({ child }: { child: CentreView }) {
  const needing = child.shortCount + child.missingCount;
  const health = MASTER_HEALTH[child.status];
  return (
    <Link className="centre-child" href={`/centres/${child.slug}`} aria-label={`Open ${child.name} ${child.type}`}>
      <CentreTypeBadge type={child.type} />
      <span className="centre-child__id">
        <strong>{child.name}</strong>
        <span>
          Badge {child.code} · {child.lines.length} items ·{" "}
          {needing ? `${needing} need restocking` : "all covered"}
        </span>
      </span>
      <span className={`centre-child__shortfall ${child.shortfallUnits ? "is-short" : "is-clear"}`}>
        {child.shortfallUnits ? `−${num(child.shortfallUnits)}` : "0"}
        <em>short</em>
      </span>
      <span className={`status ${health.className}`}>
        <i />
        {health.label}
      </span>
      <Icon name="i-arrow-right" />
    </Link>
  );
}

export default async function CentreDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const detail = await getCentreDetail(slug);
  if (!detail) notFound();

  const { centre, children } = detail;
  const lines = sortedLines(centre.lines);
  const needing = centre.shortCount + centre.missingCount;
  const subCentres = children.filter((child) => child.type === "SubCentre").length;
  const points = children.filter((child) => child.type === "Point").length;
  const breakdown = [
    subCentres ? `${subCentres} ${plural(subCentres, "sub-centre")}` : "",
    points ? `${points} ${plural(points, "point")}` : ""
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="view">
      <div className="centre-detail-bar">
        <Link className="back-link" href="/centres">
          ← All locations
        </Link>
        <div className="centre-detail-bar__right">
          {centre.parentName && centre.parentSlug ? (
            <Link className="lead-chip" href={`/centres/${centre.parentSlug}`}>
              <Icon name="i-centre" />
              Up: {centre.parentName}
            </Link>
          ) : null}
          <span className="lead-chip">
            <Icon name="i-centre" />
            Centre Master
          </span>
        </div>
      </div>

      <section className="centre-hero" aria-labelledby="centre-name">
        <header className="centre-hero__head">
          <span className="centre-mark centre-mark--lg" aria-hidden="true">
            {initials(centre.name)}
          </span>
          <div className="centre-hero__id">
            <p className="centre-hero__kicker">Centre Master</p>
            <h2 id="centre-name">{centre.name}</h2>
            <p>
              {centre.parentName && centre.parentSlug ? (
                <>
                  Under{" "}
                  <Link className="inline-link" href={`/centres/${centre.parentSlug}`}>
                    {centre.parentName}
                  </Link>{" "}
                  ·{" "}
                </>
              ) : null}
              Badge {centre.code} · {centre.lines.length} {plural(centre.lines.length, "item")} tracked ·{" "}
              {centre.coverage}% of item lines covered
            </p>
          </div>
          <div className="centre-hero__badges">
            <CentreTypeBadge type={centre.type} />
            <MasterStatusPill status={centre.status} />
          </div>
        </header>
        <div className="centre-hero__stats">
          <div className="centre-hero__stat">
            <span>Items tracked</span>
            <strong>{centre.lines.length}</strong>
            <em>
              {needing} {plural(needing, "line")} need restocking
            </em>
          </div>
          <div className="centre-hero__stat">
            <span>Units on hand</span>
            <strong>{num(centre.onHandUnits)}</strong>
            <em>Across all item lines</em>
          </div>
          <div className="centre-hero__stat">
            <span>Units required</span>
            <strong>{num(centre.requiredUnits)}</strong>
            <em>Target holding</em>
          </div>
          <div className="centre-hero__stat centre-hero__stat--alert">
            <span>Shortfall</span>
            <strong className={centre.shortfallUnits ? "is-short" : ""}>
              {centre.shortfallUnits ? `−${num(centre.shortfallUnits)}` : "0"}
            </strong>
            <em>
              {centre.missingCount} missing · {centre.shortCount} short
            </em>
          </div>
        </div>
      </section>

      {children.length ? (
        <section className="panel centre-children-panel" aria-labelledby="centre-children-title">
          <header className="panel__head">
            <div>
              <h2 className="panel__title" id="centre-children-title">
                Sub-centres &amp; points
              </h2>
              <p className="panel__sub">
                {children.length} {plural(children.length, "location")} report under {centre.name}. Open one to see
                its item requirements.
              </p>
            </div>
            <span className="lead-chip">{breakdown}</span>
          </header>
          <div className="centre-child-list">
            {children.map((child) => (
              <ChildRow child={child} key={child.id} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel centre-items-panel" aria-labelledby="centre-items-title">
        <header className="panel__head">
          <div>
            <h2 className="panel__title" id="centre-items-title">
              Items held and required
            </h2>
            <p className="panel__sub">
              On-hand stock compared with this location&apos;s requirement. The most urgent lines are first.
            </p>
          </div>
          <span className="lead-chip">
            <Icon name="i-check" />
            {centre.coveredCount}/{lines.length} covered
          </span>
        </header>

        <div className="table-wrap">
          <table className="data-table centre-items-table">
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Category</th>
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
              {lines.map((line) => (
                <tr key={line.itemId}>
                  <td>
                    <div className="product-cell">
                      <ProductTile name={line.itemName} category={line.category} />
                      <span className="product-cell__text">
                        <Link className="item-link" href={`/items/${line.itemSlug}`}>
                          {line.itemName}
                        </Link>
                        <span className="product-cell__sku">{line.sku}</span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="cat-label">{line.category}</span>
                  </td>
                  <td className="num">
                    <span className="centre-qty">{num(line.onHand)}</span>{" "}
                    <span className="centre-unit">{line.unit}</span>
                  </td>
                  <td className="num">
                    <span className="centre-qty">{num(line.required)}</span>{" "}
                    <span className="centre-unit">{line.unit}</span>
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
            <article className="c-item" key={line.itemId}>
              <div className="c-item__head">
                <ProductTile name={line.itemName} category={line.category} tiny />
                <span className="c-item__id">
                  <Link className="item-link item-link--strong" href={`/items/${line.itemSlug}`}>
                    {line.itemName}
                  </Link>
                  <span>
                    {line.sku} · {line.category}
                  </span>
                </span>
                <LineStatusPill status={line.status} />
              </div>
              <div className="c-item__facts">
                <div>
                  <span>On hand</span>
                  <strong>
                    {num(line.onHand)} <em>{line.unit}</em>
                  </strong>
                </div>
                <div>
                  <span>Required</span>
                  <strong>
                    {num(line.required)} <em>{line.unit}</em>
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
            <b>{lines.length}</b> {plural(lines.length, "item")} · {needing} {plural(needing, "line")} need
            restocking
          </span>
          <span className="table-foot__right">
            <span className="foot-note">Requirement = location target holding</span>
          </span>
        </div>
      </section>
    </div>
  );
}
