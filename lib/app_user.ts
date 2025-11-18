import { cookies } from "next/headers";

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = str.length % 4;
  if (pad) str += "=".repeat(4 - pad);
  return Buffer.from(str, "base64").toString("utf8");
}

export async function getAppUserId(): Promise<string | null> {
  const jar = await cookies();
  
  // Debug: log available cookies
  const allCookies = jar.getAll().map(c => c.name);
  console.log('Available cookies:', allCookies);
  
  const jwt = jar.get("sb-access-token")?.value || jar.get("sb:token")?.value || jar.get("supabase-access-token")?.value || jar.get("supabase.access-token")?.value || null;
  
  console.log('JWT found:', !!jwt);
  
  if (!jwt) return null;
  const parts = jwt.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    // Supabase user id is "sub"
    const userId = typeof payload?.sub === "string" ? payload.sub : null;
    console.log('User ID extracted:', !!userId);
    return userId;
  } catch (e) {
    console.log('JWT decode error:', e);
    return null;
  }
}
