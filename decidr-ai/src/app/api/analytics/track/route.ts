import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AnalyticsService } from "@/lib/services/analytics-service";
import type { AnalyticsEventName } from "@/lib/types";

const bodySchema = z.object({
  name: z.string(),
  properties: z.record(z.unknown()).optional(),
  sessionId: z.string().optional(),
  userId: z.string().nullable().optional()
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await AnalyticsService.track(
    parsed.data.name as AnalyticsEventName,
    parsed.data.properties ?? {},
    parsed.data.userId ?? null,
    parsed.data.sessionId
  );

  return NextResponse.json({ ok: true });
}
