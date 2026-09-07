import type { StructuredRequirement } from "./types";
import { demoLaptops, type DemoLaptop } from "./data/demo-laptops";
import { generateId, round, clamp } from "./utils";

/**
 * Local, deterministic demo engine
 * ----------------------------------
 * Powers the "Try a demo scenario" flow on /discover. It is intentionally
 * 100% local: no fetch calls, no OpenAI, no Supabase, no ProductService — so
 * it can never fail, hang, or be interrupted by an external dependency. It
 * runs entirely inside the browser using a single controlled async
 * orchestrator (see runDemoEngine in discover-flow.tsx) driven by the stage
 * sequence below.
 *
 * This is deliberately separate from RecommendationService (used by the real,
 * API-driven /discover flow for user-typed requests) because the brief asks
 * for a distinct, simpler weighting scheme here. Both remain intact.
 */

export const DEMO_STAGES = [
  "IDLE",
  "ANALYSING_REQUEST",
  "EXTRACTING_REQUIREMENTS",
  "ASKING_CLARIFICATION",
  "SEARCHING_PRODUCTS",
  "SCORING_PRODUCTS",
  "GENERATING_RECOMMENDATION",
  "SHOWING_RESULTS",
  "COMPLETE"
] as const;

export type DemoStage = (typeof DEMO_STAGES)[number];

/** Stage → duration in ms. SHOWING_RESULTS/COMPLETE/IDLE are instantaneous transitions. */
export const DEMO_STAGE_DURATIONS: Partial<Record<DemoStage, number>> = {
  ANALYSING_REQUEST: 1200,
  EXTRACTING_REQUIREMENTS: 1200,
  ASKING_CLARIFICATION: 1800,
  SEARCHING_PRODUCTS: 1600,
  SCORING_PRODUCTS: 1200,
  GENERATING_RECOMMENDATION: 1600
};

/** Maps the fine-grained state machine onto the 5 user-facing progress phases. */
export const DEMO_PROGRESS_PHASES = [
  { label: "Understanding your request", stages: ["ANALYSING_REQUEST", "EXTRACTING_REQUIREMENTS"] as DemoStage[] },
  { label: "Refining your requirements", stages: ["ASKING_CLARIFICATION"] as DemoStage[] },
  { label: "Finding relevant products", stages: ["SEARCHING_PRODUCTS"] as DemoStage[] },
  { label: "Comparing options", stages: ["SCORING_PRODUCTS"] as DemoStage[] },
  { label: "Building your recommendations", stages: ["GENERATING_RECOMMENDATION"] as DemoStage[] }
];

export const DEMO_PROMPT =
  "I need a laptop for university, software development and occasional gaming. My budget is around £1,200 and I want something portable with good battery life.";

export const DEMO_CLARIFICATION_QUESTION = {
  id: "demo_q_priority",
  question: "What matters more to you: maximum performance or portability and battery life?",
  options: [
    { value: "performance", label: "Maximum performance" },
    { value: "portability", label: "Portability and battery life" }
  ]
};

/** The demo always resolves to this answer — a realistic, sensible default. */
export const DEMO_AUTO_ANSWER = "portability";

export function buildDemoRequirement(sessionId: string): StructuredRequirement {
  const now = new Date().toISOString();
  return {
    id: generateId("demo_req"),
    sessionId,
    category: "laptops",
    currency: "GBP",
    budgetMin: 1000,
    budgetMax: 1300,
    useCases: ["university", "software development", "occasional gaming"],
    mustHaveFeatures: [],
    preferredFeatures: ["portable", "good battery life"],
    excludedFeatures: [],
    priorities: [{ key: "portability", label: "Portability & battery life", priority: "important" }],
    constraints: [],
    brandPreferences: [],
    brandExclusions: [],
    portabilityPreference: "balanced",
    rawInput: DEMO_PROMPT,
    confidence: 0.92,
    missingFields: [],
    createdAt: now,
    updatedAt: now
  };
}

/** Applies the auto-selected clarification answer, mirroring applyClarificationAnswers in ai-service. */
export function applyDemoClarification(requirement: StructuredRequirement): StructuredRequirement {
  return {
    ...requirement,
    portabilityPreference: "lightweight",
    performancePreference: "efficiency",
    priorities: [
      ...requirement.priorities.filter((p) => p.key !== "portability"),
      { key: "portability", label: "Portability & battery life", priority: "essential" }
    ],
    updatedAt: new Date().toISOString()
  };
}

// ---------------------------------------------------------------------------
// Deterministic demo scoring: budget 30% / performance 25% / portability 20%
// / battery 15% / gaming suitability 10%
// ---------------------------------------------------------------------------

export const DEMO_SCORE_WEIGHTS = {
  budgetFit: 0.3,
  performance: 0.25,
  portability: 0.2,
  battery: 0.15,
  gaming: 0.1
} as const;

export interface DemoScoreBreakdown {
  budgetFit: number;
  performance: number;
  portability: number;
  battery: number;
  gaming: number;
}

export interface DemoScoredLaptop {
  product: DemoLaptop;
  overallScore: number;
  breakdown: DemoScoreBreakdown;
  strengths: string[];
  tradeoff: string;
  reason: string;
  badge?: "best_overall" | "best_value" | "best_performance";
}

function scoreBudgetFit(price: number, min: number, max: number): number {
  if (price <= max && price >= min) {
    const distanceFromCeiling = (max - price) / (max - min || max);
    return round(clamp(80 + distanceFromCeiling * 20, 80, 100));
  }
  if (price > max) {
    const overBy = (price - max) / max;
    return round(clamp(60 - overBy * 200, 0, 59));
  }
  return round(clamp(85 - ((min - price) / (min || 1)) * 15, 50, 85));
}

export function scoreDemoLaptop(product: DemoLaptop, requirement: StructuredRequirement): DemoScoredLaptop {
  const budgetFit = scoreBudgetFit(product.price, requirement.budgetMin ?? 0, requirement.budgetMax ?? Infinity);
  const breakdown: DemoScoreBreakdown = {
    budgetFit,
    performance: product.performanceScore,
    portability: product.portabilityScore,
    battery: product.batteryScore,
    gaming: product.gamingScore
  };

  const overallScore = round(
    clamp(
      breakdown.budgetFit * DEMO_SCORE_WEIGHTS.budgetFit +
        breakdown.performance * DEMO_SCORE_WEIGHTS.performance +
        breakdown.portability * DEMO_SCORE_WEIGHTS.portability +
        breakdown.battery * DEMO_SCORE_WEIGHTS.battery +
        breakdown.gaming * DEMO_SCORE_WEIGHTS.gaming,
      0,
      100
    )
  );

  const strengths: string[] = [];
  if (breakdown.budgetFit >= 80) strengths.push("Fits comfortably within your £1,000–£1,300 budget");
  if (breakdown.portability >= 80) strengths.push("Lightweight and easy to carry around campus");
  if (breakdown.battery >= 80) strengths.push("Long battery life for a full day of lectures");
  if (breakdown.performance >= 80) strengths.push("Strong performance for development workloads");
  if (breakdown.gaming >= 70) strengths.push("Capable of occasional gaming");

  let tradeoff = "No major trade-offs identified against your stated requirements.";
  if (breakdown.gaming < 40) tradeoff = "Limited gaming capability — fine for casual titles, not demanding ones.";
  if (breakdown.performance < 55) tradeoff = "Lighter on raw performance — best for coursework, not heavy compilation.";
  if (breakdown.portability < 50) tradeoff = "Bulkier and heavier than average — less ideal for carrying daily.";
  if (breakdown.budgetFit < 60) tradeoff = "Priced above your stated budget.";

  const reason = `Scores ${overallScore}% overall: strong on ${
    breakdown.portability >= breakdown.performance ? "portability and battery life" : "performance"
  }, matched against your £1,000–£1,300 budget for university, development and occasional gaming.`;

  return { product, overallScore, breakdown, strengths, tradeoff: tradeoff, reason };
}

export function generateDemoRecommendations(requirement: StructuredRequirement): DemoScoredLaptop[] {
  const scored = demoLaptops
    .filter((l) => l.availability !== "out_of_stock")
    .map((l) => scoreDemoLaptop(l, requirement))
    .sort((a, b) => b.overallScore - a.overallScore);

  const top = scored.slice(0, 6);
  if (top.length) {
    top[0].badge = "best_overall";

    // Best value = strongest score-per-pound among the remaining candidates,
    // not just whoever also happens to have the highest overall score again.
    const remainingForValue = top.filter((i) => i.product.id !== top[0].product.id);
    const bestValue = [...remainingForValue].sort(
      (a, b) => b.overallScore / b.product.price - a.overallScore / a.product.price
    )[0];
    if (bestValue) bestValue.badge = "best_value";

    // Best performance = highest raw performance score among whatever's left,
    // guaranteeing a third distinct pick whenever at least 3 candidates exist.
    const remainingForPerformance = top.filter(
      (i) => i.product.id !== top[0].product.id && i.product.id !== bestValue?.product.id
    );
    const bestPerformance = [...remainingForPerformance].sort(
      (a, b) => b.breakdown.performance - a.breakdown.performance
    )[0];
    if (bestPerformance) bestPerformance.badge = "best_performance";
  }

  return top;
}

export function buildDemoSummary(requirement: StructuredRequirement, items: DemoScoredLaptop[]): string {
  const best = items[0];
  if (!best) {
    return "No laptops matched your requirements closely enough — try loosening your budget.";
  }
  return `Based on a budget of £${requirement.budgetMin?.toLocaleString()}–£${requirement.budgetMax?.toLocaleString()}, university and development use with occasional gaming, and a preference for portability and battery life, ${best.product.title} is the strongest overall match at ${best.overallScore}%.`;
}
