import Link from "next/link";
import type {
  CatalogueItemView,
  CentreView,
  DepartmentView,
  DocumentView,
  LineStatus,
  MasterHealth
} from "@/lib/types";
import { ITEM_HEALTH, LINE_HEALTH, MASTER_HEALTH, centreTypeClass } from "@/lib/master";
import { initials } from "@/lib/products";
import { money, num, plural } from "@/lib/format";
import { Icon } from "@/components/icons";
import { ProductTile } from "@/components/ui";

export function CentreTypeBadge({ type }: { type: string }) {
  return <span className={`centre-type centre-type--${centreTypeClass(type)}`}>{type}</span>;
}

export function MasterStatusPill({ status }: { status: MasterHealth }) {
  const health = MASTER_HEALTH[status];
  return (
    <span className={`status ${health.className}`}>
      <i />
      {health.label}
    </span>
  );
}

export function ItemStatusPill({ status }: { status: MasterHealth }) {
  const health = ITEM_HEALTH[status];
  return (
    <span className={`status ${health.className}`}>
      <i />
      {health.label}
    </span>
  );
}

export function LineStatusPill({ status }: { status: LineStatus }) {
  const health = LINE_HEALTH[status];
  return (
    <span className={`status ${health.className}`}>
      <i />
      {health.label}
    </span>
  );
}

function coverageClass(status: MasterHealth) {
  if (status === "critical") return "is-out";
  if (status === "needs") return "is-low";
  return "is-ready";
}

export function CentreCard({ centre }: { centre: CentreView }) {
  const needing = centre.shortCount + centre.missingCount;
  const branchNote = centre.parentName
    ? `Under ${centre.parentName}`
    : centre.childCount
      ? `${centre.childCount} ${plural(centre.childCount, "branch", "branches")}`
      : "Standalone centre";

  return (
    <Link className="centre-card" href={`/centres/${centre.slug}`} aria-label={`Open ${centre.name} ${centre.type}`}>
      <span className="centre-card__head">
        <span className="centre-mark" aria-hidden="true">
          {initials(centre.name)}
        </span>
        <span className="centre-card__id">
          <strong>{centre.name}</strong>
          <span>
            {centre.lines.length} {plural(centre.lines.length, "item")} tracked · {centre.coverage}% covered
          </span>
          <span className="centre-card__meta">
            <CentreTypeBadge type={centre.type} />
            <span>
              Badge {centre.code} · {branchNote}
            </span>
          </span>
        </span>
        <MasterStatusPill status={centre.status} />
      </span>
      <span className="centre-card__stats">
        <span className="centre-card__stat">
          <span>On hand</span>
          <strong>{num(centre.onHandUnits)}</strong>
        </span>
        <span className="centre-card__stat">
          <span>Required</span>
          <strong>{num(centre.requiredUnits)}</strong>
        </span>
        <span className="centre-card__stat">
          <span>Shortfall</span>
          <strong className={centre.shortfallUnits ? "is-short" : ""}>
            {centre.shortfallUnits ? `−${num(centre.shortfallUnits)}` : "0"}
          </strong>
        </span>
      </span>
      <span className="centre-card__bar" aria-hidden="true">
        <span className={`centre-card__fill ${coverageClass(centre.status)}`} style={{ width: `${centre.coverage}%` }} />
      </span>
      <span className="centre-card__foot">
        <span>
          {needing
            ? `${needing} ${plural(needing, "item")} ${needing === 1 ? "needs" : "need"} restocking`
            : "All requirements covered"}
        </span>
        <span className="centre-card__open">
          Open location <Icon name="i-arrow-right" />
        </span>
      </span>
    </Link>
  );
}

export function ItemCard({ item }: { item: CatalogueItemView }) {
  return (
    <Link className="item-card" href={`/items/${item.slug}`} aria-label={`Open ${item.name} in Item Master`}>
      <span className="item-card__head">
        <ProductTile name={item.name} category={item.category} />
        <span className="item-card__id">
          <strong>{item.name}</strong>
          <span>
            {item.sku} · {item.category}
          </span>
        </span>
        <ItemStatusPill status={item.status} />
      </span>
      <span className="item-card__stats">
        <span className="item-card__stat">
          <span>Unit cost</span>
          <strong>{money(item.costCents, 2)}</strong>
        </span>
        <span className="item-card__stat">
          <span>Required</span>
          <strong>{num(item.requiredUnits)}</strong>
        </span>
        <span className="item-card__stat">
          <span>Locations short</span>
          <strong className={item.shortCentreCount ? "is-short" : ""}>{item.shortCentreCount}</strong>
        </span>
      </span>
      <span className="item-card__bar" aria-hidden="true">
        <span className={`item-card__fill ${coverageClass(item.status)}`} style={{ width: `${item.coverage}%` }} />
      </span>
      <span className="item-card__foot">
        <span>
          {item.shortCentreCount
            ? `${item.shortCentreCount} of ${item.lines.length} locations need stock`
            : "Every location requirement covered"}
        </span>
        <span className="item-card__open">
          Open item <Icon name="i-arrow-right" />
        </span>
      </span>
    </Link>
  );
}

export function DocumentCard({ document, index }: { document: DocumentView; index: number }) {
  return (
    <a
      className="doc-card"
      href={document.href}
      target="_blank"
      rel="noreferrer"
      aria-label={`Open ${document.title} PDF`}
    >
      <span className="doc-card__top">
        <span className="doc-card__badge" aria-hidden="true">
          PDF
        </span>
        <span className="doc-card__index" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>
      </span>
      <span className="doc-card__title">{document.title}</span>
      <span className="doc-card__desc">{document.description}</span>
      <span className="doc-card__foot">
        <span>
          {document.category} · {document.pages} {plural(document.pages, "page")}
        </span>
        <span className="doc-card__open">
          Open PDF <Icon name="i-arrow-up-right" />
        </span>
      </span>
    </a>
  );
}

export function DepartmentCard({ department }: { department: DepartmentView }) {
  const needing = department.shortCount + department.missingCount;
  return (
    <Link
      className="centre-card dept-card"
      href={`/departments/${department.slug}`}
      aria-label={`Open ${department.name} department`}
    >
      <span className="centre-card__head">
        <span className={`centre-mark dept-mark dept-mark--${department.id}`} aria-hidden="true">
          {initials(department.name)}
        </span>
        <span className="centre-card__id">
          <strong>{department.name}</strong>
          <span>{department.description}</span>
          <span className="centre-card__meta">
            <span className="centre-type centre-type--department">Department</span>
            <span>
              {department.itemCount} {plural(department.itemCount, "item")} · {department.lines.length} requirement lines
            </span>
          </span>
        </span>
        <MasterStatusPill status={department.status} />
      </span>
      <span className="dept-card__items" aria-label={`Items in ${department.name}`}>
        {department.items.map((item) => (
          <span className="dept-item-chip" key={item.id}>
            {item.name}
          </span>
        ))}
      </span>
      <span className="centre-card__stats">
        <span className="centre-card__stat">
          <span>On hand</span>
          <strong>{num(department.onHandUnits)}</strong>
        </span>
        <span className="centre-card__stat">
          <span>Required</span>
          <strong>{num(department.requiredUnits)}</strong>
        </span>
        <span className="centre-card__stat">
          <span>Shortfall</span>
          <strong className={department.shortfallUnits ? "is-short" : ""}>
            {department.shortfallUnits ? `−${num(department.shortfallUnits)}` : "0"}
          </strong>
        </span>
      </span>
      <span className="centre-card__bar" aria-hidden="true">
        <span
          className={`centre-card__fill ${coverageClass(department.status)}`}
          style={{ width: `${department.coverage}%` }}
        />
      </span>
      <span className="centre-card__foot">
        <span>
          {needing
            ? `${needing} of ${department.lines.length} item lines need stock`
            : "All department requirements covered"}
        </span>
        <span className="centre-card__open">
          Open department <Icon name="i-arrow-right" />
        </span>
      </span>
    </Link>
  );
}
