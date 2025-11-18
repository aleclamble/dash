import Link from "next/link";
import { getAppUserId } from "@/lib/app_user";
import { getCommunitiesByUser } from "@/lib/community_store";
import { Button } from "@/components/ui/button";
import { SessionSync } from '@/components/session/SessionSync';

function SessionSyncShim() {
  // Render client-only SessionSync to sync cookies and refresh
  return <SessionSync />;
}

export default async function CommunitiesSettingsPage() {
  const userId = await getAppUserId();

  if (!userId) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-6">
        <h1 className="text-2xl font-semibold">Communities</h1>
        <div className="rounded-md border p-4 text-sm text-muted-foreground">
          You need to be signed in to view your communities.
        </div>
        <Link href="/login"><Button>Sign in</Button></Link>
        {/* Attempt to sync client auth -> server cookies and refresh */}
        <SessionSyncShim />
      </div>
    );
  }

  const communities = await getCommunitiesByUser(userId);

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Communities</h1>

      {communities.length === 0 ? (
        <div className="rounded-md border p-4 text-sm text-muted-foreground">
          You don&apos;t have any communities yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {communities.map((c) => (
            <div key={c.slug} className="rounded-md border p-4 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-muted-foreground">/{c.slug}</div>
                {c.description ? (
                  <div className="text-sm text-muted-foreground">{c.description}</div>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/join/${c.slug}`}>
                  <Button variant="secondary">View public page</Button>
                </Link>
                <Link href="/community">
                  <Button>Edit</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
