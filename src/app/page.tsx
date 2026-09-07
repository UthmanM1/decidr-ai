import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MatchRing } from "@/components/ui/match-ring";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquareText,
  SlidersHorizontal,
  ShieldCheck,
  ScaleIcon,
  Sparkles,
  BookmarkCheck,
  Store
} from "lucide-react";

const steps = [
  {
    icon: MessageSquareText,
    title: "Natural language discovery",
    body: "Tell Decidr what you're trying to buy the way you'd tell a friend — no filters or spec sheets required to get started."
  },
  {
    icon: SlidersHorizontal,
    title: "Intelligent questions",
    body: "Decidr asks two to four sharp follow-up questions, only when your answer would meaningfully change the outcome."
  },
  {
    icon: ShieldCheck,
    title: "Verified product data",
    body: "Every price, spec and rating comes from the product catalogue, never an AI guess — the model only interprets and explains."
  },
  {
    icon: Sparkles,
    title: "Personalised ranking",
    body: "A transparent, weighted scoring engine ranks products against your budget, use case and stated priorities."
  },
  {
    icon: ScaleIcon,
    title: "Transparent reasoning",
    body: "See exactly why each product was ranked where it was, including honest trade-offs, not just marketing points."
  },
  {
    icon: BookmarkCheck,
    title: "Saved decisions",
    body: "Come back weeks later and find your reasoning, comparisons and shortlist exactly where you left them."
  }
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-14 md:pb-24 md:pt-24">
        <div className="grid gap-12 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <p className="mb-5 text-sm text-slate">Decidr AI</p>
            <h1 className="font-display text-4xl leading-[1.08] tracking-tight text-ink md:text-6xl">
              Make better buying decisions.
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-slate md:text-lg">
              Decidr is an intelligent decision engine that turns vague purchasing
              requirements into personalised, evidence-based product recommendations —
              with the reasoning shown, not hidden.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/discover">
                <Button size="lg">Start a decision</Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline">
                  See how it works
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-xs text-slate">
              No account needed to get your first recommendation.
            </p>
          </div>

          {/* Product preview */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <p className="text-xs text-slate">Your recommendations</p>
                <p className="text-sm font-medium text-ink">Lightweight laptop for university</p>
              </div>
              <Badge tone="moss">Best overall</Badge>
            </div>
            <div className="flex gap-4 px-5 py-5">
              <MatchRing score={94} size={64} />
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">MacBook Air 13" M3</p>
                <p className="text-xs text-slate">Apple · £1,099</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge>Portable design</Badge>
                  <Badge>Battery life</Badge>
                  <Badge>Python-ready</Badge>
                </div>
              </div>
            </div>
            <div className="border-t border-line px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate">Trade-off</p>
              <p className="mt-1 text-sm text-ink">Limited upgradeability after purchase.</p>
            </div>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-line bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl tracking-tight text-ink">How Decidr works</h2>
            <p className="mt-3 text-slate">
              A structured pipeline sits behind every recommendation — from your first
              sentence to a ranked, explained shortlist.
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((step) => (
              <div key={step.title}>
                <step.icon size={22} className="text-moss" strokeWidth={1.6} />
                <h3 className="mt-4 text-base font-medium text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Merchant comparison */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <Store size={22} className="text-clay" strokeWidth={1.6} />
              <h2 className="mt-4 font-display text-3xl tracking-tight text-ink">
                Compare across merchants, decide once
              </h2>
              <p className="mt-3 max-w-md text-slate">
                Every recommendation links back to where the product is actually sold.
                Decidr never invents a listing — it points you to the merchant and gets
                out of the way.
              </p>
            </div>
            <Card className="p-6">
              <p className="text-xs text-slate">Demo data for this portfolio build</p>
              <ul className="mt-4 space-y-3 text-sm text-ink">
                <li className="flex items-center justify-between border-b border-line pb-3">
                  Demo Electronics <span className="text-slate">Laptops, phones, audio</span>
                </li>
                <li className="flex items-center justify-between border-b border-line pb-3">
                  Demo Home <span className="text-slate">Chairs, coffee, appliances</span>
                </li>
                <li className="flex items-center justify-between">
                  Demo Sports <span className="text-slate">Footwear &amp; training gear</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-line bg-ink py-20 text-paper">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="font-display text-3xl tracking-tight md:text-4xl">
            Describe what you need. See the reasoning. Decide with confidence.
          </h2>
          <Link href="/discover" className="mt-8 inline-block">
            <Button size="lg" variant="secondary">
              Start a decision
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
