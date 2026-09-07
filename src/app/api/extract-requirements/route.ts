import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { extractRequirements, generateClarificationQuestions } from "@/lib/services/ai-service";
import { AnalyticsService } from "@/lib/services/analytics-service";
import { generateId } from "@/lib/utils";

const bodySchema = z.object({
  rawInput: z.string().min(3).max(2000),
  sessionId: z.string().optional(),
  userId: z.string().nullable().optional()
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { rawInput, userId } = parsed.data;
  const sessionId = parsed.data.sessionId ?? generateId("sess");

  await AnalyticsService.track("session_started", {}, userId ?? null, sessionId);
  await AnalyticsService.track("requirement_submitted", { length: rawInput.length }, userId ?? null, sessionId);

  const requirement = await extractRequirements(rawInput, sessionId);
  await AnalyticsService.track(
    "requirements_extracted",
    { category: requirement.category, confidence: requirement.confidence },
    userId ?? null,
    sessionId
  );

  const questions = await generateClarificationQuestions(requirement);
  await AnalyticsService.track("clarification_started", { count: questions.length }, userId ?? null, sessionId);

  return NextResponse.json({ sessionId, requirement, questions });
}
