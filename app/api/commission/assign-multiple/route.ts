import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";

const Schema = z.object({
  sale_id: z.number(),
  pipeline_id: z.number().nullable().optional(),
  splits: z.array(z.object({
    member_id: z.number(),
    percent: z.number().min(0).max(100),
    role: z.string().optional(),
    note: z.string().optional(),
  })).min(1),
  mode: z.enum(["replace","merge"]).default("replace"),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { sale_id, pipeline_id, splits, mode } = parsed.data;

  const admin = supabaseAdmin();
  const { data: sale, error: saleErr } = await admin.from("sales").select("net_amount").eq("id", sale_id).single();
  if (saleErr || !sale) return NextResponse.json({ error: saleErr?.message || "Sale not found" }, { status: 400 });

  const totalPercent = splits.reduce((a, s) => a + s.percent, 0);
  if (totalPercent > 100.00001) return NextResponse.json({ error: "Total percent cannot exceed 100" }, { status: 400 });

  const base = sale.net_amount || 0;
  const computed = splits.map((s, idx) => ({
    ...s,
    amount: Math.round((base * s.percent) / 100),
    idx,
  }));
  const sum = computed.reduce((a, s) => a + s.amount, 0);
  const delta = base - sum; // distribute rounding remainder to last split
  if (computed.length > 0) computed[computed.length - 1].amount += delta;

  if (mode === "replace") {
    const { error: delErr } = await admin.from("sales_splits").delete().eq("sale_id", sale_id);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 400 });
  }

  for (const s of computed) {
    const { error } = await admin.from("sales_splits").upsert({
      sale_id,
      member_id: s.member_id,
      percent: s.percent,
      amount: s.amount,
      role: s.role,
      note: s.note,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (typeof pipeline_id === "number") {
    const { error } = await admin.from("sales").update({ pipeline_id }).eq("id", sale_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
