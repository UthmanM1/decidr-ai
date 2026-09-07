# Decidr AI

Decidr AI is a full-stack AI-powered consumer decision platform. Users describe
what they want to buy in plain language, answer a couple of sharp clarification
questions, and get a ranked, explained shortlist of real products — with every
factual claim (price, spec, availability, merchant) sourced from a structured
product data layer, never invented by an LLM.

This is a portfolio build demonstrating full-stack architecture, a deterministic
recommendation engine, service-oriented design, Supabase auth/data, and an
internal admin/analytics dashboard. It is not connected to any real commercial
partnerships, merchants, or product feeds — see [Demo data](#demo-data--commercial-disclaimer).

## Product concept

```
User → natural language requirement → requirement extraction → clarification
     → structured requirements → product search/filter → deterministic scoring
     → ranked products → AI-phrased explanation → save / compare / merchant click
     → analytics
```

The LLM is used only to *interpret* the user's free text and *phrase* an
explanation of a score that has already been computed. It is never used to
compute the score itself, and it never invents a product, price, or spec.

## Tech stack

- **Next.js 14 (App Router)** + **TypeScript**
- **Tailwind CSS**, hand-built component primitives (button/card/badge/input) —
  no external UI kit dependency required to run
- **Supabase** (Postgres, Auth, Row Level Security)
- **OpenAI-compatible chat completions API**, behind a provider abstraction, with
  a deterministic fallback so the app works with zero external services
- **Recharts** for the admin dashboard
- **Vitest** for unit tests
- Deployable to **Vercel** with zero configuration beyond environment variables

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full breakdown of services,
data flow, and how to extend each layer. In short:

- `src/lib/services/product-service.ts` — the only module that reads product
  data. Backed today by a 44-item local demo catalogue
  (`src/lib/data/products.ts`); swap the internals for a real product-data
  provider without touching any caller.
- `src/lib/services/recommendation-service.ts` — a **fully deterministic**,
  configurable-weight scoring engine. No AI involved. Explainable via a
  per-product score breakdown, matched requirements, trade-offs and warnings.
- `src/lib/services/ai-service.ts` — the **only** module allowed to call an LLM.
  Server-only (`import "server-only"`), with a deterministic fallback for every
  method so the whole app works without `OPENAI_API_KEY`.
- `src/lib/services/analytics-service.ts` — the only place that writes
  `analytics_events` / `ai_usage` rows.
- `src/lib/services/merchant-tracking-service.ts` — the only place that records
  an outbound merchant click and resolves a validated redirect URL (defends
  against open redirects).
- `src/lib/services/user-preference-service.ts` — reads/writes durable user
  preferences.

## Database schema

Full schema with foreign keys, indexes and Row Level Security policies lives in
[`supabase/schema.sql`](./supabase/schema.sql). Tables: `profiles`, `products`,
`merchants`, `recommendation_sessions`, `requirements`,
`clarification_questions`, `clarification_answers`, `recommendations`,
`recommendation_items`, `saved_recommendations`, `shopping_lists`,
`shopping_list_items`, `merchant_clicks`, `analytics_events`, `ai_usage`,
`user_preferences`.

RLS policies ensure a user can only read/write their own private rows
(sessions, saved recommendations, lists, preferences); `analytics_events` and
`ai_usage` are admin-read-only and written server-side via the service role
key, so client code can never forge an event.

## AI architecture

`AIService` wraps a single `callModel()` function that hits
`https://api.openai.com/v1/chat/completions` with `OPENAI_API_KEY` (server-side
only — never exposed to the browser). Every public method
(`extractRequirements`, `generateClarificationQuestions`, `explainRecommendation`,
`optimizeShoppingList`) tries the AI path first when configured, tracks the
attempt via `AnalyticsService.recordAIUsage`, and falls back to a deterministic,
rule-based implementation on any failure or when no key is configured — so the
UX never breaks. Swapping providers means changing `callModel()`; no caller
needs to change.

## Recommendation engine

Deterministic and explainable — see `SCORE_WEIGHTS` in
`recommendation-service.ts`:

| Factor             | Weight |
| ------------------ | ------ |
| Budget fit          | 20%    |
| Use-case fit        | 20%    |
| Required features   | 20%    |
| Preferences         | 15%    |
| Performance         | 10%    |
| Value               | 10%    |
| Rating              | 5%     |

Category mismatches and out-of-stock items are additionally hard-penalised.
Portability and availability are tracked in the score breakdown for
explanation purposes even though they're folded into other weighted factors.
Every result includes `matchedRequirements`, `tradeoffs`, `warnings`, and
`reasons` so the UI can show *why*, not just *what*.

## Product data architecture

`src/lib/data/products.ts` is a 44-product demo catalogue spanning laptops,
headphones, smartphones, monitors, cameras, running shoes, office chairs,
coffee machines, robot vacuums and air purifiers — generated once by
`gen_products.mjs` (kept for reference/regeneration, not part of the runtime
app). Every product record matches the `Product` type in `src/lib/types.ts`
and the `products` table in the Supabase schema, so swapping in a real
provider means writing a new implementation of `ProductService` against the
same interface.

## Analytics architecture

`AnalyticsService.track(name, properties, userId, sessionId)` is called from
API routes (never directly from UI components) for every event in the
`AnalyticsEventName` union (`page_viewed`, `session_started`,
`requirement_submitted`, ... `ai_request_failed`). Events are best-effort
persisted to Postgres and always buffered in-memory for the admin dashboard.
The admin dashboard's charts otherwise use a **deterministic seeded mock
dataset** (`src/lib/data/mock-analytics.ts`) so the dashboard looks and
behaves like a real internal tool without requiring a populated production
database — clearly labelled as demo data in the UI.

## Authentication

Supabase Auth (email/password). `src/lib/supabase/client.ts` and
`.../server.ts` return `null` when Supabase env vars aren't set, and every
call site checks for that, so the whole app — including sign-up prompts —
degrades gracefully to "accounts unavailable in this environment" rather than
crashing. `src/app/admin/layout.tsx` enforces admin-only access via a small
pure function (`src/lib/auth-guard.ts`, unit tested) plus Postgres RLS as a
second line of defence.

## Demo mode

When `OPENAI_API_KEY` is absent, `isAIAvailable()` returns `false` and:

- Requirement extraction, clarification, explanations and list optimisation
  all use deterministic, rule-based implementations.
- The discover flow shows a "Demo mode" badge.
- Five preset scenarios (laptop for university, marathon running shoes, home
  office setup, noise-cancelling headphones, small-kitchen coffee machine) are
  one click away on the discover start screen.

Separately, when Supabase env vars are absent, all *user-generated* state
(sessions, saved recommendations, shopping lists) persists to the browser's
`localStorage` instead of Postgres, using the exact same TypeScript shapes —
so the demo is fully interactive with zero configuration. Configuring
Supabase and signing in is what upgrades that same data to durable,
per-user, RLS-protected Postgres storage.

## Environment variables

See [`.env.example`](./.env.example):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEMO_MODE=true
```

All are optional. With none set, the app runs fully in local demo mode.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in only what you have
npm run dev
```

Open http://localhost:3000. Try `/discover` with a demo scenario — no keys
required.

Run tests:

```bash
npm test
```

Type-check:

```bash
npx tsc --noEmit
```

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add the environment variables from `.env.example` you want to enable
   (Supabase + OpenAI are both optional — the app works without either).
4. If using Supabase, run `supabase/schema.sql` against your project (SQL
   editor or `supabase db push`) before first deploy.
5. Deploy. No build configuration changes needed.

## Demo credentials

No seeded demo account is required — you can browse, get recommendations,
save shortlists, and build shopping lists entirely signed out. If you connect
a real Supabase project, sign up for a normal account via `/signup`; to access
`/admin`, manually set `is_admin = true` for that user's row in `profiles`.

## How a real merchant API would connect

Replace the body of `ProductService` (and the `products` table sync job) with
calls to a real product-data/merchant API (e.g. a shopping API or direct
merchant feeds). Keep the `Product` type as the contract — every other service
and every UI component depends only on that shape, not on where it came from.

## How affiliate tracking would connect

`MerchantTrackingService.recordClickAndGetRedirect` already validates that the
resolved redirect URL's hostname matches an allow-list derived from the
merchant record before redirecting (defence against open-redirect exploits).
To go live, replace `product.affiliateUrl` generation with real tracking links
issued by your affiliate network/merchant API, and extend the allow-list check
accordingly. No UI or API route changes are required.

## How this scales to multiple product-data providers

Because every caller depends on `ProductService`'s interface
(`search`, `getById`, `getByIds`, `listByCategory`, ...) rather than on
`src/lib/data/products.ts` directly, adding a second provider means:

1. Implement an adapter that maps the provider's response shape to `Product`.
2. Merge/dedupe results inside `ProductService.search` (e.g. by
   `merchantId` + normalised title, or a canonical GTIN if available).
3. Add the new merchant(s) to the `merchants` table.

No changes are required in `RecommendationService`, `AIService`, or any page —
they only ever see `Product[]`.

## Demo data / commercial disclaimer

All products, merchants, prices, and analytics figures in this build are
**synthetic demo data** created for portfolio purposes. Decidr AI does not
have, and does not claim to have, any real commercial partnerships, real
affiliate revenue, or a production product feed. `src/lib/data/products.ts`
and `src/lib/data/merchants.ts` are clearly labelled as demo data in-code and
in the UI (product detail pages note "Demo product imagery"; the homepage
marks the merchant list as demo data for this build).
