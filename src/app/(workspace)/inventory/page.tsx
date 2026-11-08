import type { Metadata } from "next";
import Link from "next/link";
import { getInventoryData, getInventoryFacets } from "@/lib/queries";
import { parseInventoryFilters, inventoryHref, exportHref } from "@/lib/url";
import { money, num, plural } from "@/lib/format";
import type { InventoryFilters } from "@/lib/types";
import { Icon } from "@/components/icons";
import { StatusPill, StockCount, ProductTile, StockRail } from "@/components/ui";
import { AddProductButton, OpenAdjustButton, ProductActions } from "@/components/actions";
import { Pagination } from "@/components/pagination";
import { InventoryToolbar } from "./inventory-toolbar";

export const metadata: Metadata = { title: "Inventory" };

function hasActiveFilters(filters: InventoryFilters) {
  return Boolean(filters.q) || filters.category !== "all" || filters.supplier !== "all" || filters.status !== "all";
}

function SortLink({
  label,
  column,
  filters
}: {
  label: string;
  column: InventoryFilters["sort"];
  filters: InventoryFilters;
}) {
  const active = filters.sort === column;
  const direction = active && filters.dir === "asc" ? "desc" : "asc";

  return (
    <Link
      className={`th-sort ${active ? "is-sorted" : ""} ${active && filters.dir === "desc" ? "is-desc" : ""}`}
      href={inventoryHref(filters, { sort: column, dir: direction, page: 1 })}
      aria-label={`Sort by ${label}`}
    >
      {label}
      <Icon name="i-sort" />
    </Link>
  );
}

export default async function InventoryPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseInventoryFilters(await searchParams);
  const [data, suppliers] = await Promise.all([getInventoryData(filters), getInventoryFacets()]);
  const { stats } = data;
  const filtered = hasActiveFilters(filters);

  const tabs = [
    { key: "all", label: "All stock", count: stats.skus },
    { key: "attention", label: "Needs attention", count: stats.attention },
    { key: "healthy", label: "Healthy", count: stats.skus - stats.attention },
    { key: "low", label: "Low", count: stats.low },
    { key: "out", label: "Out", count: stats.out }
  ];

  return (
    <div className="view">
      <div className="page-tools">
        <p className="page-tools__note">
          Manage stock levels, pricing, and reorder points. Every change is recorded in the movement log.
        </p>
        <div className="page-tools__actions">
          <a className="btn btn--secondary" href={exportHref(filters)}>
            <Icon name="i-download" />
            Export CSV
          </a>
          <AddProductButton />
        </div>
      </div>

      <section className="panel inventory-panel" aria-label="Product inventory">
        <div className="inventory-head">
          <div className="status-tabs" role="group" aria-label="Filter by stock status">
            {tabs.map((tab) => {
              const active = filters.status === tab.key;
              return (
                <Link
                  className={`status-tab ${active ? "is-active" : ""}`}
                  href={inventoryHref(filters, { status: tab.key, page: 1 })}
                  key={tab.key}
                  aria-current={active ? "page" : undefined}
                >
                  {tab.label}
                  <span className="status-tab__count">{tab.count}</span>
                </Link>
              );
            })}
          </div>

          <InventoryToolbar filters={filters} suppliers={suppliers} />
        </div>

        <div className="table-wrap">
          {data.products.length ? (
            <>
              <table className="data-table inventory-table">
                <thead>
                  <tr>
                    <th scope="col" aria-sort={filters.sort === "name" ? (filters.dir === "asc" ? "ascending" : "descending") : "none"}>
                      <SortLink label="Product" column="name" filters={filters} />
                    </th>
                    <th scope="col">Category</th>
                    <th scope="col">Supplier</th>
                    <th
                      scope="col"
                      className="num"
                      aria-sort={filters.sort === "price" ? (filters.dir === "asc" ? "ascending" : "descending") : "none"}
                    >
                      <SortLink label="Price" column="price" filters={filters} />
                    </th>
                    <th
                      scope="col"
                      aria-sort={filters.sort === "stock" ? (filters.dir === "asc" ? "ascending" : "descending") : "none"}
                    >
                      <SortLink label="On hand" column="stock" filters={filters} />
                    </th>
                    <th scope="col">Status</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="product-cell">
                          <ProductTile name={product.name} category={product.category} />
                          <span className="product-cell__text">
                            <span className="product-cell__name">{product.name}</span>
                            <span className="product-cell__sku">{product.sku}</span>
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="cat-label">{product.category}</span>
                      </td>
                      <td>
                        <span className="supplier-label" title={product.supplierName}>
                          {product.supplierName}
                        </span>
                      </td>
                      <td className="num">
                        <span className="price-label">{money(product.priceCents, 2)}</span>
                      </td>
                      <td>
                        <StockCount stock={product.stock} unit={product.unit} reorder={product.reorder} />
                      </td>
                      <td>
                        <StatusPill status={product.status} />
                      </td>
                      <td>
                        <ProductActions product={product} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mobile-product-list">
                {data.products.map((product) => (
                  <article className="m-product" key={product.id}>
                    <div className="m-product__head">
                      <ProductTile name={product.name} category={product.category} />
                      <span className="m-product__id">
                        <strong>{product.name}</strong>
                        <span className="mono">{product.sku}</span>
                      </span>
                      <ProductActions product={product} />
                    </div>
                    <p className="m-product__meta">
                      {product.category} · {product.supplierName}
                    </p>
                    <div className="m-product__facts">
                      <div>
                        <span>On hand</span>
                        <strong>
                          {num(product.stock)} <em>{product.unit}</em>
                        </strong>
                      </div>
                      <div>
                        <span>Price</span>
                        <strong>{money(product.priceCents, 2)}</strong>
                      </div>
                      <div>
                        <span>Status</span>
                        <StatusPill status={product.status} />
                      </div>
                    </div>
                    <StockRail stock={product.stock} reorder={product.reorder} />
                    <div className="m-product__foot">
                      <span>Reorder at {num(product.reorder)}</span>
                      <OpenAdjustButton productId={product.id} type="in" className="text-btn">
                        Adjust stock →
                      </OpenAdjustButton>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state__icon">
                <Icon name={filtered ? "i-search" : "i-box"} />
              </div>
              <h3>{filtered ? "No products match these filters" : "Your inventory is empty"}</h3>
              <p>
                {filtered
                  ? "Try a different search, or clear the filters to see the full catalog."
                  : "Add your first product to start tracking stock and reorder points."}
              </p>
              {filtered ? (
                <Link className="btn btn--secondary" href="/inventory">
                  Clear filters
                </Link>
              ) : (
                <AddProductButton />
              )}
            </div>
          )}
        </div>

        <div className="table-foot">
          <span>
            {data.total === 0 ? (
              <>No products to show</>
            ) : (
              <>
                Showing <b>{num(data.rangeStart)}–{num(data.rangeEnd)}</b> of <b>{num(data.total)}</b>{" "}
                {plural(data.total, "product")}
              </>
            )}
          </span>
          <span className="table-foot__right">
            <Pagination page={data.page} pageCount={data.pageCount} hrefFor={(page) => inventoryHref(filters, { page })} />
            {filtered ? (
              <Link className="text-btn" href="/inventory">
                Clear filters
              </Link>
            ) : (
              <span className="foot-note">Values in USD</span>
            )}
          </span>
        </div>
      </section>
    </div>
  );
}
