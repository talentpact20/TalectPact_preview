-- ============================================================================
-- TalentPact — Esquema Supabase (Postgres) para el demo del TFM
-- Ejecutar en el SQL Editor de Supabase (proyecto en región UE).
-- ============================================================================

-- Extensión para UUID (habilitada por defecto en Supabase, por si acaso).
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Perfiles de candidatos (anónimos). Los datos sensibles reales (nombre, etc.)
-- se cifran/anonimizan en producción; aquí basta un alias público.
-- ----------------------------------------------------------------------------
create table if not exists profiles (
  id           uuid primary key default gen_random_uuid(),
  display_name text,                                   -- alias público, p. ej. "Candidato #A17"
  created_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Evaluaciones de IA (audit trail — Art. 12 EU AI Act).
-- ----------------------------------------------------------------------------
create table if not exists evaluations (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references profiles(id) on delete cascade,
  challenge_id text not null,                          -- reto evaluado
  skill        text not null,                          -- competencia (p. ej. "SQL")
  score        int  not null check (score between 0 and 100),
  criteria     jsonb,                                  -- desglose por criterio
  reasoning    text,                                   -- Chain of Thought (dato personal → retención limitada)
  model_used   text,
  tokens_in    int,
  tokens_out   int,
  cost_eur     numeric(10,5),
  created_at   timestamptz not null default now()
);
create index if not exists idx_evaluations_profile on evaluations(profile_id);

-- ----------------------------------------------------------------------------
-- Credenciales verificables (SkillPass) ancladas en blockchain.
-- ----------------------------------------------------------------------------
create table if not exists credentials (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references profiles(id) on delete cascade,
  cv_json      jsonb not null,                         -- el SkillPass CV completo (off-chain)
  cv_hash      text  not null,                         -- keccak256(cv_json) en hex (0x...)
  chain        text  not null default 'ethereum-sepolia',  -- debe coincidir con CHAIN.slug
  tx_hash      text,                                   -- transacción de anclaje
  block_number bigint,
  anchored_at  timestamptz,
  created_at   timestamptz not null default now()
);
-- Instalaciones anteriores tienen el default antiguo ('polygon-amoy') y quiza
-- filas con ese valor. `create table if not exists` no las corrige, asi que si
-- vienes de una version previa ejecuta a mano:
--   alter table credentials alter column chain set default 'ethereum-sepolia';
--   update credentials set chain = 'ethereum-sepolia' where chain = 'polygon-amoy';

create index if not exists idx_credentials_profile on credentials(profile_id);
create unique index if not exists uq_credentials_hash on credentials(cv_hash);

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- Para el demo, las funciones serverless usan la SERVICE ROLE KEY (bypass RLS).
-- Estas políticas dejan el modelo listo para cuando haya auth de candidatos.
-- ----------------------------------------------------------------------------
alter table profiles    enable row level security;
alter table evaluations enable row level security;
alter table credentials enable row level security;

-- Verificación pública de credenciales: permitir lectura del hash/estado on-chain
-- (no expone datos personales; el cv_json se consulta solo vía función controlada).
-- En el demo la verificación se hace por función serverless, así que no abrimos SELECT anónimo por defecto.

-- ----------------------------------------------------------------------------
-- Desbloqueos de contacto (pago por resultado, €49)
--
-- El desbloqueo NO se concede en el navegador: se crea aqui en estado
-- 'pending' al abrir Stripe Checkout y solo pasa a 'paid' cuando Stripe
-- confirma el cobro (webhook, o verificacion contra la API al volver).
-- Asi un `_unlocked=true` escrito desde la consola no da acceso a nada.
-- ----------------------------------------------------------------------------
create table if not exists unlocks (
  id                    uuid primary key default gen_random_uuid(),
  company_user_id       uuid not null,                  -- quien paga (auth.users)
  candidate_ref         text not null,                  -- id del candidato en el pool
  candidate_label       text,                           -- etiqueta legible para el historial
  amount_cents          integer not null default 4900,
  currency              text not null default 'eur',
  status                text not null default 'pending',-- pending | paid | expired | failed
  stripe_session_id     text unique,                    -- idempotencia: una sesion, una fila
  stripe_payment_intent text,
  livemode              boolean not null default false, -- false = claves de test
  created_at            timestamptz not null default now(),
  paid_at               timestamptz
);
create index if not exists idx_unlocks_company on unlocks(company_user_id);
create index if not exists idx_unlocks_status  on unlocks(company_user_id, status);
-- Una empresa no paga dos veces por el mismo candidato.
create unique index if not exists uq_unlocks_paid
  on unlocks(company_user_id, candidate_ref) where status = 'paid';

alter table unlocks enable row level security;
-- Solo las funciones serverless (service role) tocan esta tabla: el cliente
-- nunca escribe aqui, porque escribir aqui es exactamente "conceder acceso".
