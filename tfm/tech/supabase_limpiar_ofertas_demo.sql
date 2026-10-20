-- ============================================================================
-- TalentPact — Borrar las empresas y ofertas de ejemplo del antiguo seed
-- Pegar entero en Supabase → SQL Editor → Run. Se puede repetir sin riesgo.
--
-- El seed (supabase_seed_ofertas_demo.sql, ya retirado) creó 4 empresas
-- ficticias con correos *.demo.talentpact.es y 8 ofertas abiertas. Su propia
-- limpieza no funcionaba: buscaba '%@demo.talentpact.es' y los correos eran
-- rrhh@nortepay.demo.talentpact.es, así que nunca coincidía.
-- Aquí se borra por los ids fijos del seed y por el dominio correcto.
-- No toca ninguna cuenta real.
-- ============================================================================

-- Postulaciones a esas ofertas (si la tabla existe; si no, ignorar el error de esta línea)
delete from applications
 where job_id in (
   select id from jobs
    where company_id in (select id from companies
                          where id in ('a1111111-1111-4111-8111-111111111111',
                                       'a2222222-2222-4222-8222-222222222222',
                                       'a3333333-3333-4333-8333-333333333333',
                                       'a4444444-4444-4444-8444-444444444444')
                             or email like '%.demo.talentpact.es')
 );

delete from jobs
 where company_id in (select id from companies
                       where id in ('a1111111-1111-4111-8111-111111111111',
                                    'a2222222-2222-4222-8222-222222222222',
                                    'a3333333-3333-4333-8333-333333333333',
                                    'a4444444-4444-4444-8444-444444444444')
                          or email like '%.demo.talentpact.es');

delete from companies
 where id in ('a1111111-1111-4111-8111-111111111111',
              'a2222222-2222-4222-8222-222222222222',
              'a3333333-3333-4333-8333-333333333333',
              'a4444444-4444-4444-8444-444444444444')
    or email like '%.demo.talentpact.es';

-- Comprobación: las dos cifras deben ser 0
select 'empresas de ejemplo' as que, count(*) as quedan
  from companies where email like '%.demo.talentpact.es'
union all
select 'ofertas de ejemplo', count(*)
  from jobs where company_id in ('a1111111-1111-4111-8111-111111111111',
                                 'a2222222-2222-4222-8222-222222222222',
                                 'a3333333-3333-4333-8333-333333333333',
                                 'a4444444-4444-4444-8444-444444444444');
