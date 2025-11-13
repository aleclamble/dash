export function buildBotInstallUrl(params: {
  clientId: string;
  guildId: string;
  redirectUri: string;
  permissions?: string | number; // Discord expects permissions as integer
}) {
  const scope = "bot applications.commands";
  const q = new URLSearchParams({
    client_id: params.clientId,
    scope,
    guild_id: params.guildId,
    response_type: "code",
    redirect_uri: params.redirectUri,
    disable_guild_select: "true",
    permissions: String(params.permissions ?? 0),
    prompt: "consent",
  });
  return `https://discord.com/oauth2/authorize?${q.toString()}`;
}
