import { supabaseAdmin } from "@/lib/supabase";

export type CommunitySettings = {
  user_id: string;
  slug: string;
  name: string;
  description?: string | null;
  youtube_url?: string | null;
  feature1?: string | null;
  feature2?: string | null;
  feature3?: string | null;
  price_cents: number;
  currency: string;
  billing_interval: 'one_time' | 'month';
};

export async function getCommunityByUser(userId: string) {
  const admin = supabaseAdmin();
  const { data, error } = await admin.from('community_settings').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data as CommunitySettings | null;
}

export async function getCommunityBySlug(slug: string) {
  const admin = supabaseAdmin();
  const { data, error } = await admin.from('community_settings').select('*').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data as CommunitySettings | null;
}

export async function upsertCommunitySettings(input: Omit<CommunitySettings,'user_id'> & { user_id: string }) {
  const admin = supabaseAdmin();
  // ensure slug uniqueness on upsert: conflict on user_id primary key
  const { data, error } = await admin.from('community_settings').upsert(input, { onConflict: 'user_id' }).select('*').maybeSingle();
  if (error) throw error;
  return data as CommunitySettings;
}
