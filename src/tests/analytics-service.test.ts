import { describe, it, expect, beforeEach } from "vitest";

describe("AnalyticsService.track", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it("appends a well-formed event to the in-memory buffer", async () => {
    const { AnalyticsService } = await import("@/lib/services/analytics-service");
    const before = AnalyticsService.getMemoryEvents().length;

    await AnalyticsService.track("product_viewed", { productId: "prod_laptops_1" }, "user_1", "sess_1");

    const events = AnalyticsService.getMemoryEvents();
    expect(events.length).toBe(before + 1);
    const last = events[events.length - 1];
    expect(last.name).toBe("product_viewed");
    expect(last.userId).toBe("user_1");
    expect(last.sessionId).toBe("sess_1");
    expect(last.properties.productId).toBe("prod_laptops_1");
    expect(typeof last.timestamp).toBe("string");
  });

  it("records AI usage entries with cost and latency fields", async () => {
    const { AnalyticsService } = await import("@/lib/services/analytics-service");
    const before = AnalyticsService.getMemoryAIUsage().length;

    await AnalyticsService.recordAIUsage({
      id: "ai_test_1",
      feature: "requirement_extraction",
      provider: "deterministic_fallback",
      success: true,
      estimatedTokens: 0,
      estimatedCostUsd: 0,
      latencyMs: 12,
      timestamp: new Date().toISOString()
    });

    const usage = AnalyticsService.getMemoryAIUsage();
    expect(usage.length).toBe(before + 1);
    expect(usage[usage.length - 1].feature).toBe("requirement_extraction");
  });
});
