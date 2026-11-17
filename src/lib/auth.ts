import { hash, verify } from "@node-rs/argon2";
import type { AstroCookies } from "astro";
import { eq } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { db } from "@/db";
import { sessions, users, type User } from "@/db/schema";

export const SESSION_COOKIE = "session";
const DAY = 24 * 60 * 60 * 1000;
const SESSION_LENGTH = 30 * DAY;
/** Sessions are renewed when a visit happens with less than this left. */
const RENEW_WITHIN = 15 * DAY;

export const hashPassword = (password: string) => hash(password);

export async function verifyPassword(passwordHash: string, password: string) {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

/** A random password for new Users and resets, easy enough to type once. */
export function temporaryPassword() {
  return randomBytes(12).toString("base64url");
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

function setSessionCookie(cookies: AstroCookies, token: string, expiresAt: Date) {
  cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: import.meta.env.PROD,
    path: "/",
    expires: expiresAt,
  });
}

export function startSession(cookies: AstroCookies, userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_LENGTH);
  db.insert(sessions).values({ id: hashToken(token), userId, expiresAt }).run();
  setSessionCookie(cookies, token, expiresAt);
}

/** Returns the logged-in User for this request, renewing the session if it's getting old. */
export function userFromSession(cookies: AstroCookies): User | null {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const id = hashToken(token);
  const row = db
    .select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, id))
    .get();

  if (!row || row.expiresAt.getTime() <= Date.now()) {
    if (row) db.delete(sessions).where(eq(sessions.id, id)).run();
    cookies.delete(SESSION_COOKIE, { path: "/" });
    return null;
  }

  if (row.expiresAt.getTime() - Date.now() < RENEW_WITHIN) {
    const expiresAt = new Date(Date.now() + SESSION_LENGTH);
    db.update(sessions).set({ expiresAt }).where(eq(sessions.id, id)).run();
    setSessionCookie(cookies, token, expiresAt);
  }

  return row.user;
}

export function endSession(cookies: AstroCookies) {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (token) db.delete(sessions).where(eq(sessions.id, hashToken(token))).run();
  cookies.delete(SESSION_COOKIE, { path: "/" });
}

/** Logs a User out everywhere, e.g. after their password is reset. */
export function endAllSessions(userId: number) {
  db.delete(sessions).where(eq(sessions.userId, userId)).run();
}
