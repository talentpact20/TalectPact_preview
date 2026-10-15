-- ============================================================================
-- TalentPact — Dilemas del día a día en la oferta (doc 08)
-- Pegar entero en Supabase → SQL Editor → Run
-- (Tras supabase_schema_rrhh_corto.sql)
-- ============================================================================

-- 1) Hasta 3 dilemas que escribe la empresa al publicar
alter table jobs add column if not exists dilemmas jsonb not null default '[]'::jsonb;

-- 2) Respuestas del candidato a esos dilemas (al postularse)
alter table applications add column if not exists dilemma_answers jsonb not null default '[]'::jsonb;

-- Comprobación
select 'jobs.dilemmas' as pieza, count(*)::text as ok
from information_schema.columns
where table_schema = 'public' and table_name = 'jobs' and column_name = 'dilemmas'
union all
select 'applications.dilemma_answers', count(*)::text
from information_schema.columns
where table_schema = 'public' and table_name = 'applications' and column_name = 'dilemma_answers';
