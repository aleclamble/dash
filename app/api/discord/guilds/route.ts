import { NextResponse } from "next/server";
import { getAppUserId } from "@/lib/app_user";
import { getDiscordConnection, upsertGuilds, upsertDiscordConnection } from "@/lib/discord_store";

const ADMIN = 0x00000008;
const MANAGE_GUILD = 0x00000020;

export async function GET() {
  const userId = await getAppUserId();
  if (!userId) return NextResponse.json({ error: "not_authenticated", hint: "Server did not detect an app session cookie (sb-access-token). Try refreshing or signing in again." }, { status: 401 });

  // Check cache first (1 hour TTL)
  const { supabaseAdmin } = await import("@/lib/supabase");
  const admin = supabaseAdmin();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const cached = await admin
    .from("discord_guilds")
    .select("guild_id id, name, icon, owner, permissions, bot_installed")
    .eq("user_id", userId)
    .gte("cached_at", oneHourAgo);
  if (!cached.error && cached.data && cached.data.length) {
    return NextResponse.json(cached.data.map((g:any)=> ({...g, botInstalled: !!g.bot_installed})));
  }

  const conn = await getDiscordConnection(userId);
  let token = conn?.access_token || null;
  if (!token) {
    // Fallback: try reading OAuth cookies (legacy connections may have no token stored)
    try {
      const { getDiscordAccessToken } = await import("@/lib/discord_session");
      token = await getDiscordAccessToken();
      if (token) {
        // Backfill connection with token by fetching discord user id
        const meRes = await fetch("https://discord.com/api/users/@me", { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
        if (meRes.ok) {
          const me = await meRes.json();
          const discord_user_id = String(me.id);
          const access_expires_at = new Date(Date.now() + 3600 * 1000).toISOString();
          await upsertDiscordConnection(userId, { discord_user_id, access_token: token, refresh_token: null, access_expires_at });
        }
      }
    } catch {}
  }
  if (!token) return NextResponse.json({ error: "Not connected (no token)" }, { status: 401 });

  // Refresh if expired
  const exp = conn.access_expires_at ? new Date(conn.access_expires_at).getTime() : 0;
  if (exp && Date.now() >= exp - 30_000 && conn.refresh_token) {
    const body = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: conn.refresh_token,
    });
    const tr = await fetch("https://discord.com/api/oauth2/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
    if (tr.ok) {
      const tj = await tr.json();
      token = tj.access_token || token;
      // update connection with refreshed token
      await upsertDiscordConnection(userId, {
        discord_user_id: conn.discord_user_id,
        access_token: token,
        refresh_token: tj.refresh_token || conn.refresh_token,
        access_expires_at: new Date(Date.now() + (tj.expires_in || 3600) * 1000).toISOString(),
      });
    }
  }

  const res = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch guilds" }, { status: res.status });
  }
  const data = await res.json();
  const manageable = (Array.isArray(data) ? data : []).filter((g: any) => {
    const perms = Number(g.permissions || 0);
    return Boolean(g.owner) || (perms & ADMIN) === ADMIN || (perms & MANAGE_GUILD) === MANAGE_GUILD;
  }).map((g: any) => ({ id: g.id, name: g.name, icon: g.icon, owner: g.owner, permissions: g.permissions }));
  await upsertGuilds(userId, manageable);
  // merge bot_installed flags from cache
  const installed = await admin
    .from("discord_guilds")
    .select("guild_id, bot_installed")
    .eq("user_id", userId);
  const installedSet = new Map((installed.data || []).map((r:any)=> [r.guild_id, !!r.bot_installed]));
  const withFlags = manageable.map(g => ({...g, botInstalled: installedSet.get(g.id) || false}));
  return NextResponse.json(withFlags);
}
