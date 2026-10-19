# 01 · Sectores, áreas funcionales y vocabulario

Tareas de la reunión: «Áreas de creación de empleo: mirar cómo tratarlo como LinkedIn; mirar vocabulario» y «Mirar sectores y áreas funcionales para acabar de enfocar la plataforma visualmente».
Fuente: `TALENTPACT PROPUESTE DE SECTORES & FUNCIONES.docx` (versión resumida 12 + 7 y ampliada 22 + 21).

---

> **Estado (19/10/2026): implementado** lo esencial — `netlify/functions/lib/taxonomia.json` (fuente única), tablón filtrado por área, oferta con área y especialidad, sector de empresa con los 12, área de interés del candidato y nombres de skills en español. Pendiente: filtro de área en retos y pool, recomendados por área, ESCO, máximo de 8 skills ya aplicado.

## 1. El problema de hoy

1. **El campo «Sector» de la oferta no es un sector.** Las opciones actuales (`Marketing, IT, Data, Business, Design, RRHH, Finance, Legal, Ops, Sales, Languages`) son **áreas funcionales** (qué hace la persona), no sectores (a qué se dedica la empresa). Una oferta de «Contable en un hotel» es *Finanzas* en el sector *Hostelería*; hoy no se puede expresar.
2. **Vocabulario mezclado**: mitad inglés, mitad español, abreviaturas (`IT`, `Ops`), y la misma cosa con varios nombres (`RRHH` / `People` / `Recursos Humanos`).
3. **Se enseña todo a la vez.** Al crear una oferta salen los 11 «sectores» y una rejilla con todas las skills del catálogo. Al candidato le pasa igual en Retos. Es una pared de opciones: cuesta elegir y da sensación de herramienta interna, no de producto.

## 2. Qué hace LinkedIn (referencia, no copia)

| Pieza de LinkedIn | Qué es | Qué tomamos |
| --- | --- | --- |
| **Skills Graph** | Taxonomía propia de unas 41.000 skills, con cientos de miles de alias en 26 idiomas y relaciones entre skills (qué skill implica otra). | Un **diccionario único** con alias y relaciones. A nuestra escala: cientos, no miles. |
| **Industria vs. función** | La empresa tiene *industria*; el puesto tiene *función* y *título normalizado*. Son campos distintos. | Separar **sector** (de la empresa) y **área funcional** (del puesto). |
| **Publicar empleo** | Escribes el título y LinkedIn propone función, nivel y hasta 10 skills; tú quitas o añades. | **Sugerir en vez de listar**: el título dispara las sugerencias. |
| **Búsqueda con autocompletado** | Nunca enseña la lista entera; buscas y aparecen 5–8 coincidencias, incluidas las de alias. | Autocompletado con alias en todos los selectores largos. |
| **Talent Insights** | Datos agregados del mercado (qué skills crecen, dónde hay talento). | A futuro: informes agregados y anónimos de lo que se demuestra en TalentPact (ver doc 07). |
| **Skill Assessments** | LinkedIn **los retiró** (badges eliminados en 2024) y dice que a las empresas les sirven más los ejemplos de skills aplicadas. | Es exactamente nuestro hueco: **skills demostradas en un trabajo real, con evidencia**. Argumento comercial directo. |

## 3. Taxonomía propuesta: dos niveles, dos ejes

### 3.1 Los dos ejes

| Eje | Lo rellena | Dónde se usa | Lista visible |
| --- | --- | --- | --- |
| **Sector** | La empresa, **una vez**, en su perfil | Ficha de empresa, filtro del candidato («quiero trabajar en salud»), informes | 12 sectores (versión resumida) |
| **Área funcional** | La empresa en cada oferta; el candidato en sus intereses | Oferta, catálogo de retos, pool, encaje | 7 áreas (versión resumida) |
| **Especialidad** (2.º nivel) | Se sugiere sola a partir del título | Búsqueda fina, retos del área, pool | Lista ampliada, solo por búsqueda |

Regla de interfaz: **el primer nivel se ve, el segundo se busca.** Nunca se enseñan las 21 + 22 opciones juntas.

### 3.2 Sectores (12 visibles) y sectores ampliados que cuelgan de ellos

| Sector visible | Ampliados que se agrupan dentro (búsqueda) |
| --- | --- |
| Capital privado | Capital privado |
| Consumo | Consumo · Comercio minorista y comercio electrónico · Agricultura, ganadería y alimentación |
| Deporte | Deporte |
| Educación e impacto social | Educación e impacto social · Organizaciones sin ánimo de lucro y tercer sector |
| Gobierno y sector público | Gobierno y sector público · Defensa, aeroespacial y seguridad |
| Hostelería, turismo y ocio | Hostelería, turismo y ocio · Cultura, arte y entretenimiento |
| Industria | Industria · Automoción y movilidad · Transporte y logística · Inmobiliario y construcción |
| Salud y ciencias de la vida | Salud y ciencias de la vida |
| Servicios financieros | Servicios financieros · Fintech y medios de pago |
| Servicios profesionales | Servicios profesionales |
| Sostenibilidad y clima | Sostenibilidad y clima · Energía e infraestructuras |
| Tecnología, medios y telecomunicaciones | Tecnología, medios de comunicación y telecomunicaciones |

A revisar con el equipo: *Inmobiliario y construcción* y *Transporte y logística* encajan regular en Industria; *Defensa* tiene parte industrial. Si se quiere, pasan a ser sectores visibles (14) sin romper nada, porque la base de datos guarda siempre el **ampliado**.

### 3.3 Áreas funcionales (7 visibles) y especialidades

| Área visible | Especialidades (ampliada) | Skills / retos actuales que caen aquí |
| --- | --- | --- |
| **Asesoría jurídica, riesgos y cumplimiento** | Asesoría jurídica · Calidad y medio ambiente (parte normativa) | RGPD, Contratos, Propiedad Intelectual, Derecho Laboral, Auditoría |
| **Finanzas** | Finanzas · Estrategia y desarrollo corporativo | Finanzas y Contabilidad, Contabilidad, Fiscalidad, Tesorería, Inversión, Gestión de Fondos |
| **Marketing, ventas y comunicación** | Marketing, ventas y comunicación · Atención al cliente y experiencia de cliente | Marketing Digital, SEO, Google Ads, Social Media, Email Marketing, Web Analytics, Copywriting, Branding, E-commerce, CRM, Ventas B2B, Ventas y Comercial, Retail, Telemarketing, Customer Success, Oratoria, Redacción Pro, Periodismo, Pitch |
| **Operaciones** | Operaciones · Compras y cadena de suministro · Producción y mantenimiento · Gestión de proyectos y programas · Administración y servicios generales · Calidad | Logística, Supply Chain, Lean, Calidad, Producción, Project Management, Agile & Scrum, Admin Oficina, Asistente Ejecutivo, Data Entry, Eventos, Hostelería, Inmobiliaria, Admin Sanitaria, Farmacia |
| **Recursos humanos** | Recursos humanos · Educación, formación e investigación | Recruiting, People Analytics, Formación, Pedagogía, E-Learning |
| **Sostenibilidad** | Sostenibilidad · Calidad y medio ambiente | Sostenibilidad |
| **Tecnología** | Tecnología · Ingeniería e I+D · Diseño y producto · Transformación y digitalización | Desarrollo, Frontend, React, CSS, JavaScript, TypeScript, Node.js, Python & Backend, SQL, Git, DevOps, Testing, Mobile, Cloud, Ciberseguridad, Data & Analytics, Python Data, Power BI, Tableau, Big Data, Estadística, Excel Avanzado, UX/UI, Figma, UX Research, Product Design, Product Management, AutoCAD, **IA & ML (pasa a la rama IA, doc 02)** |

Especialidades ampliadas sin padre claro, propuesta:

| Especialidad | Propuesta |
| --- | --- |
| Dirección general y consejo de administración | No es área de oferta habitual en nuestro público. Queda como **nivel del puesto** («Dirección»), no como área. |
| Consultoría | Es un **tipo de empresa** (sector Servicios profesionales) más que una función. Se guarda como especialidad dentro del área que corresponda (consultoría financiera → Finanzas). |
| Sanidad y atención sociosanitaria | Es una profesión regulada (titulación obligatoria). Fuera de alcance de los retos; se acepta como especialidad dentro de Operaciones para puestos de gestión. |

**Idiomas** (Inglés, Francés, Alemán) no son un área: pasan a ser un **bloque propio de idiomas** en el perfil y la oferta, como LinkedIn. **Diseño gráfico, Fotografía, Edición de vídeo** van a *Marketing, ventas y comunicación* (especialidad «Creatividad y contenidos»). **Emprendimiento** y **Social Skills** se reparten en las soft skills (doc 06).

## 4. Vocabulario: reglas

1. **Todo en español** de cara al usuario. El término inglés se guarda como alias para la búsqueda (`Customer Success` → «Éxito de cliente»; se encuentra escribiendo cualquiera de los dos). Excepción: nombres propios de herramientas (React, Power BI, Figma).
2. **Un concepto, un nombre canónico, muchos alias.** Ejemplo: `Recursos humanos` ← alias `RRHH`, `People`, `HR`, `Personas`.
3. **Mayúscula solo inicial** («Gestión del tiempo», no «Gestión Del Tiempo»). Hoy conviven las dos formas y obliga a duplicar entradas (`'Inteligencia emocional'` y `'Inteligencia Emocional'` en `19-rrhh.js`).
4. **Ni siglas sueltas ni jerga interna** en la interfaz: «Tecnología», no «IT»; «Operaciones», no «Ops».
5. **Mapeo a ESCO** (clasificación europea de ocupaciones y competencias): cada skill y cada área guarda su código ESCO cuando exista. Sirve para tres cosas: hablar el idioma de las administraciones (Eventos Impact con sector público), exportar a ATS y poder decir que la taxonomía sigue un estándar europeo.
6. Los nombres viven **en un solo sitio** (tabla `taxonomy_terms`, doc 07) y el navegador los recibe del servidor. Hoy están repetidos en `19-rrhh.js`, `personas.js` e `index.html`.

## 5. Cómo se ve: crear una oferta «tipo LinkedIn»

Hoy: formulario largo con todo abierto. Propuesta: **tres pasos cortos** con sugerencias.

```
Paso 1 · El puesto
  Título  [ Técnico de selección junior        ]   ← autocompletado de títulos normalizados
  Área    Recursos humanos  ·  cambiar            ← sugerida a partir del título, editable
  Nivel   ( ) Prácticas  (•) Junior  ( ) Intermedio  ( ) Sénior  ( ) Dirección
  Sector  Hostelería, turismo y ocio              ← viene del perfil de la empresa; no se pregunta

Paso 2 · Qué tiene que demostrar
  Sugeridas para este puesto (6)                  ← pack por área + nivel (doc 06, §5)
  [x] Selección y entrevista   [x] Comunicación escrita   [x] Escucha activa
  [x] Planificación            [ ] Negociación            [ ] Excel y datos
  + Añadir otra skill  [ buscar…            ]     ← búsqueda con alias, máx. 8 en total
  Separadas en tres columnas: Hard · Soft · Transferibles (como ya está en código)

Paso 3 · Condiciones, preguntas y dilemas        ← lo que ya existe, plegado por defecto
```

Reglas de interacción:

- **Máximo 8 skills** por oferta (LinkedIn usa 10; con 8 el encaje discrimina mejor y el candidato no tiene que hacer 8 retos largos).
- Las sugeridas salen **marcadas**, y quitar es un clic. Es más rápido que buscar.
- Lo opcional (preguntas, dilemas, configuración de ejercicios) va **plegado** con un resumen («0 de 3 dilemas»).
- Vista previa lateral de **cómo verá el candidato la oferta**, que da confianza a la empresa.

## 6. Cómo se ve: candidato

- **Onboarding de 3 preguntas**: áreas que le interesan (máx. 3 de 7), sectores preferidos (opcional) y nivel. Con eso, Retos enseña primero **lo de sus áreas** y el resto queda detrás de «Ver todo el catálogo».
- **Catálogo de retos** con pestañas por pilar (Hard · Soft · Transferibles) y filtro de área. Encima, una fila «Recomendados para ti» con 3–4 retos (los que más piden las ofertas abiertas de sus áreas: dato real de `jobs.required_skills`, no inventado).
- **Pool** (empresa): filtro de área + skills + condiciones; el sector se usa solo si el candidato lo ha marcado como preferencia.

## 7. Cambios técnicos

| Cambio | Detalle |
| --- | --- |
| Tablas | `taxonomy_terms` (id, tipo: sector/área/especialidad/skill/título, nombre canónico, padre, alias[], código ESCO, activo) — ver doc 07. |
| `companies.sector` | Valor del sector ampliado. |
| `jobs` | Nuevas columnas `area`, `especialidad`, `nivel`; `sector` deja de rellenarse a mano y se copia de la empresa. Migración: `IT/Data/Design → Tecnología`, `Marketing/Sales → Marketing, ventas y comunicación`, `Finance → Finanzas`, `Legal → Asesoría jurídica…`, `Ops/Business → Operaciones`, `RRHH → Recursos humanos`, `Languages → bloque de idiomas`. |
| Catálogo de retos | Cada reto gana `area` y `especialidad` (tabla de §3.3). Hoy los 89 retos de sector no tienen ningún campo de área. |
| API | `GET /taxonomy` (público, cacheado) y `GET /taxonomy/suggest?titulo=…` que devuelve área, nivel y skills sugeridas. Primera versión: reglas por palabras del título + packs del doc 06; más adelante, aprendida de las ofertas reales. |
| Interfaz | Componente único de autocompletado (`tpBuscador`) en `18-interfaz.js`, reutilizado en oferta, perfil y filtros. |

## 8. Búsqueda avanzada de candidatos (referencia: LinkedIn Recruiter)

Añadido el 19/10 a partir de capturas de Recruiter Advanced Search. La estructura visual está en `estructura_plataforma.md`, parte 08.

| Pieza de Recruiter | En TalentPact | Dato que lo alimenta |
| --- | --- | --- |
| Columna fija: puesto, ubicación (*Can have / Current*), skills, sector, palabras clave, seniority | Puesto o área, ubicación (vive en / puede trabajar en), skills demostradas con banda mínima, pilar, nivel, sector de interés, palabras clave | `taxonomy_terms`, `competency_scores`, `profiles.empleo` |
| Secciones plegables con «+» | Condiciones · Evidencia · Perfil · Actividad y proceso | `profiles.empleo`, `competency_scores` (banda, confianza, integridad, revisión, fecha), `applications` |
| Sugerencias con recuento (`Python (21M+)`) | Recuento real de candidatos visibles por skill | Consulta agregada sobre el pool con los filtros actuales |
| Contador «N total candidates» | «N candidatos encajan» + pista para relajar filtros cuando sale 0 | Misma consulta, recontando sin cada filtro |
| Projects, Notes, Hide previously viewed | Listas, notas del equipo, ocultar ya vistos | Tablas nuevas `company_lists`, `company_notes`, `profile_views` (por empresa) |
| Búsquedas guardadas | Búsquedas guardadas con aviso de candidatos nuevos | Tabla `saved_searches` + aviso en la bandeja de la empresa |

No se copian nombre, centro de estudios, empresas actuales o anteriores, red de contactos ni código postal: el candidato es anónimo hasta el contacto y esos campos son atajos del CV que meten sesgo. Filtros principales y condiciones en todos los planes; evidencia, perfil, actividad, listas, notas y búsquedas guardadas en Pro y Enterprise.

## 9. Decisiones para el equipo

- [ ] ¿12 sectores visibles o 14 (sacando Inmobiliario y Transporte)?
- [ ] ¿Idiomas como bloque propio fuera de las skills? (Recomendado: sí.)
- [ ] ¿Límite de 8 skills por oferta?
- [ ] ¿Se valida la lista con la asesora antes de migrar las ofertas existentes?
- [ ] ¿Búsqueda de candidatos con la estructura de Recruiter, y la parte avanzada solo en Pro y Enterprise?
