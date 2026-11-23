import { clearInstagramTokenSession } from "@/lib/instagram/session";

export async function POST() {
  await clearInstagramTokenSession();
  return Response.json({ disconnected: true });
}
