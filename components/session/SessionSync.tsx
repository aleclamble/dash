"use client";
import * as React from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export function SessionSync({ onSynced }: { onSynced?: () => void }) {
  const router = useRouter();
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
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
          if (!cancelled) {
            onSynced?.();
            router.refresh();
          }
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [router, onSynced]);
  return null;
}
