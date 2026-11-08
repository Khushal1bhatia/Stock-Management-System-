"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import type { ProductView, SessionUser, Stats } from "@/lib/types";
import { num, plural } from "@/lib/format";
import { statusOf } from "@/lib/products";
import { Icon } from "@/components/icons";
import { ProductTile } from "@/components/ui";
import { useWorkspace } from "@/components/workspace-provider";
import { logoutAction } from "@/app/actions/auth";

const PAGE_TITLES: Record<string, string> = {
  overview: "Overview",
  inventory: "Inventory",
  movements: "Movements",
  suppliers: "Suppliers",
  departments: "Departments",
  centres: "Centre Master",
  items: "Item Master",
  documents: "Document Master"
};

const subscribeToPlatform = () => () => {};

function getShortcutLabel() {
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent) ? "⌘K" : "Ctrl K";
}

function getServerShortcutLabel() {
  return "Ctrl K";
}

export function Topbar({
  user,
  stats,
  attention,
  todayLabel
}: {
  user: SessionUser;
  stats: Stats;
  attention: ProductView[];
  todayLabel: string;
}) {
  const pathname = usePathname();
  const { openSearch, openAdjustDialog, openPasswordDialog } = useWorkspace();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const shortcut = useSyncExternalStore(subscribeToPlatform, getShortcutLabel, getServerShortcutLabel);
  const notifRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const route = pathname.split("/")[1] || "overview";
  const title = PAGE_TITLES[route] ?? "Overview";
  const role = user.role === "ADMIN" ? "Administrator" : "Stock operator";
  const supplierAlerts = new Set(attention.map((product) => product.supplierName)).size;

  const subtitle =
    route === "overview"
      ? todayLabel
      : route === "inventory"
        ? `${num(stats.skus)} ${plural(stats.skus, "product")} across ${stats.categories} ${plural(stats.categories, "category", "categories")}${stats.attention ? ` · ${stats.attention} need restock` : ""}`
        : route === "movements"
          ? "Audit trail for every stock change"
          : route === "departments"
            ? "Shared catalogue grouped by how stock is used"
            : route === "centres"
              ? "Locations, sub-centres, and their stock requirements"
              : route === "items"
                ? "Catalogue items and their requirements by location"
                : route === "documents"
                  ? "Reference guides and procedures for the stock workspace"
                  : `${stats.suppliers} ${plural(stats.suppliers, "supply partner")} · ${supplierAlerts} with restock items`;

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!notifRef.current?.contains(target)) setNotificationsOpen(false);
      if (!accountRef.current?.contains(target)) setAccountOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
        setAccountOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function openSearchDialog() {
    setNotificationsOpen(false);
    setAccountOpen(false);
    void openSearch();
  }

  return (
    <header className="topbar">
      <div className="topbar__head">
        <div className="mobile-brand" aria-hidden="true">
          <strong>STOCK MANAGEMENT SYSTEM</strong>
        </div>
        <div className="page-heading">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="topbar__actions">
        <button className="search-trigger" type="button" onClick={openSearchDialog} aria-label="Search products">
          <Icon name="i-search" />
          <span className="search-trigger__text">Search stock</span>
          <kbd>{shortcut}</kbd>
        </button>

        <div className="notif-wrap" ref={notifRef}>
          <button
            className="icon-btn"
            type="button"
            aria-label="Restock alerts"
            aria-expanded={notificationsOpen}
            aria-controls="notif-panel"
            onClick={() => {
              setAccountOpen(false);
              setNotificationsOpen((value) => !value);
            }}
          >
            <Icon name="i-bell" />
            <span className="notif-dot" hidden={attention.length === 0} />
          </button>

          <div className="notif-panel" id="notif-panel" hidden={!notificationsOpen}>
            <div className="notif-panel__head">
              <div>
                <strong>Restock alerts</strong>
                <span>{attention.length ? `${attention.length} below reorder point` : "Nothing below reorder point"}</span>
              </div>
              <button className="icon-btn icon-btn--small" type="button" onClick={() => setNotificationsOpen(false)} aria-label="Close alerts">
                <Icon name="i-close" />
              </button>
            </div>
            <div className="notif-list">
              {attention.length ? attention.slice(0, 4).map((product) => {
                const status = statusOf(product.stock, product.reorder);
                return (
                  <button
                    className="notif-item"
                    type="button"
                    key={product.id}
                    onClick={() => {
                      setNotificationsOpen(false);
                      void openAdjustDialog(product.id, "in");
                    }}
                  >
                    <ProductTile name={product.name} category={product.category} tiny />
                    <span className="notif-item__main">
                      <strong>{product.name}</strong>
                      <span>{product.stock} on hand · reorder at {product.reorder}</span>
                    </span>
                    <span className={`notif-item__qty ${status === "out" ? "is-out" : ""}`}>
                      {status === "out" ? "Out" : "Low"}
                    </span>
                  </button>
                );
              }) : (
                <div className="notif-empty">No stock alerts. Every shelf is above its reorder point.</div>
              )}
            </div>
            <Link className="notif-panel__foot" href="/inventory?status=attention" onClick={() => setNotificationsOpen(false)}>
              Open restock queue <Icon name="i-arrow-right" />
            </Link>
          </div>
        </div>

        <div className="account-wrap" ref={accountRef}>
          <button
            className="avatar avatar--button"
            type="button"
            aria-label={`Account menu for ${user.name}, ${role}`}
            aria-expanded={accountOpen}
            aria-controls="account-panel"
            onClick={() => {
              setNotificationsOpen(false);
              setAccountOpen((value) => !value);
            }}
          >
            <span>{user.initials}</span>
          </button>

          <div className="account-panel" id="account-panel" hidden={!accountOpen}>
            <div className="account-panel__head">
              <span className="avatar avatar--dark" aria-hidden="true">{user.initials}</span>
              <div className="account-panel__id">
                <strong>{user.name}</strong>
                <span>{user.username} · ASO Users</span>
              </div>
            </div>
            <div className="account-panel__role"><span>{role}</span> access</div>
            <button
              className="account-panel__logout"
              type="button"
              onClick={() => {
                setAccountOpen(false);
                openPasswordDialog();
              }}
            >
              <Icon name="i-lock" />
              Change password
            </button>
            <form action={logoutAction}>
              <button className="account-panel__logout" type="submit">
                <Icon name="i-logout" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
