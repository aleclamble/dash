import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";

export const dynamic = "force-dynamic";

function nextDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

async function getSales(pipelineParam: string, from?: string | null, to?: string | null) {
  let q = supabase
    .from("sales_with_splits")
    .select("id, created_at, currency, customer_email, description, status, pipeline_id, pipeline_name, gross_amount, fee_amount, net_amount")
    .neq("status", "failed");

  if (pipelineParam === "unassigned") {
    q = q.is("pipeline_id", null);
  } else {
    const pid = Number(pipelineParam);
    if (!Number.isFinite(pid)) throw new Error("Invalid pipeline id");
    q = q.eq("pipeline_id", pid);
  }
  if (from) q = q.gte("created_at", from);
  if (to) q = q.lt("created_at", nextDay(to));
  const res = await q;
  if (res.error) throw res.error;
  return res.data ?? [];
}

export default async function PipelineSalesPage({ params, searchParams }: { params: { id: string }, searchParams?: Record<string, string | string[] | undefined> }) {
  const from = typeof searchParams?.from === "string" ? searchParams!.from : undefined;
  const to = typeof searchParams?.to === "string" ? searchParams!.to : undefined;

  const sales = await getSales(params.id, from, to);
  const currency = sales[0]?.currency || "USD";
  const fmt = new Intl.NumberFormat(undefined, { style: "currency", currency });

  const pipelineName = params.id === "unassigned" ? "Unassigned" : (sales[0]?.pipeline_name ?? `Pipeline ${params.id}`);

  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  const backHref = `/sales${qs.size ? `?${qs}` : ""}`;

  return (
    <div className="max-w-6xl w-full mx-auto py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{pipelineName} · Sales</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <DateRangePicker />
        </div>
      </div>

      <div>
        <Link href={backHref} className="text-sm text-foreground/80 hover:text-foreground">← Back to Sales</Link>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Gross</TableHead>
            <TableHead>Fees</TableHead>
            <TableHead>Net</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((r: any) => (
            <TableRow key={r.id}>
              <TableCell>{new Date(r.created_at).toLocaleString()}</TableCell>
              <TableCell>{fmt.format((r.gross_amount || 0) / 100)}</TableCell>
              <TableCell>{fmt.format((r.fee_amount || 0) / 100)}</TableCell>
              <TableCell>{fmt.format((r.net_amount || 0) / 100)}</TableCell>
              <TableCell>{r.customer_email ?? "-"}</TableCell>
              <TableCell>{r.description ?? "-"}</TableCell>
              <TableCell><Badge variant={r.status === "succeeded" ? "secondary" : "outline"}>{r.status}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
