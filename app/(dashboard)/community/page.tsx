"use client";
import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

function useCommunitySettings() {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/community/settings', { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load');
        setData(json.data);
      } catch (e:any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  return { loading, data, error, setData };
}

export default function CommunitySettingsPage() {
  const { loading, data, setData, error } = useCommunitySettings();
  const [saving, setSaving] = React.useState(false);

  const [form, setForm] = React.useState({
    slug: data?.slug || '',
    name: data?.name || '',
    youtube_url: data?.youtube_url || '',
    feature1: data?.feature1 || '',
    feature2: data?.feature2 || '',
    feature3: data?.feature3 || '',
    price_cents: data?.price_cents || 0,
    currency: data?.currency || 'usd',
    billing_interval: data?.billing_interval || 'one_time',
  });

  React.useEffect(() => {
    if (data) {
      setForm({
        slug: data.slug || '',
        name: data.name || '',
        youtube_url: data.youtube_url || '',
        feature1: data.feature1 || '',
        feature2: data.feature2 || '',
        feature3: data.feature3 || '',
        price_cents: data.price_cents || 0,
        currency: data.currency || 'usd',
        billing_interval: data.billing_interval || 'one_time',
      });
    }
  }, [data]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/community/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        ...form,
        price_cents: Number(form.price_cents) || 0,
      })});
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save');
      setData(json.data);
    } catch (e:any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  const publicUrl = form.slug ? `/join/${encodeURIComponent(form.slug)}` : '';

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Community</h1>
        {publicUrl && (
          <a href={publicUrl} target="_blank" className="underline text-sm opacity-80 hover:opacity-100">View public page</a>
        )}
      </div>

      {loading ? (
        <div className="text-sm opacity-70">Loading...</div>
      ) : (
        <form className="space-y-4" onSubmit={(e)=>{e.preventDefault(); save();}}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={form.slug} onChange={e=>setForm(f=>({...f, slug: e.target.value}))} placeholder="your-community" />
              <div className="text-xs text-muted-foreground mt-1">Public URL: {publicUrl || '—'}</div>
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))} placeholder="My Awesome Community" />
            </div>
          </div>

          <div>
            <Label htmlFor="youtube">YouTube video URL</Label>
            <Input id="youtube" value={form.youtube_url} onChange={e=>setForm(f=>({...f, youtube_url: e.target.value}))} placeholder="https://www.youtube.com/watch?v=..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="f1">Feature 1</Label>
              <Input id="f1" value={form.feature1} onChange={e=>setForm(f=>({...f, feature1: e.target.value}))} placeholder="What members get" />
            </div>
            <div>
              <Label htmlFor="f2">Feature 2</Label>
              <Input id="f2" value={form.feature2} onChange={e=>setForm(f=>({...f, feature2: e.target.value}))} placeholder="e.g. Weekly calls" />
            </div>
            <div>
              <Label htmlFor="f3">Feature 3</Label>
              <Input id="f3" value={form.feature3} onChange={e=>setForm(f=>({...f, feature3: e.target.value}))} placeholder="e.g. Premium chat" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">Price</Label>
              <Input id="price" type="number" min={0} value={Math.round((Number(form.price_cents)||0)/100)} onChange={e=>setForm(f=>({...f, price_cents: Math.max(0, Math.floor(Number(e.target.value)||0)*100)}))} />
              <div className="text-xs text-muted-foreground mt-1">Charged in {form.currency.toUpperCase()}</div>
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" value={form.currency} onChange={e=>setForm(f=>({...f, currency: e.target.value.toLowerCase()}))} placeholder="usd" />
            </div>
            <div>
              <Label htmlFor="interval">Payment</Label>
              <select id="interval" className="h-9 border rounded-md px-3 text-sm bg-transparent" value={form.billing_interval} onChange={e=>setForm(f=>({...f, billing_interval: e.target.value as any}))}>
                <option value="one_time">One-time</option>
                <option value="month">Monthly</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
            {publicUrl && (
              <a href={publicUrl} target="_blank" className="inline-flex items-center h-9 px-3 rounded-md border text-sm">View Public Page</a>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
