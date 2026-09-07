import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { merchants } from "@/lib/data/merchants";
import { products } from "@/lib/data/products";
import { merchantClicks } from "@/lib/data/mock-analytics";
import { formatCurrency } from "@/lib/utils";

export default function AdminMerchantsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-ink">Merchants</h1>
      <p className="text-sm text-slate">
        Demo merchant records for this portfolio build — no real commercial partnerships.
      </p>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-slate">
                <th className="px-5 py-3">Merchant</th>
                <th className="px-5 py-3">Products</th>
                <th className="px-5 py-3">Clicks</th>
                <th className="px-5 py-3">Outbound CTR</th>
                <th className="px-5 py-3">Est. commercial value</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {merchants.map((m) => {
                const productCount = products.filter((p) => p.merchantId === m.id).length;
                const clickRow = merchantClicks.find((c) => c.merchant === m.name);
                return (
                  <tr key={m.id} className="border-b border-line last:border-0">
                    <td className="px-5 py-3">
                      <p className="text-ink">{m.name}</p>
                      <p className="text-xs text-slate">{m.domain}</p>
                    </td>
                    <td className="px-5 py-3 text-ink">{productCount}</td>
                    <td className="px-5 py-3 text-ink">{clickRow?.clicks ?? 0}</td>
                    <td className="px-5 py-3 text-ink">{clickRow?.ctr ?? 0}%</td>
                    <td className="px-5 py-3 text-ink">
                      {formatCurrency((clickRow?.clicks ?? 0) * 14.5)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={m.status === "active" ? "moss" : "warning"}>{m.status}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
