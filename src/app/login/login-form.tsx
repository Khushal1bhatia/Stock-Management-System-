"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/app/actions/auth";
import { Icon } from "@/components/icons";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, null);
  const [showPassword, setShowPassword] = useState(false);
  const usernameError = state?.fieldErrors?.username;
  const passwordError = state?.fieldErrors?.password;

  return (
    <form action={formAction} noValidate>
      <div className="login-fields">
        <div className="login-field">
          <label htmlFor="login-username">Username</label>
          <input
            className={`input ${usernameError ? "is-invalid" : ""}`}
            id="login-username"
            name="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            placeholder="Enter username"
            autoFocus
            defaultValue={state?.username ?? ""}
            aria-invalid={usernameError ? true : undefined}
            aria-describedby={usernameError ? "login-username-error" : undefined}
          />
          {usernameError ? (
            <span className="field-error is-visible" id="login-username-error">
              {usernameError}
            </span>
          ) : null}
        </div>
        <div className="login-field">
          <label htmlFor="login-password">Password</label>
          <div className="login-password">
            <input
              className={`input ${passwordError ? "is-invalid" : ""}`}
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="Enter password"
              aria-invalid={passwordError ? true : undefined}
              aria-describedby={passwordError ? "login-password-error" : undefined}
            />
            <button
              className="login-show"
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {passwordError ? (
            <span className="field-error is-visible" id="login-password-error">
              {passwordError}
            </span>
          ) : null}
        </div>
      </div>

      {state?.error ? (
        <p className="login-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <button className="btn btn--primary login-submit" type="submit" disabled={pending} aria-busy={pending}>
        {pending ? "Signing in…" : "Sign in"}
        <Icon name="i-arrow-right" />
      </button>
    </form>
  );
}
