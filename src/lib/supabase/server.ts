import { cookies } from "next/headers";
import { connection } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Server-side Supabase client for Server Components, Server Actions and Route
 * Handlers. Always create a new client per request — never share across
 * requests. Cookie writes may fail in Server Components (read-only cookies);
 * that is expected and session refresh is handled by middleware.
 */
export async function createClient() {
  // Every request-scoped client reads the caller's cookies and resolves a
  // session against the current clock (expiry, refresh). Opt the calling render
  // out of prerendering before any of that runs; otherwise Cache Components
  // rejects the unstable time value read while loading a session.
  await connection();

  const cookieStore = await cookies();
  const env = getPublicEnv();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component where cookies are read-only.
            // Middleware refreshes the session instead.
          }
        },
      },
    },
  );
}
