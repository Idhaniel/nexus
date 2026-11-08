import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/config";

export function createClient() {
  const { url, anonKey, hasPublicEnv } = getSupabaseEnv();
  if (!hasPublicEnv || !url || !anonKey) {
    return null;
  }
  return createBrowserClient(url, anonKey);
}
