import "server-only";
import type {
  StructuredRequirement,
  ClarificationQuestion,
  ClarificationAnswer,
  ScoredProduct,
  AIFeature,
  ProductCategory
} from "../types";
import { generateId } from "../utils";
import { AnalyticsService } from "./analytics-service";

/**
 * AIService
 * ----------
 * The ONLY module allowed to call an LLM provider. It never invents factual
 * product data (price, specs, availability, urls) — those always come from
 * ProductService. The LLM is used purely to:
 *   1. Interpret free-text requirements into the structured requirement shape
 *   2. Generate clarification questions for missing/ambiguous fields
 *   3. Explain an already-computed recommendation in natural language
 *   4. Suggest which already-retrieved products belong in an optimised list
 *
 * If OPENAI_API_KEY is not configured, or a request fails, every method here
 * falls back to a deterministic, rule-based implementation so the app keeps
 * working end-to-end in demo mode. The provider abstraction (`callModel`)
 * is intentionally thin so a different LLM provider can be swapped in later.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export function isAIAvailable(): boolean {
  return Boolean(OPENAI_API_KEY);
}

interface CallModelResult {
  content: string;
  estimatedTokens: number;
}

async function callModel(systemPrompt: string, userPrompt: string): Promise<CallModelResult> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status}`);
  }

  const data = await response.json();
  const content: string = data.choices?.[0]?.message?.content ?? "{}";
  const estimatedTokens: number = data.usage?.total_tokens ?? Math.ceil(content.length / 4);
  return { content, estimatedTokens };
}

async function withUsageTracking<T>(
  feature: AIFeature,
  fn: () => Promise<{ result: T; provider: "openai" | "deterministic_fallback"; tokens: number }>
): Promise<T> {
  const start = Date.now();
  await AnalyticsService.track("ai_request_started", { feature });
  try {
    const { result, provider, tokens } = await fn();
    const latencyMs = Date.now() - start;
    await AnalyticsService.recordAIUsage({
      id: generateId("ai"),
      feature,
      provider,
      model: provider === "openai" ? OPENAI_MODEL : undefined,
      success: true,
      estimatedTokens: tokens,
      // Rough gpt-4o-mini-class blended rate for demo cost estimation only.
      estimatedCostUsd: provider === "openai" ? Number(((tokens / 1000) * 0.0006).toFixed(5)) : 0,
      latencyMs,
      timestamp: new Date().toISOString()
    });
    await AnalyticsService.track("ai_request_completed", { feature, provider, latencyMs });
    return result;
  } catch (err) {
    const latencyMs = Date.now() - start;
    await AnalyticsService.recordAIUsage({
      id: generateId("ai"),
      feature,
      provider: "deterministic_fallback",
      success: false,
      estimatedTokens: 0,
      estimatedCostUsd: 0,
      latencyMs,
      errorMessage: err instanceof Error ? err.message : "unknown error",
      timestamp: new Date().toISOString()
    });
    await AnalyticsService.track("ai_request_failed", {
      feature,
      error: err instanceof Error ? err.message : "unknown error"
    });
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 1. Requirement extraction
// ---------------------------------------------------------------------------

const CATEGORY_KEYWORDS: Record<ProductCategory, string[]> = {
  laptops: ["laptop", "macbook", "notebook", "ultrabook"],
  headphones: ["headphone", "earbud", "earphone", "anc"],
  smartphones: ["phone", "smartphone", "iphone", "android"],
  monitors: ["monitor", "display", "screen"],
  cameras: ["camera", "mirrorless", "dslr", "vlogging"],
  "running-shoes": ["running shoe", "trainer", "marathon", "shoes"],
  "office-chairs": ["office chair", "desk chair", "ergonomic chair"],
  "coffee-machines": ["coffee machine", "espresso", "coffee maker"],
  "robot-vacuums": ["robot vacuum", "roomba", "vacuum robot"],
  "air-purifiers": ["air purifier", "hepa"]
};

function detectCategory(text: string): ProductCategory | null {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [
    ProductCategory,
    string[]
  ][]) {
    if (keywords.some((k) => lower.includes(k))) return category;
  }
  return null;
}

function extractBudget(text: string): { budgetMin?: number; budgetMax?: number } {
  const under = text.match(/(?:under|below|less than|around|about)\s*£?\$?(\d[\d,]*)/i);
  const between = text.match(/£?\$?(\d[\d,]*)\s*(?:-|to)\s*£?\$?(\d[\d,]*)/i);
  if (between) {
    return {
      budgetMin: Number(between[1].replace(/,/g, "")),
      budgetMax: Number(between[2].replace(/,/g, ""))
    };
  }
  if (under) {
    return { budgetMax: Number(under[1].replace(/,/g, "")) };
  }
  const single = text.match(/£\s?(\d[\d,]*)/);
  if (single) {
    const value = Number(single[1].replace(/,/g, ""));
    return { budgetMin: Math.round(value * 0.85), budgetMax: Math.round(value * 1.1) };
  }
  return {};
}

function deterministicExtraction(rawInput: string, sessionId: string): StructuredRequirement {
  const category = detectCategory(rawInput);
  const { budgetMin, budgetMax } = extractBudget(rawInput);

  const useCases: string[] = [];
  const lower = rawInput.toLowerCase();
  const useCaseKeywords = [
    "university",
    "study",
    "school",
    "python",
    "power bi",
    "programming",
    "gaming",
    "video editing",
    "photo editing",
    "travel",
    "commute",
    "gym",
    "office",
    "work from home",
    "marathon",
    "training",
    "streaming",
    "music production"
  ];
  for (const kw of useCaseKeywords) {
    if (lower.includes(kw)) useCases.push(kw);
  }

  const mustHaveFeatures: string[] = [];
  if (lower.includes("lightweight") || lower.includes("light weight")) mustHaveFeatures.push("lightweight");
  if (lower.includes("noise cancel")) mustHaveFeatures.push("noise cancelling");
  if (lower.includes("waterproof")) mustHaveFeatures.push("waterproof");
  if (lower.includes("long battery") || lower.includes("battery life")) mustHaveFeatures.push("battery life");

  const missingFields: string[] = [];
  if (!category) missingFields.push("category");
  if (!budgetMin && !budgetMax) missingFields.push("budget");
  if (!useCases.length) missingFields.push("useCases");
  missingFields.push("priorities");

  const now = new Date().toISOString();
  return {
    id: generateId("req"),
    sessionId,
    category,
    budgetMin,
    budgetMax,
    currency: "GBP",
    useCases,
    mustHaveFeatures,
    preferredFeatures: [],
    excludedFeatures: [],
    priorities: [],
    constraints: [],
    brandPreferences: [],
    brandExclusions: [],
    rawInput,
    confidence: category ? 0.75 : 0.4,
    missingFields,
    createdAt: now,
    updatedAt: now
  };
}

export async function extractRequirements(
  rawInput: string,
  sessionId: string
): Promise<StructuredRequirement> {
  if (!isAIAvailable()) {
    return deterministicExtraction(rawInput, sessionId);
  }

  try {
    return await withUsageTracking("requirement_extraction", async () => {
      const { content, estimatedTokens } = await callModel(
        `You extract structured purchase requirements from a user's free text description.
         Only extract what the user actually said or clearly implied. Never invent product
         names, prices, or brands that were not mentioned. Respond as strict JSON matching:
         { "category": string|null, "budgetMin": number|null, "budgetMax": number|null,
           "useCases": string[], "mustHaveFeatures": string[], "preferredFeatures": string[],
           "brandPreferences": string[], "brandExclusions": string[] }`,
        rawInput
      );
      const parsed = JSON.parse(content);
      const fallback = deterministicExtraction(rawInput, sessionId);
      const merged: StructuredRequirement = {
        ...fallback,
        category: parsed.category ?? fallback.category,
        budgetMin: parsed.budgetMin ?? fallback.budgetMin,
        budgetMax: parsed.budgetMax ?? fallback.budgetMax,
        useCases: parsed.useCases?.length ? parsed.useCases : fallback.useCases,
        mustHaveFeatures: parsed.mustHaveFeatures?.length
          ? parsed.mustHaveFeatures
          : fallback.mustHaveFeatures,
        preferredFeatures: parsed.preferredFeatures ?? [],
        brandPreferences: parsed.brandPreferences ?? [],
        brandExclusions: parsed.brandExclusions ?? [],
        confidence: 0.9
      };
      return { result: merged, provider: "openai" as const, tokens: estimatedTokens };
    });
  } catch {
    return deterministicExtraction(rawInput, sessionId);
  }
}

// ---------------------------------------------------------------------------
// 2. Clarification question generation
// ---------------------------------------------------------------------------

function deterministicClarification(req: StructuredRequirement): ClarificationQuestion[] {
  const questions: ClarificationQuestion[] = [];

  if (req.missingFields.includes("budget")) {
    questions.push({
      id: generateId("q"),
      requirementField: "budgetMax",
      question: "What's your approximate budget?",
      type: "single_select",
      options: [
        { value: "budget", label: "Keep it affordable" },
        { value: "mid", label: "Mid-range" },
        { value: "premium", label: "Premium, price is secondary" }
      ]
    });
  }

  questions.push({
    id: generateId("q"),
    requirementField: "portabilityPreference",
    question: "Would you prioritise lower weight or higher performance?",
    type: "single_select",
    options: [
      { value: "performance", label: "Performance" },
      { value: "balanced", label: "Balanced" },
      { value: "lightweight", label: "Lightweight" }
    ]
  });

  questions.push({
    id: generateId("q"),
    requirementField: "priorities",
    question: "How important is battery life / long-term durability?",
    type: "single_select",
    options: [
      { value: "essential", label: "Essential" },
      { value: "important", label: "Important" },
      { value: "nice_to_have", label: "Nice to have" }
    ]
  });

  if (req.missingFields.includes("useCases")) {
    questions.push({
      id: generateId("q"),
      requirementField: "useCases",
      question: "What will you mainly use it for?",
      type: "text"
    });
  }

  return questions.slice(0, 4);
}

export async function generateClarificationQuestions(
  req: StructuredRequirement
): Promise<ClarificationQuestion[]> {
  // Clarification question *shape* is deterministic and template-driven so the
  // UI contract (single_select vs text, option lists) stays stable; this keeps
  // the experience reliable even though an LLM could phrase these differently.
  return deterministicClarification(req);
}

export function applyClarificationAnswers(
  req: StructuredRequirement,
  answers: ClarificationAnswer[]
): StructuredRequirement {
  const updated: StructuredRequirement = { ...req, updatedAt: new Date().toISOString() };

  for (const answer of answers) {
    switch (answer.requirementField) {
      case "budgetMax": {
        const value = String(answer.value);
        if (value === "budget") {
          updated.budgetMin = updated.budgetMin ?? 0;
          updated.budgetMax = updated.budgetMax ?? 300;
          updated.valuePreference = "budget";
        } else if (value === "mid") {
          updated.valuePreference = "balanced";
        } else if (value === "premium") {
          updated.valuePreference = "premium";
          updated.budgetMax = undefined;
        }
        break;
      }
      case "portabilityPreference":
        updated.portabilityPreference = answer.value as StructuredRequirement["portabilityPreference"];
        if (answer.value === "performance") updated.performancePreference = "performance";
        break;
      case "priorities": {
        const priority = String(answer.value) as "essential" | "important" | "nice_to_have";
        updated.priorities = [
          ...updated.priorities.filter((p) => p.key !== "battery_life"),
          { key: "battery_life", label: "Battery life / durability", priority }
        ];
        if (priority === "essential") {
          updated.mustHaveFeatures = Array.from(new Set([...updated.mustHaveFeatures, "battery life"]));
        }
        break;
      }
      case "useCases": {
        const raw = Array.isArray(answer.value) ? answer.value.join(" ") : answer.value;
        updated.useCases = Array.from(new Set([...updated.useCases, ...raw.split(/,\s*/)]));
        break;
      }
      default:
        break;
    }
  }

  updated.missingFields = updated.missingFields.filter(
    (f) => !answers.some((a) => a.requirementField === f)
  );

  return updated;
}

// ---------------------------------------------------------------------------
// 3. Recommendation explanation (phrasing only — scores are already computed)
// ---------------------------------------------------------------------------

function deterministicExplanation(item: ScoredProduct): string {
  const strengths = item.matchedRequirements.slice(0, 3).join(", ") || "your stated requirements";
  const tradeoff = item.tradeoffs[0];
  let text = `${item.product.title} scores ${item.overallScore}% against your requirements, matching on ${strengths}.`;
  if (tradeoff) text += ` Trade-off: ${tradeoff.toLowerCase()}.`;
  return text;
}

export async function explainRecommendation(
  item: ScoredProduct,
  requirement: StructuredRequirement
): Promise<string> {
  if (!isAIAvailable()) return deterministicExplanation(item);

  try {
    return await withUsageTracking("recommendation_explanation", async () => {
      const { content, estimatedTokens } = await callModel(
        `You explain why an already-ranked product recommendation fits a user's requirements.
         You are given the ONLY factual data you may reference — do not add specs, prices or
         claims not present in the input. Keep it to 2 short sentences, plain language.
         Respond as JSON: { "explanation": string }`,
        JSON.stringify({
          product: {
            title: item.product.title,
            price: item.product.price,
            features: item.product.features
          },
          score: item.overallScore,
          matchedRequirements: item.matchedRequirements,
          tradeoffs: item.tradeoffs,
          requirement: {
            useCases: requirement.useCases,
            budgetMax: requirement.budgetMax
          }
        })
      );
      const parsed = JSON.parse(content);
      return {
        result: parsed.explanation ?? deterministicExplanation(item),
        provider: "openai" as const,
        tokens: estimatedTokens
      };
    });
  } catch {
    return deterministicExplanation(item);
  }
}

// ---------------------------------------------------------------------------
// 4. Shopping list optimisation (selects from existing candidates only)
// ---------------------------------------------------------------------------

export interface ListOptimizationInput {
  instruction: string;
  currentItems: { id: string; title: string; price: number; category: string }[];
  candidateAlternatives: { id: string; title: string; price: number; category: string }[];
  budget?: number;
}

export interface ListOptimizationSuggestion {
  action: "keep" | "swap" | "remove";
  itemId: string;
  replacementId?: string;
  reason: string;
}

function deterministicListOptimization(input: ListOptimizationInput): ListOptimizationSuggestion[] {
  const suggestions: ListOptimizationSuggestion[] = [];
  const total = input.currentItems.reduce((sum, i) => sum + i.price, 0);
  const budget = input.budget ?? Infinity;

  if (total <= budget) {
    for (const item of input.currentItems) {
      suggestions.push({ action: "keep", itemId: item.id, reason: "Within budget as-is" });
    }
    return suggestions;
  }

  // Over budget: sort by price descending, try to swap for a cheaper
  // in-category alternative from real candidates before recommending removal.
  const sorted = [...input.currentItems].sort((a, b) => b.price - a.price);
  let runningTotal = total;

  for (const item of sorted) {
    if (runningTotal <= budget) {
      suggestions.push({ action: "keep", itemId: item.id, reason: "Within budget" });
      continue;
    }
    const cheaperAlt = input.candidateAlternatives
      .filter((c) => c.category === item.category && c.price < item.price)
      .sort((a, b) => a.price - b.price)[0];

    if (cheaperAlt) {
      runningTotal = runningTotal - item.price + cheaperAlt.price;
      suggestions.push({
        action: "swap",
        itemId: item.id,
        replacementId: cheaperAlt.id,
        reason: `Swapped for a lower-priced alternative in the same category to help fit "${input.instruction}"`
      });
    } else {
      runningTotal -= item.price;
      suggestions.push({
        action: "remove",
        itemId: item.id,
        reason: `No cheaper in-category alternative found — removing to help fit "${input.instruction}"`
      });
    }
  }

  return suggestions;
}

export async function optimizeShoppingList(
  input: ListOptimizationInput
): Promise<ListOptimizationSuggestion[]> {
  // The optimisation always selects from `candidateAlternatives`, which are
  // real products from ProductService — the AI (or fallback heuristic) never
  // invents a replacement product.
  if (!isAIAvailable()) return deterministicListOptimization(input);

  try {
    return await withUsageTracking("list_optimization", async () => {
      const { content, estimatedTokens } = await callModel(
        `You optimise a shopping list against a budget instruction. You may only choose
         replacement items from "candidateAlternatives" — never invent a product. Respond as
         JSON: { "suggestions": [{ "action": "keep"|"swap"|"remove", "itemId": string,
         "replacementId": string|null, "reason": string }] }`,
        JSON.stringify(input)
      );
      const parsed = JSON.parse(content);
      const valid = new Set(input.candidateAlternatives.map((c) => c.id));
      const suggestions: ListOptimizationSuggestion[] = (parsed.suggestions ?? [])
        .filter((s: ListOptimizationSuggestion) => !s.replacementId || valid.has(s.replacementId))
        .map((s: ListOptimizationSuggestion) => ({ ...s }));
      return {
        result: suggestions.length ? suggestions : deterministicListOptimization(input),
        provider: "openai" as const,
        tokens: estimatedTokens
      };
    });
  } catch {
    return deterministicListOptimization(input);
  }
}
