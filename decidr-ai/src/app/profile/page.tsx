"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { listSavedRecommendations, listShoppingLists, listSessions } from "@/lib/local-store";
import { formatDate } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const saved = typeof window !== "undefined" ? listSavedRecommendations() : [];
  const lists = typeof window !== "undefined" ? listShoppingLists() : [];
  const sessions = typeof window !== "undefined" ? listSessions() : [];

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setCheckedAuth(true);
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setCheckedAuth(true);
    });
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:py-16">
      <h1 className="font-display text-3xl tracking-tight text-ink">Profile</h1>

      <Card className="mt-6">
        <CardBody className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink">
              {user?.user_metadata?.full_name ?? "Guest (demo mode)"}
            </p>
            <p className="text-sm text-slate">{user?.email ?? "Not signed in"}</p>
          </div>
          {!user && checkedAuth && (
            <Link href="/login" className="text-sm text-moss underline">
              Log in
            </Link>
          )}
        </CardBody>
      </Card>

      <div className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate">Decision history</h2>
        <div className="mt-3 space-y-3">
          {sessions.length === 0 && <p className="text-sm text-slate">No sessions yet.</p>}
          {sessions.map((s) => (
            <Card key={s.id}>
              <CardBody className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ink">{s.rawInput}</p>
                  <p className="mt-1 text-xs text-slate">
                    {formatDate(s.createdAt)} · <Badge>{s.status}</Badge>
                  </p>
                </div>
                <Link href={`/discover/session/${s.id}`} className="text-sm text-moss underline">
                  Open
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate">Saved recommendations</h2>
        <p className="mt-2 text-sm text-slate">{saved.length} saved shortlist(s).</p>
        <Link href="/recommendations" className="text-sm text-moss underline">
          View all
        </Link>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate">Shopping lists</h2>
        <p className="mt-2 text-sm text-slate">{lists.length} list(s).</p>
        <Link href="/lists" className="text-sm text-moss underline">
          View all
        </Link>
      </div>
    </div>
  );
}
