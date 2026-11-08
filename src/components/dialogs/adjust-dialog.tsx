"use client";

import { useRef, useState, useTransition } from "react";
import type { CatalogOption } from "@/lib/types";
import { adjustStockAction } from "@/app/actions/products";
import { categoryClass, initials } from "@/lib/products";
import { num } from "@/lib/format";
import { Icon } from "@/components/icons";
import { FieldError } from "@/components/dialogs/field-error";
import { handleBackdropClick, useShowModal } from "@/components/dialogs/use-dialog";
import type { AdjustType } from "@/components/workspace-provider";

function autoRef(type: AdjustType) {
  const prefix = type === "in" ? "PO" : type === "out" ? "SO" : "COUNT";
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function AdjustDialog({
  catalog,
  initialProductId,
  initialType,
  onClose,
  onSaved,
  onError
}: {
  catalog: CatalogOption[];
  initialProductId?: string;
  initialType: AdjustType;
  onClose: () => void;
  onSaved: (title: string, message: string) => void;
  onError: (message: string) => void;
}) {
  const dialogRef = useShowModal("[data-autofocus]");
  const formRef = useRef<HTMLFormElement>(null);
  const referenceRef = useRef<HTMLInputElement>(null);
  const firstProduct = catalog.find((product) => product.id === initialProductId) ?? catalog[0];
  const [productId, setProductId] = useState(firstProduct?.id ?? "");
  const [type, setType] = useState<AdjustType>(initialType);
  const [qty, setQty] = useState(initialType === "set" ? String(firstProduct?.stock ?? 0) : "");
  const [placeholder, setPlaceholder] = useState(() => autoRef(initialType));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const product = catalog.find((item) => item.id === productId) ?? firstProduct;

  if (!product) return null;

  const rawQty = qty.trim();
  const qtyNumber = rawQty === "" ? null : Number(rawQty);
  let delta = 0;
  let projected = product.stock;
  let invalid = false;
  let message = "";

  if (qtyNumber !== null) {
    if (!Number.isInteger(qtyNumber) || qtyNumber < 0) {
      invalid = true;
      message = "Enter a whole number of 0 or more.";
    } else if (type === "in") {
      delta = qtyNumber;
    } else if (type === "out") {
      delta = -qtyNumber;
      if (qtyNumber > product.stock) {
        invalid = true;
        message = `Only ${product.stock} ${product.unit} on hand.`;
      }
    } else {
      delta = qtyNumber - product.stock;
    }
    projected = product.stock + delta;
    if (projected < 0) {
      invalid = true;
      message = "Stock cannot go below zero.";
    }
  }

  const labels = {
    in: ["Quantity to receive", "Enter the number of units arriving."],
    out: ["Quantity to remove", "Cannot be more than the stock on hand."],
    set: ["Counted quantity", "Enter the physical count. The difference is booked as an adjustment."]
  } as const;

  const presets = type === "in" ? [10, 25, 50] : type === "out" ? [1, 5, 10] : [];

  function chooseType(next: AdjustType) {
    setType(next);
    setQty(next === "set" ? String(product.stock) : "");
    setPlaceholder(autoRef(next));
    setErrors({});
    if (referenceRef.current) referenceRef.current.value = "";
  }

  function chooseProduct(nextId: string) {
    const next = catalog.find((item) => item.id === nextId);
    setProductId(nextId);
    setQty(type === "set" ? String(next?.stock ?? 0) : "");
    setErrors({});
    if (referenceRef.current) referenceRef.current.value = "";
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = formRef.current;
    if (!form) return;

    if (qtyNumber === null) {
      setErrors({ qty: "Enter a quantity." });
      return;
    }
    if (invalid) {
      setErrors({ qty: message });
      return;
    }
    if (type !== "set" && qtyNumber === 0) {
      setErrors({ qty: "Quantity must be greater than zero." });
      return;
    }
    if (type === "set" && delta === 0) {
      setErrors({ qty: "This count matches the current stock, so there is nothing to record." });
      return;
    }

    const formData = new FormData(form);
    startTransition(async () => {
      const result = await adjustStockAction(formData);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        if (!result.fieldErrors?.qty) onError(result.error);
        return;
      }
      const title = type === "in" ? "Stock received" : type === "out" ? "Stock removed" : "Stock count updated";
      onSaved(title, result.message ?? "Movement recorded.");
    });
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby="adjust-dialog-title"
      onClick={(event) => handleBackdropClick(event, onClose)}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <form ref={formRef} className="dialog__card" onSubmit={submit} onInput={() => setErrors({})} noValidate>
        <header className="dialog__head">
          <div>
            <h2 id="adjust-dialog-title">{initialProductId ? "Move stock" : "Log movement"}</h2>
            <p>{initialProductId ? "Record a receipt, dispatch, or physical count." : "Choose a product and record what changed."}</p>
          </div>
          <button className="icon-btn icon-btn--small" type="button" onClick={onClose} aria-label="Close dialog">
            <Icon name="i-close" />
          </button>
        </header>

        <div className="dialog__body">
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="type" value={type} />

          <div className="field">
            <label htmlFor="adjust-product">Product</label>
            <div className="select-wrap">
              <select className="input" id="adjust-product" value={productId} onChange={(event) => chooseProduct(event.target.value)} required>
                {catalog.map((item) => (
                  <option key={item.id} value={item.id}>{item.name} · {item.sku}</option>
                ))}
              </select>
              <Icon name="i-chevron-down" />
            </div>
          </div>

          <div className="adjust-summary">
            <span className={`tile tile--${categoryClass(product.category)}`} aria-hidden="true">{initials(product.name)}</span>
            <span className="adjust-summary__text">
              <strong>{product.name}</strong>
              <span>{product.sku} · {product.supplierName}</span>
            </span>
            <span className="adjust-summary__stock">
              <span>On hand</span>
              <strong>{num(product.stock)} <span className="adjust-summary__unit">{product.unit}</span></strong>
            </span>
          </div>

          <div className="field">
            <span className="field-label" id="adjust-type-label">Movement type</span>
            <div className="segmented" role="group" aria-labelledby="adjust-type-label">
              {([["in", "Receive"], ["out", "Remove"], ["set", "Set count"]] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className="segmented__btn"
                  aria-pressed={type === value}
                  onClick={() => chooseType(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label htmlFor="adjust-qty">{labels[type][0]}</label>
            <div className="qty-row">
              <input
                className={`input input--num ${errors.qty ? "is-invalid" : ""}`}
                id="adjust-qty"
                name="qty"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                required
                value={qty}
                onChange={(event) => setQty(event.target.value)}
                placeholder={type === "set" ? String(product.stock) : "0"}
                data-autofocus
                aria-invalid={errors.qty ? true : undefined}
              />
              {type !== "set" ? (
                <div className="qty-presets">
                  {presets.map((value) => (
                    <button key={value} className="qty-preset" type="button" onClick={() => setQty(String(value))}>
                      +{value}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <span className="field-hint">{labels[type][1]}</span>
            <FieldError message={errors.qty} />
          </div>

          <div className={`adjust-preview ${invalid ? "is-invalid" : ""}`} aria-live="polite">
            <span className="adjust-preview__label">New on hand</span>
            <span className="adjust-preview__values">
              <strong>{num(product.stock)}</strong>
              <Icon name="i-arrow-right" />
              <strong>{invalid ? "—" : num(projected)}</strong>
              <span className={`adjust-preview__delta ${invalid ? "is-out" : delta > 0 ? "is-in" : delta < 0 ? "is-out" : "is-flat"}`}>
                {invalid ? "Check quantity" : qtyNumber === null ? "—" : delta === 0 ? "No change" : `${delta > 0 ? "+" : "−"}${num(Math.abs(delta))} ${product.unit}`}
              </span>
            </span>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="adjust-ref">Reference <span className="label-optional">optional</span></label>
              <input className="input input--mono" id="adjust-ref" name="reference" ref={referenceRef} type="text" maxLength={24} placeholder={placeholder} autoComplete="off" />
            </div>
            <div className="field">
              <label htmlFor="adjust-note">Note <span className="label-optional">optional</span></label>
              <input className="input" id="adjust-note" name="note" type="text" maxLength={80} placeholder="e.g. Weekly replenishment" autoComplete="off" />
            </div>
          </div>
        </div>

        <footer className="dialog__foot">
          <button className="btn btn--ghost" type="button" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" type="submit" disabled={pending}>
            {pending ? "Recording…" : "Record movement"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
