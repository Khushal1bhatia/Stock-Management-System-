"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser, Stats } from "@/lib/types";
import { Icon } from "@/components/icons";

const NAV = [
  { href: "/overview", key: "overview", label: "Overview", icon: "i-grid" },
  { href: "/inventory", key: "inventory", label: "Inventory", icon: "i-box" },
  { href: "/movements", key: "movements", label: "Movements", icon: "i-flow" },
  { href: "/suppliers", key: "suppliers", label: "Suppliers", icon: "i-truck" },
  { href: "/departments", key: "departments", label: "Departments", icon: "i-departments" }
];

const MASTERS = [
  { href: "/centres", key: "centres", label: "Centre Master", icon: "i-centre" },
  { href: "/items", key: "items", label: "Item Master", icon: "i-items" },
  { href: "/documents", key: "documents", label: "Document Master", icon: "i-document" }
];

const MASTER_KEYS = new Set(MASTERS.map((item) => item.key));

export function Sidebar({ user, stats }: { user: SessionUser; stats: Stats }) {
  const pathname = usePathname();
  const active = pathname.split("/")[1] || "overview";
  const mastersActive = MASTER_KEYS.has(active);
  // Track a manual toggle per route so entering a master section always
  // reveals its active child without a setState effect.
  const [mastersMenu, setMastersMenu] = useState({ route: active, open: mastersActive });
  const mastersOpen = mastersMenu.route === active ? mastersMenu.open : mastersActive;
  const role = user.role === "ADMIN" ? "Administrator" : "Stock operator";

  const toggleMasters = () => {
    setMastersMenu({ route: active, open: !mastersOpen });
  };

  return (
    <aside className="sidebar" aria-label="Sidebar">
      <Link className="brand" href="/overview" aria-label="Stock Management System overview">
        <span className="brand__mark" aria-hidden="true">
          <svg viewBox="0 0 32 32"><use href="#i-shelf" /></svg>
        </span>
        <span className="brand__text">
          <strong>STOCK MANAGEMENT</strong>
          <small>System</small>
        </span>
      </Link>

      <nav className="nav" aria-label="Workspace">
        <span className="nav__label">Workspace</span>
        {NAV.map((item) => (
          <Link
            className={`nav__item ${active === item.key ? "is-active" : ""}`}
            href={item.href}
            key={item.key}
            aria-current={active === item.key ? "page" : undefined}
            title={item.label}
          >
            <Icon name={item.icon} />
            <span className="nav__text">{item.label}</span>
          </Link>
        ))}

        <span className="nav__label nav__label--section">Masters</span>
        <div className={`nav__group ${mastersOpen ? "is-open" : ""} ${mastersActive ? "is-active" : ""}`}>
          <button
            className="nav__group-toggle"
            type="button"
            aria-expanded={mastersOpen}
            aria-controls="masters-nav"
            onClick={toggleMasters}
          >
            <Icon name="i-folder" />
            <span className="nav__text">Masters</span>
            <Icon name="i-chevron-down" className="nav__chevron" />
          </button>
          <div className="nav__sub" id="masters-nav">
            {MASTERS.map((item) => (
              <Link
                className={`nav__item ${active === item.key ? "is-active" : ""}`}
                href={item.href}
                key={item.key}
                aria-current={active === item.key ? "page" : undefined}
                title={item.label}
              >
                <Icon name={item.icon} />
                <span className="nav__text">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <div className={`side-attention ${stats.attention === 0 ? "is-clear" : ""}`}>
        <div className="side-attention__top">
          <Icon name="i-alert" />
          <span>Attention</span>
        </div>
        <strong>{stats.attention === 0 ? "No restock needed" : `${stats.attention} items need restock`}</strong>
        <p>{stats.attention === 0 ? "Everything is above its reorder point." : `${stats.low} low · ${stats.out} out of stock`}</p>
        {stats.attention > 0 ? (
          <Link href="/inventory?status=attention" className="side-attention__link">
            Review queue <Icon name="i-arrow-right" />
          </Link>
        ) : null}
      </div>

      <div className="sidebar__foot">
        <div className="profile">
          <span className="avatar avatar--dark" aria-hidden="true">{user.initials}</span>
          <div className="profile__text">
            <strong>{user.name}</strong>
            <span>ASO Users · {role}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
