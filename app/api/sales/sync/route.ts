import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";

// Optional: sync only since a given timestamp (seconds)
export async function POST(req: Request) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 400 });
  const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });
  const admin = supabaseAdmin();

  const { since } = (await req.json().catch(() => ({}))) as { since?: number };

  let starting_after: string | undefined = undefined;
  let total = 0;
  while (true) {
    const page = await stripe.charges.list({ limit: 100, ...(starting_after ? { starting_after } : {}), ...(since ? { created: { gte: since } } : {}) });
    for (const charge of page.data) {
      // Get balance transaction to compute fees and net
      const btId = typeof charge.balance_transaction === 'string' ? charge.balance_transaction : charge.balance_transaction?.id;
      let fee = 0; let net = 0;
      if (btId) {
        const bt = await stripe.balanceTransactions.retrieve(btId);
        fee = bt.fee || 0;
        net = bt.net || 0;
      } else {
        // Fallback if no balance tx is attached
        net = charge.amount_captured ?? charge.amount ?? 0;
        fee = 0;
      }

      const gross = charge.amount_captured ?? charge.amount ?? 0;
      const currency = charge.currency ?? "usd";
      const customer_email = (typeof charge.billing_details?.email === 'string' ? charge.billing_details.email : null) ?? null;
      const description = typeof charge.description === 'string' ? charge.description : null;
      const created = charge.created ? new Date(charge.created * 1000).toISOString() : new Date().toISOString();

      const { error } = await admin
        .from("sales")
        .upsert({
          stripe_id: charge.id,
          source: "charge",
          currency,
          customer_email,
          description,
          status: charge.status,
          created_at: created,
          gross_amount: gross,
          fee_amount: fee,
          net_amount: net,
        }, { onConflict: "stripe_id" });
      if (error) throw error;
      total++;
    }
    if (!page.has_more) break;
    starting_after = page.data[page.data.length - 1]?.id;
  }
  return NextResponse.json({ ok: true, total });
}
