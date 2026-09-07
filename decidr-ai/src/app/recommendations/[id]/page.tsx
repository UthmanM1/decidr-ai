"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MatchRing } from "@/components/ui/match-ring";
import { ScoreBreakdownChart } from "@/components/recommendations/score-breakdown-chart";
import { getRecommendationResult, saveRecommendation, listSavedRecommendations } from "@/lib/local-store";
import { formatCurrency, generateId } from "@/lib/utils";
import type { RecommendationResult, ScoredProduct } from "@/lib/types";
import { Star } from "lucide-react";

export default function RecommendationDetailPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const productId = searchParams.get("product");
  const [result, setResult] = useState<RecommendationResult | null | undefined>(undefined);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    setResult(getRecommendationResult(params.id));
  }, [params.id]);

  if (result === undefined) {
    return <div className="mx-auto max-w-3xl px-6 py-16 text-sm text-slate">Loading…</div>;
  }

  if (result === null) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-2xl text-ink">Recommendation not found</h1>
        <p className="mt-2 text-sm text-slate">
          This recommendation isn't in your browser's saved history.
        </p>
      </div>
    );
  }

  const item: ScoredProduct | undefined = productId
    ? result.items.find((i) => i.product.id === productId)
    : result.items[0];

  if (!item) {
    return <div className="mx-auto max-w-3xl px-6 py-16 text-sm text-slate">Product not found in this recommendation.</div>;
  }

  const { product } = item;

  async function handleViewMerchant() {
    setRedirecting(true);
    try {
      const res = await fetch("/api/merchant-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          sessionId: result!.sessionId,
          recommendationId: result!.id,
          source: "product_detail"
        })
      });
      const data = await res.json();
      if (data.redirectUrl) window.location.href = data.redirectUrl;
    } finally {
      setRedirecting(false);
    }
  }

  function handleSave() {
    const existing = listSavedRecommendations().find((r) => r.sessionId === result!.sessionId);
    saveRecommendation({
      id: existing?.id ?? generateId("saved"),
      userId: "demo-user",
      sessionId: result!.sessionId,
      name: `${product.category.replace("-", " ")} shortlist`,
      category: product.category,
      productIds: Array.from(new Set([...(existing?.productIds ?? []), product.id])),
      status: "saved",
      createdAt: existing?.createdAt ?? new Date().toISOString()
    });
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 md:py-16">
      <div className="grid gap-8 md:grid-cols-[1fr_1.2fr]">
        <div>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card bg-sand">
            <Image src={product.image} alt={product.title} fill className="object-cover" />
          </div>
          <p className="mt-3 text-xs text-slate">Demo product imagery — not the actual retail photo.</p>
        </div>

        <div>
          {item.badge && <Badge tone="moss">{item.badge.replace("_", " ")}</Badge>}
          <h1 className="mt-2 font-display text-2xl tracking-tight text-ink">{product.title}</h1>
          <p className="text-sm text-slate">{product.brand}</p>

          <div className="mt-4 flex items-center gap-5">
            <span className="text-2xl font-medium text-ink">{formatCurrency(product.price, product.currency)}</span>
            <span className="flex items-center gap-1 text-sm text-slate">
              <Star size={14} className="fill-clay text-clay" /> {product.rating} ({product.reviewCount} reviews)
            </span>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-ink">{product.description}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={handleViewMerchant} disabled={redirecting}>
              {redirecting ? "Redirecting…" : "View at merchant"}
            </Button>
            <Button variant="outline" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <Card>
          <CardBody>
            <div className="mb-4 flex items-center gap-3">
              <MatchRing score={item.overallScore} />
              <div>
                <p className="text-sm font-medium text-ink">Why Decidr recommended it</p>
                <p className="text-xs text-slate">Deterministic scoring engine, explained in plain language</p>
              </div>
            </div>
            {item.reasons.map((r) => (
              <p key={r} className="mb-2 text-sm text-ink">
                {r}
              </p>
            ))}
            {item.matchedRequirements.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate">Matched requirements</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {item.matchedRequirements.map((m) => (
                    <Badge key={m} tone="moss">
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {item.tradeoffs.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate">Trade-offs</p>
                <ul className="mt-1.5 list-inside list-disc text-sm text-ink">
                  {item.tradeoffs.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
            {item.warnings.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate">Potential concerns</p>
                <ul className="mt-1.5 list-inside list-disc text-sm text-ink">
                  {item.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="mb-4 text-sm font-medium text-ink">Score breakdown</p>
            <ScoreBreakdownChart breakdown={item.scoreBreakdown} />
          </CardBody>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardBody>
            <p className="mb-4 text-sm font-medium text-ink">Specifications</p>
            <dl className="grid gap-3 sm:grid-cols-2">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b border-line pb-2 text-sm">
                  <dt className="text-slate">{key}</dt>
                  <dd className="text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mb-2 mt-6 text-sm font-medium text-ink">Features</p>
            <div className="flex flex-wrap gap-1.5">
              {product.features.map((f) => (
                <Badge key={f}>{f}</Badge>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
