import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { optimizeShoppingList } from "@/lib/services/ai-service";
import { ProductService } from "@/lib/services/product-service";
import { AnalyticsService } from "@/lib/services/analytics-service";

const bodySchema = z.object({
  instruction: z.string().min(2).max(500),
  productIds: z.array(z.string()).min(1),
  budget: z.number().positive().optional(),
  userId: z.string().nullable().optional(),
  listId: z.string().optional()
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { instruction, productIds, budget, userId, listId } = parsed.data;

  const currentProducts = await ProductService.getByIds(productIds);
  if (!currentProducts.length) {
    return NextResponse.json({ error: "No matching products found" }, { status: 404 });
  }

  const categories = Array.from(new Set(currentProducts.map((p) => p.category)));
  const candidatePools = await Promise.all(categories.map((c) => ProductService.listByCategory(c)));
  const candidateAlternatives = candidatePools
    .flat()
    .filter((p) => !productIds.includes(p.id))
    .map((p) => ({ id: p.id, title: p.title, price: p.price, category: p.category }));

  const suggestions = await optimizeShoppingList({
    instruction,
    budget,
    currentItems: currentProducts.map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      category: p.category
    })),
    candidateAlternatives
  });

  await AnalyticsService.track(
    "product_added_to_list",
    { optimization: true, instruction },
    userId ?? null,
    listId
  );

  // Resolve full product objects for any suggested replacements so the client
  // never has to guess product details.
  const replacementIds = suggestions.map((s) => s.replacementId).filter(Boolean) as string[];
  const replacements = await ProductService.getByIds(replacementIds);

  return NextResponse.json({ suggestions, replacements });
}
