import type { User } from "@supabase/supabase-js";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

/** Returns the signed-in user for this request, or null. */
export async function getRequestUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

/** True when the scenario exists and belongs to the given user. */
export async function userOwnsScenario(
  userId: string,
  scenarioId: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("scenarios")
    .select("user_id")
    .eq("id", scenarioId)
    .maybeSingle();
  return Boolean(data && data.user_id === userId);
}
