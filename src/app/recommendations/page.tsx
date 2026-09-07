"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listSavedRecommendations, removeSavedRecommendation } from "@/lib/local-store";
import { formatDate } from "@/lib/utils";
import type { SavedRecommendation } from "@/lib/types";

export default function RecommendationsPage() {
  const [saved, setSaved] = useState<SavedRecommendation[] | null>(null);

  useEffect(() => {
    setSaved(listSavedRecommendations());
  }, []);

  function handleRemove(id: string) {
    removeSavedRecommendation(id);
    setSaved(listSavedRecommendations());
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:py-16">
      <h1 className="font-display text-3xl tracking-tight text-ink">Saved recommendations</h1>
      <p className="mt-2 text-slate">Shortlists you've saved from previous decisions.</p>

      {saved === null && <p className="mt-8 text-sm text-slate">Loading…</p>}

      {saved && saved.length === 0 && (
        <Card className="mt-8">
          <CardBody className="text-center">
            <p className="text-sm text-ink">You haven't saved any recommendations yet.</p>
            <Link href="/discover" className="mt-4 inline-block">
              <Button size="sm">Start a decision</Button>
            </Link>
          </CardBody>
        </Card>
      )}

      <div className="mt-8 space-y-4">
        {saved?.map((rec) => (
          <Card key={rec.id}>
            <CardBody className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-ink">{rec.name}</p>
                  <Badge>{rec.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate">
                  {rec.productIds.length} product{rec.productIds.length === 1 ? "" : "s"} · Saved{" "}
                  {formatDate(rec.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link href={`/discover/session/${rec.sessionId}`}>
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </Link>
                <Button size="sm" variant="ghost" onClick={() => handleRemove(rec.id)}>
                  Remove
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
