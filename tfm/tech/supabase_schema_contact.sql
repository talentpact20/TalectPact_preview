-- ============================================================================
-- TalentPact — Mensajes del formulario de contacto ("Hablemos")
-- Ejecutar en el SQL Editor de Supabase.
--
-- Reemplaza a Netlify Forms tras la migración a Vercel: el formulario ahora
-- envía a la función api/_handlers/contact.js y esta inserta aquí.
-- ============================================================================

create table if not exists contact_messages (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null,
  profile_type  text,                                 -- Inversor / Empresa / ...
  message       text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_contact_messages_created on contact_messages(created_at desc);

alter table contact_messages enable row level security;
-- El acceso va por funciones serverless (service_role). Sin políticas públicas.
