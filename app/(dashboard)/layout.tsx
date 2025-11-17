"use client";
import * as React from "react";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!session) {
        router.replace("/login?redirect=/sales");
      } else {
        try {
          await fetch('/api/auth/set-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              expires_at: session.expires_at,
            }),
          });
        } catch {}
        setReady(true);
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (!session) {
        try { await fetch('/api/auth/set-session', { method: 'DELETE' }); } catch {}
        router.replace("/login?redirect=/sales");
      } else {
        try {
          await fetch('/api/auth/set-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              expires_at: session.expires_at,
            }),
          });
        } catch {}
      }
    });
    return () => { sub.subscription?.unsubscribe?.(); mounted = false; };
  }, [router]);

  if (!ready) return <div className="min-h-screen"/>;

  return (
    <Suspense fallback={<div className="min-h-screen" /> }>
      <div className="min-h-screen">
        <Header />
        <div className="pt-20 p-6">
          {children}
        </div>
      </div>
    </Suspense>
  );
}
