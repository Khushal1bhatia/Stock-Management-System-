import type { Metadata } from "next";
import Link from "next/link";
import { getOverviewData } from "@/lib/queries";
import { money, movementIcon, num, plural, qtyClass, signedQty, relativeWhen } from "@/lib/format";
import { statusOf } from "@/lib/products";
import { Icon } from "@/components/icons";
import { ProductTile, StockRail } from "@/components/ui";
import { OpenAdjustButton } from "@/components/actions";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const { stats, attention, flow, recent, categories } = await getOverviewData();

  const maxCategory = Math.max(1, ...categories.map((category) => category.valueCents));
  const avgPerSku = stats.skus ? Math.round(stats.units / stats.skus) : 0;
  const highestDay = Math.max(1, ...flow.days.map((day) => Math.max(day.received, day.dispatched)));
  const yMax = Math.max(40, Math.ceil(highestDay / 40) * 40);
  const ticks = [1, 0.75, 0.5, 0.25, 0].map((fraction) => Math.round(yMax * fraction));

  const attentionSummary =
    stats.attention === 0
      ? "All stock above reorder point."
      : [stats.low ? `${stats.low} low` : "", stats.out ? `${stats.out} out of stock` : ""].filter(Boolean).join(" · ");

  return (
    <div className="view">
      <section className="snapshot" aria-label="Inventory snapshot">
        <div className="snapshot__cell">
          <span className="stat-label">Active SKUs</span>
          <span className="stat-value">{num(stats.skus)}</span>
          <span className="stat-meta">
            {stats.categories} {plural(stats.categories, "category", "categories")} · {stats.suppliers} suppliers
          </span>
        </div>
        <div className="snapshot__cell">
          <span className="stat-label">Units on hand</span>
          <span className="stat-value">{num(stats.units)}</span>
          <span className="stat-meta">{num(avgPerSku)} units per SKU on average</span>
        </div>
        <div className="snapshot__cell">
          <span className="stat-label">Inventory value</span>
          <span className="stat-value">{money(stats.valueCents)}</span>
          <span className="stat-meta">At cost · {money(stats.retailCents)} at retail</span>
        </div>
        <div className="snapshot__cell snapshot__cell--attention">
          <span className="stat-label">Needs attention</span>
          <span className="stat-value">{num(stats.attention)}</span>
          <span className="stat-meta">{attentionSummary}</span>
          <Link className="stat-link" href="/inventory?status=attention">
            Review restock queue <Icon name="i-arrow-right" />
          </Link>
        </div>
      </section>

      <div className="overview-grid">
        <section className="panel flow-panel" aria-labelledby="flow-title">
          <header className="panel__head">
            <div>
              <h2 className="panel__title" id="flow-title">
                Unit flow
              </h2>
              <p className="panel__sub">Received vs. dispatched · last 7 days</p>
            </div>
            <div className="legend" aria-label="Chart legend">
              <span>
                <i className="in" /> Received
              </span>
              <span>
                <i className="out" /> Dispatched
              </span>
            </div>
          </header>

          <div className="chart">
            <div className="chart__body">
              <div className="chart__y" aria-hidden="true">
                {ticks.map((tick, index) => (
                  <span key={index}>{num(tick)}</span>
                ))}
              </div>
              <div className="chart__main">
                <div className="chart__plot">
                  <div className="chart__groups">
                    {flow.days.map((day) => (
                      <div
                        className="chart__group"
                        key={day.key}
                        role="img"
                        aria-label={`${day.dateLabel}: ${day.received} received, ${day.dispatched} dispatched`}
                      >
                        <span className="chart__tip">
                          {num(day.received)} in · {num(day.dispatched)} out
                        </span>
                        <span
                          className="chart__bar chart__bar--in"
                          style={{ height: `${Math.max(0, (day.received / yMax) * 100).toFixed(1)}%` }}
                        />
                        <span
                          className="chart__bar chart__bar--out"
                          style={{ height: `${Math.max(0, (day.dispatched / yMax) * 100).toFixed(1)}%` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="chart__x" aria-hidden="true">
                  {flow.days.map((day, index) => (
                    <span className={index === flow.days.length - 1 ? "today" : ""} key={day.key}>
                      {day.dateLabel}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="chart__foot">
              <div className="chart__stat">
                <span>Received</span>
                <strong className="positive">+{num(flow.totalIn)}</strong>
              </div>
              <div className="chart__stat">
                <span>Dispatched</span>
                <strong className="negative">−{num(flow.totalOut)}</strong>
              </div>
              <div className="chart__stat">
                <span>Net change</span>
                <strong className={flow.net > 0 ? "positive" : flow.net < 0 ? "negative" : "neutral"}>
                  {flow.net > 0 ? "+" : flow.net < 0 ? "−" : ""}
                  {num(Math.abs(flow.net))}
                </strong>
              </div>
            </div>
          </div>
        </section>

        <section className="panel restock-panel" aria-labelledby="restock-title">
          <header className="panel__head">
            <div>
              <h2 className="panel__title" id="restock-title">
                Restock queue
              </h2>
              <p className="panel__sub">
                {attention.length
                  ? `${attention.length} ${plural(attention.length, "item")} below reorder point`
                  : "All stock above reorder point"}
              </p>
            </div>
            <Link className="panel__link" href="/inventory?status=attention">
              View all <Icon name="i-arrow-right" />
            </Link>
          </header>

          {attention.length ? (
            <div className="restock-list">
              {attention.slice(0, 5).map((product) => {
                const status = statusOf(product.stock, product.reorder);
                return (
                  <OpenAdjustButton
                    key={product.id}
                    productId={product.id}
                    type="in"
                    className="restock-row"
                    ariaLabel={`Receive stock for ${product.name}`}
                  >
                    <ProductTile name={product.name} category={product.category} />
                    <span className="restock-row__main">
                      <span className="restock-row__name">{product.name}</span>
                      <span className="restock-row__meta">
                        <span className="mono">{product.sku}</span> · {product.supplierName}
                      </span>
                      <StockRail stock={product.stock} reorder={product.reorder} />
                    </span>
                    <span className="restock-row__qty">
                      <strong className={`is-${status}`}>{num(product.stock)}</strong>
                      <span>/ {num(product.reorder)}</span>
                    </span>
                    <span className="restock-row__chev" aria-hidden="true">
                      <Icon name="i-arrow-right" />
                    </span>
                  </OpenAdjustButton>
                );
              })}
            </div>
          ) : (
            <div className="restock-empty">
              <Icon name="i-check-circle" />
              <strong>Nothing to reorder</strong>
              <span>Every product is above its reorder point.</span>
            </div>
          )}
        </section>

        <section className="panel recent-panel" aria-labelledby="recent-title">
          <header className="panel__head">
            <div>
              <h2 className="panel__title" id="recent-title">
                Recent movement
              </h2>
              <p className="panel__sub">Latest receipts, dispatches, and counts</p>
            </div>
            <Link className="panel__link" href="/movements">
              View history <Icon name="i-arrow-right" />
            </Link>
          </header>

          <div className="recent-list">
            {recent.length ? (
              recent.map((movement) => (
                <div className="recent-row" key={movement.id}>
                  <span className={`movement-icon movement-icon--${movement.type}`} aria-hidden="true">
                    <Icon name={movementIcon(movement.type)} />
                  </span>
                  <span className="recent-row__main">
                    <span className="recent-row__name">{movement.productName}</span>
                    <span className="recent-row__meta">
                      <span className="mono">{movement.reference}</span> · {relativeWhen(movement.createdAt)}
                    </span>
                  </span>
                  <span className={`recent-row__qty ${qtyClass(movement.type)}`}>
                    {signedQty(movement.qty, movement.type)}
                    <small>{movement.unit}</small>
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state__icon">
                  <Icon name="i-flow" />
                </div>
                <h3>No movement recorded</h3>
                <p>Receive or remove stock and it will appear here.</p>
              </div>
            )}
          </div>
        </section>

        <section className="panel category-panel" aria-labelledby="category-title">
          <header className="panel__head">
            <div>
              <h2 className="panel__title" id="category-title">
                Value by category
              </h2>
              <p className="panel__sub">Inventory at cost · {money(stats.valueCents)} total</p>
            </div>
          </header>

          <div className="category-list">
            {categories.length ? (
              categories.map((category) => (
                <div className="category-row" key={category.name}>
                  <span className="category-row__name">
                    {category.name}{" "}
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink-3)" }}>
                      · {category.count}
                    </span>
                  </span>
                  <span className="category-row__value">{money(category.valueCents)}</span>
                  <span className="category-row__bar">
                    <span
                      className="category-row__fill"
                      style={{ width: `${Math.max(2, (category.valueCents / maxCategory) * 100).toFixed(1)}%` }}
                    />
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No categories yet.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
