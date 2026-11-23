import { NextResponse } from "next/server";
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  InstagramApiError,
} from "@/lib/instagram/api";
import { getInstagramConfig } from "@/lib/instagram/config";
import { verifyState } from "@/lib/instagram/crypto";
import {
  clearOAuthStateCookie,
  readOAuthStateCookie,
  setInstagramTokenSession,
} from "@/lib/instagram/session";

function redirectHome(request: Request, params: Record<string, string>) {
  const url = new URL("/", request.url);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const config = getInstagramConfig();
  const incoming = new URL(request.url);
  const code = incoming.searchParams.get("code");
  const state = incoming.searchParams.get("state");
  const error = incoming.searchParams.get("error");
  const errorReason = incoming.searchParams.get("error_reason");

  if (!config) {
    return redirectHome(request, { ig: "error", reason: "not_configured" });
  }

  if (error) {
    await clearOAuthStateCookie();
    const reason =
      errorReason === "user_denied" ? "user_denied" : "oauth_error";
    return redirectHome(request, { ig: "error", reason });
  }

  if (!code || !state) {
    await clearOAuthStateCookie();
    return redirectHome(request, { ig: "error", reason: "missing_code" });
  }

  const [nonce, signature] = state.split(".");
  const expectedNonce = await readOAuthStateCookie();
  await clearOAuthStateCookie();

  if (
    !nonce ||
    !signature ||
    !expectedNonce ||
    nonce !== expectedNonce ||
    !verifyState(config.sessionSecret, nonce, signature)
  ) {
    return redirectHome(request, { ig: "error", reason: "invalid_state" });
  }

  // Instagram appends `#_` to some redirects; strip if present in code.
  const cleanCode = code.replace(/#_$/, "");

  try {
    const shortLived = await exchangeCodeForToken(cleanCode);
    const longLived = await exchangeForLongLivedToken(shortLived.accessToken);

    await setInstagramTokenSession({
      accessToken: longLived.accessToken,
      userId: shortLived.userId,
      expiresAt: Date.now() + longLived.expiresIn * 1000,
    });

    return redirectHome(request, { ig: "connected" });
  } catch (err) {
    const reason =
      err instanceof InstagramApiError
        ? err.code || "token_exchange_failed"
        : "token_exchange_failed";
    return redirectHome(request, { ig: "error", reason });
  }
}
