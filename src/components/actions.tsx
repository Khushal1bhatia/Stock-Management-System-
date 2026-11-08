"use client";

import { useEffect, useRef, useState } from "react";
import type { ProductView } from "@/lib/types";
import { useWorkspace, type AdjustType } from "@/components/workspace-provider";
import { Icon } from "@/components/icons";

export function AddProductButton({ className = "btn btn--primary", label = "Add product" }: { className?: string; label?: string }) {
  const { openProductDialog } = useWorkspace();
  return (
    <button className={className} type="button" onClick={() => void openProductDialog(null)}>
      <Icon name="i-plus" />
      {label}
    </button>
  );
}

export function OpenAdjustButton({
  productId,
  type = "in",
  className = "btn btn--primary",
  label,
  children,
  ariaLabel
}: {
  productId?: string;
  type?: AdjustType;
  className?: string;
  label?: string;
  children?: React.ReactNode;
  ariaLabel?: string;
}) {
  const { openAdjustDialog } = useWorkspace();
  return (
    <button className={className} type="button" aria-label={ariaLabel} onClick={() => void openAdjustDialog(productId, type)}>
      {children ?? (
        <>
          <Icon name="i-plus" />
          {label}
        </>
      )}
    </button>
  );
}

export function ProductActions({ product }: { product: ProductView }) {
  const { user, openProductDialog, openAdjustDialog, confirmDelete } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
      if (event.key === "Tab") setOpen(false);
    }
    function onScroll() {
      setOpen(false);
    }

    // Move focus into the menu so keyboard users can act on it immediately.
    const focusTimer = window.setTimeout(() => {
      menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    }, 0);

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  function onMenuKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const items = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])];
    if (!items.length) return;
    const index = items.indexOf(document.activeElement as HTMLButtonElement);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      items[(index + 1) % items.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      items[(index - 1 + items.length) % items.length]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      items[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      items[items.length - 1]?.focus();
    }
  }

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const menuWidth = 186;
      const menuHeight = user.role === "ADMIN" ? 140 : 106;
      let top = rect.bottom + 6;
      if (top + menuHeight > window.innerHeight - 12) top = rect.top - menuHeight - 6;
      const left = Math.max(10, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 10));
      setPosition({ top: Math.max(10, top), left });
    }
    setOpen(true);
  }

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <>
      <button
        ref={buttonRef}
        className="row-action"
        type="button"
        aria-label={`Actions for ${product.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
      >
        <Icon name="i-more" />
      </button>

      {open ? (
        <div
          ref={menuRef}
          className="row-menu"
          role="menu"
          style={{ top: position.top, left: position.left, position: "fixed" }}
          onKeyDown={onMenuKeyDown}
        >
          <button className="row-menu__item" type="button" role="menuitem" onClick={() => run(() => void openAdjustDialog(product.id, "in"))}>
            <Icon name="i-flow" />
            Adjust stock
          </button>
          <button className="row-menu__item" type="button" role="menuitem" onClick={() => run(() => void openProductDialog(product))}>
            <Icon name="i-edit" />
            Edit product
          </button>
          {user.role === "ADMIN" ? (
            <>
              <div className="row-menu__sep" role="separator" />
              <button className="row-menu__item row-menu__item--danger" type="button" role="menuitem" onClick={() => run(() => confirmDelete(product))}>
                <Icon name="i-trash" />
                Delete product
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
