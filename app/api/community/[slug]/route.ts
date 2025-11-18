import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const slug = params.slug;
  const { getCommunityBySlug } = await import('@/lib/community_store');
  const data = await getCommunityBySlug(slug);
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data });
}
