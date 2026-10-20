-- ============================================================================
-- TalentPact — Seguridad: límite de frecuencia persistente
-- lib/limites.js · Pegar entero en Supabase → SQL Editor → Run. Se puede repetir.
--
-- Cuenta las llamadas a las funciones caras (corrector con IA, chat de ayuda,
-- lectura de documentos) y a las públicas (verificar un SkillPass) aunque la
-- función arranque en frío o tenga varias instancias. La clave es un hash: no
-- se guardan IPs ni ids en claro. Las filas de más de un día se borran solas.
-- ============================================================================

create table if not exists rate_events (
  id         bigserial primary key,
  key        text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_rate_events_key on rate_events(key, created_at desc);
create index if not exists idx_rate_events_fecha on rate_events(created_at);
alter table rate_events enable row level security;   -- solo funciones del servidor

-- Comprobación
select 'rate_events' as pieza, to_regclass('public.rate_events')::text as ok;
