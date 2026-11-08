import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, SESSION_TTL_DAYS } from "@/lib/constants";
import type { Role } from "@/lib/constants";

const DAY_MS = 24 * 60 * 60 * 1000;
const SESSION_TTL_MS = SESSION_TTL_DAYS * DAY_MS;
const ROLLING_REFRESH_MS = 60 * 60 * 1000;

// The browser cookie outlives the database session so activity can keep
// rolling the server-side expiry. The database remains the source of truth:
// an idle session is rejected after SESSION_TTL_DAYS regardless.
const COOKIE_MAX_AGE_MS = 30 * DAY_MS;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  userId: string,
  meta: { ipAddress?: string | null; userAgent?: string | null } = {}
) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
      ipAddress: meta.ipAddress ?? null,
      userAgent: meta.userAgent?.slice(0, 255) ?? null
    }
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(Date.now() + COOKIE_MAX_AGE_MS)
  });

  return { token, expiresAt };
}

export async function getSessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export async function findSessionUserByToken(token: string) {
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true }
  });

  if (!session) return null;

  const now = Date.now();
  if (session.expiresAt.getTime() <= now || !session.user.active) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  // Rolling sessions: extend once per hour of activity instead of writing on
  // every request. Cookies cannot be written while a Server Component renders,
  // so the server-side expiry rolls and the cookie keeps its longer fixed life.
  if (now - session.lastUsedAt.getTime() > ROLLING_REFRESH_MS) {
    await prisma.session
      .update({
        where: { id: session.id },
        data: {
          lastUsedAt: new Date(now),
          expiresAt: new Date(now + SESSION_TTL_MS)
        }
      })
      .catch(() => undefined);
  }

  return {
    id: session.user.id,
    sessionId: session.id,
    username: session.user.username,
    name: session.user.name,
    initials: session.user.initials,
    role: session.user.role as Role
  } as const;
}

export async function destroyCurrentSession() {
  const token = await getSessionToken();
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } }).catch(() => undefined);
  }
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function destroyOtherSessions(userId: string, keepSessionId: string) {
  await prisma.session.deleteMany({
    where: { userId, id: { not: keepSessionId } }
  });
}
