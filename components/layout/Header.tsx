"use client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import * as React from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

function ProfileMenu({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative">
      <button
        className="h-8 px-3 rounded-md border text-sm text-foreground/80 hover:text-foreground hover:bg-accent/50"
        onClick={() => setOpen(o=>!o)}
        aria-haspopup
        aria-expanded={open}
      >
        Profile
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="ml-1 inline-block opacity-70"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 z-50 min-w-[160px] rounded-md border bg-background shadow">
          <a className="block px-3 py-2 text-foreground/80 hover:bg-accent/50 hover:text-foreground" href="/settings">Settings</a>
          <a className="block px-3 py-2 text-foreground/80 hover:bg-accent/50 hover:text-foreground" href="/settings/integrations">Integrations</a>
          <button className="block w-full text-left px-3 py-2 text-foreground/80 hover:bg-accent/50 hover:text-foreground" onClick={onSignOut}>Sign out</button>
        </div>
      )}
    </div>
  );
}


const nav = [
  { href: "/members", label: "Members" },
  { href: "/pipelines", label: "Pipelines" },
  { href: "/settings", label: "Settings" },
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
        <div className="flex items-center gap-6">
          <Link href="/sales" className="font-semibold text-base tracking-tight italic select-none">
            <span className="logo-d mr-0.5 inline-block" aria-hidden="true">
              <span className="logo-d-layer t2">D</span>
              <span className="logo-d-layer t1">D</span>
              <span className="logo-d-main">D</span>
            </span>
            ash
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/members" className="text-foreground/80 hover:text-foreground transition-colors">Members</Link>
            <Link href="/pipelines" className="text-foreground/80 hover:text-foreground transition-colors">Pipelines</Link>
          </nav>
        </div>
        {/* Right-side profile menu */}
        <div className="flex items-center gap-3 text-sm">
          {signedIn ? (
            <ProfileMenu onSignOut={async () => { await supabase.auth.signOut(); router.replace("/login?redirect=/sales"); }} />
          ) : (
            <Link href="/login" className="text-foreground/80 hover:text-foreground transition-colors">Sign in</Link>
          )}
        </div>
      </div>
    </header>
  );
}
