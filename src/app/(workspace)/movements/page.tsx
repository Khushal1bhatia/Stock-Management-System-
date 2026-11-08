import type { Metadata } from "next";
import Link from "next/link";
import { getMovementData } from "@/lib/queries";
import { parseMovementFilters, movementHref } from "@/lib/url";
import {
  formatDateShort,
  formatFullDate,
  movementIcon,
  movementLabel,
  num,
  plural,
  qtyClass,
  relativeWhen,
  signedQty
} from "@/lib/format";
import { initials } from "@/lib/products";
import { Icon } from "@/components/icons";
import { OpenAdjustButton } from "@/components/actions";
import { Pagination } from "@/components/pagination";
import { MovementSearch } from "./movement-search";

export const metadata: Metadata = { title: "Movements" };

export default async function MovementsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseMovementFilters(await searchParams);
  const data = await getMovementData(filters);
  const filtered = Boolean(filters.q) || filters.type !== "all";

  const tabs = [
    { key: "all", label: "All", count: data.counts.all },
    { key: "in", label: "Received", count: data.counts.in },
    { key: "out", label: "Dispatched", count: data.counts.out },
    { key: "adjust", label: "Adjusted", count: data.counts.adjust }
  ];

  return (
    <div className="view">
      <div className="page-tools">
        <p className="page-tools__note">Every change is time-stamped and tied to a person.</p>
        <div className="page-tools__actions">
          <OpenAdjustButton type="in" label="Log movement" />
        </div>
      </div>

      <section className="movement-summary" aria-label="Movement summary, last 7 days">
        <div className="movement-summary__cell">
          <span>Received</span>
          <strong className="positive">+{num(data.flow.totalIn)}</strong>
          <em>units in</em>
        </div>
        <div className="movement-summary__cell">
          <span>Dispatched</span>
          <strong className="negative">−{num(data.flow.totalOut)}</strong>
          <em>units out</em>
        </div>
        <div className="movement-summary__cell">
          <span>Net change</span>
          <strong className={data.flow.net > 0 ? "positive" : data.flow.net < 0 ? "negative" : ""}>
            {data.flow.net > 0 ? "+" : data.flow.net < 0 ? "−" : ""}
            {num(Math.abs(data.flow.net))}
          </strong>
          <em>units</em>
        </div>
        <div className="movement-summary__cell">
          <span>Movements</span>
          <strong>{num(data.weekCount)}</strong>
          <em>this week</em>
        </div>
      </section>

      <section className="panel movements-panel" aria-label="Stock movement history">
        <div className="inventory-head">
          <div className="status-tabs" role="group" aria-label="Filter by movement type">
            {tabs.map((tab) => {
              const active = filters.type === tab.key;
              return (
                <Link
                  className={`status-tab ${active ? "is-active" : ""}`}
                  href={movementHref(filters, { type: tab.key, page: 1 })}
                  key={tab.key}
                  aria-current={active ? "page" : undefined}
                >
                  {tab.label}
                  <span className="status-tab__count">{tab.count}</span>
                </Link>
              );
            })}
          </div>

          <MovementSearch filters={filters} />
        </div>

        <div className="table-wrap">
          {data.movements.length ? (
            <>
              <table className="data-table movements-table">
                <thead>
                  <tr>
                    <th scope="col">When</th>
                    <th scope="col">Product</th>
                    <th scope="col">Type</th>
                    <th scope="col" className="num">
                      Change
                    </th>
                    <th scope="col">Reference</th>
                    <th scope="col">Logged by</th>
                  </tr>
                </thead>
                <tbody>
                  {data.movements.map((movement) => (
                    <tr key={movement.id}>
                      <td>
                        <div className="when-cell">
                          <time dateTime={movement.createdAt} title={formatFullDate(movement.createdAt)}>
                            {relativeWhen(movement.createdAt)}
                          </time>
                          <span>{formatDateShort(movement.createdAt)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="product-cell">
                          <span className="tile tile--tiny" aria-hidden="true">
                            {initials(movement.productName)}
                          </span>
                          <span className="product-cell__text">
                            <span className="product-cell__name">{movement.productName}</span>
                            <span className="product-cell__sku">{movement.sku}</span>
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`type-chip type-chip--${movement.type}`}>
                          <Icon name={movementIcon(movement.type)} />
                          {movementLabel(movement.type)}
                        </span>
                      </td>
                      <td className="num">
                        <span className={`change-label ${qtyClass(movement.type)}`}>
                          {signedQty(movement.qty, movement.type)}
                          <small>{movement.unit}</small>
                        </span>
                      </td>
                      <td>
                        <span className="mono">{movement.reference}</span>
                      </td>
                      <td>
                        <span className="user-label">
                          <i aria-hidden="true">{initials(movement.actorName)}</i>
                          {movement.actorName}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mobile-movement-list">
                {data.movements.map((movement) => (
                  <article className="m-movement" key={movement.id}>
                    <div className="m-movement__head">
                      <span className={`movement-icon movement-icon--${movement.type}`} aria-hidden="true">
                        <Icon name={movementIcon(movement.type)} />
                      </span>
                      <span className="m-movement__id">
                        <strong>{movement.productName}</strong>
                        <span className="mono">
                          {movement.sku} · {movement.reference}
                        </span>
                      </span>
                      <span className={`m-movement__qty ${qtyClass(movement.type)}`}>
                        {signedQty(movement.qty, movement.type)}
                        <small>{movement.unit}</small>
                      </span>
                    </div>
                    <div className="m-movement__foot">
                      <span className={`type-chip type-chip--${movement.type}`}>
                        <Icon name={movementIcon(movement.type)} />
                        {movementLabel(movement.type)}
                      </span>
                      <span>{relativeWhen(movement.createdAt)}</span>
                      <span className="m-movement__user">
                        {initials(movement.actorName)} · {movement.actorName}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state__icon">
                <Icon name={filtered ? "i-search" : "i-flow"} />
              </div>
              <h3>{filtered ? "No movements match" : "No stock movement yet"}</h3>
              <p>
                {filtered
                  ? "Try another search or clear the movement type filter."
                  : "Log a receipt, dispatch, or count to begin the audit trail."}
              </p>
              {filtered ? (
                <Link className="btn btn--secondary" href="/movements">
                  Clear filters
                </Link>
              ) : (
                <OpenAdjustButton type="in" label="Log movement" />
              )}
            </div>
          )}
        </div>

        <div className="table-foot">
          <span>
            {data.total === 0 ? (
              <>No movements to show</>
            ) : (
              <>
                Showing <b>{num(data.rangeStart)}–{num(data.rangeEnd)}</b> of <b>{num(data.total)}</b>{" "}
                {plural(data.total, "movement")}
              </>
            )}
          </span>
          <span className="table-foot__right">
            <Pagination page={data.page} pageCount={data.pageCount} hrefFor={(page) => movementHref(filters, { page })} />
            {filtered ? (
              <Link className="text-btn" href="/movements">
                Clear filters
              </Link>
            ) : (
              <span className="foot-note">Newest first</span>
            )}
          </span>
        </div>
      </section>
    </div>
  );
}
