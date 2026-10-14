-- ============================================================================
-- TalentPact — Pool: columnas de empleo + unlocks (si faltan) + contact_access
-- Pegar entero en Supabase → SQL Editor → Run
-- (Arregla el error: relation "unlocks" does not exist)
-- ============================================================================

-- 1) Desbloqueos de contacto (la necesitaba contact_access)
create table if not exists unlocks (
  id                    uuid primary key default gen_random_uuid(),
  company_user_id       uuid not null,
  candidate_ref         text not null,
  candidate_label       text,
  amount_cents          integer not null default 4900,
  currency              text not null default 'eur',
  status                text not null default 'pending',
  stripe_session_id     text unique,
  stripe_payment_intent text,
  livemode              boolean not null default false,
  created_at            timestamptz not null default now(),
  paid_at               timestamptz
);
create index if not exists idx_unlocks_company on unlocks(company_user_id);
create index if not exists idx_unlocks_status  on unlocks(company_user_id, status);
create unique index if not exists uq_unlocks_paid
  on unlocks(company_user_id, candidate_ref) where status = 'paid';
alter table unlocks enable row level security;

-- 2) Preferencias / visibilidad en profiles (esto es lo que no se guardaba)
alter table profiles add column if not exists empleo       jsonb;
alter table profiles add column if not exists pool_visible boolean not null default true;
alter table profiles add column if not exists allow_contact boolean not null default true;

-- 3) Trazabilidad de contactos entregados
create table if not exists contact_access (
  id                   uuid primary key default gen_random_uuid(),
  company_user_id      uuid not null,
  candidate_profile_id uuid not null references profiles(id) on delete cascade,
  unlock_id            uuid references unlocks(id) on delete set null,
  accessed_at          timestamptz not null default now()
);
create index if not exists idx_contact_access_candidate on contact_access(candidate_profile_id);
create index if not exists idx_contact_access_company   on contact_access(company_user_id);
alter table contact_access enable row level security;

create index if not exists idx_evaluations_profile_skill on evaluations(profile_id, skill);

-- Comprobación
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
  and column_name in ('empleo','pool_visible','allow_contact')
order by column_name;
