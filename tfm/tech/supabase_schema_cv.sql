-- ============================================================================
-- TalentPact — Currículum en PDF del candidato
-- Pegar entero en Supabase → SQL Editor → Run
-- ============================================================================

-- 1) Bucket PRIVADO: sin políticas para anon ni authenticated, así que solo la
--    service key del servidor (función cv) lee y escribe. La empresa recibe un
--    enlace firmado de 5 minutos y solo si ha desbloqueado al candidato.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cvs', 'cvs', false, 4194304, array['application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2) Datos del archivo en el perfil: { nombre, bytes, subido }. El PDF no se
--    guarda aquí; el pool solo dice si existe.
alter table profiles add column if not exists cv jsonb;

-- Comprobación: el bucket debe salir con public = false.
select 'bucket cvs' as pieza, coalesce((select (not public)::text from storage.buckets where id = 'cvs'), 'falta') as ok
union all
select 'profiles.cv', count(*)::text
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles' and column_name = 'cv';
