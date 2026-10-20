-- ============================================================================
-- TalentPact — SkillPass v2: credencial W3C firmada, revocación, caducidad y
-- sello por lotes (árbol de Merkle en capa 2).
-- docs/plan_post_reunion/03_blockchain_de_pago.md · lib/vc.js · lib/merkle.js
-- Pegar entero en Supabase → SQL Editor → Run. Se puede repetir.
-- (Tras supabase_schema.sql y supabase_schema_sello.sql)
-- ============================================================================

-- 1) Credenciales: formato, revocación, caducidad y datos del sello por lotes
alter table credentials add column if not exists format            text not null default 'v1';
alter table credentials add column if not exists status_index      integer;
alter table credentials add column if not exists valid_until       timestamptz;
alter table credentials add column if not exists revoked_at        timestamptz;
alter table credentials add column if not exists revocation_reason text;
-- Sal de 32 bytes de la hoja de Merkle. Al borrar la cuenta se borra con la
-- credencial: sin ella, la hoja publicada en la cadena no se vincula a nadie.
alter table credentials add column if not exists salt              text;
alter table credentials add column if not exists seal_paid_at      timestamptz;
alter table credentials add column if not exists batch_id          uuid;
alter table credentials add column if not exists merkle_leaf       text;
alter table credentials add column if not exists merkle_proof      jsonb;

-- Un índice de la lista de revocación por credencial (se asigna al azar).
create unique index if not exists uq_credentials_status_index on credentials(status_index) where status_index is not null;
create index if not exists idx_credentials_cola_sello on credentials(seal_paid_at) where batch_id is null;
create index if not exists idx_credentials_revocadas on credentials(status_index) where revoked_at is not null;

-- 2) Lotes diarios publicados en la cadena
create table if not exists anchor_batches (
  id          uuid primary key default gen_random_uuid(),
  root        text not null unique,
  leaves      integer not null check (leaves > 0),
  chain       text not null,
  contract    text,
  tx_hash     text,
  status      text not null default 'enviando'
              check (status in ('enviando','enviado','confirmado','fallido')),
  error       text,
  anchored_at timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists idx_anchor_batches_status on anchor_batches(status, created_at);
alter table anchor_batches enable row level security;   -- solo funciones del servidor

alter table credentials drop constraint if exists credentials_batch_fk;
alter table credentials add constraint credentials_batch_fk
  foreign key (batch_id) references anchor_batches(id) on delete set null;

-- 3) Las credenciales selladas antes (contrato v1) ya tienen el sello pagado.
update credentials c
   set seal_paid_at = coalesce(c.seal_paid_at, p.paid_at)
  from seal_payments p
 where p.credential_id = c.id and p.status = 'paid' and c.seal_paid_at is null;

-- Comprobación
select 'credentials.format' as pieza, count(*)::text as ok
  from information_schema.columns
 where table_schema='public' and table_name='credentials' and column_name='format'
union all
select 'anchor_batches', to_regclass('public.anchor_batches')::text;
