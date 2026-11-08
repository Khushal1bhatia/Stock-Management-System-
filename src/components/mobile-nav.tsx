"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";

const NAV = [
  { href: "/overview", key: "overview", label: "Overview", icon: "i-grid" },
  { href: "/inventory", key: "inventory", label: "Inventory", icon: "i-box" },
  { href: "/movements", key: "movements", label: "Moves", icon: "i-flow" },
  { href: "/suppliers", key: "suppliers", label: "Suppliers", icon: "i-truck" },
  { href: "/departments", key: "departments", label: "Depts", icon: "i-departments" },
  { href: "/centres", key: "centres", label: "Centres", icon: "i-centre" },
  { href: "/items", key: "items", label: "Items", icon: "i-items" },
  { href: "/documents", key: "documents", label: "Docs", icon: "i-document" }
];

export function MobileNav() {
  const pathname = usePathname();
  const active = pathname.split("/")[1] || "overview";

  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {NAV.map((item) => (
        <Link
          className={`mobile-nav__item ${active === item.key ? "is-active" : ""}`}
          href={item.href}
          key={item.key}
          aria-current={active === item.key ? "page" : undefined}
        >
          <Icon name={item.icon} />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
