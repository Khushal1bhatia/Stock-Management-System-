"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MovementFilters } from "@/lib/types";
import { movementHref } from "@/lib/url";
import { Icon } from "@/components/icons";

export function MovementSearch({ filters }: { filters: MovementFilters }) {
  const router = useRouter();
  const [query, setQuery] = useState(filters.q);
  const [syncedQuery, setSyncedQuery] = useState(filters.q);
  const [isPending, startTransition] = useTransition();

  // Sync with back/forward navigation or a cleared filter. This adjusts state
  // during render instead of using an effect that would cascade renders.
  if (filters.q !== syncedQuery) {
    setSyncedQuery(filters.q);
    setQuery(filters.q);
  }

  useEffect(() => {
    const term = query.trim();
    if (term === filters.q) return;

    const timer = window.setTimeout(() => {
      startTransition(() => {
        router.replace(movementHref(filters, { q: term, page: 1 }), { scroll: false });
      });
    }, 280);

    return () => window.clearTimeout(timer);
  }, [query, filters, router]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(() => {
      router.replace(movementHref(filters, { q: query.trim(), page: 1 }), { scroll: false });
    });
  }

  return (
    <div className="inventory-toolbar" aria-busy={isPending}>
      <form className="text-input" role="search" onSubmit={submit}>
        <Icon name="i-search" />
        <label className="sr-only" htmlFor="movements-search">
          Search movements
        </label>
        <input
          className="input"
          id="movements-search"
          type="search"
          placeholder="Search product, SKU, reference, or person"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </form>
    </div>
  );
}
