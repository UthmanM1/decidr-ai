/**
 * Pure decision function for admin route protection, extracted so it can be
 * unit tested without a running Next.js/Supabase environment. The actual
 * enforcement (redirects) lives in src/app/admin/layout.tsx and calls this.
 */
export function canAccessAdmin(params: {
  supabaseConfigured: boolean;
  isSignedIn: boolean;
  isAdmin: boolean;
}): boolean {
  // Demo mode: no Supabase configured means no real accounts exist yet, so
  // admin access is left open and clearly labelled in the UI.
  if (!params.supabaseConfigured) return true;
  if (!params.isSignedIn) return false;
  return params.isAdmin;
}
