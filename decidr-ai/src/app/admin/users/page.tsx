import { Card, CardBody } from "@/components/ui/card";
import { mockUsers } from "@/lib/data/mock-analytics";
import { formatDate } from "@/lib/utils";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-ink">Users</h1>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-slate">
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Signup date</th>
                <th className="px-5 py-3">Sessions</th>
                <th className="px-5 py-3">Recommendations</th>
                <th className="px-5 py-3">Saved products</th>
                <th className="px-5 py-3">Merchant clicks</th>
                <th className="px-5 py-3">Last active</th>
              </tr>
            </thead>
            <tbody>
              {mockUsers.map((u) => (
                <tr key={u.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3">
                    <p className="text-ink">{u.name}</p>
                    <p className="text-xs text-slate">{u.email}</p>
                  </td>
                  <td className="px-5 py-3 text-slate">{formatDate(u.signupDate)}</td>
                  <td className="px-5 py-3 text-ink">{u.sessions}</td>
                  <td className="px-5 py-3 text-ink">{u.recommendations}</td>
                  <td className="px-5 py-3 text-ink">{u.savedProducts}</td>
                  <td className="px-5 py-3 text-ink">{u.merchantClicks}</td>
                  <td className="px-5 py-3 text-slate">{formatDate(u.lastActive)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
