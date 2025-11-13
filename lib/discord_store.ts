import { supabaseAdmin } from "@/lib/supabase";

export async function getDiscordConnection(userId: string) {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("discord_connections")
    .select("discord_user_id, access_token, refresh_token, access_expires_at")
    .eq("user_id", userId)
    .maybeSingle();
  return data as { discord_user_id: string; access_token: string | null; refresh_token: string | null; access_expires_at: string | null } | null;
}

export async function upsertDiscordConnection(userId: string, row: {
  discord_user_id: string;
  access_token: string;
  refresh_token?: string | null;
  access_expires_at: string;
}) {
  const admin = supabaseAdmin();
  const { error } = await admin.from("discord_connections").upsert({ user_id: userId, ...row, updated_at: new Date().toISOString() });
  if (error) {
    console.error("discord_connections upsert error", error);
    throw new Error(error.message || "upsert failed");
  }
}

export async function upsertGuilds(userId: string, guilds: Array<{ id: string; name: string; icon?: string | null; owner?: boolean; permissions?: number }>) {
  const admin = supabaseAdmin();
  // Do not include bot_installed so we don't overwrite the flag during refresh
  const rows = guilds.map(g => ({ user_id: userId, guild_id: g.id, name: g.name, icon: g.icon ?? null, owner: !!g.owner, permissions: g.permissions ?? 0, cached_at: new Date().toISOString() }));
  if (rows.length) await admin.from("discord_guilds").upsert(rows);
}

export async function markGuildInstalled(userId: string, guildId: string) {
  const admin = supabaseAdmin();
  const { error } = await admin
    .from("discord_guilds")
    .upsert({ user_id: userId, guild_id: guildId, bot_installed: true, installed_at: new Date().toISOString(), cached_at: new Date().toISOString() });
  if (error) {
    console.error("markGuildInstalled upsert error", error);
    throw new Error(error.message || "markGuildInstalled failed");
  }
}
