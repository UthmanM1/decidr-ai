import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StructuredRequirement } from "@/lib/types";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate">{label}</p>
      <p className="mt-1 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

export function DemoRequirementCard({ requirement }: { requirement: StructuredRequirement }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink">Understanding your requirements</p>
        <Badge tone="moss">{Math.round(requirement.confidence * 100)}% confidence</Badge>
      </CardHeader>
      <CardBody className="grid gap-5 sm:grid-cols-2">
        <Field label="Budget" value={`£${requirement.budgetMin?.toLocaleString()}–£${requirement.budgetMax?.toLocaleString()}`} />
        <Field label="Primary use" value="University + development" />
        <Field label="Secondary use" value="Occasional gaming" />
        <Field label="Priority" value="Portability + battery life" />
      </CardBody>
    </Card>
  );
}
