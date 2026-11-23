import { getInstagramConfig, INSTAGRAM_SCOPES } from "@/lib/instagram/config";
import {
  InstagramRetrievedProfileSchema,
  type InstagramRetrievedProfile,
} from "@/lib/instagram/schemas";
import { signState } from "@/lib/instagram/crypto";

export class InstagramApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status = 502, code?: string) {
    super(message);
    this.name = "InstagramApiError";
    this.status = status;
    this.code = code;
  }
}

export function buildInstagramAuthorizeUrl(nonce: string): string {
  const config = getInstagramConfig();
  if (!config) {
    throw new InstagramApiError(
      "Instagram OAuth is not configured. Add META_APP_ID, META_APP_SECRET, and INSTAGRAM_REDIRECT_URI.",
      503,
      "not_configured",
    );
  }

  const state = `${nonce}.${signState(config.sessionSecret, nonce)}`;
  const url = new URL("https://www.instagram.com/oauth/authorize");
  url.searchParams.set("client_id", config.appId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", INSTAGRAM_SCOPES.join(","));
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeCodeForToken(code: string): Promise<{
  accessToken: string;
  userId: string;
  permissions: string[];
}> {
  const config = getInstagramConfig();
  if (!config) {
    throw new InstagramApiError("Instagram is not configured.", 503, "not_configured");
  }

  const body = new URLSearchParams({
    client_id: config.appId,
    client_secret: config.appSecret,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri,
    code,
  });

  const response = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const payload = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    throw new InstagramApiError(
      String(
        payload.error_message ||
          payload.error_description ||
          "Failed to exchange Instagram authorization code.",
      ),
      response.status,
      "token_exchange_failed",
    );
  }

  // Meta may return either a flat object or { data: [ ... ] }
  const tokenData = Array.isArray(payload.data)
    ? (payload.data[0] as Record<string, unknown> | undefined)
    : payload;

  const accessToken = String(tokenData?.access_token || "");
  const userId = String(tokenData?.user_id || tokenData?.id || "");
  const permissions = String(tokenData?.permissions || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!accessToken || !userId) {
    throw new InstagramApiError(
      "Instagram token response was incomplete.",
      502,
      "token_incomplete",
    );
  }

  return { accessToken, userId, permissions };
}

export async function exchangeForLongLivedToken(shortLivedToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const config = getInstagramConfig();
  if (!config) {
    throw new InstagramApiError("Instagram is not configured.", 503, "not_configured");
  }

  const url = new URL("https://graph.instagram.com/access_token");
  url.searchParams.set("grant_type", "ig_exchange_token");
  url.searchParams.set("client_secret", config.appSecret);
  url.searchParams.set("access_token", shortLivedToken);

  const response = await fetch(url.toString());
  const payload = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    // Fall back to short-lived token rather than failing the whole connect.
    return { accessToken: shortLivedToken, expiresIn: 60 * 60 };
  }

  return {
    accessToken: String(payload.access_token || shortLivedToken),
    expiresIn: Number(payload.expires_in || 60 * 60 * 24 * 60),
  };
}

async function graphGet<T>(
  path: string,
  accessToken: string,
  searchParams?: Record<string, string>,
): Promise<T> {
  const config = getInstagramConfig();
  if (!config) {
    throw new InstagramApiError("Instagram is not configured.", 503, "not_configured");
  }

  const url = new URL(`https://graph.instagram.com/${config.graphVersion}${path}`);
  url.searchParams.set("access_token", accessToken);
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString());
  const payload = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    const error = payload.error as { message?: string; code?: number } | undefined;
    const message = error?.message || "Instagram Graph API request failed.";
    const code =
      response.status === 429
        ? "rate_limited"
        : response.status === 401 || response.status === 403
          ? "unauthorized"
          : "graph_error";
    throw new InstagramApiError(message, response.status, code);
  }

  return payload as T;
}

export async function fetchInstagramProfileAndMedia(
  accessToken: string,
): Promise<InstagramRetrievedProfile> {
  type MeResponse = {
    id?: string;
    user_id?: string;
    username?: string;
    name?: string;
    biography?: string;
    profile_picture_url?: string;
    account_type?: string;
    media_count?: number;
  };

  type MediaResponse = {
    data?: Array<{
      id: string;
      caption?: string;
      media_type?: string;
      permalink?: string;
      timestamp?: string;
    }>;
  };

  const me = await graphGet<MeResponse>("/me", accessToken, {
    fields:
      "id,user_id,username,name,account_type,profile_picture_url,biography,media_count",
  });

  if (!me.username) {
    throw new InstagramApiError(
      "Connected Instagram account did not return a username. Professional Creator or Business accounts are required.",
      422,
      "unsupported_account",
    );
  }

  let media: MediaResponse["data"] = [];
  try {
    const mediaResponse = await graphGet<MediaResponse>("/me/media", accessToken, {
      fields: "id,caption,media_type,permalink,timestamp",
      limit: "12",
    });
    media = mediaResponse.data || [];
  } catch (error) {
    // Media can fail even when profile succeeds — keep going with profile only.
    if (
      !(error instanceof InstagramApiError && error.code === "unauthorized")
    ) {
      media = [];
    } else {
      throw error;
    }
  }

  const captions = (media || [])
    .map((item) => item.caption?.trim())
    .filter((caption): caption is string => Boolean(caption))
    .slice(0, 12);

  const profile = InstagramRetrievedProfileSchema.parse({
    id: String(me.user_id || me.id || ""),
    username: me.username,
    name: me.name,
    biography: me.biography,
    profilePictureUrl: me.profile_picture_url,
    accountType: me.account_type,
    mediaCount: me.media_count,
    captions,
    media: (media || []).map((item) => ({
      id: item.id,
      caption: item.caption,
      mediaType: item.media_type,
      permalink: item.permalink,
      timestamp: item.timestamp,
    })),
    retrievedAt: new Date().toISOString(),
    source: "instagram_official_api",
  });

  return profile;
}
