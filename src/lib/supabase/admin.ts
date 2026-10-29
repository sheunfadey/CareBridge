import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Service-role Supabase client. Bypasses Row Level Security entirely, so it must
 * only be used for platform-administration tasks that cannot be expressed as a
 * user's own RLS-scoped operations (e.g. suspending an account, platform-wide
 * reporting). NEVER import this into a Client Component or ship the key to the
 * browser.
 *
 * Returns null when SUPABASE_SERVICE_ROLE_KEY is not configured, so callers must
 * handle the "admin capability unavailable" case explicitly rather than
 * silently falling back to the anon key.
 */
export function createAdminClient(): ReturnType<
  typeof createSupabaseClient<Database>
> | null {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    return null;
  }

  const env = getPublicEnv();

  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

/** True when the service-role key is present in the server environment. */
export function hasAdminClient(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
