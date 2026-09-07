"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setError("Supabase isn't configured in this environment, so accounts are unavailable — the app still works fully in demo mode without one.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/profile");
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-display text-2xl tracking-tight text-ink">Log in</h1>
      <p className="mt-2 text-sm text-slate">
        You can browse and get recommendations without an account — sign in to sync across devices.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Card>
          <CardBody className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate">Email</label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate">Password</label>
              <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-sm text-clay">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in…" : "Log in"}
            </Button>
          </CardBody>
        </Card>
      </form>

      <p className="mt-4 text-center text-sm text-slate">
        No account?{" "}
        <Link href="/signup" className="text-ink underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
