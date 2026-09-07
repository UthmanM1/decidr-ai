import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { TrendLineChart, SimpleBarChart } from "@/components/admin/charts";
import { userGrowth, sessionVolume, popularCategories, aiUsageTrend } from "@/lib/data/mock-analytics";

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-ink">Analytics</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-ink">User growth</p>
          </CardHeader>
          <CardBody>
            <TrendLineChart data={userGrowth} dataKey="users" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-ink">Recommendation sessions</p>
          </CardHeader>
          <CardBody>
            <TrendLineChart data={sessionVolume} dataKey="sessions" color="#B5533C" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-ink">Popular categories</p>
          </CardHeader>
          <CardBody>
            <SimpleBarChart data={popularCategories} dataKey="sessions" xKey="category" horizontal />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-ink">AI requests (14 days)</p>
          </CardHeader>
          <CardBody>
            <TrendLineChart data={aiUsageTrend} dataKey="requests" />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
