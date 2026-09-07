import "server-only";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Server-side Supabase client, bound to the current request's cookies so
 * Supabase Auth sessions work in server components and route handlers.
 * Returns null when Supabase env vars are absent, so the app can run in
 * demo mode without a database configured.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  const cookieStore = cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a server component without write access — safe to ignore
          // because middleware refreshes the session cookie instead.
        }
      }
    }
  });
}

/**
 * Admin client using the service role key. SERVER ONLY. Never import this
 * from a client component or expose the key via NEXT_PUBLIC_*.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
