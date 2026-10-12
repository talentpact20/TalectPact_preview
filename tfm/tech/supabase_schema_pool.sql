-- ============================================================================
-- Pool de talento real y entrega de contacto tras el pago.
-- Ejecutar en Supabase → SQL Editor después de supabase_schema.sql,
-- supabase_schema_auth.sql y supabase_schema_integrity.sql.
-- ============================================================================

-- Condiciones de empleo del candidato (jornada, modalidad, ciudad…) y si quiere
-- aparecer en el pool. Las lee get-talent-pool; nunca contienen datos personales.
alter table profiles add column if not exists empleo       jsonb;
alter table profiles add column if not exists pool_visible boolean not null default true;
-- Consentimiento del candidato a que una empresa reciba su contacto tras pagar.
-- Lo comprueban create-checkout-session (no se cobra) y get-contact (no se entrega).
alter table profiles add column if not exists allow_contact boolean not null default true;

-- Registro de cada entrega de un contacto desbloqueado: quién lo vio y cuándo.
-- Es la trazabilidad que pide el RGPD sobre un dato personal cedido a un tercero
-- y la base del aviso al candidato ("una empresa ha desbloqueado tu perfil").
create table if not exists contact_access (
  id                  uuid primary key default gen_random_uuid(),
  company_user_id     uuid not null,
  candidate_profile_id uuid not null references profiles(id) on delete cascade,
  unlock_id           uuid references unlocks(id) on delete set null,
  accessed_at         timestamptz not null default now()
);
create index if not exists idx_contact_access_candidate on contact_access(candidate_profile_id);
create index if not exists idx_contact_access_company   on contact_access(company_user_id);

-- Solo las funciones serverless (service role) leen o escriben estas filas.
alter table contact_access enable row level security;

-- Índice para que el pool agregue rápido las evaluaciones por perfil.
create index if not exists idx_evaluations_profile_skill on evaluations(profile_id, skill);
