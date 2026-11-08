import type { Metadata } from "next";
import Link from "next/link";
import { getItemMasterData } from "@/lib/master-data";
import { itemHref, parseItemFilters } from "@/lib/url";
import { num, plural } from "@/lib/format";
import { Icon } from "@/components/icons";
import { ItemCard } from "@/components/master-ui";
import { ItemToolbar } from "../master-toolbar";

export const metadata: Metadata = { title: "Item Master" };

export default async function ItemsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseItemFilters(await searchParams);
  const { items, allItems, stats } = await getItemMasterData(filters);
  const filtered = Boolean(filters.q) || filters.status !== "all";

  const tabs = [
    { key: "all", label: "All items", count: stats.total },
    { key: "needs", label: "Needs stock", count: stats.withNeeds },
    { key: "ready", label: "Covered", count: stats.ready }
  ];

  return (
    <div className="view">
      <div className="page-tools">
        <p className="page-tools__note">
          One row per catalogue item. Open an item to see its cost and requirement in every centre,
          sub-centre, and point.
        </p>
        <div className="page-tools__actions">
          <span className="lead-chip">
            <Icon name="i-items" />
            {stats.total} catalogue items
          </span>
        </div>
      </div>

      <section className="item-summary" aria-label="Item master summary">
        <div className="item-summary__cell">
          <span>Items</span>
          <strong>{stats.total}</strong>
          <em>shared catalogue</em>
        </div>
        <div className="item-summary__cell">
          <span>Locations</span>
          <strong>{stats.centres}</strong>
          <em>requirements tracked</em>
        </div>
        <div className="item-summary__cell">
          <span>Need stock</span>
          <strong className={stats.withNeeds ? "negative" : "positive"}>{stats.withNeeds}</strong>
          <em>{stats.critical} critical</em>
        </div>
        <div className="item-summary__cell">
          <span>Units short</span>
          <strong className={stats.shortfallUnits ? "negative" : "positive"}>{num(stats.shortfallUnits)}</strong>
          <em>below requirement</em>
        </div>
      </section>

      <section className="panel items-panel" aria-label="Item master list">
        <div className="inventory-head">
          <div className="status-tabs" role="group" aria-label="Filter items by stock status">
            {tabs.map((tab) => {
              const active = filters.status === tab.key;
              return (
                <Link
                  className={`status-tab ${active ? "is-active" : ""}`}
                  href={itemHref(filters, { status: tab.key as typeof filters.status })}
                  key={tab.key}
                  aria-current={active ? "page" : undefined}
                >
                  {tab.label}
                  <span className="status-tab__count">{tab.count}</span>
                </Link>
              );
            })}
          </div>
          <ItemToolbar filters={filters} />
        </div>

        {items.length ? (
          <div className="items-grid">
            {items.map((item) => (
              <ItemCard item={item} key={item.id} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state__icon">
              <Icon name="i-items" />
            </div>
            <h3>No items match this view</h3>
            <p>Try a different search, or show every item in the catalogue.</p>
            <Link className="btn btn--secondary" href="/items">
              Show all items
            </Link>
          </div>
        )}

        <div className="table-foot">
          <span>
            Showing <b>{items.length}</b> of {allItems.length} {plural(allItems.length, "item")}
          </span>
          <span className="table-foot__right">
            <span className="foot-note">
              {filtered ? `${num(stats.requiredUnits)} units required across locations` : "Quantities shown across locations"}
            </span>
          </span>
        </div>
      </section>
    </div>
  );
}
