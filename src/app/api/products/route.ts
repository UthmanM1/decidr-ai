import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/lib/services/product-service";
import type { ProductCategory } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? undefined;
  const category = (searchParams.get("category") as ProductCategory | null) ?? undefined;
  const ids = searchParams.get("ids");

  if (ids) {
    const products = await ProductService.getByIds(ids.split(","));
    return NextResponse.json({ products });
  }

  const products = await ProductService.search({ query, category: category || undefined });
  return NextResponse.json({ products: products.slice(0, 30) });
}
