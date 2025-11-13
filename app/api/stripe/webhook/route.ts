import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  const buf = await req.text();
  const sig = (await headers()).get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeSecret = process.env.STRIPE_SECRET_KEY;

  if (!sig || !webhookSecret || !stripeSecret) {
    return NextResponse.json({ error: "Missing Stripe env" }, { status: 400 });
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: "2024-12-18.acacia" });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await upsertSaleFromCheckoutSession(session);
        break;
      }
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await upsertSaleFromPaymentIntent(pi);
        break;
      }
      default:
        // ignore others for now
        break;
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function upsertSaleFromCheckoutSession(session: Stripe.Checkout.Session) {
  const admin = supabaseAdmin();
  const amount = session.amount_total ?? 0;
  const currency = session.currency ?? "usd";
  const id = session.id;
  const customer_email = session.customer_details?.email ?? null;
  const description = session.metadata?.description ?? null;

  const { error } = await admin
    .from("sales")
    .upsert({
      stripe_id: id,
      source: "checkout",
      amount,
      currency,
      customer_email,
      description,
      status: session.payment_status,
      created_at: new Date((session.created ?? Math.floor(Date.now() / 1000)) * 1000).toISOString(),
    }, { onConflict: "stripe_id" });
  if (error) throw error;
}

async function upsertSaleFromPaymentIntent(pi: Stripe.PaymentIntent) {
  const admin = supabaseAdmin();
  const amount = pi.amount_received ?? pi.amount ?? 0;
  const currency = pi.currency ?? "usd";
  const id = pi.id;
  const customer_email = (typeof pi.receipt_email === "string" ? pi.receipt_email : null) ?? null;
  const description = typeof pi.description === "string" ? pi.description : null;

  const { error } = await admin
    .from("sales")
    .upsert({
      stripe_id: id,
      source: "payment_intent",
      amount,
      currency,
      customer_email,
      description,
      status: pi.status,
      created_at: new Date((pi.created ?? Math.floor(Date.now() / 1000)) * 1000).toISOString(),
    }, { onConflict: "stripe_id" });
  if (error) throw error;
}
