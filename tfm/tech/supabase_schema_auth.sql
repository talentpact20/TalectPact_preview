-- ============================================================================
-- TalentPact — Actualización de esquema para cuentas (Supabase Auth) + progreso
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de supabase_schema.sql
-- ============================================================================

-- Vincular el perfil con el usuario de Supabase Auth y guardar datos de perfil.
alter table profiles add column if not exists user_id  uuid unique;   -- = auth.users.id
alter table profiles add column if not exists email    text;
alter table profiles add column if not exists full_name text;
alter table profiles add column if not exists sector   text;
alter table profiles add column if not exists phone    text;
alter table profiles add column if not exists linkedin text;

-- Índice para buscar el perfil por usuario autenticado.
create index if not exists idx_profiles_user on profiles(user_id);

-- Nota de seguridad:
--   RLS sigue activada en las tres tablas. El acceso a datos se hace SIEMPRE
--   a través de las funciones serverless (service_role, que hace bypass de RLS).
--   El navegador solo usa la clave anon para AUTENTICAR (login/registro),
--   nunca para leer/escribir datos directamente. Por eso no abrimos políticas
--   públicas de SELECT/INSERT aquí.
