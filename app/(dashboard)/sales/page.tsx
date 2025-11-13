import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SyncButton } from "@/components/dashboard/SyncButton";
import { SplitsDialog } from "@/components/sales/SplitsDialog";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import Link from "next/link";

export const dynamic = "force-dynamic";

function nextDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

async function getSales(from?: string | null, to?: string | null) {
  let q = supabase
    .from("sales_with_splits")
    .select("id, created_at, currency, customer_email, description, status, pipeline_name, gross_amount, fee_amount, net_amount")
    .neq("status", "failed");
  if (from) q = q.gte("created_at", from);
  if (to) q = q.lt("created_at", nextDay(to));
  const res = await q;
  if (res.error) throw res.error;
  return res.data ?? [];
}

import { headers } from "next/headers";

async function getSummary(from?: string | null, to?: string | null) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") || "http";
  const base = `${proto}://${host}`;
  const res = await fetch(`${base}/api/dashboard/summary${params.size ? `?${params}` : ""}`, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to load summary");
  return json as { totals: any; members: any[]; pipelines: any[] };
}

export default async function SalesPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const from = typeof searchParams?.from === "string" ? searchParams!.from : undefined;
  const to = typeof searchParams?.to === "string" ? searchParams!.to : undefined;

  const [sales, summary] = await Promise.all([
    getSales(from, to),
    getSummary(from, to),
  ]);

  const overall = summary.totals;
  const members = summary.members;
  const pipelines = summary.pipelines;

  const currency = sales[0]?.currency || "USD";
  const fmt = new Intl.NumberFormat(undefined, { style: "currency", currency });

  return (
    <div className="max-w-6xl w-full mx-auto py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Sales</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <DateRangePicker />
          <SyncButton />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-md border p-3">
          <div className="text-sm text-muted-foreground">Total Gross</div>
          <div className="text-xl font-semibold">{fmt.format((overall.total_gross || 0)/100)}</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-sm text-muted-foreground">Stripe Fees</div>
          <div className="text-xl font-semibold">{fmt.format((overall.total_fees || 0)/100)}</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-sm text-muted-foreground">Total Net</div>
          <div className="text-xl font-semibold">{fmt.format((overall.total_net || 0)/100)}</div>
        </div>
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
            <TableHead>Pipeline</TableHead>
            <TableHead>Actions</TableHead>
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
              <TableCell>{r.pipeline_name ?? "-"}</TableCell>
              <TableCell>
                <SplitsDialog saleId={r.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-md border p-3">
          <div className="text-sm font-medium mb-2">Splits</div>
          <div className="space-y-1">
            {members.map((m: any) => (
              <div key={m.member_id} className="flex justify-between text-sm">
                <div>{m.member_name}</div>
                <div>{fmt.format((m.total_amount || 0)/100)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-sm font-medium mb-2">By Pipeline</div>
          <div className="space-y-1">
            {pipelines.map((p: any) => (
              <div key={String(p.pipeline_id)} className="flex justify-between text-sm">
                <div className="relative z-10">
                  <Link
                    href={`/pipelines/${p.pipeline_id ?? 'unassigned'}${(from || to) ? `?${new URLSearchParams(Object.fromEntries(Object.entries({ from, to }).filter(([_,v])=> !!v)) as any)}` : ''}`}
                    prefetch
                    className="block underline underline-offset-2 decoration-dotted hover:decoration-solid py-1"
                  >
                    {p.pipeline_name}
                  </Link>
                </div>
                <div>{fmt.format((p.total_amount || 0)/100)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
