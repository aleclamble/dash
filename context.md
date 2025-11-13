# Project Context and Work Log

This document captures ongoing context, decisions, and work history for the Dash project to maintain continuity between sessions.

## Environment and Tech
- Next.js 15 (app router), React 19
- Tailwind CSS 4
- Supabase (admin client used in server routes)
- Stripe integration present
- Discord integration work in progress (OAuth with PKCE, guild fetch, persistence)

## Recent Work (2025-11-13)
- Implemented Discord OAuth with PKCE:
  - /api/discord/oauth/start sets dc_state and dc_verifier cookies and redirects to Discord authorize
  - /api/discord/oauth/callback validates state + verifier, exchanges code for tokens, fetches Discord user, stores access/refresh/expiry in Supabase, clears PKCE cookies
- Session helpers:
  - /api/auth/set-session sets sb-access-token and sb-refresh-token cookies
  - lib/app_user.getAppUserId parses sb-access-token to get app user id
- Discord APIs:
  - /api/discord/status returns connection state
  - /api/discord/me returns profile via stored access token
  - /api/discord/guilds fetches manageable guilds, refreshes token if needed, caches guilds in Supabase with ~1h TTL
  - /api/discord/disconnect removes connection + cached guilds and clears legacy cookies
- UI:
  - Settings page for Discord shows connect/disconnect, profile, manageable guilds, placeholders for Install bot/Manage
- Fixes:
  - Resolved Next.js error on /sales by awaiting async `searchParams` API. Updated SalesPage to await `searchParams` and use `sp.from`/`sp.to`.

## Known Issues / TODOs
- Duplicate upsert in /api/discord/guilds when refreshing token (upsertDiscordConnection is called twice)
- Wire up bot install flow (OAuth2 URL with scopes `bot applications.commands` and permissions) from the Integrations UI
- Improve rate limiting and error handling for Discord endpoints server-side
- Verify DISCORD_* env vars across environments (local/prod) and validate redirect URIs

## Next Focus: Guild Persistence
- Ensure guilds list is persisted reliably with proper TTL and invalidation
- Add endpoints to read cached guilds, force-refresh, and maybe diff/update logic
- Potentially add background refresh on demand and reconcile permissions/ownership fields

## Branch Strategy
- New feature branch: `feature/guild-persistence` for work focused on guild persistence, cache policy, and related APIs/UI.

## Useful Notes
- `getAppUserId` relies on sb-access-token cookie containing a JWT with `sub` claim as user id
- Supabase tables used: `discord_connections`, `discord_guilds`
- `upsertGuilds` stores `cached_at` ISO timestamp for TTL checks
