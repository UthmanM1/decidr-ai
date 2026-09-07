"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listShoppingLists, upsertShoppingList, deleteShoppingList } from "@/lib/local-store";
import { generateId, formatDate } from "@/lib/utils";
import type { ShoppingList } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";

export default function ListsPage() {
  const [lists, setLists] = useState<ShoppingList[] | null>(null);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    setLists(listShoppingLists());
  }, []);

  function createList() {
    if (!newName.trim()) return;
    const now = new Date().toISOString();
    const list: ShoppingList = {
      id: generateId("list"),
      userId: "demo-user",
      name: newName.trim(),
      currency: "GBP",
      items: [],
      createdAt: now,
      updatedAt: now
    };
    upsertShoppingList(list);
    setLists(listShoppingLists());
    setNewName("");
  }

  function removeList(id: string) {
    deleteShoppingList(id);
    setLists(listShoppingLists());
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:py-16">
      <h1 className="font-display text-3xl tracking-tight text-ink">Shopping lists</h1>
      <p className="mt-2 text-slate">Group multiple products into a single setup, like "University Setup".</p>

      <div className="mt-6 flex gap-2">
        <Input
          placeholder="New list name, e.g. University Setup"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createList()}
        />
        <Button onClick={createList} disabled={!newName.trim()}>
          <Plus size={16} /> Create
        </Button>
      </div>

      {lists === null && <p className="mt-8 text-sm text-slate">Loading…</p>}

      {lists && lists.length === 0 && (
        <Card className="mt-8">
          <CardBody className="text-center text-sm text-slate">No lists yet — create your first above.</CardBody>
        </Card>
      )}

      <div className="mt-6 space-y-3">
        {lists?.map((list) => (
          <Card key={list.id}>
            <CardBody className="flex items-center justify-between">
              <Link href={`/lists/${list.id}`} className="flex-1">
                <p className="text-sm font-medium text-ink">{list.name}</p>
                <p className="mt-0.5 text-xs text-slate">
                  {list.items.length} item{list.items.length === 1 ? "" : "s"} · Updated{" "}
                  {formatDate(list.updatedAt)}
                </p>
              </Link>
              <button onClick={() => removeList(list.id)} className="text-slate hover:text-clay">
                <Trash2 size={16} />
              </button>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
