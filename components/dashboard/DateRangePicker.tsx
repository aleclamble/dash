"use client";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function fmtLabelDate(d: string | null | undefined) {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00Z");
  // Use a fixed locale and options so SSR and client render identically
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(dt);
}
function formatDate(d: Date) { return d.toISOString().slice(0, 10); }
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function addDays(d: Date, days: number) { const nd = new Date(d); nd.setDate(nd.getDate() + days); return nd; }

export function DateRangePicker() {
  const router = useRouter();
  const sp = useSearchParams();

  const fromQ = sp.get("from") || "";
  const toQ = sp.get("to") || "";

  const [open, setOpen] = React.useState(false);
  const [from, setFrom] = React.useState<string>(fromQ);
  const [to, setTo] = React.useState<string>(toQ);

  React.useEffect(() => { setFrom(fromQ); setTo(toQ); }, [fromQ, toQ]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onClick = (e: MouseEvent) => {
      const tgt = e.target as HTMLElement;
      if (!tgt.closest?.("[data-range-root]")) setOpen(false);
    };
    if (open) {
      window.addEventListener("keydown", onKey);
      window.addEventListener("mousedown", onClick);
      return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("mousedown", onClick); };
    }
  }, [open]);

  const setQuery = (params: Record<string, string | undefined>) => {
    const curr = new URLSearchParams(Array.from(sp.entries()));
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === "") curr.delete(k); else curr.set(k, v);
    });
    router.push(curr.size ? `?${curr}` : "?");
  };

  const thisMonth = () => {
    const now = new Date();
    setQuery({ from: formatDate(startOfMonth(now)), to: formatDate(endOfMonth(now)) });
    setOpen(false);
  };
  const lastMonth = () => {
    const now = new Date();
    const firstOfThis = startOfMonth(now);
    const lastOfPrev = addDays(firstOfThis, -1);
    setQuery({ from: formatDate(startOfMonth(lastOfPrev)), to: formatDate(lastOfPrev) });
    setOpen(false);
  };
  const clearAll = () => { setQuery({ from: undefined, to: undefined }); setOpen(false); };
  const apply = () => { setQuery({ from: from || undefined, to: to || undefined }); setOpen(false); };

  const label = (() => {
    if (!from && !to) return "All time";
    if (from && to) return `${fmtLabelDate(from)} — ${fmtLabelDate(to)}`;
    if (from) return `From ${fmtLabelDate(from)}`;
    if (to) return `Until ${fmtLabelDate(to)}`;
    return "Date range";
  })();

  return (
    <div className="relative" data-range-root>
      <Button variant="outline" onClick={() => setOpen(o=>!o)} aria-expanded={open} aria-haspopup className="min-w-[10ch] max-w-[70vw] sm:max-w-none truncate text-left justify-between">
        {label}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="ml-2 opacity-70"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </Button>
      {open && (
        <>
          {/* Mobile: full-screen bottom sheet */}
          <div className="fixed inset-0 z-50 bg-black/40 sm:hidden" />
          <div className="fixed inset-x-0 bottom-0 z-50 sm:hidden">
            <div className="rounded-t-xl border-t border-x bg-background shadow-2xl p-4">
              <div className="pb-2 border-b text-sm font-medium">Date range</div>
              <div className="pt-3 grid gap-3">
                <div className="grid gap-1">
                  <label className="text-xs text-muted-foreground">From</label>
                  <Input type="date" value={from} onChange={(e)=> setFrom(e.target.value)} className="h-11" />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs text-muted-foreground">To</label>
                  <Input type="date" value={to} onChange={(e)=> setTo(e.target.value)} className="h-11" />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Button variant="outline" onClick={thisMonth} className="w-full h-11">This month</Button>
                  <Button variant="outline" onClick={lastMonth} className="w-full h-11">Last month</Button>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Button variant="ghost" onClick={clearAll} className="w-full h-11">Clear</Button>
                  <Button onClick={apply} className="w-full h-11">Apply</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: anchored popover */}
          <div className="absolute right-0 mt-2 z-50 hidden sm:block w-[340px] rounded-md border bg-background shadow">
            <div className="p-3 border-b text-sm font-medium">Date range</div>
            <div className="p-3 grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <label className="text-xs text-muted-foreground">From</label>
                <Input type="date" value={from} onChange={(e)=> setFrom(e.target.value)} />
              </div>
              <div className="grid gap-1">
                <label className="text-xs text-muted-foreground">To</label>
                <Input type="date" value={to} onChange={(e)=> setTo(e.target.value)} />
              </div>
              <div className="col-span-2 flex justify-end gap-2 mt-2">
                <Button variant="ghost" onClick={clearAll}>Clear</Button>
                <Button onClick={apply}>Apply</Button>
              </div>
            </div>
            <div className="p-2 border-t">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={thisMonth}>This month</Button>
                <Button variant="outline" onClick={lastMonth}>Last month</Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
