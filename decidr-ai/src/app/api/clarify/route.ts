import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { applyClarificationAnswers } from "@/lib/services/ai-service";
import { AnalyticsService } from "@/lib/services/analytics-service";
import type { StructuredRequirement } from "@/lib/types";

const answerSchema = z.object({
  questionId: z.string(),
  requirementField: z.string(),
  value: z.union([z.string(), z.array(z.string())])
});

const bodySchema = z.object({
  requirement: z.custom<StructuredRequirement>((v) => typeof v === "object" && v !== null),
  answers: z.array(answerSchema),
  userId: z.string().nullable().optional()
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { requirement, answers, userId } = parsed.data;
  const updated = applyClarificationAnswers(requirement, answers);

  await AnalyticsService.track(
    "clarification_answered",
    { answeredFields: answers.map((a) => a.requirementField) },
    userId ?? null,
    requirement.sessionId
  );

  return NextResponse.json({ requirement: updated });
}
