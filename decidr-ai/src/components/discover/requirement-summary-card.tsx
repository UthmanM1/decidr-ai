import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StructuredRequirement } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate">{label}</p>
      <div className="mt-1.5 text-sm text-ink">{children}</div>
    </div>
  );
}

export function RequirementSummaryCard({ requirement }: { requirement: StructuredRequirement }) {
  const budget =
    requirement.budgetMin && requirement.budgetMax
      ? `${formatCurrency(requirement.budgetMin, requirement.currency)} – ${formatCurrency(requirement.budgetMax, requirement.currency)}`
      : requirement.budgetMax
        ? `Up to ${formatCurrency(requirement.budgetMax, requirement.currency)}`
        : "Not specified yet";

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink">What we understood</p>
        <Badge tone={requirement.confidence >= 0.7 ? "moss" : "warning"}>
          {Math.round(requirement.confidence * 100)}% confidence
        </Badge>
      </CardHeader>
      <CardBody className="grid gap-5 sm:grid-cols-2">
        <Field label="Category">
          {requirement.category ? requirement.category.replace("-", " ") : "Not yet identified"}
        </Field>
        <Field label="Budget">{budget}</Field>
        <Field label="Use case">
          {requirement.useCases.length ? (
            <div className="flex flex-wrap gap-1.5">
              {requirement.useCases.map((u) => (
                <Badge key={u}>{u}</Badge>
              ))}
            </div>
          ) : (
            "Not specified yet"
          )}
        </Field>
        <Field label="Required features">
          {requirement.mustHaveFeatures.length ? (
            <div className="flex flex-wrap gap-1.5">
              {requirement.mustHaveFeatures.map((f) => (
                <Badge key={f} tone="moss">
                  {f}
                </Badge>
              ))}
            </div>
          ) : (
            "None stated"
          )}
        </Field>
        <Field label="Preferences">
          {[requirement.portabilityPreference, requirement.performancePreference, requirement.valuePreference]
            .filter(Boolean)
            .join(", ") || "To be refined"}
        </Field>
        <Field label="Constraints">
          {requirement.brandExclusions.length || requirement.excludedFeatures.length
            ? [...requirement.brandExclusions, ...requirement.excludedFeatures].join(", ")
            : "None stated"}
        </Field>
      </CardBody>
    </Card>
  );
}
