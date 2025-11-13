"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function SyncButton() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const onClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sales/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const json = await res.json();
      if (!res.ok) {
        alert(`Error: ${json.error || "Unknown"}`);
      } else {
        // trigger server component re-fetch
        router.refresh();
      }
    } catch (e: any) {
      alert((e as any)?.message || "Failed to sync");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button onClick={onClick} disabled={loading}>
      {loading ? "Syncing..." : "Sync from Stripe"}
    </Button>
  );
}
