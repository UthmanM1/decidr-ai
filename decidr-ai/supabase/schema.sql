-- =============================================================================
-- DECIDR AI — Supabase / PostgreSQL schema
-- Run against a fresh Supabase project via the SQL editor or `supabase db push`.
-- =============================================================================

create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- profiles (mirrors auth.users, extended with app-specific fields)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- -----------------------------------------------------------------------------
-- merchants (demo/synthetic commercial data)
-- -----------------------------------------------------------------------------
create table if not exists public.merchants (
  id text primary key,
  name text not null,
  domain text not null,
  status text not null default 'active' check (status in ('active', 'paused')),
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- products (demo catalogue; swap for a synced product-data-provider table)
-- -----------------------------------------------------------------------------
create table if not exists public.products (
  id text primary key,
  title text not null,
  brand text not null,
  category text not null,
  subcategory text,
  price numeric(10,2) not null,
  currency text not null default 'GBP',
  rating numeric(2,1) not null default 0,
  review_count integer not null default 0,
  image text,
  description text,
  specifications jsonb not null default '{}',
  features jsonb not null default '[]',
  availability text not null default 'in_stock',
  merchant_id text references public.merchants(id),
  product_url text,
  affiliate_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_merchant on public.products(merchant_id);
create index if not exists idx_products_price on public.products(price);

-- -----------------------------------------------------------------------------
-- recommendation_sessions / requirements / clarification / recommendations
-- -----------------------------------------------------------------------------
create table if not exists public.recommendation_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'clarifying', 'completed', 'abandoned')),
  raw_input text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sessions_user on public.recommendation_sessions(user_id);

alter table public.recommendation_sessions enable row level security;

create policy "Users can access their own sessions"
  on public.recommendation_sessions for all
  using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id or user_id is null);

create table if not exists public.requirements (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references public.recommendation_sessions(id) on delete cascade,
  category text,
  subcategory text,
  budget_min numeric(10,2),
  budget_max numeric(10,2),
  currency text default 'GBP',
  use_cases jsonb default '[]',
  must_have_features jsonb default '[]',
  preferred_features jsonb default '[]',
  excluded_features jsonb default '[]',
  priorities jsonb default '[]',
  constraints jsonb default '[]',
  brand_preferences jsonb default '[]',
  brand_exclusions jsonb default '[]',
  portability_preference text,
  performance_preference text,
  value_preference text,
  raw_input text,
  confidence numeric(3,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_requirements_session on public.requirements(session_id);

create table if not exists public.clarification_questions (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references public.recommendation_sessions(id) on delete cascade,
  requirement_field text not null,
  question text not null,
  type text not null check (type in ('single_select', 'multi_select', 'text')),
  options jsonb default '[]',
  created_at timestamptz not null default now()
);

create table if not exists public.clarification_answers (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid references public.clarification_questions(id) on delete cascade,
  session_id uuid references public.recommendation_sessions(id) on delete cascade,
  requirement_field text not null,
  value jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.recommendations (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references public.recommendation_sessions(id) on delete cascade,
  requirement_id uuid references public.requirements(id) on delete set null,
  explanation_source text default 'deterministic_fallback',
  generated_at timestamptz not null default now()
);

create table if not exists public.recommendation_items (
  id uuid primary key default uuid_generate_v4(),
  recommendation_id uuid references public.recommendations(id) on delete cascade,
  product_id text references public.products(id),
  overall_score numeric(5,2) not null,
  score_breakdown jsonb not null,
  matched_requirements jsonb default '[]',
  tradeoffs jsonb default '[]',
  warnings jsonb default '[]',
  reasons jsonb default '[]',
  badge text,
  rank integer not null
);

create index if not exists idx_rec_items_recommendation on public.recommendation_items(recommendation_id);

-- -----------------------------------------------------------------------------
-- saved recommendations, shopping lists
-- -----------------------------------------------------------------------------
create table if not exists public.saved_recommendations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  session_id uuid references public.recommendation_sessions(id) on delete set null,
  name text not null,
  category text,
  product_ids jsonb default '[]',
  status text not null default 'saved' check (status in ('saved', 'purchased', 'archived')),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.saved_recommendations enable row level security;

create policy "Users manage their own saved recommendations"
  on public.saved_recommendations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.shopping_lists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  budget numeric(10,2),
  currency text default 'GBP',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shopping_lists enable row level security;

create policy "Users manage their own shopping lists"
  on public.shopping_lists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.shopping_list_items (
  id uuid primary key default uuid_generate_v4(),
  list_id uuid references public.shopping_lists(id) on delete cascade,
  product_id text references public.products(id),
  position integer not null default 0,
  added_at timestamptz not null default now()
);

alter table public.shopping_list_items enable row level security;

create policy "Users manage items on their own lists"
  on public.shopping_list_items for all
  using (exists (
    select 1 from public.shopping_lists l
    where l.id = shopping_list_items.list_id and l.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.shopping_lists l
    where l.id = shopping_list_items.list_id and l.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- merchant click tracking
-- -----------------------------------------------------------------------------
create table if not exists public.merchant_clicks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  session_id uuid,
  recommendation_id uuid,
  product_id text references public.products(id),
  merchant_id text references public.merchants(id),
  source text,
  created_at timestamptz not null default now()
);

create index if not exists idx_merchant_clicks_merchant on public.merchant_clicks(merchant_id);
create index if not exists idx_merchant_clicks_product on public.merchant_clicks(product_id);

-- -----------------------------------------------------------------------------
-- analytics + AI usage
-- -----------------------------------------------------------------------------
create table if not exists public.analytics_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  session_id uuid,
  name text not null,
  properties jsonb default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_analytics_events_name on public.analytics_events(name);
create index if not exists idx_analytics_events_created on public.analytics_events(created_at);

create table if not exists public.ai_usage (
  id uuid primary key default uuid_generate_v4(),
  feature text not null,
  provider text not null,
  model text,
  success boolean not null,
  estimated_tokens integer default 0,
  estimated_cost_usd numeric(10,5) default 0,
  latency_ms integer,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_usage_feature on public.ai_usage(feature);

-- Admin-only read access to analytics + AI usage (no public policy = default deny).
alter table public.analytics_events enable row level security;
alter table public.ai_usage enable row level security;
alter table public.merchant_clicks enable row level security;

create policy "Admins can read analytics events"
  on public.analytics_events for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy "Admins can read AI usage"
  on public.ai_usage for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy "Admins can read merchant clicks"
  on public.merchant_clicks for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- Server-side (service role) inserts bypass RLS by design — the AnalyticsService
-- and MerchantTrackingService write using the service role key, never the
-- anon key, so client code cannot forge events.

-- -----------------------------------------------------------------------------
-- user preferences
-- -----------------------------------------------------------------------------
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_currency text default 'GBP',
  brand_affinities jsonb default '[]',
  price_preference text default 'balanced',
  notify_on_price_drops boolean default false,
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "Users manage their own preferences"
  on public.user_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
