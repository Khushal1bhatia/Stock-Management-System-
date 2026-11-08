"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CentreFilters, DepartmentFilters, ItemFilters } from "@/lib/types";
import { centreHref, departmentHref, itemHref } from "@/lib/url";
import { Icon } from "@/components/icons";

function SearchField({
  id,
  value,
  current,
  placeholder,
  hrefFor
}: {
  id: string;
  value: string;
  current: string;
  placeholder: string;
  hrefFor: (query: string) => string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState(value);
  const [syncedQuery, setSyncedQuery] = useState(value);

  if (value !== syncedQuery) {
    setSyncedQuery(value);
    setQuery(value);
  }

  useEffect(() => {
    const term = query.trim();
    if (term === current) return;
    const timer = window.setTimeout(() => {
      startTransition(() => {
        router.replace(hrefFor(term), { scroll: false });
      });
    }, 280);
    return () => window.clearTimeout(timer);
  }, [query, current, hrefFor, router]);

  return (
    <form
      className="text-input"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(() => {
          router.replace(hrefFor(query.trim()), { scroll: false });
        });
      }}
    >
      <Icon name="i-search" />
      <label className="sr-only" htmlFor={id}>
        {placeholder}
      </label>
      <input
        className="input"
        id={id}
        type="search"
        placeholder={placeholder}
        autoComplete="off"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
    </form>
  );
}

export function CentreToolbar({ filters }: { filters: CentreFilters }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="inventory-toolbar" aria-busy={isPending}>
      <SearchField
        id="centre-search"
        value={filters.q}
        current={filters.q}
        placeholder="Search locations, badge codes, or parents"
        hrefFor={(query) => centreHref(filters, { q: query, status: filters.status, type: filters.type })}
      />
      <div className="select-wrap select-wrap--wide">
        <label className="sr-only" htmlFor="centre-type-filter">
          Filter locations by type
        </label>
        <select
          className="input"
          id="centre-type-filter"
          value={filters.type}
          onChange={(event) =>
            startTransition(() => {
              router.replace(centreHref(filters, { type: event.target.value as CentreFilters["type"] }), {
                scroll: false
              });
            })
          }
        >
          <option value="all">All locations</option>
          <option value="Centre">Centres</option>
          <option value="SubCentre">Sub-centres</option>
          <option value="Point">Points</option>
        </select>
        <Icon name="i-chevron-down" />
      </div>
    </div>
  );
}

export function ItemToolbar({ filters }: { filters: ItemFilters }) {
  return (
    <div className="inventory-toolbar">
      <SearchField
        id="item-search"
        value={filters.q}
        current={filters.q}
        placeholder="Search items, SKU, or category"
        hrefFor={(query) => itemHref(filters, { q: query, status: filters.status })}
      />
    </div>
  );
}

export function DepartmentToolbar({ filters }: { filters: DepartmentFilters }) {
  return (
    <div className="inventory-toolbar">
      <SearchField
        id="department-search"
        value={filters.q}
        current={filters.q}
        placeholder="Search departments or items"
        hrefFor={(query) => departmentHref(filters, { q: query, status: filters.status })}
      />
    </div>
  );
}
