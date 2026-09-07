import { describe, it, expect } from "vitest";
import {
  DEMO_STAGES,
  DEMO_STAGE_DURATIONS,
  DEMO_SCORE_WEIGHTS,
  buildDemoRequirement,
  applyDemoClarification,
  generateDemoRecommendations,
  scoreDemoLaptop,
  buildDemoSummary
} from "@/lib/demo-engine";
import { demoLaptops } from "@/lib/data/demo-laptops";

describe("DEMO_SCORE_WEIGHTS", () => {
  it("sums to 1.0 (100%)", () => {
    const total = Object.values(DEMO_SCORE_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1.0, 5);
  });
});

describe("demo laptop catalogue", () => {
  it("has between 8 and 12 laptops as required", () => {
    expect(demoLaptops.length).toBeGreaterThanOrEqual(8);
    expect(demoLaptops.length).toBeLessThanOrEqual(12);
  });

  it("every laptop is a valid Product with the required structured fields", () => {
    for (const l of demoLaptops) {
      expect(l.category).toBe("laptops");
      expect(l.currency).toBe("GBP");
      expect(typeof l.price).toBe("number");
      expect(typeof l.rating).toBe("number");
      expect(l.merchantId).toBeTruthy();
      expect(l.productUrl).toContain("http");
      expect(l.affiliateUrl).toContain("http");
    }
  });
});

describe("buildDemoRequirement", () => {
  it("produces a fully-formed StructuredRequirement for the fixed demo prompt", () => {
    const req = buildDemoRequirement("sess_demo_1");
    expect(req.category).toBe("laptops");
    expect(req.budgetMin).toBe(1000);
    expect(req.budgetMax).toBe(1300);
    expect(req.useCases).toContain("university");
    expect(req.useCases).toContain("software development");
  });
});

describe("applyDemoClarification", () => {
  it("sets portability preference to lightweight after the auto-answered clarification", () => {
    const req = buildDemoRequirement("sess_demo_2");
    const updated = applyDemoClarification(req);
    expect(updated.portabilityPreference).toBe("lightweight");
    expect(updated.priorities.find((p) => p.key === "portability")?.priority).toBe("essential");
  });
});

describe("scoreDemoLaptop — deterministic scoring", () => {
  it("gives a higher budget-fit score to a laptop priced well inside the budget", () => {
    const req = applyDemoClarification(buildDemoRequirement("sess_demo_3"));
    const cheap = demoLaptops.find((l) => l.id === "demo_laptop_zenlight_14")!; // £999
    const expensive = demoLaptops.find((l) => l.id === "demo_laptop_proart_studio")!; // £2199, over budget
    const cheapScore = scoreDemoLaptop(cheap, req);
    const expensiveScore = scoreDemoLaptop(expensive, req);
    expect(cheapScore.breakdown.budgetFit).toBeGreaterThan(expensiveScore.breakdown.budgetFit);
  });

  it("scores are always between 0 and 100", () => {
    const req = applyDemoClarification(buildDemoRequirement("sess_demo_4"));
    for (const l of demoLaptops) {
      const scored = scoreDemoLaptop(l, req);
      expect(scored.overallScore).toBeGreaterThanOrEqual(0);
      expect(scored.overallScore).toBeLessThanOrEqual(100);
    }
  });
});

describe("generateDemoRecommendations", () => {
  it("returns results sorted by descending overall score", () => {
    const req = applyDemoClarification(buildDemoRequirement("sess_demo_5"));
    const items = generateDemoRecommendations(req);
    const scores = items.map((i) => i.overallScore);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("assigns best_overall, best_value and best_performance badges", () => {
    const req = applyDemoClarification(buildDemoRequirement("sess_demo_6"));
    const items = generateDemoRecommendations(req);
    expect(items[0].badge).toBe("best_overall");
    expect(items.some((i) => i.badge === "best_value")).toBe(true);
    expect(items.some((i) => i.badge === "best_performance")).toBe(true);
  });

  it("excludes out-of-stock laptops", () => {
    const req = applyDemoClarification(buildDemoRequirement("sess_demo_7"));
    const items = generateDemoRecommendations(req);
    expect(items.every((i) => i.product.availability !== "out_of_stock")).toBe(true);
  });
});

describe("buildDemoSummary", () => {
  it("produces a non-empty, requirement-grounded summary string", () => {
    const req = applyDemoClarification(buildDemoRequirement("sess_demo_8"));
    const items = generateDemoRecommendations(req);
    const summary = buildDemoSummary(req, items);
    expect(summary.length).toBeGreaterThan(10);
    expect(summary).toContain(items[0].product.title);
  });
});

describe("DEMO_STAGES sequencing", () => {
  it("matches the required state machine order", () => {
    expect(DEMO_STAGES).toEqual([
      "IDLE",
      "ANALYSING_REQUEST",
      "EXTRACTING_REQUIREMENTS",
      "ASKING_CLARIFICATION",
      "SEARCHING_PRODUCTS",
      "SCORING_PRODUCTS",
      "GENERATING_RECOMMENDATION",
      "SHOWING_RESULTS",
      "COMPLETE"
    ]);
  });

  it("total timed duration is roughly 8-10 seconds", () => {
    const total = Object.values(DEMO_STAGE_DURATIONS).reduce((a, b) => a + (b ?? 0), 0);
    expect(total).toBeGreaterThanOrEqual(7000);
    expect(total).toBeLessThanOrEqual(11000);
  });
});
