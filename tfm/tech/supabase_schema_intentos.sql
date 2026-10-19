-- ============================================================================
-- TalentPact — Intento oficial único por reto, cámara obligatoria y solicitudes
-- docs/plan_post_reunion/08_seguridad_antitrampas.md · netlify/functions/lib/intentos.js
-- Pegar entero en Supabase → SQL Editor → Run
--
-- Un intento por persona y reto (los anulados no cuentan). Abrir el reto lo
-- consume; para repetir, la persona lo pide explicando el motivo y una persona
-- de TalentPact lo aprueba: al aprobarlo, el intento anterior se anula solo.
-- Mientras no se ejecute, los retos funcionan sin control de intento.
-- ============================================================================

create table if not exists attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null,
  challenge_id  text not null,
  estado        text not null default 'abierto' check (estado in ('abierto','entregado','caducado','anulado')),
  abierto_en    timestamptz not null default now(),
  expira_en     timestamptz not null,
  entregado_en  timestamptz,
  camara        text,                 -- activa | alternativa_aprobada
  evaluation_id uuid,
  created_at    timestamptz not null default now()
);
-- Uno por persona y reto: la base de datos lo garantiza aunque lleguen dos peticiones a la vez.
create unique index if not exists attempts_uno_por_reto on attempts(user_id, challenge_id) where estado <> 'anulado';
create index if not exists attempts_user on attempts(user_id);

create table if not exists attempt_requests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null,
  tipo          text not null check (tipo in ('reapertura','sin_camara')),
  challenge_id  text,                 -- null en sin_camara (vale para todos los retos)
  motivo        text not null,
  estado        text not null default 'pendiente' check (estado in ('pendiente','aprobada','rechazada')),
  nota          text,                 -- respuesta de TalentPact a la persona
  resuelto_en   timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists attempt_requests_user on attempt_requests(user_id);
create index if not exists attempt_requests_pendientes on attempt_requests(estado) where estado = 'pendiente';

-- Al aprobar una reapertura, el intento anterior se anula y la persona puede volver a empezar.
create or replace function tp_aprobar_reapertura() returns trigger language plpgsql as $$
begin
  if new.tipo = 'reapertura' and new.estado = 'aprobada' and old.estado is distinct from 'aprobada' then
    update attempts set estado = 'anulado'
      where user_id = new.user_id and challenge_id = new.challenge_id and estado <> 'anulado';
    new.resuelto_en := coalesce(new.resuelto_en, now());
  end if;
  return new;
end $$;
drop trigger if exists attempt_requests_aprobar on attempt_requests;
create trigger attempt_requests_aprobar before update on attempt_requests
  for each row execute function tp_aprobar_reapertura();

-- Acceso solo por las funciones del servidor (service_role). Sin políticas públicas.
alter table attempts enable row level security;
alter table attempt_requests enable row level security;

-- Para resolver una solicitud (hasta que esté en el backoffice):
--   update attempt_requests set estado = 'aprobada', nota = 'Aprobada: problema técnico comprobado' where id = '…';
--   update attempt_requests set estado = 'rechazada', nota = 'Motivo: …' where id = '…';

-- Comprobación
select 'attempts' as tabla, count(*) from attempts
union all select 'attempt_requests', count(*) from attempt_requests;
