"use client";

import { useEffect, useState } from "react";
import { getSession } from "@/lib/local-store";
import { DiscoverFlow } from "@/components/discover/discover-flow";
import type { DiscoverySession } from "@/lib/types";

export default function DiscoverSessionPage({ params }: { params: { id: string } }) {
  const [session, setSession] = useState<DiscoverySession | null | undefined>(undefined);

  useEffect(() => {
    setSession(getSession(params.id));
  }, [params.id]);

  if (session === undefined) {
    return <div className="mx-auto max-w-3xl px-6 py-16 text-sm text-slate">Loading your session…</div>;
  }

  if (session === null) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-2xl text-ink">Session not found</h1>
        <p className="mt-2 text-sm text-slate">
          This session isn't in your browser's saved history. It may have been cleared, or opened on a
          different device.
        </p>
      </div>
    );
  }

  return <DiscoverFlow initialSession={session} />;
}
