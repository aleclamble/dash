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
        setReady(true);
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) {
        router.replace("/login?redirect=/sales");
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
