-- Add community settings table
create table if not exists community_settings (
  user_id uuid primary key,
  slug text unique not null,
  name text not null,
  youtube_url text,
  feature1 text,
  feature2 text,
  feature3 text,
  price_cents integer not null default 0,
  currency text not null default 'usd',
  billing_interval text not null check (billing_interval in ('one_time','month')) default 'one_time',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Helpful index
create index if not exists idx_community_settings_slug on community_settings(slug);

-- Trigger to update updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_updated_at on community_settings;
create trigger trg_set_updated_at
before update on community_settings
for each row execute function set_updated_at();
