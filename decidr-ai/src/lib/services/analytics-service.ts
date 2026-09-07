import "server-only";
import type { AnalyticsEvent, AnalyticsEventName, AIUsageRecord } from "../types";
import { generateId } from "../utils";
import { createClient } from "../supabase/server";

/**
 * AnalyticsService
 * -----------------
 * The single place that writes analytics_events and ai_usage rows. UI
 * components and API routes call `AnalyticsService.track(...)` — they never
 * insert into Postgres directly. When Supabase isn't configured, events are
 * appended to an in-memory buffer so the admin dashboard still has demo data
 * to render locally.
 */

const memoryEvents: AnalyticsEvent[] = [];
const memoryAIUsage: AIUsageRecord[] = [];

class AnalyticsServiceImpl {
  async track(
    name: AnalyticsEventName,
    properties: Record<string, unknown> = {},
    userId: string | null = null,
    sessionId?: string
  ): Promise<void> {
    const event: AnalyticsEvent = {
      id: generateId("evt"),
      userId,
      sessionId,
      name,
      properties,
      timestamp: new Date().toISOString()
    };

    memoryEvents.push(event);
    if (memoryEvents.length > 5000) memoryEvents.shift();

    try {
      const supabase = createClient();
      if (!supabase) return;
      await supabase.from("analytics_events").insert({
        id: event.id,
        user_id: event.userId,
        session_id: event.sessionId ?? null,
        name: event.name,
        properties: event.properties,
        created_at: event.timestamp
      });
    } catch {
      // Analytics must never break the primary user flow.
    }
  }

  async recordAIUsage(record: AIUsageRecord): Promise<void> {
    memoryAIUsage.push(record);
    if (memoryAIUsage.length > 5000) memoryAIUsage.shift();

    try {
      const supabase = createClient();
      if (!supabase) return;
      await supabase.from("ai_usage").insert({
        id: record.id,
        feature: record.feature,
        provider: record.provider,
        model: record.model ?? null,
        success: record.success,
        estimated_tokens: record.estimatedTokens,
        estimated_cost_usd: record.estimatedCostUsd,
        latency_ms: record.latencyMs,
        error_message: record.errorMessage ?? null,
        created_at: record.timestamp
      });
    } catch {
      // no-op in demo mode
    }
  }

  /** Used by the admin dashboard when Supabase isn't configured. */
  getMemoryEvents(): AnalyticsEvent[] {
    return memoryEvents;
  }

  getMemoryAIUsage(): AIUsageRecord[] {
    return memoryAIUsage;
  }
}

export const AnalyticsService = new AnalyticsServiceImpl();
