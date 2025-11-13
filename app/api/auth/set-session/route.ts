import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { access_token, refresh_token, expires_at } = body as { access_token?: string; refresh_token?: string; expires_at?: number };
    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: "Missing tokens" }, { status: 400 });
    }
    const secure = process.env.NODE_ENV === "production";
    const jar = await cookies();
    const now = Math.floor(Date.now() / 1000);
    const maxAge = Math.max(1, (expires_at ? expires_at - now : 3600));
    await jar.set("sb-access-token", access_token, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge });
    await jar.set("sb-refresh-token", refresh_token, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60*60*24*30 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
