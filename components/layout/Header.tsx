"use client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import * as React from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const nav = [
  { href: "/members", label: "Members" },
  { href: "/pipelines", label: "Pipelines" },
];

export function Header() {
  const [signedIn, setSignedIn] = React.useState<boolean | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setSignedIn(!!session);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => { sub.subscription?.unsubscribe?.(); mounted = false; };
  }, []);

  return (
    <header className={cn("fixed top-4 left-4 right-4 sm:inset-x-0 z-40")}>
      <div
        className={cn(
          "mx-auto max-w-6xl w-full",
          "h-12 px-6 flex items-center justify-between",
          "rounded-md border border-white/20",
          "bg-background/30 backdrop-blur supports-[backdrop-filter]:bg-background/30",
          "shadow-[0_0_20px_rgba(255,255,255,0.15)]"
        )}
      >
        <Link href="/sales" className="font-semibold text-base tracking-tight italic select-none">
          <span className="logo-d mr-0.5 inline-block" aria-hidden="true">
            <span className="logo-d-layer t2">D</span>
            <span className="logo-d-layer t1">D</span>
            <span className="logo-d-main">D</span>
          </span>
          ash
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              {n.label}
            </Link>
          ))}
          {signedIn ? (
            <Button
              variant="ghost"
              onClick={async ()=> { await supabase.auth.signOut(); router.replace("/login?redirect=/sales"); }}
            >Sign out</Button>
          ) : (
            <Link href="/login" className="text-foreground/80 hover:text-foreground transition-colors">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
