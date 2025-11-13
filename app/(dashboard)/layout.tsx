"use client";
import * as React from "react";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!session) {
        const qs = new URLSearchParams(sp as any);
        const redirect = qs.toString() ? `/login?redirect=/sales?${qs}` : "/login?redirect=/sales";
        router.replace(redirect);
      } else {
        setReady(true);
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) {
        const qs = new URLSearchParams(sp as any);
        const redirect = qs.toString() ? `/login?redirect=/sales?${qs}` : "/login?redirect=/sales";
        router.replace(redirect);
      }
    });
    return () => { sub.subscription?.unsubscribe?.(); mounted = false; };
  }, [router, sp]);

  if (!ready) return <div className="min-h-screen"/>;

  return (
    <Suspense fallback={<div className="min-h-screen" /> }>
      <div className="min-h-screen">
        <Header />
        <div className="pt-14 p-6">
          {children}
        </div>
      </div>
    </Suspense>
  );
}
