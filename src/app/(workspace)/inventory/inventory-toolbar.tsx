"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/constants";
import type { InventoryFilters } from "@/lib/types";
import { inventoryHref } from "@/lib/url";
import { Icon } from "@/components/icons";

export function InventoryToolbar({ filters, suppliers }: { filters: InventoryFilters; suppliers: string[] }) {
  const router = useRouter();
  const [query, setQuery] = useState(filters.q);
  const [syncedQuery, setSyncedQuery] = useState(filters.q);
  const [isPending, startTransition] = useTransition();

  // Keep the input in step with back/forward navigation or a cleared filter
  // without an effect that would cascade an extra render.
  if (filters.q !== syncedQuery) {
    setSyncedQuery(filters.q);
    setQuery(filters.q);
  }

  useEffect(() => {
    const term = query.trim();
    if (term === filters.q) return;

    const timer = window.setTimeout(() => {
      startTransition(() => {
        router.replace(inventoryHref(filters, { q: term, page: 1 }), { scroll: false });
      });
    }, 280);

    return () => window.clearTimeout(timer);
  }, [query, filters, router]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(() => {
      router.replace(inventoryHref(filters, { q: query.trim(), page: 1 }), { scroll: false });
    });
  }

  function setFilter(key: "category" | "supplier", value: string) {
    startTransition(() => {
      router.replace(inventoryHref(filters, { [key]: value, page: 1 }), { scroll: false });
    });
  }

  return (
    <div className="inventory-toolbar" aria-busy={isPending}>
      <form className="text-input" role="search" onSubmit={submit}>
        <Icon name="i-search" />
        <label className="sr-only" htmlFor="inventory-search">
          Search inventory
        </label>
        <input
          className="input"
          id="inventory-search"
          type="search"
          placeholder="Search product, SKU, or supplier"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </form>

      <div className="select-wrap">
        <label className="sr-only" htmlFor="inventory-category">
          Filter by category
        </label>
        <select
          className="input"
          id="inventory-category"
          value={filters.category}
          onChange={(event) => setFilter("category", event.target.value)}
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((category) => (
            <option value={category} key={category}>
              {category}
            </option>
          ))}
        </select>
        <Icon name="i-chevron-down" />
      </div>

      <div className="select-wrap select-wrap--wide">
        <label className="sr-only" htmlFor="inventory-supplier">
          Filter by supplier
        </label>
        <select
          className="input"
          id="inventory-supplier"
          value={filters.supplier}
          onChange={(event) => setFilter("supplier", event.target.value)}
        >
          <option value="all">All suppliers</option>
          {suppliers.map((supplier) => (
            <option value={supplier} key={supplier}>
              {supplier}
            </option>
          ))}
        </select>
        <Icon name="i-chevron-down" />
      </div>
    </div>
  );
}
