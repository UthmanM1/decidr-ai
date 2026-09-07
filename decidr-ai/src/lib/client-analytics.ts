"use client";

import type { AnalyticsEventName } from "./types";

/**
 * Client-side analytics helper. Never awaited by callers and never throws —
 * demo mode and the rest of the UI must not depend on this succeeding.
 * Posts to /api/analytics/track, which delegates to the existing
 * AnalyticsService (in-memory fallback when Supabase isn't configured), so
 * these events still show up in /admin/events during local development.
 */
export function trackClientEvent(
  name: AnalyticsEventName,
  properties: Record<string, unknown> = {},
  sessionId?: string
): void {
  try {
    void fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, properties, sessionId }),
      keepalive: true
    }).catch(() => {
      // Analytics must never interrupt the user-facing flow.
    });
  } catch {
    // Synchronous failure (e.g. fetch unavailable) — safe to ignore.
  }
}
