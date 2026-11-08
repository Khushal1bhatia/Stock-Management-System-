import type { Metadata } from "next";
import Link from "next/link";
import { getDepartmentMasterData } from "@/lib/master-data";
import { departmentHref, parseDepartmentFilters } from "@/lib/url";
import { num, plural } from "@/lib/format";
import { Icon } from "@/components/icons";
import { DepartmentCard } from "@/components/master-ui";
import { DepartmentToolbar } from "../master-toolbar";

export const metadata: Metadata = { title: "Departments" };

export default async function DepartmentsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseDepartmentFilters(await searchParams);
  const { departments, allDepartments, stats } = await getDepartmentMasterData(filters);

  const tabs = [
    { key: "all", label: "All departments", count: stats.total },
    { key: "needs", label: "Needs stock", count: stats.withNeeds },
    { key: "ready", label: "Covered", count: stats.ready }
  ];

  return (
    <div className="view">
      <div className="page-tools">
        <p className="page-tools__note">
          Departments group the shared catalogue by how stock is used. Open one to see its items, stock
          cover, and locations that need restocking.
        </p>
        <div className="page-tools__actions">
          <span className="lead-chip">
            <Icon name="i-departments" />
            {stats.total} departments · {stats.items} items
          </span>
        </div>
      </div>

      <section className="centre-summary department-summary" aria-label="Department summary">
        <div className="centre-summary__cell">
          <span>Departments</span>
          <strong>{stats.total}</strong>
          <em>grouped by use</em>
        </div>
        <div className="centre-summary__cell">
          <span>Item assignments</span>
          <strong>{stats.assignments}</strong>
          <em>{stats.items} unique items</em>
        </div>
        <div className="centre-summary__cell">
          <span>Need stock</span>
          <strong className={stats.withNeeds ? "negative" : "positive"}>{stats.withNeeds}</strong>
          <em>{stats.critical} critical</em>
        </div>
        <div className="centre-summary__cell">
          <span>Units short</span>
          <strong className={stats.shortfallUnits ? "negative" : "positive"}>{num(stats.shortfallUnits)}</strong>
          <em>across assignments</em>
        </div>
      </section>

      <section className="panel departments-panel" aria-label="Department list">
        <div className="inventory-head">
          <div className="status-tabs" role="group" aria-label="Filter departments by stock status">
            {tabs.map((tab) => {
              const active = filters.status === tab.key;
              return (
                <Link
                  className={`status-tab ${active ? "is-active" : ""}`}
                  href={departmentHref(filters, { status: tab.key as typeof filters.status })}
                  key={tab.key}
                  aria-current={active ? "page" : undefined}
                >
                  {tab.label}
                  <span className="status-tab__count">{tab.count}</span>
                </Link>
              );
            })}
          </div>
          <DepartmentToolbar filters={filters} />
        </div>

        {departments.length ? (
          <div className="centres-grid departments-grid">
            {departments.map((department) => (
              <DepartmentCard department={department} key={department.id} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state__icon">
              <Icon name="i-departments" />
            </div>
            <h3>No departments match this view</h3>
            <p>Try a different search, or show every department in the master list.</p>
            <Link className="btn btn--secondary" href="/departments">
              Show all departments
            </Link>
          </div>
        )}

        <div className="table-foot">
          <span>
            Showing <b>{departments.length}</b> of {allDepartments.length}{" "}
            {plural(allDepartments.length, "department")}
          </span>
          <span className="table-foot__right">
            <span className="foot-note">Items can belong to more than one department</span>
          </span>
        </div>
      </section>
    </div>
  );
}
