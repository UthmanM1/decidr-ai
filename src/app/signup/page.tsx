"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setError("Supabase isn't configured in this environment, so accounts are unavailable — the app still works fully in demo mode without one.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-display text-2xl tracking-tight text-ink">Create an account</h1>
      <p className="mt-2 text-sm text-slate">Save your decisions and pick up where you left off.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Card>
          <CardBody className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate">Full name</label>
              <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate">Email</label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate">Password</label>
              <Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-sm text-clay">{error}</p>}
            {success && <p className="text-sm text-moss">Account created — redirecting to log in…</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </CardBody>
        </Card>
      </form>

      <p className="mt-4 text-center text-sm text-slate">
        Already have an account?{" "}
        <Link href="/login" className="text-ink underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
