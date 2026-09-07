import type { ScoreBreakdown } from "@/lib/types";

const labels: Record<keyof ScoreBreakdown, string> = {
  budgetFit: "Budget fit",
  categoryFit: "Category fit",
  useCaseFit: "Use case fit",
  requiredFeatures: "Required features",
  preferences: "Preferences",
  performance: "Performance",
  portability: "Portability",
  value: "Value",
  rating: "Rating",
  availability: "Availability"
};

export function ScoreBreakdownChart({ breakdown }: { breakdown: ScoreBreakdown }) {
  const entries = Object.entries(breakdown) as [keyof ScoreBreakdown, number][];

  return (
    <div className="space-y-3">
      {entries.map(([key, value]) => (
        <div key={key}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-slate">{labels[key]}</span>
            <span className="font-medium text-ink">{value}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-sand">
            <div
              className="h-full rounded-full bg-moss"
              style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
