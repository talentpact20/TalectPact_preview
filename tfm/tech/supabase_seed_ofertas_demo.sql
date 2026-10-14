-- ============================================================================
-- TalentPact — Crear tabla jobs + empresas/ofertas de demostración
-- Pegar entero en Supabase → SQL Editor → Run
-- Idempotente: se puede volver a ejecutar; limpia solo el seed @demo.talentpact.es
-- ============================================================================

-- Ficha pública de empresa (columnas que usa list-jobs)
alter table companies add column if not exists description text;
alter table companies add column if not exists sector      text;
alter table companies add column if not exists website     text;
alter table companies add column if not exists location    text;

create table if not exists jobs (
  id               uuid primary key default gen_random_uuid(),
  company_user_id  uuid not null,
  company_id       uuid references companies(id) on delete cascade,
  title            text not null check (char_length(title) between 3 and 120),
  sector           text not null,
  description      text not null check (char_length(description) between 20 and 4000),
  required_skills  text[] not null default '{}',
  tags             text[] not null default '{}',
  required_level   text not null default 'basico'
                   check (required_level in ('basico','intermedio','avanzado')),
  exercise_config  text not null default 'common+custom'
                   check (exercise_config in ('common','common+custom','custom','contact')),
  jornada          text check (jornada in ('completa','parcial','horas','practicas')),
  modalidad        text check (modalidad in ('remoto','hibrido','presencial')),
  contrato         text check (contrato in ('indefinido','temporal','freelance','practicas')),
  ubicacion        text,
  sal_min          integer check (sal_min is null or sal_min >= 0),
  sal_max          integer check (sal_max is null or sal_max >= 0),
  status           text not null default 'open' check (status in ('open','closed')),
  created_at       timestamptz not null default now(),
  closed_at        timestamptz,
  constraint jobs_salario check (sal_min is null or sal_max is null or sal_min <= sal_max)
);

create index if not exists idx_jobs_status  on jobs(status, created_at desc);
create index if not exists idx_jobs_company on jobs(company_user_id);

alter table jobs enable row level security;

-- Limpia solo el seed anterior (no toca cuentas reales)
delete from jobs
 where company_id in (select id from companies where email like '%@demo.talentpact.es');
delete from companies where email like '%@demo.talentpact.es';

-- UUIDs fijos para poder re-ejecutar el seed
-- Empresas
-- a111... fintech  | a222... software | a333... retail data | a224... consultoría

insert into companies (
  id, user_id, email, company_name, contact_name, job_title, company_size,
  description, sector, website, location
) values
(
  'a1111111-1111-4111-8111-111111111111',
  null,
  'rrhh@nortepay.demo.talentpact.es',
  'NortePay',
  'Demo NortePay',
  'People Partner',
  '51-200',
  'Fintech de pagos B2B para pymes. Buscamos perfiles que demuestren criterio con datos y producto, no solo un CV.',
  'Finance',
  'https://talentpact.es',
  'Barcelona'
),
(
  'a2222222-2222-4222-8222-222222222222',
  null,
  'talent@orbitlabs.demo.talentpact.es',
  'Orbit Labs',
  'Demo Orbit',
  'Head of Talent',
  '11-50',
  'Producto SaaS B2B. Contratamos por habilidades verificadas: retos técnicos y de producto antes del desbloqueo de contacto.',
  'IT',
  'https://talentpact.es',
  'Madrid'
),
(
  'a3333333-3333-4333-8333-333333333333',
  null,
  'people@clarodata.demo.talentpact.es',
  'ClaroData',
  'Demo ClaroData',
  'Talent Acquisition',
  '201-500',
  'Consultora de datos y analytics. Priorizamos anonimato en cribado y evidencia de análisis frente a titulaciones genéricas.',
  'Data',
  'https://talentpact.es',
  'Valencia'
),
(
  'a4444444-4444-4444-8444-444444444444',
  null,
  'hr@verdebrand.demo.talentpact.es',
  'Verde Brand',
  'Demo Verde',
  'Talent Lead',
  '11-50',
  'Estudio de marketing y growth. Buscamos gente que sepa priorizar campañas, escribir y defender decisiones con métricas.',
  'Marketing',
  'https://talentpact.es',
  'Barcelona'
);

-- Ofertas abiertas (company_user_id ficticio: no permite login; solo alimenta el tablón)
insert into jobs (
  id, company_user_id, company_id, title, sector, description,
  required_skills, tags, required_level, exercise_config,
  jornada, modalidad, contrato, ubicacion, sal_min, sal_max, status
) values
(
  'b1111111-1111-4111-8111-111111111101',
  'c1111111-1111-4111-8111-111111111111',
  'a1111111-1111-4111-8111-111111111111',
  'Analista de riesgos junior',
  'Finance',
  'Te incorporarás al equipo de riesgo de producto. Evaluarás casos reales de onboarding de pymes, explicarás el porqué de cada decisión y colaborarás con producto para reducir fricción sin subir el riesgo. Buscamos claridad de razonamiento más que años de experiencia.',
  array['Análisis financiero','Pensamiento crítico','Comunicación'],
  array['Finance','Riesgo','Junior'],
  'basico',
  'common+custom',
  'completa',
  'hibrido',
  'indefinido',
  'Barcelona',
  28000,
  36000,
  'open'
),
(
  'b1111111-1111-4111-8111-111111111102',
  'c1111111-1111-4111-8111-111111111111',
  'a1111111-1111-4111-8111-111111111111',
  'Product Operations',
  'Business',
  'Operaciones de producto en una fintech en crecimiento: documentar procesos, detectar cuellos de botella y proponer mejoras medibles. Trabajarás con soporte, compliance y producto. Se valora capacidad de estructurar problemas y escribir con precisión.',
  array['Operaciones','Documentación','Priorización'],
  array['Business','Ops','Fintech'],
  'intermedio',
  'common+custom',
  'completa',
  'hibrido',
  'indefinido',
  'Barcelona',
  32000,
  42000,
  'open'
),
(
  'b2222222-2222-4222-8222-222222222201',
  'c2222222-2222-4222-8222-222222222222',
  'a2222222-2222-4222-8222-222222222222',
  'Backend Engineer (Node)',
  'IT',
  'APIs, autenticación y datos en un SaaS B2B. No pedimos un CV interminable: queremos ver cómo diseñas endpoints, manejas errores y razonas trade-offs. Stack principal Node/TypeScript; valoramos experiencia con Postgres.',
  array['Node.js','APIs REST','PostgreSQL'],
  array['IT','Backend','SaaS'],
  'intermedio',
  'common+custom',
  'completa',
  'remoto',
  'indefinido',
  null,
  40000,
  55000,
  'open'
),
(
  'b2222222-2222-4222-8222-222222222202',
  'c2222222-2222-4222-8222-222222222222',
  'a2222222-2222-4222-8222-222222222222',
  'Customer Success Associate',
  'Sales',
  'Acompañarás a clientes en la adopción del producto: onboarding, seguimiento y detección de expansión. Buscamos comunicación clara, escucha activa y capacidad de priorizar cuentas. El cribado se hace con retos prácticos, sin foto ni edad.',
  array['Atención al cliente','Comunicación','Organización'],
  array['Sales','CS','Remoto'],
  'basico',
  'common',
  'completa',
  'remoto',
  'indefinido',
  null,
  26000,
  34000,
  'open'
),
(
  'b3333333-3333-4333-8333-333333333301',
  'c3333333-3333-4333-8333-333333333333',
  'a3333333-3333-4333-8333-333333333333',
  'Data Analyst',
  'Data',
  'Análisis de negocio para clientes de retail y servicios. Deberás leer un caso, proponer métricas, diagnosticar caídas de margen y explicar un plan de acción. SQL y storytelling con datos son el núcleo del rol.',
  array['SQL','Visualización','Análisis de negocio'],
  array['Data','Analytics','SQL'],
  'intermedio',
  'common+custom',
  'completa',
  'hibrido',
  'indefinido',
  'Valencia',
  30000,
  42000,
  'open'
),
(
  'b3333333-3333-4333-8333-333333333302',
  'c3333333-3333-4333-8333-333333333333',
  'a3333333-3333-4333-8333-333333333333',
  'Prácticas · Business Intelligence',
  'Data',
  'Prácticas de 6 meses apoyando al equipo de BI: limpieza de datos, paneles y documentación. Ideal si quieres demostrar criterio analítico con retos reales antes de la entrevista.',
  array['Excel/Sheets','SQL básico','Curiosidad analítica'],
  array['Data','Prácticas','BI'],
  'basico',
  'common',
  'practicas',
  'presencial',
  'practicas',
  'Valencia',
  9000,
  14000,
  'open'
),
(
  'b4444444-4444-4444-8444-444444444401',
  'c4444444-4444-4444-8444-444444444444',
  'a4444444-4444-4444-8444-444444444444',
  'Growth Marketing Specialist',
  'Marketing',
  'Gestionarás experimentos de adquisición y retención. En el proceso verás un caso de campañas con ROI/CPA y tendrás que decidir qué pausar y dónde reinvertir. Buscamos criterio, no jerga vacía.',
  array['Performance','CPA/ROI','Priorización'],
  array['Marketing','Growth','Performance'],
  'intermedio',
  'common+custom',
  'completa',
  'hibrido',
  'indefinido',
  'Barcelona',
  32000,
  45000,
  'open'
),
(
  'b4444444-4444-4444-8444-444444444402',
  'c4444444-4444-4444-8444-444444444444',
  'a4444444-4444-4444-8444-444444444444',
  'Copywriter junior',
  'Marketing',
  'Redacción para web, email y crisis en redes. Evaluamos tono, empatía y capacidad de proponer un siguiente paso concreto. Perfil junior con ganas de aprender en un equipo pequeño.',
  array['Copywriting','Social Media','Empatía'],
  array['Marketing','Copy','Junior'],
  'basico',
  'common',
  'completa',
  'presencial',
  'indefinido',
  'Barcelona',
  24000,
  30000,
  'open'
);

-- Comprobación rápida
select c.company_name, count(j.id) as ofertas_abiertas
from companies c
left join jobs j on j.company_id = c.id and j.status = 'open'
where c.email like '%@demo.talentpact.es'
group by c.company_name
order by c.company_name;
