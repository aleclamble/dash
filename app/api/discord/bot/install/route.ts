import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAppUserId } from "@/lib/app_user";
import { buildBotInstallUrl } from "@/lib/discord_bot";

async function baseUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || "http";
  return `${proto}://${host}`;
}

export async function GET(req: Request) {
  const userId = await getAppUserId();
  if (!userId) return NextResponse.redirect("/settings/integrations/discord?error=not_signed_in");

  const url = new URL(req.url);
  const guildId = url.searchParams.get("guildId");
  if (!guildId) return NextResponse.redirect("/settings/integrations/discord?error=missing_guild");

  const clientId = process.env.DISCORD_CLIENT_ID!;
  const redirectUri = process.env.DISCORD_BOT_REDIRECT_URI || `${await baseUrl()}/api/discord/bot/callback`;
  const perms = process.env.DISCORD_BOT_PERMISSIONS || "0";
  if (!clientId) return NextResponse.redirect("/settings/integrations/discord?error=server_config");

  const installUrl = buildBotInstallUrl({ clientId, guildId, redirectUri, permissions: perms });
  return NextResponse.redirect(installUrl);
}
