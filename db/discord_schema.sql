-- Discord integration persistence
create table if not exists public.discord_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  discord_user_id text not null,
  access_token text,
  refresh_token text,
  access_expires_at timestamptz,
  scopes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.discord_connections enable row level security;

create policy "own rows" on public.discord_connections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.discord_guilds (
  user_id uuid references auth.users(id) on delete cascade,
  guild_id text,
  name text,
  icon text,
  owner boolean,
  permissions bigint,
  cached_at timestamptz default now(),
  bot_installed boolean default false,
  installed_at timestamptz,
  primary key (user_id, guild_id)
);

-- Backfill-safe alters (no-op if columns already exist)
alter table public.discord_guilds add column if not exists bot_installed boolean default false;
alter table public.discord_guilds add column if not exists installed_at timestamptz;

alter table public.discord_guilds enable row level security;

create policy "own rows" on public.discord_guilds
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
