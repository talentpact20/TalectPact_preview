-- ============================================================================
-- TalentPact — Verificación de empresa (Google Workspace o email corporativo)
-- Pegar entero en Supabase → SQL Editor → Run (tras supabase_schema_requisitos.sql)
--
-- La calcula el servidor (netlify/functions/lib/verificacion.js) cada vez que
-- la empresa abre su panel o guarda su ficha; aquí solo se guarda el resultado.
--   verificacion: google_workspace | email_corporativo | sin_verificar
-- Mientras no se ejecute, la web calcula la verificación pero no la guarda y
-- las ofertas no muestran «Empresa verificada».
-- ============================================================================

alter table companies add column if not exists verificacion text not null default 'sin_verificar';
alter table companies add column if not exists dominio_verificado text;
alter table companies add column if not exists verificada_en timestamptz;

-- Comprobación
select column_name as pieza, 'ok' as estado
from information_schema.columns
where table_schema = 'public' and table_name = 'companies'
  and column_name in ('verificacion', 'dominio_verificado', 'verificada_en');
