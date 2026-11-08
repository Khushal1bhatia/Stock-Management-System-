import { categoryClass, initials, railMetrics, statusClass, statusLabel } from "@/lib/products";
import type { StockStatus } from "@/lib/constants";
import { num } from "@/lib/format";

export function ProductTile({
  name,
  category,
  tiny = false
}: {
  name: string;
  category: string;
  tiny?: boolean;
}) {
  return (
    <span className={`tile ${tiny ? "tile--tiny" : ""} tile--${categoryClass(category)}`} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export function StockRail({ stock, reorder }: { stock: number; reorder: number }) {
  const { fill, tick } = railMetrics(stock, reorder);
  return (
    <span className="stock-rail" aria-hidden="true">
      <span className={`stock-rail__fill is-${stockStatus(stock, reorder)}`} style={{ width: `${fill.toFixed(1)}%` }} />
      <span className="stock-rail__tick" style={{ left: `${tick.toFixed(1)}%` }} />
    </span>
  );
}

function stockStatus(stock: number, reorder: number): StockStatus {
  if (stock <= 0) return "out";
  if (stock <= reorder) return "low";
  return "healthy";
}

export function StatusPill({ status }: { status: StockStatus }) {
  return (
    <span className={`status ${statusClass(status)}`}>
      <i />
      {statusLabel(status)}
    </span>
  );
}

export function StockCount({ stock, unit, reorder }: { stock: number; unit: string; reorder: number }) {
  return (
    <div className="stock-cell">
      <div className="stock-cell__top">
        <strong>{num(stock)}</strong>
        <span>{unit}</span>
      </div>
      <StockRail stock={stock} reorder={reorder} />
      <div className="stock-cell__meta">Reorder at {num(reorder)}</div>
    </div>
  );
}
