import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAppUserId } from "@/lib/app_user";

export async function GET() {
  const jar = await cookies();
  const names = jar.getAll().map(c => c.name).sort();
  const userId = await getAppUserId();
  return NextResponse.json({ userId, cookieNames: names });
}
