import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";

async function baseUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || "http";
  return `${proto}://${host}`;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const cookieJar = await cookies();
    const expectedState = cookieJar.get("dc_state")?.value;
    const verifier = cookieJar.get("dc_verifier")?.value;
    if (!code || !state || !expectedState || state !== expectedState || !verifier) {
      return NextResponse.redirect("/settings/integrations/discord?error=invalid_state");
    }

    const clientId = process.env.DISCORD_CLIENT_ID!;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET!;
    const redirectUri = process.env.DISCORD_REDIRECT_URI || `${await baseUrl()}/api/discord/oauth/callback`;
    if (!clientId || !clientSecret) {
      return NextResponse.redirect("/settings/integrations/discord?error=server_config");
    }

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    });

    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });
    if (!tokenRes.ok) {
      const txt = await tokenRes.text().catch(()=>"");
      return NextResponse.redirect(`/settings/integrations/discord?error=token_exchange_failed&detail=${encodeURIComponent(txt.slice(0,200))}`);
    }
    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token as string | undefined;
    const refreshToken = tokenJson.refresh_token as string | undefined;
    const expiresIn = tokenJson.expires_in as number | undefined;
    const tokenType = tokenJson.token_type as string | undefined;
    if (!accessToken || tokenType?.toLowerCase() !== "bearer") {
      return NextResponse.redirect("/settings/integrations/discord?error=token_invalid");
    }

    // Look up Discord user to get their id to store
    const meRes = await fetch("https://discord.com/api/users/@me", { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
    if (!meRes.ok) {
      return NextResponse.redirect(`${await baseUrl()}/settings/integrations/discord?error=profile_fetch_failed`);
    }
    const me = await meRes.json();
    const discordUserId = me?.id as string | undefined;

    // Persist in Supabase keyed by app user (requires existing app session)
    const { getAppUserId } = await import("@/lib/app_user");
    const { upsertDiscordConnection } = await import("@/lib/discord_store");
    const { setPendingDiscord } = await import("@/lib/discord_pending");
    const appUserId = await getAppUserId();

    // Set Discord cookies for immediate UI access to /api/discord/me
    const now = Math.floor(Date.now() / 1000);
    const maxAge = Math.max(1, Math.min((expiresIn || 3600), 3600));
    const exp = now + (expiresIn || 3600);
    const secure = process.env.NODE_ENV === "production";
    await cookieJar.set("dc_access", accessToken, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge });
    if (refreshToken) await cookieJar.set("dc_refresh", refreshToken, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60*60*24*30 });
    await cookieJar.set("dc_expires", String(exp), { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60*60*24*30 });

    if (!appUserId) {
      // Store pending Discord connection to attach after user logs in
      await setPendingDiscord({
        discord_user_id: discordUserId,
        access_token: accessToken,
        refresh_token: refreshToken || null,
        expires_in: expiresIn || 3600,
        captured_at: Date.now(),
      });
      return NextResponse.redirect(`${await baseUrl()}/login?redirect=${encodeURIComponent("/settings/integrations/discord?pending=1")}`);
    }
    if (discordUserId) {
      try {
        const access_expires_at = new Date((Date.now() + (expiresIn || 3600) * 1000)).toISOString();
        await upsertDiscordConnection(appUserId, { discord_user_id: discordUserId, access_token: accessToken, refresh_token: refreshToken || null, access_expires_at });
      } catch (e:any) {
        return NextResponse.redirect(`${await baseUrl()}/settings/integrations/discord?error=db_upsert_failed&detail=${encodeURIComponent(e?.message || "")}`);
      }
    }

    // Clean up PKCE cookies
    await cookieJar.delete("dc_state");
    await cookieJar.delete("dc_verifier");

    return NextResponse.redirect(`${await baseUrl()}/settings/integrations/discord?connected=1`);
  } catch (e: any) {
    return NextResponse.redirect(`${await baseUrl()}/settings/integrations/discord?error=callback_exception&detail=${encodeURIComponent(e?.message || "unknown")}`);
  }
}
