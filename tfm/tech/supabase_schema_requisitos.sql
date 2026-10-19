-- ============================================================================
-- TalentPact — Requisitos de skill en la oferta: imprescindible o valorable,
-- con banda mínima por skill (docs/plan_post_reunion/skills_en_la_plataforma.md)
-- Pegar entero en Supabase → SQL Editor → Run (tras supabase_schema_dilemmas.sql)
--
-- Forma: [{ "skill": "Comunicación Escrita", "peso": "imprescindible",
--           "minimo": "bueno" }]   (máx. 8; hasta 4 imprescindibles)
-- required_skills y required_level se siguen rellenando (derivados) para que
-- el pool, las tarjetas y las ofertas antiguas funcionen igual.
-- Mientras no se ejecute, la web guarda y lee las ofertas sin esta columna.
-- ============================================================================

alter table jobs add column if not exists skill_requirements jsonb not null default '[]'::jsonb;

-- Comprobación
select 'jobs.skill_requirements' as pieza, count(*)::text as ok
from information_schema.columns
where table_schema = 'public' and table_name = 'jobs' and column_name = 'skill_requirements';
