/**
 * Instagram profile retrieval via Meta's official Instagram API with Instagram Login.
 * Tokens stay server-side. This module never scrapes Instagram HTML.
 */

import { isInstagramConfigured } from "@/lib/instagram/config";
import {
  fetchInstagramProfileAndMedia,
  InstagramApiError,
} from "@/lib/instagram/api";
import { readInstagramTokenSession } from "@/lib/instagram/session";
import type { InstagramRetrievedProfile } from "@/lib/instagram/schemas";

export type ProfileSourceResult =
  | {
      available: true;
      profile: InstagramRetrievedProfile;
    }
  | {
      available: false;
      reason:
        | "not_configured"
        | "not_connected"
        | "unauthorized"
        | "unsupported_account"
        | "rate_limited"
        | "empty_profile"
        | "error";
      message: string;
    };

export async function fetchConnectedInstagramProfile(): Promise<ProfileSourceResult> {
  if (!isInstagramConfigured()) {
    return {
      available: false,
      reason: "not_configured",
      message:
        "Instagram connection is not configured yet. Add Meta app credentials to .env.local, or enter your details manually.",
    };
  }

  const session = await readInstagramTokenSession();
  if (!session) {
    return {
      available: false,
      reason: "not_connected",
      message:
        "No Instagram account is connected. Connect a Creator or Business account, or enter details manually.",
    };
  }

  try {
    const profile = await fetchInstagramProfileAndMedia(session.accessToken);

    if (!profile.biography && profile.captions.length === 0) {
      return {
        available: false,
        reason: "empty_profile",
        message:
          "We connected your Instagram account, but there wasn't enough public profile/caption content to analyse. Add a few posts or enter details manually.",
      };
    }

    return { available: true, profile };
  } catch (error) {
    if (error instanceof InstagramApiError) {
      if (error.code === "unauthorized") {
        return {
          available: false,
          reason: "unauthorized",
          message:
            "Instagram access expired or was revoked. Reconnect your account, or continue manually.",
        };
      }
      if (error.code === "rate_limited") {
        return {
          available: false,
          reason: "rate_limited",
          message:
            "Instagram rate-limited this request. Wait a moment and retry, or continue manually.",
        };
      }
      if (error.code === "unsupported_account") {
        return {
          available: false,
          reason: "unsupported_account",
          message: error.message,
        };
      }
      return {
        available: false,
        reason: "error",
        message: error.message,
      };
    }

    return {
      available: false,
      reason: "error",
      message:
        "We couldn't retrieve your Instagram profile right now. Retry, or enter details manually.",
    };
  }
}
