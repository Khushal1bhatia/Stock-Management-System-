"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DUMMY_HASH, hashPassword, verifyPassword } from "@/lib/auth/password";
import { clearRateLimit, rateLimit } from "@/lib/auth/rate-limit";
import { createSession, destroyCurrentSession, destroyOtherSessions } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/current-user";
import { writeAudit } from "@/lib/audit";
import { getRequestMeta } from "@/lib/request";
import { LOGIN_RATE_LIMIT, LOGIN_RATE_WINDOW_MS } from "@/lib/constants";
import { changePasswordSchema, formString, loginSchema, zodFieldErrors } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

export type LoginState = { error: string; fieldErrors?: Record<string, string>; username?: string } | null;

function loginError(message: string, fieldErrors?: Record<string, string>, username?: string): LoginState {
  return { error: message, fieldErrors, username };
}

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    username: formString(formData, "username"),
    password: formString(formData, "password")
  });

  if (!parsed.success) {
    return loginError("Enter your username and password.", zodFieldErrors(parsed.error), formString(formData, "username"));
  }

  const meta = await getRequestMeta();
  const username = parsed.data.username.toLowerCase();

  // Limits are applied per-IP and per-IP+username so one noisy client cannot
  // lock out a colleague, and distributed guessing still hits a ceiling.
  const ipLimit = rateLimit(`login:ip:${meta.ipAddress}`, LOGIN_RATE_LIMIT * 4, LOGIN_RATE_WINDOW_MS);
  const accountLimit = rateLimit(`login:account:${meta.ipAddress}:${username}`, LOGIN_RATE_LIMIT, LOGIN_RATE_WINDOW_MS);

  if (!ipLimit.allowed || !accountLimit.allowed) {
    return loginError("Too many sign-in attempts. Wait a few minutes and try again.", undefined, parsed.data.username);
  }

  const user = await prisma.user.findUnique({ where: { username } });
  const passwordMatches = await verifyPassword(user?.passwordHash ?? DUMMY_HASH, parsed.data.password);

  if (!user || !user.active || !passwordMatches) {
    await writeAudit({
      actorId: null,
      actorName: username || "unknown",
      action: "LOGIN_FAILED",
      entityType: "User",
      entityId: user?.id ?? null,
      detail: "Incorrect username or password.",
      ipAddress: meta.ipAddress
    });
    return loginError("Incorrect username or password. Please try again.", undefined, parsed.data.username);
  }

  clearRateLimit(`login:account:${meta.ipAddress}:${username}`);

  // Rotate any session that may already be attached to this browser.
  await destroyCurrentSession();
  await createSession(user.id, meta);

  await writeAudit({
    actorId: user.id,
    actorName: user.name,
    action: "LOGIN",
    entityType: "User",
    entityId: user.id,
    detail: `Signed in as ${user.username}.`,
    ipAddress: meta.ipAddress
  });

  redirect("/overview");
}

export async function logoutAction() {
  const user = await getCurrentUser();
  const meta = await getRequestMeta();

  await destroyCurrentSession();

  if (user) {
    await writeAudit({
      actorId: user.id,
      actorName: user.name,
      action: "LOGOUT",
      entityType: "Session",
      entityId: user.sessionId,
      detail: "Signed out.",
      ipAddress: meta.ipAddress
    });
  }

  redirect("/login");
}

export async function changePasswordAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Your session has expired. Sign in again." };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formString(formData, "currentPassword"),
    newPassword: formString(formData, "newPassword"),
    confirmPassword: formString(formData, "confirmPassword")
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Check the highlighted fields and try again.",
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  const account = await prisma.user.findUnique({ where: { id: user.id } });
  if (!account) return { ok: false, error: "This account no longer exists." };

  const valid = await verifyPassword(account.passwordHash, parsed.data.currentPassword);
  if (!valid) {
    return { ok: false, error: "Your current password is incorrect.", fieldErrors: { currentPassword: "Incorrect password." } };
  }

  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return { ok: false, error: "Choose a password you have not used here before.", fieldErrors: { newPassword: "Choose a new password." } };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await destroyOtherSessions(user.id, user.sessionId);

  const meta = await getRequestMeta();
  await writeAudit({
    actorId: user.id,
    actorName: user.name,
    action: "PASSWORD_CHANGED",
    entityType: "User",
    entityId: user.id,
    detail: "Password changed; other sessions were revoked.",
    ipAddress: meta.ipAddress
  });

  return { ok: true, message: "Password updated. Other sessions were signed out." };
}
