import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAppUserId } from "@/lib/app_user";
import { cookies } from "next/headers";

export async function POST() {
  const userId = await getAppUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const admin = supabaseAdmin();

  // Remove connection and cached guilds
  await admin.from("discord_connections").delete().eq("user_id", userId);
  await admin.from("discord_guilds").delete().eq("user_id", userId);

  // Clear any legacy cookies we set during early prototype
  const jar = await cookies();
  await jar.delete("dc_access");
  await jar.delete("dc_refresh");
  await jar.delete("dc_expires");

  return NextResponse.json({ ok: true });
}
