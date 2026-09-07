import type {
  Product,
  StructuredRequirement,
  ScoredProduct,
  ScoreBreakdown,
  RecommendationResult
} from "../types";
import { ProductService } from "./product-service";
import { generateId, clamp, round } from "../utils";

/**
 * RecommendationService
 * ----------------------
 * A fully deterministic, explainable scoring engine. The LLM is never used to
 * compute scores — only to phrase the natural-language explanation of a score
 * that has already been calculated here. This keeps recommendations
 * reproducible, auditable and free of hallucinated factual claims.
 *
 * Weights are configurable and sum to 1.0 (100%).
 */
export const SCORE_WEIGHTS = {
  budgetFit: 0.2,
  useCaseFit: 0.2,
  requiredFeatures: 0.2,
  preferences: 0.15,
  performance: 0.1,
  value: 0.1,
  rating: 0.05
} as const;

// portability and availability are folded into performance/value/rating in the
// final weighted sum but are still reported individually in the breakdown so
// the UI can explain trade-offs (e.g. "optimised for portability, not raw
// performance").
function scoreBudgetFit(product: Product, req: StructuredRequirement): number {
  const { budgetMin, budgetMax } = req;
  if (!budgetMin && !budgetMax) return 70; // neutral score, no stated budget
  const min = budgetMin ?? 0;
  const max = budgetMax ?? Infinity;

  if (product.price >= min && product.price <= max) {
    // Reward being comfortably inside the budget, not just barely under it.
    if (max === Infinity) return 100;
    const range = max - min || max;
    const distanceFromCeiling = (max - product.price) / range;
    return round(clamp(80 + distanceFromCeiling * 20, 80, 100));
  }

  if (product.price > max) {
    const overBy = (product.price - max) / max;
    return round(clamp(60 - overBy * 200, 0, 59));
  }

  // Under budgetMin - not necessarily bad, but flagged as a value question.
  return round(clamp(75 - ((min - product.price) / (min || 1)) * 20, 40, 75));
}

function scoreCategoryFit(product: Product, req: StructuredRequirement): number {
  if (!req.category) return 60;
  return product.category === req.category ? 100 : 0;
}

function scoreUseCaseFit(product: Product, req: StructuredRequirement): number {
  if (!req.useCases.length) return 70;
  const haystack = `${product.description} ${product.features.join(" ")} ${Object.values(
    product.specifications
  ).join(" ")}`.toLowerCase();

  let matched = 0;
  for (const useCase of req.useCases) {
    const terms = useCase.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
    const hit = terms.some((t) => haystack.includes(t)) || haystack.includes(useCase.toLowerCase());
    if (hit) matched += 1;
  }
  return round((matched / req.useCases.length) * 100);
}

function scoreRequiredFeatures(product: Product, req: StructuredRequirement): number {
  if (!req.mustHaveFeatures.length) return 100;
  const haystack = `${product.features.join(" ")} ${Object.entries(product.specifications)
    .map(([k, v]) => `${k} ${v}`)
    .join(" ")}`.toLowerCase();

  const matched = req.mustHaveFeatures.filter((f) => haystack.includes(f.toLowerCase()));
  return round((matched.length / req.mustHaveFeatures.length) * 100);
}

function scorePreferences(product: Product, req: StructuredRequirement): number {
  const preferredCount = req.preferredFeatures.length;
  const brandPrefCount = req.brandPreferences.length;
  if (!preferredCount && !brandPrefCount) return 75;

  const haystack = product.features.join(" ").toLowerCase();
  let score = 0;
  let weightTotal = 0;

  if (preferredCount) {
    const matched = req.preferredFeatures.filter((f) => haystack.includes(f.toLowerCase()));
    score += (matched.length / preferredCount) * 70;
    weightTotal += 70;
  }
  if (brandPrefCount) {
    const brandMatch = req.brandPreferences.some(
      (b) => b.toLowerCase() === product.brand.toLowerCase()
    );
    score += (brandMatch ? 1 : 0) * 30;
    weightTotal += 30;
  }
  return round((score / (weightTotal || 1)) * 100);
}

function scorePerformance(product: Product, req: StructuredRequirement): number {
  // Heuristic: higher price-within-category correlates with spec tier in this
  // demo catalogue. Combined with an explicit performance preference signal.
  const base = clamp((product.price / 20) % 100, 30, 95);
  if (req.performancePreference === "performance") return round(clamp(base + 10, 0, 100));
  if (req.performancePreference === "efficiency") return round(clamp(100 - base + 40, 0, 100));
  return round(base);
}

function scorePortability(product: Product, req: StructuredRequirement): number {
  const weightSpec = product.specifications["Weight"];
  let base = 70;
  if (weightSpec) {
    const kg = parseFloat(weightSpec);
    if (!Number.isNaN(kg)) {
      // lighter -> higher portability score, tuned for laptop/camera-scale weights
      base = clamp(100 - kg * 30, 20, 100);
    }
  }
  if (req.portabilityPreference === "lightweight") return round(clamp(base + 10, 0, 100));
  if (req.portabilityPreference === "performance") return round(clamp(base - 10, 0, 100));
  return round(base);
}

function scoreValue(product: Product, req: StructuredRequirement): number {
  // Rating per pound relative to category median price, rewarding products
  // that punch above their price bracket.
  const ratingComponent = (product.rating / 5) * 60;
  const priceComponent = clamp(40 - product.price / 100, 0, 40);
  let score = ratingComponent + priceComponent;
  if (req.valuePreference === "premium") score = ratingComponent + clamp(product.price / 100, 0, 40);
  if (req.valuePreference === "budget") score = ratingComponent + priceComponent;
  return round(clamp(score, 0, 100));
}

function scoreRating(product: Product): number {
  return round((product.rating / 5) * 100);
}

function scoreAvailability(product: Product): number {
  switch (product.availability) {
    case "in_stock":
      return 100;
    case "preorder":
      return 60;
    case "low_stock":
      return 50;
    case "out_of_stock":
      return 0;
  }
}

export function scoreProduct(product: Product, req: StructuredRequirement): ScoredProduct {
  const breakdown: ScoreBreakdown = {
    budgetFit: scoreBudgetFit(product, req),
    categoryFit: scoreCategoryFit(product, req),
    useCaseFit: scoreUseCaseFit(product, req),
    requiredFeatures: scoreRequiredFeatures(product, req),
    preferences: scorePreferences(product, req),
    performance: scorePerformance(product, req),
    portability: scorePortability(product, req),
    value: scoreValue(product, req),
    rating: scoreRating(product),
    availability: scoreAvailability(product)
  };

  const weighted =
    breakdown.budgetFit * SCORE_WEIGHTS.budgetFit +
    breakdown.useCaseFit * SCORE_WEIGHTS.useCaseFit +
    breakdown.requiredFeatures * SCORE_WEIGHTS.requiredFeatures +
    breakdown.preferences * SCORE_WEIGHTS.preferences +
    breakdown.performance * SCORE_WEIGHTS.performance +
    breakdown.value * SCORE_WEIGHTS.value +
    breakdown.rating * SCORE_WEIGHTS.rating;

  // Category mismatch and out-of-stock items are hard-penalised regardless of
  // otherwise strong scores, since they are disqualifying in practice.
  let overallScore = weighted;
  if (breakdown.categoryFit === 0) overallScore *= 0.3;
  if (breakdown.availability === 0) overallScore *= 0.5;

  overallScore = round(clamp(overallScore, 0, 100));

  const matchedRequirements: string[] = [];
  const tradeoffs: string[] = [];
  const warnings: string[] = [];
  const reasons: string[] = [];

  if (breakdown.budgetFit >= 80) matchedRequirements.push("Budget");
  else if (breakdown.budgetFit < 50) tradeoffs.push("Priced outside your stated budget");

  if (breakdown.requiredFeatures === 100 && req.mustHaveFeatures.length) {
    matchedRequirements.push("All required features");
  } else if (breakdown.requiredFeatures < 100 && req.mustHaveFeatures.length) {
    warnings.push("Missing one or more required features");
  }

  if (breakdown.useCaseFit >= 70 && req.useCases.length) matchedRequirements.push("Stated use case");
  if (req.portabilityPreference === "lightweight" && breakdown.portability >= 70) {
    matchedRequirements.push("Portable design");
  }
  if (req.portabilityPreference === "performance" && breakdown.portability < 60) {
    tradeoffs.push("Less portable in exchange for higher performance");
  }
  if (breakdown.rating >= 85) matchedRequirements.push("Highly rated by other buyers");
  if (breakdown.value >= 80) reasons.push("Strong rating-to-price value in its category");
  if (breakdown.availability < 100) warnings.push("Limited current availability");
  if (breakdown.categoryFit === 0) warnings.push("Outside the requested product category");

  reasons.push(
    `Scores ${overallScore}% overall against your budget, use case and feature requirements.`
  );

  return {
    product,
    overallScore,
    scoreBreakdown: breakdown,
    matchedRequirements,
    tradeoffs,
    warnings,
    reasons
  };
}

class RecommendationServiceImpl {
  /** Runs the full search -> filter -> score -> rank pipeline for a requirement. */
  async generate(req: StructuredRequirement): Promise<RecommendationResult> {
    const candidates = req.category
      ? await ProductService.listByCategory(req.category)
      : await ProductService.listAll();

    const excluded = new Set(req.excludedFeatures.map((f) => f.toLowerCase()));
    const brandExcluded = new Set(req.brandExclusions.map((b) => b.toLowerCase()));

    const filtered = candidates.filter((p) => {
      if (brandExcluded.has(p.brand.toLowerCase())) return false;
      const haystack = p.features.join(" ").toLowerCase();
      if ([...excluded].some((f) => haystack.includes(f))) return false;
      return true;
    });

    const scored = filtered.map((p) => scoreProduct(p, req)).sort((a, b) => b.overallScore - a.overallScore);

    const top = scored.slice(0, 8);

    if (top.length) {
      top[0].badge = "best_overall";
      const bestValue = [...top].sort((a, b) => b.scoreBreakdown.value - a.scoreBreakdown.value)[0];
      const bestPerformance = [...top].sort(
        (a, b) => b.scoreBreakdown.performance - a.scoreBreakdown.performance
      )[0];
      if (bestValue && bestValue.product.id !== top[0].product.id) bestValue.badge = "best_value";
      if (
        bestPerformance &&
        bestPerformance.product.id !== top[0].product.id &&
        bestPerformance.product.id !== bestValue?.product.id
      ) {
        bestPerformance.badge = "best_performance";
      }
    }

    return {
      id: generateId("rec"),
      sessionId: req.sessionId,
      requirementId: req.id,
      items: top,
      generatedAt: new Date().toISOString(),
      explanationSource: "deterministic_fallback"
    };
  }
}

export const RecommendationService = new RecommendationServiceImpl();
