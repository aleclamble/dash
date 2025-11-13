import { NextResponse } from "next/server";
import { getDiscordAccessToken } from "@/lib/discord_session";

export async function GET() {
  const token = await getDiscordAccessToken();
  if (!token) return NextResponse.json({ error: "Not connected" }, { status: 401 });
  const res = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return NextResponse.json({ error: "Failed to fetch profile" }, { status: res.status });
  const u = await res.json();
  // Normalize minimal fields
  const dto = {
    id: u.id as string,
    username: (u.global_name as string) || (u.username as string),
    avatar: u.avatar as string | null,
    discriminator: u.discriminator as string | null,
  };
  return NextResponse.json(dto);
}
