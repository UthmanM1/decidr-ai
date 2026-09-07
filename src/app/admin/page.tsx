import { MetricCard } from "@/components/admin/metric-card";
import { TrendLineChart, SimpleBarChart, SimpleFunnelChart } from "@/components/admin/charts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  summaryMetrics,
  userGrowth,
  sessionVolume,
  recommendationFunnel,
  merchantClicks,
  popularCategories,
  popularProducts,
  aiUsageTrend
} from "@/lib/data/mock-analytics";
import { formatCurrency } from "@/lib/utils";

export default function AdminOverviewPage() {
  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl text-ink">Overview</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Total users" value={summaryMetrics.totalUsers.toLocaleString()} />
        <MetricCard label="Active users (7d)" value={summaryMetrics.activeUsers7d.toLocaleString()} />
        <MetricCard label="AI sessions" value={summaryMetrics.aiSessions.toLocaleString()} />
        <MetricCard label="Recommendations generated" value={summaryMetrics.recommendationsGenerated.toLocaleString()} />
        <MetricCard label="Saved recommendations" value={summaryMetrics.savedRecommendations.toLocaleString()} />
        <MetricCard label="Merchant clicks" value={summaryMetrics.merchantClicks.toLocaleString()} />
        <MetricCard
          label="Account conversion"
          value={`${Math.round(summaryMetrics.accountConversionRate * 100)}%`}
          sublabel="Guest sessions → signed-up accounts"
        />
        <MetricCard
          label="Est. commercial value"
          value={formatCurrency(summaryMetrics.estimatedCommercialValueGbp)}
          sublabel="Demo estimate, not real revenue"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-ink">User growth (30 days)</p>
          </CardHeader>
          <CardBody>
            <TrendLineChart data={userGrowth} dataKey="users" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-ink">Recommendation sessions (30 days)</p>
          </CardHeader>
          <CardBody>
            <TrendLineChart data={sessionVolume} dataKey="sessions" color="#B5533C" />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-ink">Recommendation funnel</p>
          </CardHeader>
          <CardBody>
            <SimpleFunnelChart data={recommendationFunnel} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-ink">Merchant clicks</p>
          </CardHeader>
          <CardBody>
            <SimpleBarChart data={merchantClicks} dataKey="clicks" xKey="merchant" horizontal color="#B5533C" />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-ink">Popular categories</p>
          </CardHeader>
          <CardBody>
            <SimpleBarChart data={popularCategories.slice(0, 8)} dataKey="sessions" xKey="category" horizontal />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-ink">AI usage &amp; estimated cost (14 days)</p>
          </CardHeader>
          <CardBody>
            <TrendLineChart data={aiUsageTrend} dataKey="requests" color="#2F5D50" />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <p className="text-sm font-medium text-ink">Popular products</p>
        </CardHeader>
        <CardBody className="grid gap-2 sm:grid-cols-2">
          {popularProducts.map((p, i) => (
            <div key={p.id} className="flex items-center justify-between border-b border-line py-2 text-sm">
              <span className="text-ink">
                {i + 1}. {p.title}
              </span>
              <span className="text-slate">{p.score} pts</span>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
