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
  chain        text  not null default 'polygon-amoy',
  tx_hash      text,                                   -- transacción de anclaje
  block_number bigint,
  anchored_at  timestamptz,
  created_at   timestamptz not null default now()
);
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
