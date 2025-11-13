import { cookies, headers } from "next/headers";

export async function getDiscordAccessToken(): Promise<string | null> {
  const jar = await cookies();
  let access = jar.get("dc_access")?.value || null;
  const refresh = jar.get("dc_refresh")?.value || null;
  const expStr = jar.get("dc_expires")?.value || null;
  const now = Math.floor(Date.now() / 1000);
  const exp = expStr ? Number(expStr) : 0;

  const needRefresh = !access || (exp && now >= exp - 30);
  if (!needRefresh || !refresh) return access;

  const client_id = process.env.DISCORD_CLIENT_ID!;
  const client_secret = process.env.DISCORD_CLIENT_SECRET!;
  if (!client_id || !client_secret) return access;

  const body = new URLSearchParams({
    client_id,
    client_secret,
    grant_type: "refresh_token",
    refresh_token: refresh,
  });
  const res = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!res.ok) return access;
  const j = await res.json();
  const newAccess = j.access_token as string | undefined;
  const newRefresh = j.refresh_token as string | undefined;
  const expiresIn = j.expires_in as number | undefined;
  if (!newAccess) return access;

  const secure = process.env.NODE_ENV === "production";
  const maxAge = typeof expiresIn === "number" ? Math.min(expiresIn, 3600) : 3600;
  const newExp = now + (expiresIn || 3600);
  await (await cookies()).set("dc_access", newAccess, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge });
  if (newRefresh) await (await cookies()).set("dc_refresh", newRefresh, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60*60*24*30 });
  await (await cookies()).set("dc_expires", String(newExp), { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60*60*24*30 });
  return newAccess;
}
