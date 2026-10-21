-- ============================================================================
-- TalentPact — Preguntas de cribado de la oferta (contrato y descarte)
-- Pegar entero en Supabase → SQL Editor → Run
-- (Tras supabase_schema_dilemmas.sql)
-- ============================================================================

-- 1) Hasta 6 preguntas de sí o no que pone la empresa al publicar:
--    [{ id, grupo: contrato|requisito, texto, esperada: si|no|"", eliminatoria }]
alter table jobs add column if not exists screening jsonb not null default '[]'::jsonb;

-- 2) Respuestas del candidato al postularse y si cumple las eliminatorias.
--    No descarta a nadie: la empresa lo ve marcado y decide ella.
alter table applications add column if not exists screening_answers jsonb not null default '[]'::jsonb;

-- Comprobación
select 'jobs.screening' as pieza, count(*)::text as ok
from information_schema.columns
where table_schema = 'public' and table_name = 'jobs' and column_name = 'screening'
union all
select 'applications.screening_answers', count(*)::text
from information_schema.columns
where table_schema = 'public' and table_name = 'applications' and column_name = 'screening_answers';
