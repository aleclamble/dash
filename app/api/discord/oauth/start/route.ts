import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { createPkce, discordAuthorizeUrl } from "@/lib/discord";

async function baseUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || "http";
  return `${proto}://${host}`;
}

export async function GET() {
  try {
    const clientId = process.env.DISCORD_CLIENT_ID!;
    const redirectUri = process.env.DISCORD_REDIRECT_URI || `${await baseUrl()}/api/discord/oauth/callback`;
    if (!clientId) {
      return NextResponse.json({ error: "Missing DISCORD_CLIENT_ID" }, { status: 500 });
    }
    const scope = "identify guilds";
    const state = Math.random().toString(36).slice(2);
    const { codeVerifier, codeChallenge } = await createPkce();

    const cookieJar = await cookies();
    const secure = process.env.NODE_ENV === "production";
    await cookieJar.set("dc_state", state, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 600 });
    await cookieJar.set("dc_verifier", codeVerifier, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 600 });

    const url = discordAuthorizeUrl({ clientId, redirectUri, scope, state, codeChallenge });
    return NextResponse.redirect(url);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to start Discord OAuth" }, { status: 500 });
  }
}
