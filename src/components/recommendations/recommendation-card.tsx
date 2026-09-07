import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MatchRing } from "@/components/ui/match-ring";
import { formatCurrency } from "@/lib/utils";
import type { ScoredProduct } from "@/lib/types";
import { Star } from "lucide-react";

const badgeLabel = {
  best_overall: "Best overall",
  best_value: "Best value",
  best_performance: "Best performance"
} as const;

export function RecommendationCard({
  item,
  recommendationId,
  onSave,
  onCompareToggle,
  isSaved,
  isComparing
}: {
  item: ScoredProduct;
  recommendationId: string;
  onSave?: (item: ScoredProduct) => void;
  onCompareToggle?: (item: ScoredProduct) => void;
  isSaved?: boolean;
  isComparing?: boolean;
}) {
  const { product } = item;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 p-5 sm:flex-row">
        <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-lg bg-sand sm:h-28 sm:w-28">
          <Image src={product.image} alt={product.title} fill sizes="160px" className="object-cover" />
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              {item.badge && <Badge tone="moss">{badgeLabel[item.badge]}</Badge>}
              <h3 className="mt-1.5 text-base font-medium text-ink">{product.title}</h3>
              <p className="text-sm text-slate">{product.brand}</p>
            </div>
            <MatchRing score={item.overallScore} />
          </div>

          <div className="mt-2 flex items-center gap-4 text-sm text-ink">
            <span className="font-medium">{formatCurrency(product.price, product.currency)}</span>
            <span className="flex items-center gap-1 text-slate">
              <Star size={13} className="fill-clay text-clay" /> {product.rating} ({product.reviewCount})
            </span>
          </div>

          {item.reasons[0] && <p className="mt-3 text-sm leading-relaxed text-ink">{item.reasons[0]}</p>}

          {(item.matchedRequirements.length > 0 || item.tradeoffs.length > 0) && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {item.matchedRequirements.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate">Strong match for</p>
                  <ul className="mt-1 space-y-0.5 text-sm text-ink">
                    {item.matchedRequirements.slice(0, 3).map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}
              {item.tradeoffs.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate">Trade-off</p>
                  <ul className="mt-1 space-y-0.5 text-sm text-ink">
                    {item.tradeoffs.slice(0, 2).map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/recommendations/${recommendationId}?product=${product.id}`}>
              <Button size="sm" variant="outline">
                View details
              </Button>
            </Link>
            {onCompareToggle && (
              <Button size="sm" variant={isComparing ? "primary" : "outline"} onClick={() => onCompareToggle(item)}>
                {isComparing ? "Added to compare" : "Compare"}
              </Button>
            )}
            {onSave && (
              <Button size="sm" variant={isSaved ? "primary" : "ghost"} onClick={() => onSave(item)}>
                {isSaved ? "Saved" : "Save"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
