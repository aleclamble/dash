import { NextResponse } from "next/server";
import Stripe from 'stripe';

export async function POST(_req: Request, { params }: { params: { slug: string } }) {
  const slug = params.slug;
  const { getCommunityBySlug } = await import('@/lib/community_store');
  const cfg = await getCommunityBySlug(slug);
  if (!cfg) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: 'Missing STRIPE_SECRET_KEY' }, { status: 500 });

  const stripe = new Stripe(secret, { apiVersion: '2024-06-20' });

  const isSub = cfg.billing_interval === 'month';
  const mode: 'payment' | 'subscription' = isSub ? 'subscription' : 'payment';

  const session = await stripe.checkout.sessions.create({
    mode,
    line_items: [
      {
        price_data: {
          currency: cfg.currency || 'usd',
          product_data: {
            name: cfg.name,
            description: 'Community access',
          },
          unit_amount: cfg.price_cents,
          ...(isSub ? { recurring: { interval: 'month' as const } } : {}),
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/join/${encodeURIComponent(slug)}?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/join/${encodeURIComponent(slug)}?canceled=1`,
    metadata: {
      description: `Community checkout: ${cfg.name}`,
      slug,
      source: 'community',
    },
  });

  return NextResponse.json({ url: session.url });
}
