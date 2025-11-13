import { NextResponse } from "next/server";
import { getAppUserId } from "@/lib/app_user";
import { getPendingDiscord, clearPendingDiscord } from "@/lib/discord_pending";
import { upsertDiscordConnection } from "@/lib/discord_store";

export async function POST() {
  const userId = await getAppUserId();
  if (!userId) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  const pending = await getPendingDiscord();
  if (!pending?.discord_user_id || !pending?.access_token) {
    return NextResponse.json({ attached: false, reason: "no_pending" });
  }
  try {
    const access_expires_at = new Date(Date.now() + (Number(pending.expires_in || 3600) * 1000)).toISOString();
    await upsertDiscordConnection(userId, {
      discord_user_id: String(pending.discord_user_id),
      access_token: String(pending.access_token),
      refresh_token: pending.refresh_token ? String(pending.refresh_token) : null,
      access_expires_at,
    });
    await clearPendingDiscord();
    return NextResponse.json({ attached: true });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
