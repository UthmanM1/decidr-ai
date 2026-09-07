import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { MetricCard } from "@/components/admin/metric-card";
import { TrendLineChart } from "@/components/admin/charts";
import { aiUsageTrend, aiUsageByFeature, summaryMetrics } from "@/lib/data/mock-analytics";
import { AnalyticsService } from "@/lib/services/analytics-service";
import { formatCurrency } from "@/lib/utils";

export default function AdminAIUsagePage() {
  const liveUsage = AnalyticsService.getMemoryAIUsage();
  const liveSuccess = liveUsage.filter((u) => u.success).length;
  const liveFailed = liveUsage.length - liveSuccess;
  const avgLatency = liveUsage.length
    ? Math.round(liveUsage.reduce((s, u) => s + u.latencyMs, 0) / liveUsage.length)
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-ink">AI usage</h1>
      <p className="text-sm text-slate">
        Provider abstraction: today calls OpenAI ({process.env.OPENAI_MODEL ?? "gpt-4o-mini"}) with a
        deterministic fallback. Swappable for another provider without changing callers — see AIService.
      </p>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="AI requests" value={summaryMetrics.aiRequests.toLocaleString()} />
        <MetricCard label="Estimated cost" value={`$${summaryMetrics.estimatedAICostUsd.toFixed(2)}`} />
        <MetricCard label="This session — success" value={String(liveSuccess)} sublabel="Live requests in this process" />
        <MetricCard label="This session — failed" value={String(liveFailed)} sublabel={`Avg latency ${avgLatency}ms`} />
      </div>

      <Card>
        <CardHeader>
          <p className="text-sm font-medium text-ink">Requests &amp; estimated cost (14 days)</p>
        </CardHeader>
        <CardBody>
          <TrendLineChart data={aiUsageTrend} dataKey="requests" />
        </CardBody>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-slate">
                <th className="px-5 py-3">Feature</th>
                <th className="px-5 py-3">Requests</th>
                <th className="px-5 py-3">Avg latency</th>
                <th className="px-5 py-3">Est. cost</th>
              </tr>
            </thead>
            <tbody>
              {aiUsageByFeature.map((f) => (
                <tr key={f.feature} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 text-ink">{f.feature.replace(/_/g, " ")}</td>
                  <td className="px-5 py-3 text-ink">{f.requests.toLocaleString()}</td>
                  <td className="px-5 py-3 text-slate">{f.avgLatencyMs}ms</td>
                  <td className="px-5 py-3 text-ink">{formatCurrency(f.costUsd, "USD")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
