import Link from "next/link";
import { Button } from "@/components/ui/button";

function DiscordIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M20.317 4.369A19.791 19.791 0 0016.886 3c-.2.357-.43.83-.59 1.204a18.27 18.27 0 00-4.593 0A7.78 7.78 0 0011.113 3c-1.217.219-2.4.6-3.431 1.127C4.794 7.391 4.094 10.64 4.276 13.845c1.285 1.35 3.192 2.101 5.258 2.256.401-.546.76-1.132 1.066-1.749-.602-.227-1.175-.507-1.716-.833.144-.104.285-.213.421-.327 3.289 1.54 6.85 1.54 10.104 0 .138.114.279.223.421.327-.54.326-1.114.606-1.716.833.309.617.668 1.203 1.066 1.749 2.073-.157 3.989-.908 5.275-2.265.432-3.356-.735-6.579-2.928-9.267zM9.861 12.47c-.793 0-1.442-.731-1.442-1.633 0-.901.637-1.642 1.442-1.642.806 0 1.455.74 1.442 1.642 0 .902-.636 1.632-1.442 1.632zm4.293 0c-.793 0-1.443-.731-1.443-1.633 0-.901.637-1.642 1.443-1.642.805 0 1.454.74 1.441 1.642 0 .902-.636 1.632-1.441 1.632z"/>
    </svg>
  );
}

function StripeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M12.001 2C6.477 2 2 6.477 2 12.001 2 17.523 6.477 22 12.001 22 17.523 22 22 17.523 22 12.001 22 6.477 17.523 2 12.001 2zm1.918 5.83c1.543 0 2.515.736 2.515 2.102v5.467h-1.809v-1.04h-.047c-.354.68-1.143 1.178-2.201 1.178-1.615 0-2.68-.973-2.68-2.355 0-1.4 1.066-2.26 2.96-2.26.533 0 1.127.083 1.968.25v-.18c0-.74-.563-1.113-1.541-1.113-.886 0-1.83.3-2.455.802l-.507-1.463c.774-.577 1.96-1.389 3.797-1.389zM12.7 13.3c0 .56.478.96 1.174.96.86 0 1.626-.563 1.626-1.339v-.563c-.31-.06-.91-.168-1.436-.168-.87 0-1.364.39-1.364 1.11z"/>
    </svg>
  );
}

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <div className="rounded-md border p-4">
        <div className="text-sm text-muted-foreground">Manage integrations and platform configuration.</div>
      </div>

      <div className="grid gap-4">
        {/* Integrations section */}
        <div className="text-sm font-medium">Integrations</div>

        {/* Discord Card */}
        <div className="rounded-md border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DiscordIcon className="w-6 h-6" />
            <div>
              <div className="font-medium">Discord</div>
              <div className="text-sm text-muted-foreground">Connect a Discord account and select a server for Dash to manage.</div>
            </div>
          </div>
          <Link href="/settings/integrations/discord">
            <Button>Connect</Button>
          </Link>
        </div>

        {/* Stripe Card */}
        <div className="rounded-md border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StripeIcon className="w-6 h-6" />
            <div>
              <div className="font-medium">Stripe</div>
              <div className="text-sm text-muted-foreground">Connect Stripe for sales syncing and reporting.</div>
            </div>
          </div>
          <Link href="/settings/integrations/stripe"><Button>Connect</Button></Link>
        </div>

        {/* Communities Card */}
        <div className="rounded-md border p-4 flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-sm bg-muted" />
            <div>
              <div className="font-medium">Communities</div>
              <div className="text-sm text-muted-foreground">Manage your communities: view details and edit settings.</div>
            </div>
          </div>
          <Link href="/settings/communities"><Button>Open</Button></Link>
        </div>
      </div>
    </div>
  );
}
