-- Migration: Add bot_installed and installed_at to discord_guilds
-- Safe to run multiple times

begin;

alter table if exists public.discord_guilds
  add column if not exists bot_installed boolean default false;

alter table if exists public.discord_guilds
  add column if not exists installed_at timestamptz;

-- Optional backfill to ensure no nulls (idempotent)
update public.discord_guilds set bot_installed = coalesce(bot_installed, false) where bot_installed is null;

commit;
