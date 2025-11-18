"use client";
import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function DiscordIntegrationPage() {
  const [connected, setConnected] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [guilds, setGuilds] = React.useState<{
    id: string; name: string; botInstalled?: boolean; permissions?: string | number; owner?: boolean;
  }[]>([]);
  const [me, setMe] = React.useState<{ id: string; username: string; avatar: string | null } | null>(null);

  React.useEffect(() => {
    const url = new URL(window.location.href);
    // Ask server if we have a persisted connection
    fetch("/api/discord/status")
      .then(r => r.ok ? r.json() : Promise.resolve({ connected: false }))
      .then(s => { if (s?.connected) setConnected(true); });

    // Avoid double-fetch on Fast Refresh/hot reload
    const fetchedKey = "dc_guilds_fetched_once";
    const cached = sessionStorage.getItem("dc_guilds_cache");
    if (cached) {
      try { setGuilds(JSON.parse(cached)); } catch {}
    }

    let cancelled = false;

    const ensureServerSession = async () => {
      // Make sure server has sb-access-token before calling server routes
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetch('/api/auth/set-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: session.access_token, refresh_token: session.refresh_token, expires_at: session.expires_at }),
          }).catch(()=>{});
        }
      } catch {}
    };

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        await ensureServerSession();
        // Fetch profile first
        try {
          const pr = await fetch("/api/discord/me");
          if (pr.ok) {
            const pj = await pr.json();
            if (!cancelled) setMe(pj);
          }
        } catch {}
        let r = await fetch("/api/discord/guilds");
        if (r.status === 401) {
          // retry once after forcing session sync
          await ensureServerSession();
          r = await fetch("/api/discord/guilds");
        }
        if (r.status === 429) {
          const ra = Number(r.headers.get("Retry-After") || 2);
          await new Promise(res => setTimeout(res, Math.min(Math.max(ra, 1), 5) * 1000));
          r = await fetch("/api/discord/guilds");
        }
        if (!r.ok) throw r;
        const data = await r.json();
        if (!cancelled) {
          setGuilds(data);
          sessionStorage.setItem(fetchedKey, "1");
          sessionStorage.setItem("dc_guilds_cache", JSON.stringify(data));
        }
      } catch (e) {
        let msg = "Failed to load guilds";
        try { const j = await (e as Response).json(); if (j?.error) msg = j.error + (j?.hint ? `: ${j.hint}` : ''); } catch {}
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Attempt to attach a pending Discord connection after login
    const attachPending = async () => {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.get("pending") === "1") {
          await ensureServerSession();
          await fetch("/api/discord/attach", { method: "POST" });
          url.searchParams.delete("pending");
          window.history.replaceState({}, "", url.toString());
        }
      } catch {}
    };

    // If returning from bot install, refresh guilds to reflect install state
    const maybeRefreshFromInstall = async () => {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.get("installed") === "1") {
          url.searchParams.delete("installed");
          window.history.replaceState({}, "", url.toString());
          await load();
        }
      } catch {}
    };

    attachPending().then(() => maybeRefreshFromInstall().then(load));
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Discord</h1>
        <Link href="/settings/integrations" className="text-sm text-foreground/80 hover:text-foreground">Integrations</Link>
      </div>

      <div className="rounded-md border p-4 space-y-3">
        <div className="text-sm text-muted-foreground">Connect your Discord account to allow Dash to access your servers (guilds). We’ll ask you to install the Dash bot on a server so it can create invites and kick users.</div>
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3 min-h-10">
            {me ? (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {me.avatar ? (
                    <img src={`https://cdn.discordapp.com/avatars/${me.id}/${me.avatar}.png?size=64`} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="opacity-60">{me.username?.charAt(0) || "D"}</span>
                  )}
                </div>
                <div>
                  <div className="font-medium">{me.username}</div>
                  <div className="text-xs text-muted-foreground">Connected</div>
                </div>
              </div>
            ) : connected ? (
              <div className="text-sm text-muted-foreground">Connected</div>
            ) : (
              <div className="text-sm text-muted-foreground">Not connected</div>
            )}
          </div>
          <div className="flex gap-2">
            {connected ? (
              <Button variant="outline" onClick={async ()=>{
                try {
                  const r = await fetch('/api/discord/disconnect', { method: 'POST' });
                  if (r.ok) {
                    setConnected(false);
                    setMe(null);
                    setGuilds([]);
                    sessionStorage.removeItem('dc_guilds_fetched_once');
                    sessionStorage.removeItem('dc_guilds_cache');
                  }
                } catch {}
              }}>Disconnect</Button>
            ) : (
              <a href="/api/discord/oauth/start"><Button>Connect Discord</Button></a>
            )}
            {!connected && <Button variant="outline" disabled>Install bot</Button>}
          </div>
        </div>
      </div>

      <div className="rounded-md border p-4 space-y-2">
        <div className="text-sm font-medium">Servers you can manage</div>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading servers…</div>
        ) : error ? (
          <div className="text-sm text-red-500">{error}</div>
        ) : guilds.length === 0 ? (
          <div className="text-sm text-muted-foreground">No servers to show yet. Connect Discord to fetch your servers.</div>
        ) : (
          <div className="divide-y">
            {guilds.map((g) => (
              <div key={g.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="font-medium">{g.name}</div>
                  {g.botInstalled && (
                    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs border border-emerald-300/60 text-emerald-700 bg-emerald-50">Installed</span>
                  )}
                  <div className="text-xs text-muted-foreground">{g.permissions || ""}</div>
                </div>
                <div className="flex gap-2">
                  {g.botInstalled ? (
                    <>
                      <Button size="sm" variant="outline">Manage</Button>
                    </>
                  ) : (
                    <a href={`/api/discord/bot/install?guildId=${g.id}`}><Button size="sm">Install bot</Button></a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-md border p-4 space-y-2">
        <div className="text-sm font-medium">Actions</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button variant="outline" disabled>Create invite link</Button>
          <Button variant="outline" disabled>Kick user</Button>
        </div>
        <div className="text-xs text-muted-foreground">These actions will be enabled after connecting Discord and installing the bot in a selected server.</div>
      </div>
    </div>
  );
}
