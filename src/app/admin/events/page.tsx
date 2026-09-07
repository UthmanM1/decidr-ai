import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnalyticsService } from "@/lib/services/analytics-service";
import { formatDate } from "@/lib/utils";
import type { AnalyticsEventName } from "@/lib/types";

const seedNames: AnalyticsEventName[] = [
  "page_viewed",
  "session_started",
  "requirement_submitted",
  "requirements_extracted",
  "recommendation_generated",
  "product_viewed",
  "merchant_clicked",
  "recommendation_saved"
];

function mockEvents() {
  const now = Date.now();
  return Array.from({ length: 20 }, (_, i) => ({
    id: `evt_seed_${i}`,
    name: seedNames[i % seedNames.length],
    userId: i % 3 === 0 ? null : `user_${(i % 18) + 1}`.padStart(9, "0"),
    timestamp: new Date(now - i * 1000 * 60 * 7).toISOString(),
    properties: {}
  }));
}

export default function AdminEventsPage() {
  const live = AnalyticsService.getMemoryEvents();
  const events = [...live].reverse().slice(0, 40);
  const combined = events.length ? events : mockEvents();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-ink">Events</h1>
      <p className="text-sm text-slate">
        {live.length
          ? "Live analytics events recorded in this server process."
          : "Seeded example events — no live traffic recorded yet in this process."}
      </p>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-slate">
                <th className="px-5 py-3">Event</th>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {combined.map((e) => (
                <tr key={e.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3">
                    <Badge>{e.name}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate">{e.userId ?? "guest"}</td>
                  <td className="px-5 py-3 text-slate">{formatDate(e.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
