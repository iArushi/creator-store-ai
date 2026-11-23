import { connection } from "next/server";
import { isInstagramConfigured } from "@/lib/instagram/config";
import { fetchConnectedInstagramProfile } from "@/lib/instagram/profileSource";

export async function GET() {
  await connection();
  const configured = isInstagramConfigured();

  if (!configured) {
    return Response.json({
      configured: false,
      connected: false,
      message:
        "Add META_APP_ID, META_APP_SECRET, and INSTAGRAM_REDIRECT_URI to enable Instagram connect.",
    });
  }

  const result = await fetchConnectedInstagramProfile();

  if (!result.available) {
    return Response.json({
      configured: true,
      connected: false,
      reason: result.reason,
      message: result.message,
    });
  }

  return Response.json({
    configured: true,
    connected: true,
    profile: result.profile,
  });
}
