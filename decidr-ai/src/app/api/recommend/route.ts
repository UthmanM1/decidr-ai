import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { RecommendationService } from "@/lib/services/recommendation-service";
import { explainRecommendation } from "@/lib/services/ai-service";
import { AnalyticsService } from "@/lib/services/analytics-service";
import type { StructuredRequirement } from "@/lib/types";

const bodySchema = z.object({
  requirement: z.custom<StructuredRequirement>((v) => typeof v === "object" && v !== null),
  userId: z.string().nullable().optional()
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { requirement, userId } = parsed.data;
  const result = await RecommendationService.generate(requirement);

  // Attach natural-language explanations for the top few items. Scores and all
  // factual data are already fixed above — explanation only affects phrasing.
  const explained = await Promise.all(
    result.items.slice(0, 5).map(async (item) => {
      const explanation = await explainRecommendation(item, requirement);
      return { ...item, reasons: [explanation, ...item.reasons.slice(1)] };
    })
  );
  result.items = [...explained, ...result.items.slice(5)];

  await AnalyticsService.track(
    "recommendation_generated",
    { count: result.items.length, category: requirement.category },
    userId ?? null,
    requirement.sessionId
  );

  return NextResponse.json({ result });
}
