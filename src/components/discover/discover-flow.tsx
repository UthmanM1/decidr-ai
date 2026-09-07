"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RequirementSummaryCard } from "./requirement-summary-card";
import { ClarificationStep } from "./clarification-step";
import { RecommendationCard } from "@/components/recommendations/recommendation-card";
import { demoScenarios } from "@/lib/data/demo-scenarios";
import { generateId } from "@/lib/utils";
import {
  saveSession,
  saveRecommendation,
  saveRecommendationResult,
  listSavedRecommendations
} from "@/lib/local-store";
import type {
  ClarificationAnswer,
  ClarificationQuestion,
  DiscoverySession,
  RecommendationResult,
  StructuredRequirement
} from "@/lib/types";
import { Sparkles } from "lucide-react";

type Step = "input" | "requirement" | "clarify" | "results";

export function DiscoverFlow({ initialSession }: { initialSession?: DiscoverySession }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(initialSession?.result ? "results" : "input");
  const [rawInput, setRawInput] = useState(initialSession?.rawInput ?? "");
  const [sessionId, setSessionId] = useState(initialSession?.id ?? "");
  const [requirement, setRequirement] = useState<StructuredRequirement | undefined>(
    initialSession?.requirement
  );
  const [questions, setQuestions] = useState<ClarificationQuestion[]>(initialSession?.questions ?? []);
  const [result, setResult] = useState<RecommendationResult | undefined>(initialSession?.result);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/ai-status")
      .then((r) => r.json())
      .then((d) => setDemoMode(Boolean(d.demoMode)))
      .catch(() => setDemoMode(true));
  }, []);

  function persist(patch: Partial<DiscoverySession>) {
    const session: DiscoverySession = {
      id: sessionId,
      userId: null,
      status: "in_progress",
      rawInput,
      requirement,
      questions,
      answers: [],
      result,
      createdAt: initialSession?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...patch
    };
    saveSession(session);
    return session;
  }

  async function submitInput(text: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/extract-requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput: text })
      });
      if (!res.ok) throw new Error("Couldn't process that description. Please try rephrasing it.");
      const data = await res.json();
      setSessionId(data.sessionId);
      setRequirement(data.requirement);
      setQuestions(data.questions);
      setRawInput(text);
      persist({
        id: data.sessionId,
        rawInput: text,
        requirement: data.requirement,
        questions: data.questions,
        status: "clarifying"
      });
      router.replace(`/discover/session/${data.sessionId}`);
      setStep("requirement");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleClarificationComplete(answers: ClarificationAnswer[]) {
    if (!requirement) return;
    setLoading(true);
    setError(null);
    try {
      const clarifyRes = await fetch("/api/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirement, answers })
      });
      const clarifyData = await clarifyRes.json();
      const updatedRequirement: StructuredRequirement = clarifyData.requirement;
      setRequirement(updatedRequirement);

      const recRes = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirement: updatedRequirement })
      });
      if (!recRes.ok) throw new Error("Couldn't generate recommendations right now.");
      const recData = await recRes.json();
      setResult(recData.result);
      saveRecommendationResult(recData.result);
      persist({ requirement: updatedRequirement, result: recData.result, status: "completed" });
      setStep("results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleSave(item: RecommendationResult["items"][number]) {
    if (!result) return;
    const already = listSavedRecommendations();
    const existing = already.find((r) => r.sessionId === sessionId);
    const productIds = Array.from(new Set([...(existing?.productIds ?? []), item.product.id]));
    saveRecommendation({
      id: existing?.id ?? generateId("saved"),
      userId: "demo-user",
      sessionId,
      name: requirement?.category ? `${requirement.category.replace("-", " ")} shortlist` : "Saved shortlist",
      category: requirement?.category ?? null,
      productIds,
      status: "saved",
      createdAt: existing?.createdAt ?? new Date().toISOString()
    });
    setSavedIds(new Set(productIds));
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:py-16">
      {demoMode && (
        <div className="mb-6 flex items-center gap-2">
          <Badge tone="clay">
            <Sparkles size={12} /> Demo mode — deterministic recommendation engine, no API key required
          </Badge>
        </div>
      )}

      {step === "input" && (
        <div>
          <h1 className="font-display text-3xl tracking-tight text-ink">What are you trying to buy?</h1>
          <p className="mt-2 text-slate">
            Describe it in your own words — budget, use case, anything that matters to you.
          </p>
          <div className="mt-6">
            <Textarea
              rows={4}
              placeholder="I need a lightweight laptop for university. I study business analytics, use Python and Power BI, and want to stay around £1,000."
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
            />
            {error && <p className="mt-2 text-sm text-clay">{error}</p>}
            <div className="mt-4 flex justify-end">
              <Button onClick={() => submitInput(rawInput)} disabled={loading || rawInput.trim().length < 3}>
                {loading ? "Thinking…" : "Continue"}
              </Button>
            </div>
          </div>

          <div className="mt-10">
            <p className="text-xs font-medium uppercase tracking-wide text-slate">Try a demo scenario</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {demoScenarios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => submitInput(s.prompt)}
                  className="rounded-full border border-line px-3.5 py-1.5 text-sm text-ink hover:border-ink/40"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === "requirement" && requirement && (
        <div className="space-y-6">
          <RequirementSummaryCard requirement={requirement} />
          <div className="flex justify-end">
            <Button onClick={() => setStep("clarify")}>Answer a couple of questions</Button>
          </div>
        </div>
      )}

      {step === "clarify" && questions.length > 0 && (
        <ClarificationStep questions={questions} onComplete={handleClarificationComplete} />
      )}

      {step === "clarify" && loading && (
        <p className="mt-4 text-center text-sm text-slate">Ranking products against your requirements…</p>
      )}

      {step === "results" && result && requirement && (
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl tracking-tight text-ink">Your recommendations</h1>
            <p className="mt-1 text-sm text-slate">
              Ranked against your budget, use case and stated priorities. {result.items.length} matches found.
            </p>
          </div>
          {result.items.length === 0 && (
            <p className="text-sm text-slate">
              No products matched every requirement. Try loosening your budget or required features.
            </p>
          )}
          {result.items.map((item) => (
            <RecommendationCard
              key={item.product.id}
              item={item}
              recommendationId={result.id}
              onSave={handleSave}
              isSaved={savedIds.has(item.product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
