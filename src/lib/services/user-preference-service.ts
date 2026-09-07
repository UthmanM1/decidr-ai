import "server-only";
import type { UserPreferences } from "../types";
import { createClient } from "../supabase/server";

/**
 * UserPreferenceService
 * -----------------------
 * Reads and writes durable per-user preferences (currency, brand affinities,
 * price sensitivity) that seed future recommendation sessions. Falls back to
 * sensible defaults when Supabase isn't configured.
 */

const DEFAULTS: Omit<UserPreferences, "userId"> = {
  preferredCurrency: "GBP",
  brandAffinities: [],
  pricePreference: "balanced",
  notifyOnPriceDrops: false,
  updatedAt: new Date().toISOString()
};

class UserPreferenceServiceImpl {
  async get(userId: string): Promise<UserPreferences> {
    try {
      const supabase = createClient();
      if (!supabase) return { userId, ...DEFAULTS };

      const { data } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (!data) return { userId, ...DEFAULTS };

      return {
        userId,
        preferredCurrency: data.preferred_currency ?? DEFAULTS.preferredCurrency,
        brandAffinities: data.brand_affinities ?? [],
        pricePreference: data.price_preference ?? DEFAULTS.pricePreference,
        notifyOnPriceDrops: data.notify_on_price_drops ?? false,
        updatedAt: data.updated_at ?? DEFAULTS.updatedAt
      };
    } catch {
      return { userId, ...DEFAULTS };
    }
  }

  async update(userId: string, patch: Partial<Omit<UserPreferences, "userId">>): Promise<UserPreferences> {
    const current = await this.get(userId);
    const next: UserPreferences = { ...current, ...patch, updatedAt: new Date().toISOString() };

    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.from("user_preferences").upsert({
          user_id: userId,
          preferred_currency: next.preferredCurrency,
          brand_affinities: next.brandAffinities,
          price_preference: next.pricePreference,
          notify_on_price_drops: next.notifyOnPriceDrops,
          updated_at: next.updatedAt
        });
      }
    } catch {
      // Demo mode: preference is still returned to the caller even if
      // persistence isn't available.
    }

    return next;
  }
}

export const UserPreferenceService = new UserPreferenceServiceImpl();
