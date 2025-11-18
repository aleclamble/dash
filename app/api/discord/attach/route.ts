import { NextResponse } from "next/server";
import { getAppUserId } from "@/lib/app_user";
import { getPendingDiscord, clearPendingDiscord } from "@/lib/discord_pending";
import { upsertDiscordConnection } from "@/lib/discord_store";

export async function POST() {
  const userId = await getAppUserId();
  if (!userId) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  const pending = await getPendingDiscord();
  if (!pending?.discord_user_id || !pending?.access_token) {
    // Fallback: if we have Discord cookies from OAuth callback, attach directly
    try {
      const jar = await (await import('next/headers')).cookies();
      const access = jar.get('dc_access')?.value || null;
      const refresh = jar.get('dc_refresh')?.value || null;
      const expStr = jar.get('dc_expires')?.value || null;
      if (!access) return NextResponse.json({ attached: false, reason: "no_pending_no_cookies" });
      // Fetch profile to get discord_user_id
      const meRes = await fetch("https://discord.com/api/users/@me", { headers: { Authorization: `Bearer ${access}` }, cache: 'no-store' });
      if (!meRes.ok) return NextResponse.json({ attached: false, reason: "cookie_profile_fetch_failed" });
      const me = await meRes.json();
      const discord_user_id = String(me.id);
      const access_expires_at = expStr ? new Date(Number(expStr) * 1000).toISOString() : new Date(Date.now() + 3600*1000).toISOString();
      await upsertDiscordConnection(userId, {
        discord_user_id,
        access_token: access,
        refresh_token: refresh || null,
        access_expires_at,
      });
      return NextResponse.json({ attached: true, via: 'cookies' });
    } catch (e:any) {
      return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
    }
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
