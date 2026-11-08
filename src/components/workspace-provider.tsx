"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CatalogOption, ProductView, SessionUser } from "@/lib/types";
import { ProductDialog } from "@/components/dialogs/product-dialog";
import { AdjustDialog } from "@/components/dialogs/adjust-dialog";
import { DeleteDialog } from "@/components/dialogs/delete-dialog";
import { PasswordDialog } from "@/components/dialogs/password-dialog";
import { SearchDialog } from "@/components/dialogs/search-dialog";
import { ToastStack, type ToastItem, type ToastTone } from "@/components/toast-stack";
import { Icon } from "@/components/icons";

export type AdjustType = "in" | "out" | "set";
export type CatalogData = {
  products: CatalogOption[];
  suppliers: Array<{ id: string; name: string }>;
};

type DialogState =
  | { kind: "product"; product: ProductView | null }
  | { kind: "adjust"; productId?: string; type: AdjustType }
  | { kind: "delete"; product: ProductView }
  | { kind: "password" }
  | { kind: "search" };

type WorkspaceContextValue = {
  user: SessionUser;
  openProductDialog: (product?: ProductView | null) => Promise<void>;
  openAdjustDialog: (productId?: string, type?: AdjustType) => Promise<void>;
  confirmDelete: (product: ProductView) => void;
  openPasswordDialog: () => void;
  openSearch: () => Promise<void>;
  toast: (title: string, message?: string, tone?: ToastTone) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return value;
}

let toastSequence = 0;

export function WorkspaceProvider({
  user,
  children
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const catalogRef = useRef<CatalogData | null>(null);
  const pendingCatalog = useRef<Promise<CatalogData | null> | null>(null);

  const dismissToast = useCallback((id: number) => {
    setToasts((items) => items.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback((title: string, message?: string, tone: ToastTone = "success") => {
    const id = ++toastSequence;
    setToasts((items) => [...items.slice(-3), { id, title, message, tone }]);
    window.setTimeout(() => dismissToast(id), 5200);
  }, [dismissToast]);

  const loadCatalog = useCallback(async (force = false) => {
    if (force) {
      catalogRef.current = null;
      pendingCatalog.current = null;
      setCatalog(null);
    }
    if (catalogRef.current) return catalogRef.current;
    if (pendingCatalog.current) return pendingCatalog.current;

    const request = fetch("/api/catalog", {
      cache: "no-store",
      headers: { accept: "application/json" }
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Catalog request failed (${response.status})`);
        const data = (await response.json()) as CatalogData;
        catalogRef.current = data;
        setCatalog(data);
        return data;
      })
      .catch((error) => {
        console.error("Could not load catalog", error);
        pendingCatalog.current = null;
        return null;
      });

    pendingCatalog.current = request;
    return request;
  }, []);

  const invalidateCatalog = useCallback(() => {
    catalogRef.current = null;
    pendingCatalog.current = null;
    setCatalog(null);
  }, []);

  const requireCatalog = useCallback(async () => {
    const data = await loadCatalog();
    if (!data) {
      toast("Inventory unavailable", "Could not load product data. Check your connection and try again.", "error");
      return null;
    }
    return data;
  }, [loadCatalog, toast]);

  const openProductDialog = useCallback(async (product: ProductView | null = null) => {
    if (!(await requireCatalog())) return;
    setDialog({ kind: "product", product });
  }, [requireCatalog]);

  const openAdjustDialog = useCallback(async (productId?: string, type: AdjustType = "in") => {
    if (!(await requireCatalog())) return;
    setDialog({ kind: "adjust", productId, type });
  }, [requireCatalog]);

  const confirmDelete = useCallback((product: ProductView) => {
    setDialog({ kind: "delete", product });
  }, []);

  const openPasswordDialog = useCallback(() => {
    setDialog({ kind: "password" });
  }, []);

  const openSearch = useCallback(async () => {
    if (document.querySelector("dialog[open]")) return;
    if (!(await requireCatalog())) return;
    setDialog({ kind: "search" });
  }, [requireCatalog]);

  const closeDialog = useCallback(() => setDialog(null), []);

  const handleSaved = useCallback((title: string, message: string) => {
    setDialog(null);
    invalidateCatalog();
    toast(title, message, "success");
    router.refresh();
  }, [invalidateCatalog, router, toast]);

  useEffect(() => {
    // Warm the catalog so the first dialog opens without a network wait. The
    // state update happens asynchronously inside loadCatalog, not in this
    // effect body, so it does not cause a synchronous cascading render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    document.body.style.overflow = dialog ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [dialog]);

  useEffect(() => {
    function isTyping(target: EventTarget | null) {
      return target instanceof HTMLElement && (
        target.tagName === "INPUT" ||
        target.tagName === "SELECT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      );
    }

    function onKeyDown(event: KeyboardEvent) {
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (!document.querySelector("dialog[open]")) void openSearch();
        return;
      }
      if (event.key === "/" && !isTyping(event.target) && !document.querySelector("dialog[open]")) {
        event.preventDefault();
        void openSearch();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openSearch]);

  const value = useMemo<WorkspaceContextValue>(() => ({
    user,
    openProductDialog,
    openAdjustDialog,
    confirmDelete,
    openPasswordDialog,
    openSearch,
    toast
  }), [user, openProductDialog, openAdjustDialog, confirmDelete, openPasswordDialog, openSearch, toast]);

  return (
    <WorkspaceContext.Provider value={value}>
      {children}

      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      {dialog?.kind === "product" && catalog ? (
        <ProductDialog
          product={dialog.product}
          suppliers={catalog.suppliers}
          onClose={closeDialog}
          onSaved={handleSaved}
          onError={(message) => toast("Could not save product", message, "error")}
        />
      ) : null}

      {dialog?.kind === "adjust" && catalog ? (
        <AdjustDialog
          catalog={catalog.products}
          initialProductId={dialog.productId}
          initialType={dialog.type}
          onClose={closeDialog}
          onSaved={handleSaved}
          onError={(message) => toast("Could not record movement", message, "error")}
        />
      ) : null}

      {dialog?.kind === "delete" ? (
        <DeleteDialog
          product={dialog.product}
          onClose={closeDialog}
          onSaved={handleSaved}
          onError={(message) => toast("Could not remove product", message, "error")}
        />
      ) : null}

      {dialog?.kind === "password" ? (
        <PasswordDialog
          onClose={closeDialog}
          onToast={toast}
        />
      ) : null}

      {dialog?.kind === "search" && catalog ? (
        <SearchDialog
          products={catalog.products}
          onClose={closeDialog}
        />
      ) : null}
    </WorkspaceContext.Provider>
  );
}

/** The shared toast icon mapping keeps the provider and stack in sync. */
export function ToastIcon({ tone }: { tone: ToastTone }) {
  return <Icon name={tone === "error" ? "i-alert" : tone === "info" ? "i-flow" : "i-check"} />;
}
