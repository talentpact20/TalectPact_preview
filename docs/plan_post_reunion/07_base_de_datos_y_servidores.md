# 07 · Base de datos, servidores y entrega de información a empresas

Tareas de la reunión: «Base de datos: acabar de mirar la información que tenemos y saber cómo guardarla en servidores»; «tratar la base de datos un poco como LinkedIn, más interactiva»; «si las empresas lo necesitan, cómo podemos acomodar la información».

---

## 1. Qué información tenemos hoy

Supabase (PostgreSQL + autenticación), 9 tablas:

| Tabla | Qué guarda | Sensibilidad |
| --- | --- | --- |
| `profiles` | Candidato: nombre, email, teléfono, LinkedIn, sector, preferencias de empleo (`empleo` jsonb), `pool_visible`, `allow_contact` | **Alta** (datos personales de contacto) |
| `evaluations` | Cada corrección: reto, nota, criterios, feedback, integridad (`integrity` jsonb) | **Alta** (evaluación de una persona: sistema de alto riesgo en el Reglamento de IA) |
| `credentials` | SkillPass emitidos, hash, transacción | Media |
| `companies` | Empresa: nombre, sector, descripción, web, ubicación | Baja |
| `jobs` | Ofertas, skills pedidas, preguntas, dilemas | Baja |
| `applications` | Postulaciones, etapa del pipeline, respuestas a dilemas | Alta |
| `unlocks` | Pagos de desbloqueo | Media (financiera, sin tarjeta: la tarjeta la tiene Stripe) |
| `contact_access` | Registro de cada entrega de contacto | Media (auditoría) |
| `notifications` | Avisos en la bandeja | Media |

Problemas: las respuestas de los candidatos, la taxonomía y el catálogo están **mezclados** con datos de uso; no hay versiones del catálogo; no hay separación entre datos operativos y analítica; no hay política de retención aplicada en código.

## 2. Modelo de datos «tipo LinkedIn»: un grafo de skills

LinkedIn no guarda «un CV»: guarda **entidades conectadas** (personas, puestos, empresas, skills) y relaciones con evidencia. Nuestra versión, en PostgreSQL (no hace falta una base de grafos a nuestra escala):

```
taxonomy_terms ──< term_relations          (skill ↔ skill: «implica», «relacionada», «alias»)
      │
      ├──< challenge_versions ──< exercises_v      (catálogo versionado; doc 05)
      │
profiles ──< attempts ──< evaluations ──< evidence (citas)
   │            │                 └──< evaluation_reviews (revisión humana)
   │            └── integrity_sessions (doc 08)
   ├──< competency_scores (nota por competencia, confianza, caducidad; doc 06)
   ├──< credentials ──> anchor_batches (doc 03)
   └──< applications >── jobs >── companies
                                     └──< company_members (varios usuarios por empresa)
```

Tablas nuevas:

| Tabla | Campos clave | Para qué |
| --- | --- | --- |
| `taxonomy_terms` | id, tipo (`sector`, `area`, `especialidad`, `competencia`, `herramienta`, `idioma`, `titulo`), nombre, padre, alias[], código (01.1, 03.03…), código ESCO, definición, anclajes jsonb, activo | Vocabulario único (doc 01 y 06). |
| `term_relations` | origen, destino, tipo, peso | Sugerencias «quien pide X suele pedir Y». |
| `challenge_versions` | reto, versión, competencias, área, nivel, rúbrica, indicadores, errores, publicado_en | Catálogo versionado en base de datos, no en un JSON del repo. |
| `attempts` | perfil, ejercicio y versión, variante, abierto_en, entregado_en, estado, nivel de integridad | Intento de servidor: base del antitrampas (doc 08). |
| `evidence` | evaluación, criterio, cita, verificada | Auditoría de cada nota. |
| `competency_scores` | perfil, competencia, nota, banda, confianza, n.º evidencias, válida_hasta | Ficha y encaje (doc 06). |
| `evaluation_reviews` | evaluación, motivo, estado, revisor, decisión, plazo | Revisión humana (doc 05). |
| `company_members` | empresa, usuario, rol (`admin`, `reclutador`, `lector`) | Equipos de selección (Pro/Enterprise). |
| `data_exports` | empresa, tipo, filtros, creado_por, creado_en | Registro de lo que sale hacia empresas. |
| `audit_log` | quién, qué, sobre qué, cuándo, IP truncada | Trazabilidad exigida para sistemas de alto riesgo. |

**«Más interactiva» en la interfaz** significa usar este grafo: sugerencias al crear una oferta (doc 01), «candidatos con skills relacionadas» cuando no hay coincidencia exacta, «retos recomendados» al candidato según las ofertas abiertas de sus áreas, y búsqueda con alias en todas partes.

## 3. Dónde y cómo se guarda

| Aspecto | Propuesta |
| --- | --- |
| **Región** | Comprobar que el proyecto de Supabase está en una región de la UE (Fráncfort o Irlanda). Si no, migrar antes de tener usuarios reales. Netlify Functions: fijar región UE. |
| **Plan** | Supabase Pro en cuanto haya datos reales: copias diarias y **recuperación a un momento concreto** (PITR, 7 días). El plan gratuito pausa proyectos inactivos y no tiene PITR. |
| **Cifrado** | En reposo y en tránsito ya lo da Supabase. Además, **cifrado a nivel de columna** para teléfono y email de candidato (`pgsodium` / Vault), descifrado solo en `get-contact`. |
| **Acceso** | RLS en todas las tablas (ya en las existentes). El navegador nunca usa la clave de servicio. Las tablas de evaluación solo se leen a través de funciones. |
| **Ficheros** | Audios y PDFs en Supabase Storage, cubo privado, URLs firmadas de corta duración. Audio borrado tras transcribir salvo consentimiento. |
| **Secretos** | Netlify como hoy; a medio plazo, la clave del emisor de credenciales en un gestor de claves (doc 03). |
| **Copias fuera de Supabase** | Volcado cifrado semanal a un almacenamiento de objetos en la UE, con prueba de restauración trimestral. |
| **Entornos** | Dos proyectos de Supabase: `produccion` y `pruebas`. Hoy solo hay uno; las pruebas con datos reales son un riesgo. |

### Retención (lo que pide el RGPD y el Reglamento de IA)

| Dato | Cuánto se guarda |
| --- | --- |
| Respuestas y evaluaciones | 12 meses desde la última actividad, luego anonimización; registros de evaluación al menos 6 meses (obligación de logs de sistemas de alto riesgo). |
| Señales de integridad | 6 meses, o hasta resolver una revisión. |
| Audio y vídeo | No se guarda vídeo nunca. Audio: hasta transcribir. |
| Contacto entregado (`contact_access`) | 3 años (prueba de consentimiento y de la transacción). |
| Cuenta borrada | Borrado en 30 días; credenciales y sales borradas (doc 03). |

Una función programada (`retention-job`, diaria) aplica estas reglas; hoy no existe.

## 4. Analítica sin tocar la base de producción

Para el backoffice y para un futuro producto de datos («Insights», como Talent Insights de LinkedIn):

- **Vistas agregadas** con un mínimo de **20 personas por celda** (si no, no se muestra) para evitar reidentificar.
- Ejemplos de informes reales, nunca inventados: skills más pedidas por área frente a skills demostradas; distribución de bandas por reto; tiempo de oferta a contratación.
- Cuando haya volumen, réplica de solo lectura o exportación nocturna a un almacén analítico. Hasta entonces, vistas materializadas en Supabase.

## 5. Cómo se le entrega la información a una empresa

«Acomodar la información» = que la empresa reciba los datos **en su formato y en sus herramientas**, sin copiar a mano.

| Necesidad | Solución | Plan |
| --- | --- | --- |
| Ver al candidato | Ficha en el panel (ya existe) | Todos |
| Enseñarlo a su equipo | **Informe PDF del candidato**: skills por pilar con banda y confianza, extractos de evidencia, integridad, respuestas a dilemas, enlace de verificación del SkillPass | Todos (tras desbloqueo) |
| Comparar | **Exportación CSV/Excel** de la lista corta de una oferta (alias, bandas por skill, encaje, etapa) | Pro |
| Su ATS (Workday, SuccessFactors, Teamtailor, Personio…) | **API REST** + **webhooks** (`candidato.desbloqueado`, `etapa.cambiada`, `evaluacion.revisada`). Para no programar cada ATS, un agregador de integraciones de ATS en una fase posterior. | Enterprise |
| Varios reclutadores | `company_members` con roles; **SSO** (SAML/Google Workspace) | Enterprise |
| Cumplimiento | **Paquete de documentación**: contrato de encargo de tratamiento (DPA), registro de actividades, descripción del sistema de IA, informe de método y calibración | Enterprise (y bajo petición) |

Reglas para todo lo que sale:

1. Solo datos de candidatos **desbloqueados** y con `allow_contact`; antes del desbloqueo, nunca contacto ni nombre.
2. Cada exportación queda en `data_exports` y `audit_log`.
3. Formato de intercambio estable y documentado (JSON con versión), con los códigos de competencia del diccionario y ESCO para que el ATS los entienda.
4. El candidato ve en su panel **qué empresas han descargado su informe** (transparencia).

## 6. Orden de trabajo

1. Comprobar región UE y pasar a plan con copias y PITR (usuario).
2. `taxonomy_terms` + `challenge_versions` (base de los docs 01, 05 y 06).
3. `attempts` (base del doc 08).
4. `competency_scores` y `evaluation_reviews`.
5. Informe PDF del candidato y exportación CSV.
6. `audit_log`, `retention-job` y cifrado de columnas de contacto.
7. API y webhooks para Enterprise.

## 7. Decisiones para el equipo

- [ ] ¿Pasamos a Supabase Pro (copias y PITR) antes de la primera empresa real?
- [ ] ¿Segundo proyecto de pruebas?
- [ ] ¿Retención de 12 meses para respuestas?
- [ ] ¿Qué ATS usan las empresas de los primeros Eventos Impact? (Para priorizar la integración.)
