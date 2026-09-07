# Architecture

## Layered overview

```
┌─────────────────────────────────────────────────────────────────────┐
│ UI (App Router pages + client components)                           │
│  /, /discover, /discover/session/[id], /recommendations(/[id]),     │
│  /compare, /lists(/[id]), /profile, /login, /signup, /admin/*       │
└───────────────┬───────────────────────────────────────────────────┬─┘
                │ fetch()                                            │ (server components read
                ▼                                                    │  services directly)
┌───────────────────────────────┐                                   │
│ API routes (src/app/api/*)     │◄──────────────────────────────────┘
│  extract-requirements, clarify,│
│  recommend, optimize-list,     │
│  merchant-click, products,     │
│  ai-status                     │
└───────────────┬────────────────┘
                │ calls
                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Service layer (src/lib/services/*) — the only layer with business    │
│ logic and the only layer allowed to touch data/AI                    │
│                                                                        │
│  ProductService         → src/lib/data/products.ts (demo catalogue)  │
│  RecommendationService  → deterministic scoring, uses ProductService │
│  AIService (server-only)→ OpenAI or deterministic fallback           │
│  AnalyticsService       → analytics_events / ai_usage                │
│  MerchantTrackingService→ merchant_clicks + validated redirects      │
│  UserPreferenceService  → user_preferences                           │
└───────────────┬────────────────────────────────────────────────────┘
                │ (when configured)
                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Supabase Postgres — see supabase/schema.sql, RLS-protected           │
└─────────────────────────────────────────────────────────────────────┘
```

Demo-mode persistence for signed-out / no-Supabase browsing lives in
`src/lib/local-store.ts` (browser `localStorage`, same TypeScript shapes as
the Postgres tables) so the entire user-facing app works with zero backend
configured.

## Request lifecycle: a discovery session

1. **`POST /api/extract-requirements`** — `{ rawInput }` → `AIService.extractRequirements`
   parses free text into a `StructuredRequirement` (category, budget, use
   cases, must-have features, confidence, missing fields). Analytics events:
   `session_started`, `requirement_submitted`, `requirements_extracted`.
   `AIService.generateClarificationQuestions` returns 2–4 template-driven
   questions targeting the requirement's missing/ambiguous fields.
2. Client renders the extracted requirement, then steps through clarification
   questions (with back navigation), collecting `ClarificationAnswer[]`.
3. **`POST /api/clarify`** — `applyClarificationAnswers` (pure function) merges
   answers into the requirement (e.g. sets `budgetMax`, `portabilityPreference`,
   pushes a `battery_life` priority). Analytics: `clarification_answered`.
4. **`POST /api/recommend`** — `RecommendationService.generate(requirement)`:
   - Loads candidates via `ProductService.listByCategory` / `listAll`
   - Filters out excluded brands/features
   - Scores every candidate with `scoreProduct()` (10-factor breakdown,
     weighted sum, hard penalties for category mismatch / out-of-stock)
   - Sorts descending, takes top 8, assigns `best_overall` / `best_value` /
     `best_performance` badges
   - `AIService.explainRecommendation` phrases (does not compute) an
     explanation for the top 5 items
   - Analytics: `recommendation_generated`
5. Client renders `RecommendationCard`s; saving persists a `SavedRecommendation`
   (local or Postgres); clicking "View at merchant" calls
   **`POST /api/merchant-click`**, which validates the product/merchant, records
   a `MerchantClickEvent`, and returns a redirect URL whose hostname is checked
   against an allow-list before the browser navigates.

## Why the scoring engine is deterministic

The brief explicitly requires that recommendation scores never come from an
LLM. `scoreProduct()` in `recommendation-service.ts` is a pure function:
given the same `Product` and `StructuredRequirement`, it always returns the
same `ScoredProduct`. This makes recommendations reproducible, testable
(see `src/tests/recommendation-service.test.ts`), and free of hallucinated
scoring — the AI layer only ever phrases an explanation of a number that
already exists.

## Security notes

- `AIService` is marked `import "server-only"` — attempting to import it from
  a client component fails at build time. `OPENAI_API_KEY` is read only via
  `process.env` inside that file and never serialized to the client.
- Supabase's **service role key** is only used in `createAdminClient()`
  (`src/lib/supabase/server.ts`), never imported by client components.
- All API routes validate request bodies with `zod` schemas before touching
  any service.
- `MerchantTrackingService` validates the resolved redirect URL's hostname
  against an allow-list derived from the merchant record — defence against
  open-redirect abuse even if `affiliateUrl` data were ever compromised.
- Row Level Security policies (see `supabase/schema.sql`) enforce that a user
  can only read/write their own `recommendation_sessions`,
  `saved_recommendations`, `shopping_lists`, `shopping_list_items`, and
  `user_preferences` rows. `analytics_events`, `ai_usage`, and
  `merchant_clicks` are admin-read-only; inserts happen only via the service
  role key from server-side service code, so client code cannot forge events.
- `/admin/*` is protected by `canAccessAdmin()` (`src/lib/auth-guard.ts`,
  unit tested) in `src/app/admin/layout.tsx`, which redirects unauthenticated
  or non-admin users when Supabase is configured.

## Extending the scoring weights

`SCORE_WEIGHTS` in `recommendation-service.ts` is a single exported constant.
Changing a weight (or adding a new scored factor) requires: adding the factor
to `ScoreBreakdown` in `types.ts`, implementing a `scoreX()` function, adding
it to the weighted sum in `scoreProduct()`, and adjusting `SCORE_WEIGHTS` so
the weights still sum to 1.0 (enforced by a test).

## API surface (internal service contracts)

| Service                   | Key methods                                                                 |
| -------------------------- | ---------------------------------------------------------------------------- |
| `ProductService`           | `listAll`, `getById`, `getByIds`, `listByCategory`, `search`, `listCategories`, `listBrandsForCategory` |
| `RecommendationService`    | `generate(requirement): RecommendationResult`                               |
| `AIService` (functions)    | `extractRequirements`, `generateClarificationQuestions`, `applyClarificationAnswers`, `explainRecommendation`, `optimizeShoppingList`, `isAIAvailable` |
| `AnalyticsService`         | `track(name, properties, userId?, sessionId?)`, `recordAIUsage(record)`, `getMemoryEvents`, `getMemoryAIUsage` |
| `MerchantTrackingService`  | `recordClickAndGetRedirect(params)`, `getMemoryClicks`                      |
| `UserPreferenceService`    | `get(userId)`, `update(userId, patch)`                                      |

## Known simplifications (documented, not hidden)

- Admin dashboard charts use a **deterministic seeded mock dataset**
  (`mock-analytics.ts`) rather than live SQL aggregation, since a portfolio
  deployment has no real user traffic to aggregate. Live in-memory events from
  the current server process are shown alongside where available (e.g.
  `/admin/events`, `/admin/ai-usage`). Swapping to live queries means
  replacing the imports in `src/app/admin/*/page.tsx` with Supabase queries
  against `analytics_events` / `ai_usage` / `merchant_clicks`.
- In-memory buffers in `AnalyticsService`/`MerchantTrackingService` are
  per-process and not durable on serverless platforms with multiple
  instances — they exist to make the admin dashboard show *something live*
  in local development; production observability should read from Postgres.
- Signed-out/no-Supabase persistence uses `localStorage`, scoped to one
  browser — this is a demo-mode convenience, not a substitute for the
  Postgres schema, which is the intended production data layer (and is
  fully defined and RLS-protected in `supabase/schema.sql` regardless of
  whether it's wired up in this environment).
