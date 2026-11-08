"use client";

import { useRef, useTransition } from "react";
import type { ProductView } from "@/lib/types";
import { deleteProductAction } from "@/app/actions/products";
import { Icon } from "@/components/icons";
import { handleBackdropClick, useShowModal } from "@/components/dialogs/use-dialog";

export function DeleteDialog({
  product,
  onClose,
  onSaved,
  onError
}: {
  product: ProductView;
  onClose: () => void;
  onSaved: (title: string, message: string) => void;
  onError: (message: string) => void;
}) {
  const dialogRef = useShowModal("[data-autofocus]");
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !formRef.current) return;

    const formData = new FormData(formRef.current);
    startTransition(async () => {
      const result = await deleteProductAction(formData);
      if (!result.ok) {
        onError(result.error);
        return;
      }
      onSaved("Product removed", result.message ?? "Movement history retained.");
    });
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialog dialog--confirm"
      aria-labelledby="confirm-title"
      onClick={(event) => handleBackdropClick(event, onClose)}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <form ref={formRef} className="dialog__card" onSubmit={submit}>
        <header className="dialog__head">
          <div>
            <h2 id="confirm-title">Remove product?</h2>
            <p>
              “{product.name}” will be removed from inventory. Its past movements stay in the audit trail. This cannot be undone.
            </p>
          </div>
          <button className="icon-btn icon-btn--small" type="button" onClick={onClose} aria-label="Close dialog">
            <Icon name="i-close" />
          </button>
        </header>
        <footer className="dialog__foot">
          <input type="hidden" name="id" value={product.id} />
          <button className="btn btn--ghost" type="button" onClick={onClose} data-autofocus>Cancel</button>
          <button className="btn btn--danger" type="submit" disabled={pending}>
            {pending ? "Removing…" : "Remove product"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
