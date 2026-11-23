import { cookies } from "next/headers";
import { getInstagramConfig } from "@/lib/instagram/config";
import { decryptPayload, encryptPayload } from "@/lib/instagram/crypto";

export const IG_SESSION_COOKIE = "csa_ig_session";
export const IG_OAUTH_STATE_COOKIE = "csa_ig_oauth_state";

export type InstagramTokenSession = {
  accessToken: string;
  userId: string;
  expiresAt: number;
};

export async function setOAuthStateCookie(nonce: string) {
  const jar = await cookies();
  jar.set(IG_OAUTH_STATE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
}

export async function readOAuthStateCookie(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(IG_OAUTH_STATE_COOKIE)?.value;
}

export async function clearOAuthStateCookie() {
  const jar = await cookies();
  jar.delete(IG_OAUTH_STATE_COOKIE);
}

export async function setInstagramTokenSession(session: InstagramTokenSession) {
  const config = getInstagramConfig();
  if (!config) {
    throw new Error("Instagram is not configured.");
  }

  const jar = await cookies();
  const encrypted = encryptPayload(config.sessionSecret, JSON.stringify(session));
  const maxAge = Math.max(
    60,
    Math.floor((session.expiresAt - Date.now()) / 1000),
  );

  jar.set(IG_SESSION_COOKIE, encrypted, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export async function readInstagramTokenSession(): Promise<InstagramTokenSession | null> {
  const config = getInstagramConfig();
  if (!config) return null;

  const jar = await cookies();
  const raw = jar.get(IG_SESSION_COOKIE)?.value;
  if (!raw) return null;

  const decrypted = decryptPayload(config.sessionSecret, raw);
  if (!decrypted) return null;

  try {
    const parsed = JSON.parse(decrypted) as InstagramTokenSession;
    if (!parsed.accessToken || !parsed.userId || !parsed.expiresAt) {
      return null;
    }
    if (parsed.expiresAt <= Date.now() + 60_000) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function clearInstagramTokenSession() {
  const jar = await cookies();
  jar.delete(IG_SESSION_COOKIE);
}
