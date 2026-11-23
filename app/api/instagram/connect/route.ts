import { randomBytes } from "crypto";
import { connection, NextResponse } from "next/server";
import { buildInstagramAuthorizeUrl, InstagramApiError } from "@/lib/instagram/api";
import { isInstagramConfigured } from "@/lib/instagram/config";
import { setOAuthStateCookie } from "@/lib/instagram/session";

export async function GET(request: Request) {
  await connection();
  const url = new URL(request.url);
  const wantsJson = url.searchParams.get("format") === "json";

  if (!isInstagramConfigured()) {
    const payload = {
      error: "not_configured",
      message:
        "Instagram OAuth is not configured. Set META_APP_ID, META_APP_SECRET, and INSTAGRAM_REDIRECT_URI in .env.local.",
    };
    if (wantsJson) {
      return Response.json(payload, { status: 503 });
    }
    return NextResponse.redirect(
      new URL("/?ig=error&reason=not_configured", request.url),
    );
  }

  try {
    const nonce = randomBytes(16).toString("base64url");
    await setOAuthStateCookie(nonce);
    const authorizeUrl = buildInstagramAuthorizeUrl(nonce);

    if (wantsJson) {
      return Response.json({ authorizeUrl });
    }

    return NextResponse.redirect(authorizeUrl);
  } catch (error) {
    const message =
      error instanceof InstagramApiError
        ? error.message
        : "Could not start Instagram connection.";
    if (wantsJson) {
      return Response.json({ error: "connect_failed", message }, { status: 500 });
    }
    return NextResponse.redirect(
      new URL(`/?ig=error&reason=connect_failed`, request.url),
    );
  }
}
