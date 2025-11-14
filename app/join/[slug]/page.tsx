import { headers } from 'next/headers';

function youtubeEmbedUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.split('/').filter(Boolean).pop();
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {}
  return null;
}

export default async function JoinPage({ params, searchParams }: { params: { slug: string }, searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const slug = params.slug;
  const sp = searchParams ? await searchParams : {} as any;
  const hdrs = await headers();
  const host = hdrs.get('x-forwarded-host') || hdrs.get('host') || 'localhost:3000';
  const proto = hdrs.get('x-forwarded-proto') || 'http';
  const base = `${proto}://${host}`;
  const res = await fetch(`${base}/api/community/${encodeURIComponent(slug)}`, { cache: 'no-store' });
  const json = await res.json();
  if (!res.ok) {
    return <div className="min-h-screen flex items-center justify-center">Community not found</div> as any;
  }
  const cfg = json.data as any;
  const embed = youtubeEmbedUrl(cfg.youtube_url);
  const priceMajor = new Intl.NumberFormat(undefined, { style: 'currency', currency: (cfg.currency||'usd').toUpperCase() }).format((cfg.price_cents||0)/100);

  async function createSession() {
    'use server';
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/60">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          <div className="flex-1 space-y-5">
            <h1 className="text-4xl font-semibold tracking-tight">{cfg.name}</h1>
            <p className="text-foreground/70">Private community access. Join to get exclusive content, support, and more.</p>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[cfg.feature1, cfg.feature2, cfg.feature3].filter(Boolean).map((f: string, i: number) => (
                <li key={i} className="rounded-md border p-3 text-sm">{f}</li>
              ))}
            </ul>
            {embed && (
              <div className="aspect-video rounded-md overflow-hidden border">
                <iframe src={embed} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            )}
          </div>
          <div className="w-full max-w-sm lg:sticky lg:top-10 rounded-md border p-6 bg-background/70 backdrop-blur">
            <div className="text-sm text-muted-foreground mb-1">{cfg.billing_interval === 'month' ? 'Monthly' : 'One-time'}</div>
            <div className="text-3xl font-semibold">{priceMajor}</div>
            <form action={`/api/checkout/community/${encodeURIComponent(slug)}`} method="post" className="mt-6">
              <button className="w-full h-10 rounded-md bg-foreground text-background font-medium hover:opacity-90" type="submit">Join now</button>
            </form>
            {sp?.success === '1' && (
              <div className="mt-4 text-sm text-green-600">Payment successful. Check your email for details.</div>
            )}
            {sp?.canceled === '1' && (
              <div className="mt-4 text-sm text-amber-600">Payment canceled.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
