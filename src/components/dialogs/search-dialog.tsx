"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CatalogOption } from "@/lib/types";
import { statusOf, statusLabel } from "@/lib/products";
import { num } from "@/lib/format";
import { Icon } from "@/components/icons";
import { ProductTile } from "@/components/ui";
import { handleBackdropClick, useShowModal } from "@/components/dialogs/use-dialog";

export function SearchDialog({
  products,
  onClose
}: {
  products: CatalogOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const dialogRef = useShowModal("#palette-input");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter((product) =>
      !term || [product.name, product.sku, product.supplierName, product.category].join(" ").toLowerCase().includes(term)
    );
  }, [products, query]);

  useEffect(() => {
    document.getElementById(`palette-option-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function openProduct(product: CatalogOption) {
    onClose();
    router.push(`/inventory?q=${encodeURIComponent(product.sku)}`);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const product = results[active];
      if (product) openProduct(product);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialog dialog--search"
      aria-labelledby="search-dialog-title"
      onClick={(event) => handleBackdropClick(event, onClose)}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="palette">
        <h2 id="search-dialog-title" className="sr-only">Search products</h2>
        <div className="palette__input-row">
          <Icon name="i-search" />
          <input
            id="palette-input"
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search by product, SKU, or supplier…"
            autoComplete="off"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            aria-autocomplete="list"
            aria-activedescendant={results.length ? `palette-option-${active}` : undefined}
          />
          <kbd>Esc</kbd>
        </div>
        <div className="palette__list" id="palette-results" role="listbox" aria-label="Products">
          {results.length ? (
            <>
              <div className="palette__group-label">Products</div>
              {results.map((product, index) => {
                const status = statusOf(product.stock, product.reorder);
                return (
                  <div
                    className={`palette-item ${index === active ? "is-active" : ""}`}
                    id={`palette-option-${index}`}
                    key={product.id}
                    role="option"
                    aria-selected={index === active}
                    onClick={() => openProduct(product)}
                    onMouseEnter={() => setActive(index)}
                  >
                    <ProductTile name={product.name} category={product.category} tiny />
                    <span className="palette-item__main">
                      <span className="palette-item__name">{product.name}</span>
                      <span className="palette-item__meta">{product.sku} · {product.supplierName}</span>
                    </span>
                    <span className="palette-item__stock">
                      <strong className={status === "out" ? "is-out" : status === "low" ? "is-low" : ""}>
                        {num(product.stock)} {product.unit}
                      </strong>
                      <span>{statusLabel(status)}</span>
                    </span>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="palette__empty">No products match “{query.trim()}”.</div>
          )}
        </div>
        <div className="palette__foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> to move</span>
          <span><kbd>↵</kbd> to open</span>
          <span>{products.length} {products.length === 1 ? "product" : "products"}</span>
        </div>
      </div>
    </dialog>
  );
}
