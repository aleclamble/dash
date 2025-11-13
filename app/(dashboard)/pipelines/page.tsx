"use client";
import * as React from "react";
import { Suspense } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function PipelinesInner() {
  const [list, setList] = React.useState<any[]>([]);
  const [name, setName] = React.useState("");

  const load = async () => {
    const res = await fetch("/api/pipelines");
    const json = await res.json();
    if (Array.isArray(json)) setList(json);
  };
  React.useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name) return alert("Name required");
    const res = await fetch("/api/pipelines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name })});
    if (!res.ok) {
      const j = await res.json().catch(()=>({}));
      return alert(j.error || "Failed to add pipeline");
    }
    setName("");
    load();
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Pipelines</h1>

      <div className="rounded-md border p-4 grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Label>Name</Label>
          <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Inbound" />
        </div>
        <div className="sm:col-span-1 flex items-end">
          <Button onClick={add}>Add</Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((p)=> (
            <TableRow key={p.id}>
              <TableCell>{p.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function PipelinesPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" /> }>
      <PipelinesInner />
    </Suspense>
  );
}
