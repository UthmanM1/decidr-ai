import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MatchRing } from "@/components/ui/match-ring";
import { formatCurrency } from "@/lib/utils";
import type { DemoScoredLaptop } from "@/lib/demo-engine";
import { Star } from "lucide-react";

const badgeLabel = {
  best_overall: "Best overall",
  best_value: "Best value",
  best_performance: "Best performance"
} as const;

const factorLabel: Record<keyof DemoScoredLaptop["breakdown"], string> = {
  budgetFit: "Budget fit",
  performance: "Performance",
  portability: "Portability",
  battery: "Battery",
  gaming: "Gaming suitability"
};

export function DemoRecommendationCard({
  item,
  onSave,
  isSaved,
  onViewMerchant
}: {
  item: DemoScoredLaptop;
  onSave?: (item: DemoScoredLaptop) => void;
  isSaved?: boolean;
  onViewMerchant?: (item: DemoScoredLaptop) => void;
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

          <p className="mt-3 text-sm leading-relaxed text-ink">{item.reason}</p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {item.strengths.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate">Strengths</p>
                <ul className="mt-1 space-y-0.5 text-sm text-ink">
                  {item.strengths.slice(0, 3).map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate">Trade-off</p>
              <p className="mt-1 text-sm text-ink">{item.tradeoff}</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-5 gap-2">
            {(Object.entries(item.breakdown) as [keyof DemoScoredLaptop["breakdown"], number][]).map(
              ([key, value]) => (
                <div key={key}>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-sand">
                    <div className="h-full rounded-full bg-moss" style={{ width: `${value}%` }} />
                  </div>
                  <p className="mt-1 text-[10px] text-slate">{factorLabel[key]}</p>
                </div>
              )
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {onViewMerchant && (
              <Button size="sm" variant="outline" onClick={() => onViewMerchant(item)}>
                View product
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
