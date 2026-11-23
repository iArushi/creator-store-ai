export type InstagramConfig = {
  appId: string;
  appSecret: string;
  redirectUri: string;
  sessionSecret: string;
  graphVersion: string;
};

export function getInstagramConfig(): InstagramConfig | null {
  const appId =
    process.env.META_APP_ID?.trim() ||
    process.env.INSTAGRAM_APP_ID?.trim() ||
    "";
  const appSecret =
    process.env.META_APP_SECRET?.trim() ||
    process.env.INSTAGRAM_APP_SECRET?.trim() ||
    "";
  const redirectUri =
    process.env.INSTAGRAM_REDIRECT_URI?.trim() ||
    process.env.META_REDIRECT_URI?.trim() ||
    "";
  const sessionSecret =
    process.env.INSTAGRAM_SESSION_SECRET?.trim() || appSecret;

  if (!appId || !appSecret || !redirectUri) {
    return null;
  }

  return {
    appId,
    appSecret,
    redirectUri,
    sessionSecret,
    graphVersion: process.env.INSTAGRAM_GRAPH_VERSION?.trim() || "v22.0",
  };
}

export function isInstagramConfigured(): boolean {
  return getInstagramConfig() !== null;
}

export const INSTAGRAM_SCOPES = ["instagram_business_basic"] as const;
