"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { Star, X } from "lucide-react";

export default function ComparePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handle = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.products ?? []);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  function addProduct(p: Product) {
    if (selected.find((s) => s.id === p.id)) return;
    if (selected.length >= 4) return;
    setSelected((prev) => [...prev, p]);
    setQuery("");
    setResults([]);
  }

  function removeProduct(id: string) {
    setSelected((prev) => prev.filter((p) => p.id !== id));
  }

  const specKeys = Array.from(new Set(selected.flatMap((p) => Object.keys(p.specifications))));

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 md:py-16">
      <h1 className="font-display text-3xl tracking-tight text-ink">Compare products</h1>
      <p className="mt-2 text-slate">Search and add up to four products to compare side by side.</p>

      <div className="relative mt-6 max-w-md">
        <Input placeholder="Search products…" value={query} onChange={(e) => setQuery(e.target.value)} />
        {results.length > 0 && (
          <Card className="absolute z-10 mt-1.5 max-h-72 w-full overflow-auto">
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => addProduct(p)}
                className="flex w-full items-center justify-between border-b border-line px-4 py-2.5 text-left text-sm last:border-0 hover:bg-sand"
              >
                <span>
                  {p.title} <span className="text-slate">· {p.brand}</span>
                </span>
                <span className="text-slate">{formatCurrency(p.price, p.currency)}</span>
              </button>
            ))}
          </Card>
        )}
        {loading && <p className="mt-1 text-xs text-slate">Searching…</p>}
      </div>

      {selected.length === 0 ? (
        <Card className="mt-10">
          <CardBody className="text-center text-sm text-slate">
            Search above to add products, or save some from a recommendation first.
          </CardBody>
        </Card>
      ) : (
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="w-40" />
                {selected.map((p) => (
                  <th key={p.id} className="p-3 text-left align-top">
                    <div className="relative mb-2 h-24 w-24 overflow-hidden rounded-lg bg-sand">
                      <Image src={p.image} alt={p.title} fill className="object-cover" />
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-ink">{p.title}</p>
                        <p className="text-xs text-slate">{p.brand}</p>
                      </div>
                      <button onClick={() => removeProduct(p.id)} className="text-slate hover:text-clay">
                        <X size={16} />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-t border-line py-3 text-xs font-medium uppercase tracking-wide text-slate">
                  Price
                </td>
                {selected.map((p) => (
                  <td key={p.id} className="border-t border-line py-3 text-sm font-medium text-ink">
                    {formatCurrency(p.price, p.currency)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border-t border-line py-3 text-xs font-medium uppercase tracking-wide text-slate">
                  Rating
                </td>
                {selected.map((p) => (
                  <td key={p.id} className="border-t border-line py-3 text-sm text-ink">
                    <span className="flex items-center gap-1">
                      <Star size={13} className="fill-clay text-clay" /> {p.rating} ({p.reviewCount})
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border-t border-line py-3 text-xs font-medium uppercase tracking-wide text-slate">
                  Availability
                </td>
                {selected.map((p) => (
                  <td key={p.id} className="border-t border-line py-3 text-sm text-ink">
                    <Badge tone={p.availability === "in_stock" ? "moss" : "warning"}>
                      {p.availability.replace("_", " ")}
                    </Badge>
                  </td>
                ))}
              </tr>
              {specKeys.map((key) => (
                <tr key={key}>
                  <td className="border-t border-line py-3 text-xs font-medium uppercase tracking-wide text-slate">
                    {key}
                  </td>
                  {selected.map((p) => (
                    <td key={p.id} className="border-t border-line py-3 text-sm text-ink">
                      {p.specifications[key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="border-t border-line py-3 text-xs font-medium uppercase tracking-wide text-slate">
                  Features
                </td>
                {selected.map((p) => (
                  <td key={p.id} className="border-t border-line py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.features.slice(0, 4).map((f) => (
                        <Badge key={f}>{f}</Badge>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
