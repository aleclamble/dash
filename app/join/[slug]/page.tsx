import { headers } from 'next/headers';
import { Check } from 'lucide-react';

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
  } catch { }
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
    return <div className="min-h-screen flex items-center justify-center text-lg text-muted-foreground">Community not found</div> as any;
  }
  const cfg = json.data as any;
  const embed = youtubeEmbedUrl(cfg.youtube_url);
  const priceMajor = new Intl.NumberFormat(undefined, { style: 'currency', currency: (cfg.currency || 'usd').toUpperCase() }).format((cfg.price_cents || 0) / 100);
  const features = [cfg.feature1, cfg.feature2, cfg.feature3].filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            {cfg.name}
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {cfg.description || 'Join our exclusive community to get access to premium content, support, and connect with like-minded people.'}
          </p>
        </div>

        {/* Features Grid */}
        {features.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            {features.map((f: string, i: number) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-colors">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center mt-0.5">
                  <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" strokeWidth={3} />
                </div>
                <span className="text-sm font-medium text-foreground/90">{f}</span>
              </div>
            ))}
          </div>
        )}

        {/* Video Embed */}
        {embed && (
          <div className="mb-12">
            <div className="aspect-video rounded-2xl overflow-hidden border border-border/50 shadow-2xl shadow-black/10">
              <iframe
                src={embed}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Checkout Card */}
        <div className="max-w-md mx-auto">
          <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl shadow-black/5 overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  {cfg.billing_interval === 'month' ? 'Monthly Subscription' : 'One-time Payment'}
                </div>
                <div className="text-5xl font-bold tracking-tight mb-1">{priceMajor}</div>
                {cfg.billing_interval === 'month' && (
                  <div className="text-sm text-muted-foreground">per month</div>
                )}
              </div>

              <form action={`/api/checkout/community/${encodeURIComponent(slug)}`} method="post">
                <button
                  className="w-full h-12 rounded-xl bg-foreground text-background font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-lg hover:shadow-xl"
                  type="submit"
                >
                  Join now
                </button>
              </form>

              {sp?.success === '1' && (
                <div className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400 text-center">
                    ✓ Payment successful! Check your email for details.
                  </p>
                </div>
              )}
              {sp?.canceled === '1' && (
                <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400 text-center">
                    Payment was canceled. You can try again anytime.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
