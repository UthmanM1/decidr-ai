"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { RequirementSummaryCard } from "./requirement-summary-card";
import { ClarificationStep } from "./clarification-step";
import { DemoRequirementCard } from "./demo-requirement-card";
import { DemoClarificationCard } from "./demo-clarification-card";
import { DemoProgress } from "./demo-progress";
import { DemoRecommendationCard } from "./demo-recommendation-card";
import { RecommendationCard } from "@/components/recommendations/recommendation-card";
import { demoScenarios } from "@/lib/data/demo-scenarios";
import { generateId } from "@/lib/utils";
import { trackClientEvent } from "@/lib/client-analytics";
import {
  saveSession,
  saveRecommendation,
  saveRecommendationResult,
  listSavedRecommendations,
  upsertShoppingList
} from "@/lib/local-store";
import {
  DEMO_STAGE_DURATIONS,
  DEMO_PROMPT,
  DEMO_AUTO_ANSWER,
  buildDemoRequirement,
  applyDemoClarification,
  generateDemoRecommendations,
  buildDemoSummary,
  type DemoStage,
  type DemoScoredLaptop
} from "@/lib/demo-engine";
import type {
  ClarificationAnswer,
  ClarificationQuestion,
  DiscoverySession,
  RecommendationResult,
  StructuredRequirement
} from "@/lib/types";
import { Sparkles, PlayCircle } from "lucide-react";

type Step = "input" | "requirement" | "clarify" | "results" | "demo" | "demo-results";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Resumes a persisted session at the correct step. Previously this only
 * checked for `result`, which meant remounting mid-flow (e.g. right after the
 * requirement/questions were extracted but before results existed) silently
 * reset the user back to the empty input screen — the root cause of the
 * "demo starts, then stops" bug. It now checks every stage of progress.
 */
function computeInitialStep(session?: DiscoverySession): Step {
  if (!session) return "input";
  if (session.result) return "results";
  if (session.requirement) return "requirement";
  return "input";
}

export function DiscoverFlow({ initialSession }: { initialSession?: DiscoverySession }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(() => computeInitialStep(initialSession));
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

  // ---------------------------------------------------------------------
  // Local demo engine state — entirely separate from the API-driven state
  // above so the two flows can never race or overwrite each other.
  // ---------------------------------------------------------------------
  const [demoStage, setDemoStage] = useState<DemoStage>("IDLE");
  const [demoRequirement, setDemoRequirement] = useState<StructuredRequirement | undefined>();
  const [demoClarificationSelected, setDemoClarificationSelected] = useState<string | null>(null);
  const [demoItems, setDemoItems] = useState<DemoScoredLaptop[]>([]);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [demoSavedIds, setDemoSavedIds] = useState<Set<string>>(new Set());

  // Run-token + mounted-ref pattern: every async demo step checks this before
  // touching state. A new run (or "Start New Decision") bumps the token,
  // instantly invalidating any in-flight timers without needing to actually
  // cancel the underlying setTimeout calls — so a stray timer firing late can
  // never resurrect stale state or "un-stop" a demo the user has left.
  const demoRunToken = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

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
      // Safe now: /discover/session/[id] resumes at the "requirement" step
      // via computeInitialStep, so this navigation no longer discards
      // in-progress state.
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

  // -----------------------------------------------------------------------
  // Local demo engine — single controlled async orchestrator. No fetch, no
  // OpenAI, no Supabase, no router navigation while it runs, so it cannot be
  // interrupted by anything external. See src/lib/demo-engine.ts.
  // -----------------------------------------------------------------------
  async function runDemo() {
    const token = ++demoRunToken.current;
    const isCurrent = () => mountedRef.current && demoRunToken.current === token;

    const newSessionId = generateId("demo_sess");
    setDemoError(null);
    setDemoItems([]);
    setDemoClarificationSelected(null);
    setDemoRequirement(undefined);
    setSessionId(newSessionId);
    setRawInput(DEMO_PROMPT);
    setStep("demo");
    setDemoStage("ANALYSING_REQUEST");

    trackClientEvent("demo_started", {}, newSessionId);
    trackClientEvent("session_started", { mode: "demo" }, newSessionId);
    trackClientEvent("requirement_submitted", { mode: "demo" }, newSessionId);

    try {
      await wait(DEMO_STAGE_DURATIONS.ANALYSING_REQUEST ?? 1000);
      if (!isCurrent()) return;

      setDemoStage("EXTRACTING_REQUIREMENTS");
      const req = buildDemoRequirement(newSessionId);
      await wait(DEMO_STAGE_DURATIONS.EXTRACTING_REQUIREMENTS ?? 1000);
      if (!isCurrent()) return;
      setDemoRequirement(req);
      trackClientEvent("requirements_extracted", { category: req.category, mode: "demo" }, newSessionId);

      setDemoStage("ASKING_CLARIFICATION");
      trackClientEvent("clarification_started", { mode: "demo" }, newSessionId);
      const clarifyDuration = DEMO_STAGE_DURATIONS.ASKING_CLARIFICATION ?? 1500;
      await wait(clarifyDuration * 0.55);
      if (!isCurrent()) return;
      setDemoClarificationSelected(DEMO_AUTO_ANSWER);
      await wait(clarifyDuration * 0.45);
      if (!isCurrent()) return;
      const clarifiedReq = applyDemoClarification(req);
      setDemoRequirement(clarifiedReq);
      trackClientEvent("clarification_answered", { value: DEMO_AUTO_ANSWER, mode: "demo" }, newSessionId);

      setDemoStage("SEARCHING_PRODUCTS");
      trackClientEvent("product_search_started", { mode: "demo" }, newSessionId);
      await wait(DEMO_STAGE_DURATIONS.SEARCHING_PRODUCTS ?? 1200);
      if (!isCurrent()) return;

      setDemoStage("SCORING_PRODUCTS");
      await wait(DEMO_STAGE_DURATIONS.SCORING_PRODUCTS ?? 1000);
      if (!isCurrent()) return;
      const items = generateDemoRecommendations(clarifiedReq);

      setDemoStage("GENERATING_RECOMMENDATION");
      await wait(DEMO_STAGE_DURATIONS.GENERATING_RECOMMENDATION ?? 1200);
      if (!isCurrent()) return;

      setDemoItems(items);
      trackClientEvent("recommendation_generated", { count: items.length, mode: "demo" }, newSessionId);

      setDemoStage("SHOWING_RESULTS");
      setStep("demo-results");
      setDemoStage("COMPLETE");
    } catch (e) {
      if (!isCurrent()) return;
      console.error("[Decidr AI] Demo engine failed:", e);
      setDemoError("Something interrupted the demo unexpectedly.");
    }
  }

  function handleDemoSave(item: DemoScoredLaptop) {
    const already = listSavedRecommendations();
    const existing = already.find((r) => r.sessionId === sessionId);
    const productIds = Array.from(new Set([...(existing?.productIds ?? []), item.product.id]));
    saveRecommendation({
      id: existing?.id ?? generateId("saved"),
      userId: "demo-user",
      sessionId,
      name: "Laptop for university — demo shortlist",
      category: "laptops",
      productIds,
      status: "saved",
      createdAt: existing?.createdAt ?? new Date().toISOString()
    });
    trackClientEvent("recommendation_saved", { productId: item.product.id, mode: "demo" }, sessionId);
    setDemoSavedIds(new Set(productIds));
  }

  function createShoppingListFromDemo() {
    const now = new Date().toISOString();
    const listId = generateId("list");
    upsertShoppingList({
      id: listId,
      userId: "demo-user",
      name: "University laptop setup",
      currency: "GBP",
      items: demoItems.slice(0, 3).map((item, i) => ({
        id: generateId("item"),
        productId: item.product.id,
        position: i,
        addedAt: now
      })),
      createdAt: now,
      updatedAt: now
    });
    trackClientEvent("list_created", { mode: "demo" }, sessionId);
    router.push(`/lists/${listId}`);
  }

  function resetFlow() {
    // Invalidate any in-flight demo run so a late timer can never revive it.
    demoRunToken.current++;
    setStep("input");
    setRawInput("");
    setSessionId("");
    setRequirement(undefined);
    setQuestions([]);
    setResult(undefined);
    setError(null);
    setSavedIds(new Set());
    setDemoStage("IDLE");
    setDemoRequirement(undefined);
    setDemoClarificationSelected(null);
    setDemoItems([]);
    setDemoError(null);
    setDemoSavedIds(new Set());
  }

  const demoSummary = demoRequirement && demoItems.length ? buildDemoSummary(demoRequirement, demoItems) : "";

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

          <Card className="mt-10 border-moss/30 bg-moss/5">
            <CardBody className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-ink">See a full example decision</p>
                <p className="mt-0.5 text-sm text-slate">
                  Runs entirely locally — no API keys needed. Laptop for university, development and gaming.
                </p>
              </div>
              <Button onClick={runDemo}>
                <PlayCircle size={16} /> Run demo
              </Button>
            </CardBody>
          </Card>

          <div className="mt-8">
            <p className="text-xs font-medium uppercase tracking-wide text-slate">Or try another example</p>
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
          <ResultsActions onStartNew={resetFlow} onCreateList={() => {}} disableCreateList />
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Local demo engine — progress / clarification / error states        */}
      {/* ------------------------------------------------------------------ */}
      {step === "demo" && (
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl tracking-tight text-ink">Running a live example</h1>
            <p className="mt-1 text-sm text-slate">"{DEMO_PROMPT}"</p>
          </div>

          <Card>
            <CardBody>
              <DemoProgress stage={demoStage} />
            </CardBody>
          </Card>

          {demoRequirement && <DemoRequirementCard requirement={demoRequirement} />}

          {demoStage === "ASKING_CLARIFICATION" && (
            <DemoClarificationCard selectedValue={demoClarificationSelected} />
          )}

          {demoError && (
            <Card className="border-clay/40 bg-clay/5">
              <CardBody className="space-y-3">
                <p className="text-sm font-medium text-ink">{demoError}</p>
                <p className="text-sm text-slate">
                  The demo runs entirely locally and shouldn't normally fail — please try again.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={runDemo}>
                    Retry demo
                  </Button>
                  <Button size="sm" variant="outline" onClick={resetFlow}>
                    Start new decision
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {step === "demo-results" && demoRequirement && (
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl tracking-tight text-ink">Your recommendations</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink">{demoSummary}</p>
          </div>

          {demoItems.map((item) => (
            <DemoRecommendationCard
              key={item.product.id}
              item={item}
              onSave={handleDemoSave}
              isSaved={demoSavedIds.has(item.product.id)}
              onViewMerchant={(i) =>
                trackClientEvent("merchant_clicked", { productId: i.product.id, mode: "demo" }, sessionId)
              }
            />
          ))}

          <ResultsActions onStartNew={resetFlow} onCreateList={createShoppingListFromDemo} />
        </div>
      )}
    </div>
  );
}

function ResultsActions({
  onStartNew,
  onCreateList,
  disableCreateList
}: {
  onStartNew: () => void;
  onCreateList: () => void;
  disableCreateList?: boolean;
}) {
  return (
    <Card>
      <CardBody className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <a href="/compare">
            <Button size="sm" variant="outline">
              Compare
            </Button>
          </a>
          <Button size="sm" variant="outline" onClick={onCreateList} disabled={disableCreateList}>
            Create shopping list
          </Button>
        </div>
        <Button size="sm" variant="ghost" onClick={onStartNew}>
          Start new decision
        </Button>
      </CardBody>
    </Card>
  );
}
