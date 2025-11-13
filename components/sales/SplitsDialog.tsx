"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

type Member = { id: number; name: string };
type Pipeline = { id: number; name: string };

type Props = {
  saleId: number;
};

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function SplitsDialog({ saleId }: Props) {
  const [open, setOpen] = React.useState(false);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [pipelines, setPipelines] = React.useState<Pipeline[]>([]);
  const [pipelineId, setPipelineId] = React.useState<number | null>(null);
  const [rows, setRows] = React.useState<{ member_id: number | null; percent: number }[]>([
    { member_id: null, percent: 100 },
  ]);

  React.useEffect(() => {
    fetch("/api/team/members").then(r=>r.json()).then(setMembers).catch(()=>{});
    fetch("/api/pipelines").then(r=>r.json()).then(setPipelines).catch(()=>{});
  }, []);

  // Load existing splits + pipeline when opening
  React.useEffect(() => {
    if (!open) return;
    (async () => {
      const { data, error } = await supabase
        .from("sales_splits")
        .select("member_id, percent, sale_id, sales(pipeline_id)")
        .eq("sale_id", saleId);
      if (!error && data) {
        // prefill pipeline and rows if existing
        const pid = (data[0] as any)?.sales?.pipeline_id as number | null | undefined;
        if (typeof pid === 'number') setPipelineId(pid);
        if (Array.isArray(data) && data.length > 0) {
          setRows(data.map(d => ({ member_id: d.member_id ?? null, percent: d.percent ?? 0 })));
        }
      }
    })();
  }, [open, saleId]);

  const total = rows.reduce((a, r) => a + (Number(r.percent) || 0), 0);

  const addRow = () => setRows(rs => [...rs, { member_id: null, percent: 0 }]);
  const removeRow = (idx: number) => setRows(rs => rs.filter((_, i) => i !== idx));

  const router = useRouter();

  const submit = async () => {
    if (rows.some(r => !r.member_id)) return alert("Please select all members");
    const payload = {
      sale_id: saleId,
      pipeline_id: pipelineId,
      splits: rows.map(r => ({ member_id: r.member_id!, percent: Number(r.percent) })),
      mode: "replace" as const,
    };
    const res = await fetch("/api/commission/assign-multiple", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await res.json();
    if (!res.ok) return alert(json.error || "Failed");
    alert("Saved");
    setOpen(false);
    // Trigger server component re-fetch so the sales list and totals update without manual refresh
    router.refresh();
  };

  return (
    <div>
      <Button variant="outline" onClick={() => setOpen(true)}>Assign Splits</Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-xl rounded-md bg-background p-4 shadow">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Assign splits</h3>
              <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <Label>Pipeline</Label>
                <Select value={pipelineId !== null ? String(pipelineId) : undefined} onValueChange={(v)=>setPipelineId(Number(v))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a pipeline" />
                  </SelectTrigger>
                  <SelectContent>
                    {pipelines.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                {rows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 items-end gap-2">
                    <div className="col-span-7">
                      <Label>Member</Label>
                      <Select value={row.member_id ? String(row.member_id) : undefined} onValueChange={(v)=> setRows(r=> r.map((x,i)=> i===idx? { ...x, member_id: Number(v)}: x))}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select member" /></SelectTrigger>
                        <SelectContent>
                          {members.map(m => (
                            <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-4">
                      <Label>Percent</Label>
                      <Input type="number" min={0} max={100} value={row.percent} onChange={(e)=> setRows(r=> r.map((x,i)=> i===idx? { ...x, percent: Number(e.target.value)}: x))} />
                    </div>
                    <div className="col-span-1">
                      <Button variant="ghost" onClick={()=> removeRow(idx)}>X</Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={addRow}>Add Member</Button>
                <div className={total > 100 ? "text-red-600" : "text-muted-foreground"}>Total: {total}%</div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={()=> setOpen(false)}>Cancel</Button>
                <Button onClick={submit} disabled={total>100}>Save</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
