import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function parseDateParam(v: string | null): string | null {
  if (!v) return null;
  // Expect YYYY-MM-DD; basic validation
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  return v;
}
function nextDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const from = parseDateParam(url.searchParams.get("from"));
  const toExclusive = (() => {
    const t = parseDateParam(url.searchParams.get("to"));
    return t ? nextDay(t) : null;
  })();

  const admin = supabaseAdmin();

  // Totals within range (or all-time if no range). Compute in code to avoid aggregate parsing issues
  let totalsQuery = admin
    .from("sales")
    .select("net_amount,gross_amount,fee_amount,created_at,status")
    .neq("status", "failed");
  if (from) totalsQuery = totalsQuery.gte("created_at", from);
  if (toExclusive) totalsQuery = totalsQuery.lt("created_at", toExclusive);
  const totalsRes = await totalsQuery;
  if (totalsRes.error) return NextResponse.json({ error: totalsRes.error.message }, { status: 400 });
  const totalsData = totalsRes.data || [];
  const totals = totalsData.reduce((acc: { total_net: number; total_gross: number; total_fees: number }, r: any) => {
    acc.total_net += Number(r.net_amount || 0);
    acc.total_gross += Number(r.gross_amount || 0);
    acc.total_fees += Number(r.fee_amount || 0);
    return acc;
  }, { total_net: 0, total_gross: 0, total_fees: 0 });

  // Member totals: aggregate in JS due to join + filter
  let memberQuery = admin
    .from("sales_splits")
    .select("member_id, amount, team_members(name), sales!inner(created_at,status)");
  memberQuery = memberQuery.neq("sales.status", "failed");
  if (from) memberQuery = memberQuery.gte("sales.created_at", from);
  if (toExclusive) memberQuery = memberQuery.lt("sales.created_at", toExclusive);
  const memberRows = await memberQuery;
  if (memberRows.error) return NextResponse.json({ error: memberRows.error.message }, { status: 400 });
  const memberMap = new Map<number, { member_id: number; member_name: string; total_amount: number }>();
  for (const r of memberRows.data || []) {
    const id = r.member_id as number;
    const tm: any = (r as any).team_members;
    const name = Array.isArray(tm) ? (tm[0]?.name as string | undefined) : (tm?.name as string | undefined);
    if (!id) continue;
    const prev = memberMap.get(id) || { member_id: id, member_name: name || `Member ${id}`, total_amount: 0 };
    prev.total_amount += Number((r as any).amount || 0);
    if (name) prev.member_name = name;
    memberMap.set(id, prev);
  }
  const members = Array.from(memberMap.values()).sort((a,b)=> a.member_name.localeCompare(b.member_name));

  // Pipeline totals
  let pipeQuery = admin
    .from("sales")
    .select("pipeline_id, net_amount, pipelines(name), status, created_at")
    .neq("status", "failed");
  if (from) pipeQuery = pipeQuery.gte("created_at", from);
  if (toExclusive) pipeQuery = pipeQuery.lt("created_at", toExclusive);
  const pipeRows = await pipeQuery;
  if (pipeRows.error) return NextResponse.json({ error: pipeRows.error.message }, { status: 400 });
  const pipeMap = new Map<number | null, { pipeline_id: number | null; pipeline_name: string; total_amount: number }>();
  for (const r of pipeRows.data || []) {
    const id = (r.pipeline_id as number | null) ?? null;
    const pip: any = (r as any).pipelines;
    const pname = Array.isArray(pip) ? (pip[0]?.name as string | undefined) : (pip?.name as string | undefined);
    const name = pname ?? (id === null ? "Unassigned" : `Pipeline ${id}`);
    const prev = pipeMap.get(id) || { pipeline_id: id, pipeline_name: name, total_amount: 0 };
    prev.total_amount += Number((r as any).net_amount || 0);
    pipeMap.set(id, prev);
  }
  const pipelines = Array.from(pipeMap.values()).sort((a,b)=> a.pipeline_name.localeCompare(b.pipeline_name));

  return NextResponse.json({
    totals,
    members,
    pipelines,
  });
}
