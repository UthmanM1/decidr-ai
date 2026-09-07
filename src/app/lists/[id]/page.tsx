"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getShoppingList, upsertShoppingList } from "@/lib/local-store";
import { formatCurrency, generateId } from "@/lib/utils";
import type { Product, ShoppingList, ShoppingListItem } from "@/lib/types";
import { ArrowDown, ArrowUp, Sparkles, Trash2 } from "lucide-react";

export default function ListDetailPage({ params }: { params: { id: string } }) {
  const [list, setList] = useState<ShoppingList | null | undefined>(undefined);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [budgetInput, setBudgetInput] = useState("");
  const [instruction, setInstruction] = useState("");
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationNotes, setOptimizationNotes] = useState<string[]>([]);

  useEffect(() => {
    const found = getShoppingList(params.id);
    setList(found);
    setBudgetInput(found?.budget ? String(found.budget) : "");
  }, [params.id]);

  useEffect(() => {
    if (!list?.items.length) return;
    fetch(`/api/products?ids=${list.items.map((i) => i.productId).join(",")}`)
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, Product> = {};
        for (const p of d.products as Product[]) map[p.id] = p;
        setProducts((prev) => ({ ...prev, ...map }));
      });
  }, [list?.items]);

  useEffect(() => {
    const handle = setTimeout(async () => {
      if (query.trim().length < 2) return setSearchResults([]);
      const res = await fetch(`/api/products?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.products ?? []);
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  function persist(next: ShoppingList) {
    const updated = { ...next, updatedAt: new Date().toISOString() };
    upsertShoppingList(updated);
    setList(updated);
  }

  function addProduct(p: Product) {
    if (!list) return;
    if (list.items.some((i) => i.productId === p.id)) return;
    setProducts((prev) => ({ ...prev, [p.id]: p }));
    persist({
      ...list,
      items: [...list.items, { id: generateId("item"), productId: p.id, position: list.items.length, addedAt: new Date().toISOString() }]
    });
    setQuery("");
    setSearchResults([]);
  }

  function removeItem(itemId: string) {
    if (!list) return;
    persist({ ...list, items: list.items.filter((i) => i.id !== itemId) });
  }

  function move(itemId: string, direction: -1 | 1) {
    if (!list) return;
    const items = [...list.items].sort((a, b) => a.position - b.position);
    const index = items.findIndex((i) => i.id === itemId);
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    items.forEach((it, i) => (it.position = i));
    persist({ ...list, items });
  }

  function saveBudget() {
    if (!list) return;
    const value = Number(budgetInput);
    persist({ ...list, budget: Number.isFinite(value) && value > 0 ? value : undefined });
  }

  async function optimize() {
    if (!list || !list.items.length || !instruction.trim()) return;
    setOptimizing(true);
    setOptimizationNotes([]);
    try {
      const res = await fetch("/api/optimize-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction,
          productIds: list.items.map((i) => i.productId),
          budget: list.budget,
          listId: list.id
        })
      });
      const data = await res.json();
      const replacementMap: Record<string, Product> = {};
      for (const p of data.replacements ?? []) replacementMap[p.id] = p;
      setProducts((prev) => ({ ...prev, ...replacementMap }));

      interface OptimizationSuggestion {
        action: "keep" | "swap" | "remove";
        itemId: string;
        replacementId?: string;
        reason: string;
      }
      const suggestions: OptimizationSuggestion[] = data.suggestions ?? [];
      const notes: string[] = suggestions.map((s) => s.reason);

      // itemId in suggestions refers to product id, not list item id — reconcile.
      const bySuggestionProduct = new Map(suggestions.map((s) => [s.itemId, s]));
      let finalItems = list.items.filter((i) => {
        const s = bySuggestionProduct.get(i.productId);
        return !(s && s.action === "remove");
      });
      finalItems = finalItems.map((i) => {
        const s = bySuggestionProduct.get(i.productId);
        if (s && s.action === "swap" && s.replacementId) {
          return { ...i, productId: s.replacementId };
        }
        return i;
      });

      persist({ ...list, items: finalItems });
      setOptimizationNotes(notes);
    } finally {
      setOptimizing(false);
    }
  }

  if (list === undefined) return <div className="mx-auto max-w-3xl px-6 py-16 text-sm text-slate">Loading…</div>;
  if (list === null)
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-2xl text-ink">List not found</h1>
      </div>
    );

  const sortedItems = [...list.items].sort((a, b) => a.position - b.position);
  const total = sortedItems.reduce((sum, i) => sum + (products[i.productId]?.price ?? 0), 0);
  const remaining = list.budget ? list.budget - total : null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:py-16">
      <h1 className="font-display text-3xl tracking-tight text-ink">{list.name}</h1>

      <Card className="mt-6">
        <CardBody className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-xs text-slate">Estimated total</p>
            <p className="text-lg font-medium text-ink">{formatCurrency(total, list.currency)}</p>
          </div>
          <div className="flex items-end gap-2">
            <div>
              <p className="text-xs text-slate">Budget</p>
              <Input
                className="w-32"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                onBlur={saveBudget}
                placeholder="e.g. 1500"
              />
            </div>
            {remaining !== null && (
              <Badge tone={remaining >= 0 ? "moss" : "clay"}>
                {remaining >= 0 ? "Remaining" : "Over by"} {formatCurrency(Math.abs(remaining), list.currency)}
              </Badge>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="relative mt-8">
        <Input placeholder="Add a product…" value={query} onChange={(e) => setQuery(e.target.value)} />
        {searchResults.length > 0 && (
          <Card className="absolute z-10 mt-1.5 max-h-72 w-full overflow-auto">
            {searchResults.map((p) => (
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
      </div>

      <div className="mt-6 space-y-3">
        {sortedItems.map((item, idx) => {
          const product = products[item.productId];
          if (!product) return null;
          return (
            <Card key={item.id}>
              <CardBody className="flex items-center gap-4">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-sand">
                  <Image src={product.image} alt={product.title} fill className="object-cover" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{product.title}</p>
                  <p className="text-xs text-slate">{formatCurrency(product.price, product.currency)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => move(item.id, -1)} disabled={idx === 0} className="text-slate disabled:opacity-30">
                    <ArrowUp size={16} />
                  </button>
                  <button
                    onClick={() => move(item.id, 1)}
                    disabled={idx === sortedItems.length - 1}
                    className="text-slate disabled:opacity-30"
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button onClick={() => removeItem(item.id)} className="ml-2 text-slate hover:text-clay">
                    <Trash2 size={16} />
                  </button>
                </div>
              </CardBody>
            </Card>
          );
        })}
        {sortedItems.length === 0 && (
          <p className="text-sm text-slate">No products yet — search above to add some.</p>
        )}
      </div>

      {sortedItems.length > 0 && (
        <Card className="mt-8">
          <CardBody>
            <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
              <Sparkles size={14} className="text-moss" /> Ask Decidr to optimise this list
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Input
                className="flex-1"
                placeholder='e.g. "Keep this setup under £1,500"'
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
              />
              <Button onClick={optimize} disabled={optimizing || !instruction.trim()}>
                {optimizing ? "Optimising…" : "Optimise"}
              </Button>
            </div>
            {optimizationNotes.length > 0 && (
              <ul className="mt-4 space-y-1.5 text-sm text-ink">
                {optimizationNotes.map((n, i) => (
                  <li key={i}>• {n}</li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
