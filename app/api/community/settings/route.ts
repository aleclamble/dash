import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAppUserId } from "@/lib/app_user";

export async function GET() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const userId = await getAppUserId();
  if (!userId) return NextResponse.json({ error: 'No app user' }, { status: 400 });
  const { getCommunityByUser } = await import('@/lib/community_store');
  const data = await getCommunityByUser(userId);
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const userId = await getAppUserId();
  if (!userId) return NextResponse.json({ error: 'No app user' }, { status: 400 });
  const { upsertCommunitySettings } = await import('@/lib/community_store');

  const slug = String(body.slug || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (!slug) return NextResponse.json({ error: 'Slug is required' }, { status: 400 });

  const name = String(body.name || '').trim();
  const youtube_url = (body.youtube_url ? String(body.youtube_url) : null);
  const feature1 = body.feature1 ? String(body.feature1) : null;
  const feature2 = body.feature2 ? String(body.feature2) : null;
  const feature3 = body.feature3 ? String(body.feature3) : null;
  const currency = (body.currency && typeof body.currency === 'string') ? body.currency.toLowerCase() : 'usd';
  const price_cents = Math.max(0, Number.isFinite(body.price_cents) ? Math.floor(body.price_cents) : 0);
  const billing_interval = body.billing_interval === 'month' ? 'month' : 'one_time';

  const saved = await upsertCommunitySettings({
    user_id: userId,
    slug,
    name,
    youtube_url,
    feature1,
    feature2,
    feature3,
    price_cents,
    currency,
    billing_interval,
  });

  return NextResponse.json({ data: saved });
}
