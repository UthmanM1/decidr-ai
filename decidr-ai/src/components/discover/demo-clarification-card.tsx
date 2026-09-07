"use client";

import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DEMO_CLARIFICATION_QUESTION } from "@/lib/demo-engine";
import { Sparkles } from "lucide-react";

/**
 * Purely presentational — the demo engine drives `selectedValue` over time
 * (undefined → "portability") on its own timer. No local state or effects
 * here, so this component can never desync from the orchestrator.
 */
export function DemoClarificationCard({ selectedValue }: { selectedValue: string | null }) {
  return (
    <Card>
      <CardBody>
        <p className="mb-4 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate">
          <Sparkles size={12} className="text-moss" /> Part of the decision process
        </p>
        <h3 className="text-lg font-medium text-ink">{DEMO_CLARIFICATION_QUESTION.question}</h3>
        <div className="mt-5 grid gap-2.5">
          {DEMO_CLARIFICATION_QUESTION.options.map((opt) => {
            const isSelected = selectedValue === opt.value;
            return (
              <div
                key={opt.value}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors duration-300",
                  isSelected ? "border-moss bg-moss/5 text-ink" : "border-line text-slate"
                )}
              >
                {opt.label}
                {isSelected && <Badge tone="moss">Selected</Badge>}
              </div>
            );
          })}
        </div>
        {!selectedValue && <p className="mt-4 text-xs text-slate">Weighing your stated priorities…</p>}
      </CardBody>
    </Card>
  );
}
