import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Only ever uses the public anon key — never the
 * service role key, which must stay server-side only.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createBrowserClient(url, anonKey);
}
