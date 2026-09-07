import { ProductService } from "@/lib/services/product-service";
import { getMerchantById } from "@/lib/data/merchants";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ProductCategory } from "@/lib/types";

function pseudoCount(seedStr: string, max: number) {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) >>> 0;
  return h % max;
}

export default async function AdminProductsPage({
  searchParams
}: {
  searchParams: { q?: string; category?: string };
}) {
  const products = await ProductService.search({
    query: searchParams.q,
    category: (searchParams.category as ProductCategory) || undefined
  });
  const categories = await ProductService.listCategories();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-ink">Products</h1>

      <form className="flex flex-wrap gap-3">
        <input
          type="text"
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search products…"
          className="h-10 rounded-lg border border-line px-3 text-sm"
        />
        <select name="category" defaultValue={searchParams.category ?? ""} className="h-10 rounded-lg border border-line px-3 text-sm">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.category} value={c.category}>
              {c.category.replace("-", " ")} ({c.count})
            </option>
          ))}
        </select>
        <button type="submit" className="h-10 rounded-lg bg-ink px-4 text-sm text-paper">
          Filter
        </button>
      </form>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-slate">
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Merchant</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Availability</th>
                <th className="px-5 py-3">Last updated</th>
                <th className="px-5 py-3">Recs</th>
                <th className="px-5 py-3">Clicks</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const merchant = getMerchantById(p.merchantId);
                return (
                  <tr key={p.id} className="border-b border-line last:border-0">
                    <td className="px-5 py-3">
                      <p className="text-ink">{p.title}</p>
                      <p className="text-xs text-slate">{p.brand}</p>
                    </td>
                    <td className="px-5 py-3 text-slate">{p.category.replace("-", " ")}</td>
                    <td className="px-5 py-3 text-slate">{merchant?.name}</td>
                    <td className="px-5 py-3 text-ink">{formatCurrency(p.price, p.currency)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={p.availability === "in_stock" ? "moss" : "warning"}>
                        {p.availability.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate">{formatDate(p.updatedAt)}</td>
                    <td className="px-5 py-3 text-ink">{pseudoCount(p.id, 90)}</td>
                    <td className="px-5 py-3 text-ink">{pseudoCount(p.id + "click", 40)}</td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate">
                    No products match that search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
