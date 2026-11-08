"use client";

import { Icon } from "@/components/icons";

export type ToastTone = "success" | "error" | "info";
export type ToastItem = {
  id: number;
  title: string;
  message?: string;
  tone: ToastTone;
};

export function ToastStack({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div className="toast-stack" role="status" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div className={`toast toast--${toast.tone}`} key={toast.id}>
          <span className="toast__icon" aria-hidden="true">
            <Icon name={toast.tone === "error" ? "i-alert" : toast.tone === "info" ? "i-flow" : "i-check"} />
          </span>
          <span className="toast__main">
            <strong>{toast.title}</strong>
            {toast.message ? <span>{toast.message}</span> : null}
          </span>
          <button className="toast__close" type="button" onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification">
            <Icon name="i-close" />
          </button>
        </div>
      ))}
    </div>
  );
}
