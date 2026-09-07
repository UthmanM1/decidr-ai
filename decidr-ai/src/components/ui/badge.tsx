import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type Tone = "neutral" | "moss" | "clay" | "warning";

const toneStyles: Record<Tone, string> = {
  neutral: "bg-sand text-ink",
  moss: "bg-moss/10 text-moss",
  clay: "bg-clay/10 text-clay",
  warning: "bg-amber-100 text-amber-800"
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        toneStyles[tone],
        className
      )}
      {...props}
    />
  );
}
