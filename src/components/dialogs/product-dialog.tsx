"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, UNITS } from "@/lib/constants";
import type { ProductView } from "@/lib/types";
import { saveProductAction } from "@/app/actions/products";
import { Icon } from "@/components/icons";
import { FieldError, invalidAttrs, invalidClass } from "@/components/dialogs/field-error";
import { handleBackdropClick, useShowModal } from "@/components/dialogs/use-dialog";

const SKU_PREFIX: Record<string, string> = {
  Audio: "AUD",
  Workspace: "WRK",
  Accessories: "ACC",
  Lighting: "LGT",
  Storage: "STO"
};

function generateSku(category: string) {
  const prefix = SKU_PREFIX[category] ?? "SKU";
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function ProductDialog({
  product,
  suppliers,
  onClose,
  onSaved,
  onError
}: {
  product: ProductView | null;
  suppliers: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSaved: (title: string, message: string) => void;
  onError: (message: string) => void;
}) {
  const router = useRouter();
  const isEdit = Boolean(product);
  const dialogRef = useShowModal("[data-autofocus]");
  const formRef = useRef<HTMLFormElement>(null);
  const skuRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function handleCategoryChange(event: React.ChangeEvent<HTMLSelectElement>) {
    if (isEdit) return;
    const sku = skuRef.current;
    if (sku && (!sku.value || /^[A-Z]{3}-\d{4}$/.test(sku.value))) {
      sku.value = generateSku(event.target.value);
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = formRef.current;
    if (!form) return;

    const formData = new FormData(form);
    startTransition(async () => {
      const result = await saveProductAction(formData);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        onError(result.error);
        return;
      }

      if (!isEdit) router.push("/inventory");
      onSaved(isEdit ? "Product updated" : "Product added", result.message ?? "Saved.");
    });
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby="product-dialog-title"
      onClick={(event) => handleBackdropClick(event, onClose)}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <form ref={formRef} className="dialog__card" onSubmit={submit} onInput={() => setErrors({})} noValidate>
        <header className="dialog__head">
          <div>
            <h2 id="product-dialog-title">{isEdit ? "Edit product" : "Add product"}</h2>
            <p>{isEdit ? "Update catalog details. Stock changes stay in the movement log." : "Create a new SKU in the inventory."}</p>
          </div>
          <button className="icon-btn icon-btn--small" type="button" onClick={onClose} aria-label="Close dialog">
            <Icon name="i-close" />
          </button>
        </header>

        <div className="dialog__body">
          <input type="hidden" name="id" value={product?.id ?? ""} />
          <div className="form-grid">
            <div className="field field--full">
              <label htmlFor="product-name">Product name</label>
              <input
                className={`input ${invalidClass(errors.name)}`}
                id="product-name"
                name="name"
                type="text"
                autoComplete="off"
                maxLength={80}
                required
                placeholder="e.g. Arc USB-C Hub"
                defaultValue={product?.name ?? ""}
                data-autofocus
                {...invalidAttrs(errors.name)}
              />
              <FieldError message={errors.name} />
            </div>

            <div className="field">
              <label htmlFor="product-sku">SKU</label>
              <input
                ref={skuRef}
                className={`input input--mono ${invalidClass(errors.sku)}`}
                id="product-sku"
                name="sku"
                type="text"
                autoComplete="off"
                maxLength={24}
                required
                placeholder="AUD-4821"
                defaultValue={product?.sku ?? generateSku("Audio")}
                {...invalidAttrs(errors.sku)}
              />
              <FieldError message={errors.sku} />
            </div>

            <div className="field">
              <label htmlFor="product-category">Category</label>
              <div className="select-wrap">
                <select
                  className={`input ${invalidClass(errors.category)}`}
                  id="product-category"
                  name="category"
                  defaultValue={product?.category ?? "Audio"}
                  onChange={handleCategoryChange}
                  required
                >
                  {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
                <Icon name="i-chevron-down" />
              </div>
              <FieldError message={errors.category} />
            </div>

            <div className="field">
              <label htmlFor="product-supplier">Supplier</label>
              <div className="select-wrap">
                <select
                  className={`input ${invalidClass(errors.supplierId)}`}
                  id="product-supplier"
                  name="supplierId"
                  defaultValue={product?.supplierId ?? suppliers[0]?.id ?? ""}
                  required
                >
                  {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
                </select>
                <Icon name="i-chevron-down" />
              </div>
              <FieldError message={errors.supplierId} />
            </div>

            <div className="field">
              <label htmlFor="product-unit">Unit</label>
              <div className="select-wrap">
                <select className={`input ${invalidClass(errors.unit)}`} id="product-unit" name="unit" defaultValue={product?.unit ?? "pcs"} required>
                  {UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                </select>
                <Icon name="i-chevron-down" />
              </div>
              <FieldError message={errors.unit} />
            </div>

            <div className="field">
              <label htmlFor="product-cost">Unit cost (USD)</label>
              <input
                className={`input input--num ${invalidClass(errors.cost)}`}
                id="product-cost"
                name="cost"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                required
                placeholder="0.00"
                defaultValue={product ? (product.costCents / 100).toFixed(2) : ""}
                {...invalidAttrs(errors.cost)}
              />
              <FieldError message={errors.cost} />
            </div>

            <div className="field">
              <label htmlFor="product-price">Sale price (USD)</label>
              <input
                className={`input input--num ${invalidClass(errors.price)}`}
                id="product-price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                required
                placeholder="0.00"
                defaultValue={product ? (product.priceCents / 100).toFixed(2) : ""}
                {...invalidAttrs(errors.price)}
              />
              <FieldError message={errors.price} />
            </div>

            <div className="field">
              <label htmlFor="product-stock">{isEdit ? "On hand (locked)" : "Opening stock"}</label>
              {isEdit ? (
                <input className="input input--num" id="product-stock" type="text" value={`${product?.stock} ${product?.unit}`} disabled />
              ) : (
                <input
                  className={`input input--num ${invalidClass(errors.openingStock)}`}
                  id="product-stock"
                  name="openingStock"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  placeholder="0"
                  defaultValue="0"
                  {...invalidAttrs(errors.openingStock)}
                />
              )}
              <FieldError message={errors.openingStock} />
            </div>

            <div className="field">
              <label htmlFor="product-reorder">Reorder point</label>
              <input
                className={`input input--num ${invalidClass(errors.reorder)}`}
                id="product-reorder"
                name="reorder"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                required
                placeholder="10"
                defaultValue={product?.reorder ?? 10}
                {...invalidAttrs(errors.reorder)}
              />
              <FieldError message={errors.reorder} />
            </div>

            {isEdit ? (
              <p className="form-note field--full">
                <strong>{product?.stock} {product?.unit} on hand.</strong>{" "}
                Stock is changed only through adjustments so every movement stays auditable.
              </p>
            ) : null}
          </div>
        </div>

        <footer className="dialog__foot">
          <button className="btn btn--ghost" type="button" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" type="submit" disabled={pending}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Add product"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
