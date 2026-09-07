import { describe, it, expect, beforeEach } from "vitest";

describe("extractRequirements — deterministic fallback (no AI configured)", () => {
  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  it("detects category, budget and use cases from free text", async () => {
    const { extractRequirements } = await import("@/lib/services/ai-service");
    const requirement = await extractRequirements(
      "I need a lightweight laptop for university. I study business analytics, use Python and Power BI, and want to stay around £1,000.",
      "sess_1"
    );

    expect(requirement.category).toBe("laptops");
    expect(requirement.budgetMax).toBeGreaterThan(900);
    expect(requirement.mustHaveFeatures).toContain("lightweight");
    expect(requirement.useCases).toContain("python");
    expect(requirement.useCases).toContain("university");
  });

  it("detects a budget expressed as 'under £X'", async () => {
    const { extractRequirements } = await import("@/lib/services/ai-service");
    const requirement = await extractRequirements(
      "Looking for running shoes under £160 for marathon training.",
      "sess_2"
    );
    expect(requirement.category).toBe("running-shoes");
    expect(requirement.budgetMax).toBe(160);
  });

  it("flags missing fields when the category can't be detected", async () => {
    const { extractRequirements } = await import("@/lib/services/ai-service");
    const requirement = await extractRequirements("I want something nice for my home.", "sess_3");
    expect(requirement.category).toBeNull();
    expect(requirement.missingFields).toContain("category");
  });
});

describe("applyClarificationAnswers", () => {
  it("applies a budget-tier answer to set min/max and value preference", async () => {
    const { applyClarificationAnswers, extractRequirements } = await import("@/lib/services/ai-service");
    const requirement = await extractRequirements("I need headphones.", "sess_4");
    const updated = applyClarificationAnswers(requirement, [
      { questionId: "q1", requirementField: "budgetMax", value: "budget" }
    ]);
    expect(updated.valuePreference).toBe("budget");
    expect(updated.budgetMax).toBeDefined();
  });

  it("applies a portability preference answer", async () => {
    const { applyClarificationAnswers, extractRequirements } = await import("@/lib/services/ai-service");
    const requirement = await extractRequirements("I need a laptop.", "sess_5");
    const updated = applyClarificationAnswers(requirement, [
      { questionId: "q1", requirementField: "portabilityPreference", value: "lightweight" }
    ]);
    expect(updated.portabilityPreference).toBe("lightweight");
  });
});
