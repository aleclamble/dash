import { NextResponse } from "next/server";
import { getAppUserId } from "@/lib/app_user";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const userId = await getAppUserId();
  if (!userId) return NextResponse.json({ connected: false });
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("discord_connections")
    .select("discord_user_id, access_expires_at")
    .eq("user_id", userId)
    .maybeSingle();
  return NextResponse.json({ connected: !!data, connection: data || null });
}
