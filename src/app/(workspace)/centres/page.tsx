import type { Metadata } from "next";
import Link from "next/link";
import { getCentreMasterData } from "@/lib/master-data";
import { centreHref, parseCentreFilters } from "@/lib/url";
import { num } from "@/lib/format";
import { Icon } from "@/components/icons";
import { CentreCard } from "@/components/master-ui";
import { CentreToolbar } from "../master-toolbar";

export const metadata: Metadata = { title: "Centre Master" };

export default async function CentresPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseCentreFilters(await searchParams);
  const { centres, allCentres, stats } = await getCentreMasterData(filters);
  const filtered = Boolean(filters.q) || filters.status !== "all" || filters.type !== "all";

  const tabs = [
    { key: "all", label: "All locations", count: stats.total },
    { key: "needs", label: "Needs stock", count: stats.withNeeds },
    { key: "ready", label: "Ready", count: stats.ready }
  ];

  return (
    <div className="view">
      <div className="page-tools">
        <p className="page-tools__note">
          {stats.centreCount} centres, {stats.subCentreCount} sub-centres, and {stats.pointCount} points. Open a
          centre to see its branches and item requirements.
        </p>
        <div className="page-tools__actions">
          <span className="lead-chip">
            <Icon name="i-centre" />
            {stats.total} unique locations
          </span>
        </div>
      </div>

      <section className="centre-summary" aria-label="Centre master summary">
        <div className="centre-summary__cell">
          <span>Locations</span>
          <strong>{stats.total}</strong>
          <em>
            {stats.centreCount} centres · {stats.subCentreCount} sub-centres · {stats.pointCount} points
          </em>
        </div>
        <div className="centre-summary__cell">
          <span>Items tracked</span>
          <strong>{num(stats.trackedItems)}</strong>
          <em>across all locations</em>
        </div>
        <div className="centre-summary__cell">
          <span>Need stock</span>
          <strong className={stats.withNeeds ? "negative" : "positive"}>{stats.withNeeds}</strong>
          <em>{stats.critical} critical</em>
        </div>
        <div className="centre-summary__cell">
          <span>Units short</span>
          <strong className={stats.shortfallUnits ? "negative" : "positive"}>{num(stats.shortfallUnits)}</strong>
          <em>below requirement</em>
        </div>
      </section>

      <section className="panel centres-panel" aria-label="Centre master list">
        <div className="inventory-head">
          <div className="status-tabs" role="group" aria-label="Filter locations by stock status">
            {tabs.map((tab) => {
              const active = filters.status === tab.key;
              return (
                <Link
                  className={`status-tab ${active ? "is-active" : ""}`}
                  href={centreHref(filters, { status: tab.key as typeof filters.status })}
                  key={tab.key}
                  aria-current={active ? "page" : undefined}
                >
                  {tab.label}
                  <span className="status-tab__count">{tab.count}</span>
                </Link>
              );
            })}
          </div>
          <CentreToolbar filters={filters} />
        </div>

        {centres.length ? (
          <div className="centres-grid">
            {centres.map((centre) => (
              <CentreCard centre={centre} key={centre.id} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state__icon">
              <Icon name="i-centre" />
            </div>
            <h3>No locations match this view</h3>
            <p>Try a different search, or show every location in the master list.</p>
            <Link className="btn btn--secondary" href="/centres">
              Show all locations
            </Link>
          </div>
        )}

        <div className="table-foot">
          <span>
            Showing <b>{centres.length}</b> of {allCentres.length} locations
          </span>
          <span className="table-foot__right">
            <span className="foot-note">
              {filtered ? `${num(stats.requiredUnits)} units required across the master` : "Source names and badge codes deduplicated"}
            </span>
          </span>
        </div>
      </section>
    </div>
  );
}
