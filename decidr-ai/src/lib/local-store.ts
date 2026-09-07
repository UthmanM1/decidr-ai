"use client";

import type { DiscoverySession, RecommendationResult, SavedRecommendation, ShoppingList } from "./types";

/**
 * Demo-mode persistence layer.
 * ------------------------------
 * DECIDR AI's production data model lives in Postgres (see supabase/schema.sql)
 * and is written through the service layer (AnalyticsService,
 * MerchantTrackingService, etc). For this portfolio build, signed-out and
 * demo browsing persists to localStorage so the whole app — sessions, saved
 * recommendations, shopping lists — works with zero external services
 * configured. When Supabase is configured and the user is signed in, the same
 * shapes are written to Postgres instead (see ProfileSync in profile page).
 */

const KEYS = {
  sessions: "decidr.sessions",
  results: "decidr.recommendation_results",
  saved: "decidr.saved_recommendations",
  lists: "decidr.shopping_lists"
} as const;

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — demo mode degrades gracefully.
  }
}

// ---------------------------------------------------------------------------
// Discovery sessions
// ---------------------------------------------------------------------------
export function saveSession(session: DiscoverySession) {
  const all = readJSON<Record<string, DiscoverySession>>(KEYS.sessions, {});
  all[session.id] = session;
  writeJSON(KEYS.sessions, all);
}

export function getSession(id: string): DiscoverySession | null {
  const all = readJSON<Record<string, DiscoverySession>>(KEYS.sessions, {});
  return all[id] ?? null;
}

export function listSessions(): DiscoverySession[] {
  const all = readJSON<Record<string, DiscoverySession>>(KEYS.sessions, {});
  return Object.values(all).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

// ---------------------------------------------------------------------------
// Recommendation results (looked up directly by /recommendations/[id])
// ---------------------------------------------------------------------------
export function saveRecommendationResult(result: RecommendationResult) {
  const all = readJSON<Record<string, RecommendationResult>>(KEYS.results, {});
  all[result.id] = result;
  writeJSON(KEYS.results, all);
}

export function getRecommendationResult(id: string): RecommendationResult | null {
  const all = readJSON<Record<string, RecommendationResult>>(KEYS.results, {});
  return all[id] ?? null;
}

// ---------------------------------------------------------------------------
// Saved recommendations
// ---------------------------------------------------------------------------
export function listSavedRecommendations(): SavedRecommendation[] {
  return readJSON<SavedRecommendation[]>(KEYS.saved, []);
}

export function saveRecommendation(rec: SavedRecommendation) {
  const all = listSavedRecommendations();
  writeJSON(KEYS.saved, [rec, ...all.filter((r) => r.id !== rec.id)]);
}

export function removeSavedRecommendation(id: string) {
  const all = listSavedRecommendations();
  writeJSON(
    KEYS.saved,
    all.filter((r) => r.id !== id)
  );
}

// ---------------------------------------------------------------------------
// Shopping lists
// ---------------------------------------------------------------------------
export function listShoppingLists(): ShoppingList[] {
  return readJSON<ShoppingList[]>(KEYS.lists, []);
}

export function getShoppingList(id: string): ShoppingList | null {
  return listShoppingLists().find((l) => l.id === id) ?? null;
}

export function upsertShoppingList(list: ShoppingList) {
  const all = listShoppingLists();
  writeJSON(
    KEYS.lists,
    [list, ...all.filter((l) => l.id !== list.id)].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    )
  );
}

export function deleteShoppingList(id: string) {
  writeJSON(
    KEYS.lists,
    listShoppingLists().filter((l) => l.id !== id)
  );
}
