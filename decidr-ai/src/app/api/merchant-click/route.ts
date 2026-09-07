import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MerchantTrackingService } from "@/lib/services/merchant-tracking-service";

const bodySchema = z.object({
  productId: z.string(),
  sessionId: z.string(),
  recommendationId: z.string().optional(),
  source: z.enum(["recommendation_card", "product_detail", "comparison", "list"]),
  userId: z.string().nullable().optional()
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const result = await MerchantTrackingService.recordClickAndGetRedirect({
    userId: parsed.data.userId ?? null,
    sessionId: parsed.data.sessionId,
    recommendationId: parsed.data.recommendationId,
    productId: parsed.data.productId,
    source: parsed.data.source
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
