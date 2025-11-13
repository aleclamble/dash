"use client";
import * as React from "react";
import { Suspense } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";

function LoginInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const redirectTo = sp.get("redirect") || "/sales";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [mode, setMode] = React.useState<'signin' | 'signup'>('signin');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.session) throw new Error("No session returned");
        try {
          await fetch('/api/auth/set-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: data.session.access_token, refresh_token: data.session.refresh_token, expires_at: data.session.expires_at }),
          });
        } catch {}
        router.push(redirectTo);
      } else {
        // Sign up flow (requires email confirmations off to return a session immediately)
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          try {
            await fetch('/api/auth/set-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ access_token: data.session.access_token, refresh_token: data.session.refresh_token, expires_at: data.session.expires_at }),
            });
          } catch {}
          router.push(redirectTo);
        } else {
          setError('Sign up successful. Please verify your email to continue, or disable email confirmations in Supabase Auth settings for instant access.');
        }
      }
    } catch (err: any) {
      setError(err?.message || (mode === 'signin' ? "Login failed" : "Sign up failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-md border border-white/10 bg-zinc-900 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{mode === 'signin' ? 'Sign in' : 'Sign up'}</h1>
          <button type="button" className="text-sm text-foreground/80 hover:text-foreground underline underline-offset-2" onClick={()=> setMode(mode === 'signin' ? 'signup' : 'signin')}>
            {mode === 'signin' ? 'Create account' : 'Have an account? Sign in'}
          </button>
        </div>
        {error && <div className="text-sm text-red-400">{error}</div>}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e)=> setEmail(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e)=> setPassword(e.target.value)} required />
        </div>
        <Button type="submit" disabled={loading} className="w-full">{loading? "Signing in...": "Sign in"}</Button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" /> }>
      <LoginInner />
    </Suspense>
  );
}
