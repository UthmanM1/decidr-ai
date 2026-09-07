import { describe, it, expect } from "vitest";
import { canAccessAdmin } from "@/lib/auth-guard";

describe("canAccessAdmin", () => {
  it("allows access in demo mode when Supabase isn't configured", () => {
    expect(canAccessAdmin({ supabaseConfigured: false, isSignedIn: false, isAdmin: false })).toBe(true);
  });

  it("denies access when Supabase is configured but the user isn't signed in", () => {
    expect(canAccessAdmin({ supabaseConfigured: true, isSignedIn: false, isAdmin: false })).toBe(false);
  });

  it("denies access when signed in but not an admin", () => {
    expect(canAccessAdmin({ supabaseConfigured: true, isSignedIn: true, isAdmin: false })).toBe(false);
  });

  it("allows access when signed in and flagged as admin", () => {
    expect(canAccessAdmin({ supabaseConfigured: true, isSignedIn: true, isAdmin: true })).toBe(true);
  });
});
