import { cookies } from "next/headers";

const PENDING_KEY = "dc_pending";

export async function setPendingDiscord(payload: any, maxAgeSeconds = 600) {
  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";
  const value = Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
  await jar.set(PENDING_KEY, value, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: maxAgeSeconds });
}

export async function getPendingDiscord(): Promise<any | null> {
  const jar = await cookies();
  const v = jar.get(PENDING_KEY)?.value;
  if (!v) return null;
  try { return JSON.parse(Buffer.from(v, "base64").toString("utf8")); } catch { return null; }
}

export async function clearPendingDiscord() {
  const jar = await cookies();
  await jar.delete(PENDING_KEY);
}
