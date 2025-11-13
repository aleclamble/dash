import { NextResponse } from "next/server";
import { getAppUserId } from "@/lib/app_user";
import { markGuildInstalled } from "@/lib/discord_store";

export async function GET(req: Request) {
  const userId = await getAppUserId();
  if (!userId) return NextResponse.redirect("/settings/integrations/discord?error=not_signed_in");

  const url = new URL(req.url);
  const guildId = url.searchParams.get("guild_id");
  // If Discord sends code for OAuth, we don't need to exchange it for bot install; guild_id marks success
  if (!guildId) return NextResponse.redirect("/settings/integrations/discord?error=missing_guild");

  try {
    await markGuildInstalled(userId, guildId);
    return NextResponse.redirect("/settings/integrations/discord?installed=1");
  } catch (e:any) {
    return NextResponse.redirect(`/settings/integrations/discord?error=install_mark_failed&detail=${encodeURIComponent(e?.message || "")}`);
  }
}
