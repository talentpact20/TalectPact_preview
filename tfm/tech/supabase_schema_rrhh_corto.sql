-- ============================================================================
-- TalentPact — Corto plazo RRHH: preguntas de vacante, avisos, pipeline
-- Pegar entero en Supabase → SQL Editor → Run
-- (Tras supabase_schema_pool_fix.sql y supabase_schema_jobs.sql)
-- ============================================================================

-- 1) Preguntas / escenarios de la vacante (máx. 3, texto corto)
alter table jobs add column if not exists culture_questions jsonb not null default '[]'::jsonb;

-- 2) Avisos al candidato (p. ej. desbloqueo de contacto)
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  type       text not null,
  title      text not null,
  body       text not null default '',
  meta       jsonb not null default '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user
  on notifications(user_id, created_at desc);
alter table notifications enable row level security;

-- 3) Pipeline por oferta
create table if not exists applications (
  id                   uuid primary key default gen_random_uuid(),
  job_id               uuid not null references jobs(id) on delete cascade,
  candidate_profile_id uuid not null references profiles(id) on delete cascade,
  company_user_id      uuid not null,
  status               text not null default 'aplicado'
    check (status in ('aplicado','retos','preseleccionado','entrevista','contratado','descartado')),
  reason               text,
  updated_at           timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  unique (job_id, candidate_profile_id)
);
create index if not exists idx_applications_job on applications(job_id, status);
create index if not exists idx_applications_company on applications(company_user_id);
alter table applications enable row level security;

-- Comprobación
select 'jobs.culture_questions' as pieza, count(*)::text as ok
from information_schema.columns
where table_schema='public' and table_name='jobs' and column_name='culture_questions'
union all
select 'notifications', to_regclass('public.notifications')::text
union all
select 'applications', to_regclass('public.applications')::text;
