"use client";

import { DEMO_PROGRESS_PHASES, type DemoStage } from "@/lib/demo-engine";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";

export function DemoProgress({ stage }: { stage: DemoStage }) {
  const currentPhaseIndex = DEMO_PROGRESS_PHASES.findIndex((p) => p.stages.includes(stage));

  return (
    <div className="space-y-3">
      {DEMO_PROGRESS_PHASES.map((phase, i) => {
        const isDone = currentPhaseIndex > i || stage === "SHOWING_RESULTS" || stage === "COMPLETE";
        const isActive = i === currentPhaseIndex;
        return (
          <div key={phase.label} className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs",
                isDone
                  ? "border-moss bg-moss text-white"
                  : isActive
                    ? "border-moss text-moss"
                    : "border-line text-slate"
              )}
            >
              {isDone ? <Check size={13} /> : isActive ? <Loader2 size={13} className="animate-spin" /> : i + 1}
            </div>
            <p className={cn("text-sm", isDone || isActive ? "text-ink" : "text-slate")}>{phase.label}</p>
          </div>
        );
      })}
    </div>
  );
}
