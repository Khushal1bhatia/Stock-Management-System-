"use client";

import { useRef, useState, useTransition } from "react";
import { changePasswordAction } from "@/app/actions/auth";
import { Icon } from "@/components/icons";
import { FieldError, invalidAttrs, invalidClass } from "@/components/dialogs/field-error";
import { handleBackdropClick, useShowModal } from "@/components/dialogs/use-dialog";
import type { ToastTone } from "@/components/toast-stack";

export function PasswordDialog({
  onClose,
  onToast
}: {
  onClose: () => void;
  onToast: (title: string, message?: string, tone?: ToastTone) => void;
}) {
  const dialogRef = useShowModal("[data-autofocus]");
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !formRef.current) return;

    const formData = new FormData(formRef.current);
    startTransition(async () => {
      const result = await changePasswordAction(formData);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error);
        return;
      }
      onClose();
      onToast("Password updated", result.message, "success");
    });
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby="password-dialog-title"
      onClick={(event) => handleBackdropClick(event, onClose)}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <form ref={formRef} className="dialog__card" onSubmit={submit} onInput={() => { setErrors({}); setFormError(""); }} noValidate>
        <header className="dialog__head">
          <div>
            <h2 id="password-dialog-title">Change password</h2>
            <p>Update the password for your account. Other sessions will be signed out.</p>
          </div>
          <button className="icon-btn icon-btn--small" type="button" onClick={onClose} aria-label="Close dialog">
            <Icon name="i-close" />
          </button>
        </header>

        <div className="dialog__body">
          {formError ? <p className="login-error" role="alert">{formError}</p> : null}
          <div className="field">
            <label htmlFor="current-password">Current password</label>
            <input
              className={`input ${invalidClass(errors.currentPassword)}`}
              id="current-password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              data-autofocus
              {...invalidAttrs(errors.currentPassword)}
            />
            <FieldError message={errors.currentPassword} />
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="new-password">New password</label>
              <input
                className={`input ${invalidClass(errors.newPassword)}`}
                id="new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                {...invalidAttrs(errors.newPassword)}
              />
              <span className="field-hint">At least 12 characters, with a letter and a number.</span>
              <FieldError message={errors.newPassword} />
            </div>
            <div className="field">
              <label htmlFor="confirm-password">Confirm new password</label>
              <input
                className={`input ${invalidClass(errors.confirmPassword)}`}
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                {...invalidAttrs(errors.confirmPassword)}
              />
              <FieldError message={errors.confirmPassword} />
            </div>
          </div>
        </div>

        <footer className="dialog__foot">
          <button className="btn btn--ghost" type="button" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" type="submit" disabled={pending}>
            {pending ? "Updating…" : "Update password"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
