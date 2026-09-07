import { describe, it, expect } from "vitest";
import { scoreProduct, RecommendationService, SCORE_WEIGHTS } from "@/lib/services/recommendation-service";
import { products } from "@/lib/data/products";
import type { StructuredRequirement } from "@/lib/types";

function baseRequirement(overrides: Partial<StructuredRequirement> = {}): StructuredRequirement {
  return {
    id: "req_test",
    sessionId: "sess_test",
    category: "laptops",
    currency: "GBP",
    useCases: [],
    mustHaveFeatures: [],
    preferredFeatures: [],
    excludedFeatures: [],
    priorities: [],
    constraints: [],
    brandPreferences: [],
    brandExclusions: [],
    rawInput: "",
    confidence: 0.8,
    missingFields: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}

describe("SCORE_WEIGHTS", () => {
  it("sums to 1.0 (100%)", () => {
    const total = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1.0, 5);
  });
});

describe("scoreProduct — budget filtering", () => {
  const laptop = products.find((p) => p.category === "laptops")!;

  it("scores high budget fit when comfortably within budget", () => {
    const req = baseRequirement({ budgetMin: 0, budgetMax: laptop.price * 2 });
    const result = scoreProduct(laptop, req);
    expect(result.scoreBreakdown.budgetFit).toBeGreaterThanOrEqual(80);
  });

  it("penalises products priced well above the budget ceiling", () => {
    const req = baseRequirement({ budgetMin: 0, budgetMax: Math.round(laptop.price * 0.5) });
    const result = scoreProduct(laptop, req);
    expect(result.scoreBreakdown.budgetFit).toBeLessThan(60);
    expect(result.tradeoffs.some((t) => t.toLowerCase().includes("budget"))).toBe(true);
  });

  it("returns a neutral score when no budget is stated", () => {
    const req = baseRequirement({ budgetMin: undefined, budgetMax: undefined });
    const result = scoreProduct(laptop, req);
    expect(result.scoreBreakdown.budgetFit).toBe(70);
  });
});

describe("scoreProduct — feature matching", () => {
  it("gives full marks when all required features are present", () => {
    const laptop = products.find((p) => p.id === "prod_laptops_1")!; // MacBook Air, fanless silent design
    const req = baseRequirement({ mustHaveFeatures: ["fanless"] });
    const result = scoreProduct(laptop, req);
    expect(result.scoreBreakdown.requiredFeatures).toBe(100);
  });

  it("penalises missing required features and adds a warning", () => {
    const laptop = products.find((p) => p.category === "laptops")!;
    const req = baseRequirement({ mustHaveFeatures: ["a feature that does not exist anywhere"] });
    const result = scoreProduct(laptop, req);
    expect(result.scoreBreakdown.requiredFeatures).toBe(0);
    expect(result.warnings.some((w) => w.toLowerCase().includes("missing"))).toBe(true);
  });
});

describe("scoreProduct — category fit", () => {
  it("heavily penalises out-of-category products", () => {
    const headphone = products.find((p) => p.category === "headphones")!;
    const req = baseRequirement({ category: "laptops" });
    const result = scoreProduct(headphone, req);
    expect(result.scoreBreakdown.categoryFit).toBe(0);
    expect(result.overallScore).toBeLessThan(40);
  });
});

describe("RecommendationService.generate — ranking", () => {
  it("returns products sorted by descending overall score", async () => {
    const req = baseRequirement({ category: "running-shoes", budgetMax: 300 });
    const result = await RecommendationService.generate(req);
    const scores = result.items.map((i) => i.overallScore);
    const sorted = [...scores].sort((a, b) => b - a);
    expect(scores).toEqual(sorted);
  });

  it("assigns a best_overall badge to the top result", async () => {
    const req = baseRequirement({ category: "headphones" });
    const result = await RecommendationService.generate(req);
    expect(result.items[0]?.badge).toBe("best_overall");
  });

  it("excludes products matching brand exclusions", async () => {
    const req = baseRequirement({ category: "laptops", brandExclusions: ["Apple"] });
    const result = await RecommendationService.generate(req);
    expect(result.items.every((i) => i.product.brand !== "Apple")).toBe(true);
  });

  it("uses deterministic (non-AI) explanation source by default", async () => {
    const req = baseRequirement({ category: "monitors" });
    const result = await RecommendationService.generate(req);
    expect(result.explanationSource).toBe("deterministic_fallback");
  });
});
