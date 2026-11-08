import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSessionToken, findSessionUserByToken } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/types";

/**
 * Resolves the signed-in user once per request. Every protected layout, page,
 * server action, and route handler calls this - never the client.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = await getSessionToken();
  if (!token) return null;
  return findSessionUserByToken(token);
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/overview");
  return user;
}
