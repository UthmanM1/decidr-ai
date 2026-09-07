import { products } from "./products";
import { merchants } from "./merchants";

/**
 * Deterministic (seeded) mock analytics used to populate the admin dashboard
 * with realistic-looking aggregate data for demo purposes. In production this
 * whole module is replaced by SQL aggregation queries against
 * analytics_events / ai_usage / merchant_clicks (see ARCHITECTURE.md).
 */

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export const userGrowth = Array.from({ length: 30 }, (_, i) => {
  const day = 29 - i;
  const base = 4 + i * 2.6;
  return { date: daysAgo(day), users: Math.round(base + rand() * 4) };
});

export const sessionVolume = Array.from({ length: 30 }, (_, i) => {
  const day = 29 - i;
  const base = 12 + i * 3.1;
  return { date: daysAgo(day), sessions: Math.round(base + rand() * 8) };
});

export const recommendationFunnel = [
  { stage: "Session started", value: 1280 },
  { stage: "Requirements extracted", value: 1140 },
  { stage: "Clarification answered", value: 890 },
  { stage: "Recommendation generated", value: 860 },
  { stage: "Product viewed", value: 640 },
  { stage: "Saved or merchant click", value: 310 }
];

export const merchantClicks = merchants.map((m, i) => ({
  merchant: m.name,
  clicks: Math.round(120 - i * 22 + rand() * 30),
  ctr: Number((6 + rand() * 6 - i * 0.7).toFixed(1))
}));

export const popularCategories = Array.from(
  products.reduce((map, p) => {
    map.set(p.category, (map.get(p.category) ?? 0) + Math.round(8 + rand() * 40));
    return map;
  }, new Map<string, number>())
)
  .map(([category, sessions]) => ({ category, sessions }))
  .sort((a, b) => b.sessions - a.sessions);

export const popularProducts = [...products]
  .map((p) => ({ id: p.id, title: p.title, category: p.category, score: Math.round(rand() * 60 + p.rating * 8) }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 8);

export const aiUsageTrend = Array.from({ length: 14 }, (_, i) => {
  const day = 13 - i;
  const requests = Math.round(30 + rand() * 40 + i * 2);
  const failed = Math.round(requests * (0.02 + rand() * 0.03));
  return {
    date: daysAgo(day),
    requests,
    failed,
    costUsd: Number((requests * 0.0009 + rand() * 0.4).toFixed(2))
  };
});

export const aiUsageByFeature = [
  { feature: "requirement_extraction", requests: 640, avgLatencyMs: 820, costUsd: 4.1 },
  { feature: "clarification_generation", requests: 610, avgLatencyMs: 4, costUsd: 0 },
  { feature: "recommendation_explanation", requests: 2140, avgLatencyMs: 960, costUsd: 11.6 },
  { feature: "list_optimization", requests: 95, avgLatencyMs: 1100, costUsd: 0.8 }
];

export const mockUsers = Array.from({ length: 18 }, (_, i) => {
  const signupDaysAgo = Math.round(rand() * 60);
  const sessions = Math.round(rand() * 12) + 1;
  return {
    id: `user_${(i + 1).toString().padStart(3, "0")}`,
    name: [
      "Amelia Clarke",
      "Ben Whitfield",
      "Priya Nair",
      "Tom Okafor",
      "Sofia Marin",
      "Leon Bauer",
      "Grace Lindqvist",
      "Marcus Reid",
      "Hana Suzuki",
      "Owen Fitzgerald",
      "Isabelle Roy",
      "Daniel Petrov",
      "Chloe Bennett",
      "Ravi Chandran",
      "Nora Eriksen",
      "Jack Sullivan",
      "Mei Lin",
      "Ethan Brooks"
    ][i],
    email: `user${i + 1}@example.com`,
    signupDate: daysAgo(signupDaysAgo),
    sessions,
    recommendations: Math.round(sessions * (0.7 + rand() * 0.5)),
    savedProducts: Math.round(rand() * 6),
    merchantClicks: Math.round(rand() * 5),
    lastActive: daysAgo(Math.round(rand() * signupDaysAgo))
  };
});

export const summaryMetrics = {
  totalUsers: 1842,
  activeUsers7d: 396,
  aiSessions: 1280,
  recommendationsGenerated: 3110,
  savedRecommendations: 820,
  merchantClicks: 611,
  accountConversionRate: 0.24,
  estimatedCommercialValueGbp: 18420,
  aiRequests: aiUsageByFeature.reduce((s, f) => s + f.requests, 0),
  estimatedAICostUsd: Number(aiUsageByFeature.reduce((s, f) => s + f.costUsd, 0).toFixed(2))
};
