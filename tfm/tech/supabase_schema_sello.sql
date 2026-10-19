-- ============================================================================
-- TalentPact — Sello público del SkillPass de pago (candidato)
-- docs/plan_post_reunion/03_blockchain_de_pago.md · netlify/functions/lib/sello.js
-- Pegar entero en Supabase → SQL Editor → Run
--
-- Emitir y compartir el SkillPass es gratis. Anclar su huella en blockchain
-- (sello público) se paga por credencial; anchor-credential solo ancla si hay
-- un pago `paid` de esa credencial. Mientras no se ejecute, el sello aparece
-- como «todavía no disponible».
-- ============================================================================

create table if not exists seal_payments (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null,
  credential_id         uuid not null references credentials(id) on delete cascade,
  amount_cents          integer not null,
  currency              text not null default 'eur',
  status                text not null default 'pending' check (status in ('pending','paid','expired','failed')),
  stripe_session_id     text unique,
  stripe_payment_intent text,
  livemode              boolean not null default false,
  paid_at               timestamptz,
  created_at            timestamptz not null default now()
);
create index if not exists seal_payments_cred on seal_payments(credential_id, status);

alter table seal_payments enable row level security;   -- solo funciones del servidor

-- Comprobación
select status, count(*) from seal_payments group by status;
