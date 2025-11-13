import crypto from "crypto";

export function base64UrlEncode(buf: Buffer | Uint8Array) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest();
}

export async function createPkce() {
  const codeVerifier = base64UrlEncode(crypto.randomBytes(32));
  const hash = await sha256(codeVerifier);
  const codeChallenge = base64UrlEncode(hash);
  return { codeVerifier, codeChallenge };
}

export function discordAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  codeChallenge: string;
}) {
  const q = new URLSearchParams({
    response_type: "code",
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    scope: params.scope,
    state: params.state,
    code_challenge: params.codeChallenge,
    code_challenge_method: "S256",
    prompt: "consent",
  });
  return `https://discord.com/api/oauth2/authorize?${q.toString()}`;
}
