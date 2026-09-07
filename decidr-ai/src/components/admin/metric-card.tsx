import { Card, CardBody } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  sublabel
}: {
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <Card>
      <CardBody>
        <p className="text-xs font-medium uppercase tracking-wide text-slate">{label}</p>
        <p className="mt-2 text-2xl font-medium text-ink">{value}</p>
        {sublabel && <p className="mt-1 text-xs text-slate">{sublabel}</p>}
      </CardBody>
    </Card>
  );
}
