import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { createClient } from "@/lib/supabase/server";
import { canAccessAdmin } from "@/lib/auth-guard";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false }
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Route protection: when Supabase is configured, require a signed-in user
  // whose profile has is_admin = true (enforced again at the RLS layer for
  // any direct table access). When Supabase isn't configured, admin access
  // is left open for demo/portfolio purposes and clearly labelled as such.
  const supabase = createClient();
  const supabaseConfigured = Boolean(supabase);
  let isSignedIn = false;
  let isAdmin = false;

  if (supabase) {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    isSignedIn = Boolean(user);

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();
      isAdmin = Boolean(profile?.is_admin);
    }
  }

  const allowed = canAccessAdmin({ supabaseConfigured, isSignedIn, isAdmin });
  if (!allowed) redirect(isSignedIn ? "/" : "/login");

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 bg-paper px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-xs text-slate">
            Internal dashboard · Portfolio demo data — not connected to real users or revenue.
            {!supabaseConfigured && " Admin auth bypassed: Supabase not configured."}
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
