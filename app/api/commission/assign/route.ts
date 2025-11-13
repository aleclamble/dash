import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";

const Schema = z.object({
  sale_id: z.number(),
  seller_id: z.number(),
  seller_percent: z.number().min(0).max(100),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { sale_id, seller_id, seller_percent } = parsed.data;
  const admin = supabaseAdmin();
  const { data: sale, error: saleErr } = await admin.from("sales").select("amount").eq("id", sale_id).single();
  if (saleErr) return NextResponse.json({ error: saleErr.message }, { status: 400 });

  const seller_share_amount = Math.round((sale.amount * seller_percent) / 100);
  const company_share_amount = sale.amount - seller_share_amount;

  const { error } = await admin.from("sales_commissions").upsert({
    sale_id,
    seller_id,
    seller_percent,
    seller_share: seller_share_amount,
    company_share: company_share_amount,
  }, { onConflict: "sale_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
