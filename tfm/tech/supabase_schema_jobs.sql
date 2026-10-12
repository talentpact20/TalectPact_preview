-- ============================================================================
-- Ofertas de empleo reales y ficha pública de empresa.
-- Ejecutar en Supabase → SQL Editor después de supabase_schema_companies.sql.
-- ============================================================================

-- Ficha de empresa visible para candidatos en cada oferta.
alter table companies add column if not exists description text;
alter table companies add column if not exists sector      text;
alter table companies add column if not exists website     text;
alter table companies add column if not exists location    text;

create table if not exists jobs (
  id               uuid primary key default gen_random_uuid(),
  company_user_id  uuid not null,                         -- quien publica (auth.users)
  company_id       uuid references companies(id) on delete cascade,
  title            text not null check (char_length(title) between 3 and 120),
  sector           text not null,
  description      text not null check (char_length(description) between 20 and 4000),
  required_skills  text[] not null default '{}',
  tags             text[] not null default '{}',
  required_level   text not null default 'basico'
                   check (required_level in ('basico','intermedio','avanzado')),
  exercise_config  text not null default 'common+custom'
                   check (exercise_config in ('common','common+custom','custom','contact')),
  jornada          text check (jornada in ('completa','parcial','horas','practicas')),
  modalidad        text check (modalidad in ('remoto','hibrido','presencial')),
  contrato         text check (contrato in ('indefinido','temporal','freelance','practicas')),
  ubicacion        text,
  sal_min          integer check (sal_min is null or sal_min >= 0),
  sal_max          integer check (sal_max is null or sal_max >= 0),
  status           text not null default 'open' check (status in ('open','closed')),
  created_at       timestamptz not null default now(),
  closed_at        timestamptz,
  constraint jobs_salario check (sal_min is null or sal_max is null or sal_min <= sal_max)
);

create index if not exists idx_jobs_status  on jobs(status, created_at desc);
create index if not exists idx_jobs_company on jobs(company_user_id);

-- Solo las funciones serverless (service role) escriben. La lectura pública
-- también va por función (list-jobs), que nunca expone company_user_id.
alter table jobs enable row level security;
