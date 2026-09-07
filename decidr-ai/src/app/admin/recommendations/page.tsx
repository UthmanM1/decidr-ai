import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { popularCategories, recommendationFunnel, summaryMetrics } from "@/lib/data/mock-analytics";
import { MetricCard } from "@/components/admin/metric-card";
import { SimpleFunnelChart } from "@/components/admin/charts";

export default function AdminRecommendationsPage() {
  const saveRate = Math.round((summaryMetrics.savedRecommendations / summaryMetrics.recommendationsGenerated) * 100);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-ink">Recommendations</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Generated" value={summaryMetrics.recommendationsGenerated.toLocaleString()} />
        <MetricCard label="Saved" value={summaryMetrics.savedRecommendations.toLocaleString()} />
        <MetricCard label="Save rate" value={`${saveRate}%`} />
        <MetricCard label="Categories covered" value={String(popularCategories.length)} />
      </div>

      <Card>
        <CardBody>
          <p className="mb-4 text-sm font-medium text-ink">Funnel from session to saved recommendation</p>
          <SimpleFunnelChart data={recommendationFunnel} />
        </CardBody>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-slate">
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Sessions</th>
                <th className="px-5 py-3">Share</th>
              </tr>
            </thead>
            <tbody>
              {popularCategories.map((c) => (
                <tr key={c.category} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 text-ink">
                    <Badge>{c.category.replace("-", " ")}</Badge>
                  </td>
                  <td className="px-5 py-3 text-ink">{c.sessions}</td>
                  <td className="px-5 py-3 text-slate">
                    {Math.round((c.sessions / popularCategories.reduce((s, x) => s + x.sessions, 0)) * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
