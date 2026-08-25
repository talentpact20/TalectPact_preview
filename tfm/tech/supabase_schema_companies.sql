-- ============================================================================
-- TalentPact — Tabla de empresas (cuentas del portal empresa)
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de supabase_schema_auth.sql
-- ============================================================================

create table if not exists companies (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid unique,                          -- = auth.users.id
  email         text,
  company_name  text,
  contact_name  text,
  job_title     text,
  company_size  text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_companies_user on companies(user_id);

alter table companies enable row level security;
-- El acceso va por funciones serverless (service_role). Sin políticas públicas.
