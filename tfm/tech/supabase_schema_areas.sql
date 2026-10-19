-- ============================================================================
-- TalentPact — Área funcional y especialidad en la oferta (vocabulario tipo LinkedIn)
-- docs/plan_post_reunion/01_sectores_areas_y_vocabulario.md · netlify/functions/lib/taxonomia.json
-- Pegar entero en Supabase → SQL Editor → Run (tras supabase_schema_verificacion.sql)
--
-- Área = qué hace la persona en el puesto (7 áreas). Sector = a qué se dedica la
-- empresa (12 sectores, en companies.sector). jobs.sector sigue guardando el
-- valor antiguo (IT, Finance…) para el código que aún lo lee.
-- Mientras no se ejecute, la web deduce el área del sector antiguo.
-- ============================================================================

alter table jobs add column if not exists area text;
alter table jobs add column if not exists especialidad text;

-- Ofertas ya publicadas: área deducida del sector antiguo.
update jobs set area = case sector
  when 'Legal' then 'juridica'   when 'Finance' then 'finanzas'
  when 'Marketing' then 'marketing' when 'Sales' then 'marketing'
  when 'Ops' then 'operaciones'  when 'Business' then 'operaciones'
  when 'RRHH' then 'rrhh'
  when 'IT' then 'tecnologia'    when 'Data' then 'tecnologia' when 'Design' then 'tecnologia'
  else null end
where area is null;

-- Comprobación
select area, count(*) from jobs group by area order by 2 desc;
