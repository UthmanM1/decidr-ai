"use client";

import { useState } from "react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";
import type { ClarificationAnswer, ClarificationQuestion } from "@/lib/types";

export function ClarificationStep({
  questions,
  onComplete
}: {
  questions: ClarificationQuestion[];
  onComplete: (answers: ClarificationAnswer[]) => void;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const question = questions[index];
  const isLast = index === questions.length - 1;

  function choose(value: string) {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  }

  function next() {
    if (isLast) {
      const finalAnswers: ClarificationAnswer[] = questions.map((q) => ({
        questionId: q.id,
        requirementField: q.requirementField,
        value: answers[q.id] ?? ""
      }));
      onComplete(finalAnswers);
    } else {
      setIndex((i) => i + 1);
    }
  }

  function back() {
    setIndex((i) => Math.max(0, i - 1));
  }

  const currentAnswer = answers[question.id];
  const canContinue = currentAnswer !== undefined && currentAnswer !== "";

  return (
    <Card>
      <CardBody>
        <div className="mb-6 flex items-center gap-3">
          <ProgressBar value={((index + 1) / questions.length) * 100} className="flex-1" />
          <span className="shrink-0 text-xs text-slate">
            {index + 1} / {questions.length}
          </span>
        </div>

        <h3 className="text-lg font-medium text-ink">{question.question}</h3>

        <div className="mt-5">
          {question.type === "single_select" && question.options && (
            <div className="grid gap-2.5">
              {question.options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => choose(opt.value)}
                  className={cn(
                    "rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                    currentAnswer === opt.value
                      ? "border-moss bg-moss/5 text-ink"
                      : "border-line text-ink hover:border-ink/40"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {question.type === "text" && (
            <Textarea
              rows={3}
              placeholder="Type your answer..."
              value={typeof currentAnswer === "string" ? currentAnswer : ""}
              onChange={(e) => choose(e.target.value)}
            />
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button variant="ghost" onClick={back} disabled={index === 0}>
            Back
          </Button>
          <Button onClick={next} disabled={!canContinue}>
            {isLast ? "See recommendations" : "Next"}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
