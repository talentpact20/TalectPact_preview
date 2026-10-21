# Changelog prereunión

Orden: más reciente abajo. Cada entrada: fecha, qué, por qué (para la asesora / producto), ficheros.

---

## 2026-10-14 — Seed de ofertas demo (1A)

**Qué.** SQL para tabla `jobs` + empresas demo + ~8 ofertas.

**Ficheros.** `tfm/tech/supabase_seed_ofertas_demo.sql`

---

## 2026-10-14 — Migración pool: `empleo` + `unlocks` (1B)

**Qué.** Columnas de preferencias y tablas `unlocks` / `contact_access`.

**Ficheros.** `tfm/tech/supabase_schema_pool_fix.sql`

---

## 2026-10-14 — Pool: chips de condiciones (1C)

**Qué.** Condiciones completas en pool + `horas` en API.

**Ficheros.** `get-talent-pool.js`, `14-empleo.js`, tests pool. Tests → 118.

---

## 2026-10-14 — Criterio reunión sin guion + carpeta prereunión

**Qué.** 1E descartado; docs en `docs/Cambios_prereunion/`.

---

## 2026-10-14 — Criterio 1D: Personas delante

**Qué.** Segmentar Personas y equipo → Cognitivo → Técnico (no “elegir 4”).

**Docs.** `02_punto_1d_pack_soft.md`, `03_corto_plazo_rrhh_y_personas.md`

---

## 2026-10-14 — Implementación corto plazo RRHH + Personas

**Qué.** Todo lo de la tabla (apartado 2) unido a Personas delante:

| Necesidad | Entrega |
| --- | --- |
| Condiciones fiables | Ya 1B/1C (+ SQL pool) |
| Cómo es / cultura | Segmentación Personas + chips en pool/ficha; 2–3 preguntas al publicar oferta |
| Confío en la nota | Integridad visible en pool/ficha (sin auto-descarte) |
| Quién sigue | Mini-pipeline por oferta (`applications`) |
| Cómo contacto | Aviso in-app al desbloquear (`notifications` + `inbox`) |

**Ficheros principales**
- `tfm/tech/supabase_schema_rrhh_corto.sql` ← **ejecutar en Supabase**
- `netlify/functions/lib/personas.js`, `notify.js`
- Handlers: `inbox`, `applications`; cambios en `get-talent-pool`, `save-job`, `list-jobs`, webhook/confirm
- `assets/js/app/19-rrhh.js` + filtros en `index.html` + CSS
- Tests: `tests/rrhh.test.js` → **124 casos / 15 ficheros**

**Acción usuario**
1. Run `supabase_schema_pool_fix.sql` (si falta).
2. Run `supabase_schema_rrhh_corto.sql`.
3. Deploy código (commit/push cuando se apruebe).
4. Probar: filtros Personas, publicar oferta con preguntas, pool con columna Personas, etapa en “Ver candidatos”, desbloqueo → aviso en bandeja candidato.

---

## 2026-10-15 — Tarjeta de oferta segura y rediseñada; pipeline y descarte

**Qué.**
- **Seguridad:** el nombre de empresa y las skills se insertaban sin escapar en las tarjetas de oferta de la portada (una empresa podía inyectar código que se ejecutaba a todos los visitantes). Ahora todo pasa por `escHtml`.
- Tarjeta de oferta única (`tpTarjetaOferta`) para portada y panel del candidato: empresa arriba, sector en español, máximo 4 skills + «+N», nivel y encaje al pie. Logotipos de empresa con tintes de `componentes.css` (sin colores a mano).
- Pipeline: la etapa del proceso ya no depende del botón de contacto (`data-ref` en la tarjeta), así que también aparece en candidatos que no aceptan contacto.
- Motivo de descarte: diálogo propio accesible en vez de `window.prompt`.
- Tests: `tests/diseno.test.js` comprueba el escapado. Tests → **125 / 15 ficheros**.

**Ficheros.** `08-ofertas-y-ejercicios.js`, `10-paneles-y-pagos.js`, `19-rrhh.js`, `componentes.css`, `tests/diseno.test.js`

---

## 2026-10-15 — Aviso al candidato cuando cambia su etapa (cierra el circuito del pipeline)

**Qué.** Al mover a un candidato de etapa (preseleccionado, entrevista, contratado, descartado) se le avisa en su bandeja. El aviso no nombra a la empresa y **no incluye el motivo del descarte** (solo lo ve la empresa; queda registrado). Solo se avisa si la etapa cambia de verdad. No requiere SQL nuevo (usa `notifications` del SQL RRHH).

**Por qué.** RRHH pedía «quién sigue» y el candidato se quedaba sin saber nada: el pipeline era solo del lado empresa.

**Ficheros.** `lib/notify.js` (`notificarEtapa`), `lib/handlers/applications.js`, `tests/rrhh.test.js`

---

## 2026-10-15 — Postulaciones reales del candidato y acceso con Google

**Qué.**
- **Postulaciones (fallo grave):** el botón «Aplicar» solo enseñaba «¡Candidatura enviada!» y no guardaba nada: la empresa nunca recibía la postulación. Nueva función `apply` (guarda la postulación en `applications`, es idempotente, exige sesión de candidato y oferta abierta). Cuenta de empresa → 403. El candidato ve su etapa en las tarjetas de oferta; la empresa ve el chip «Se ha postulado» en «Ver candidatos» y un aviso si hay postulados que no salen en la lista (perfil no visible en el pool).
- Sin sesión, «Aplicar» pide iniciar sesión en vez de fingir que funciona; con error de servidor, lo dice y ofrece «Reintentar».
- **Google:** el diagnóstico (`npm run check:google`) dice que Google y LinkedIn **no están habilitados en Supabase Auth**: por eso el acceso social no funcionaba. Es configuración, no código. Hasta que se active, los botones sociales y el separador «o» se ocultan (antes salían atenuados y daban error al pulsar).
- Scripts `check-google-auth.js` y `check-rls.js` rotos desde el troceado de `index.html`: arreglados.
- Escapado de nombre de empresa y skills en la pantalla de requisitos de la oferta.
- Estilos en línea de los scripts → clases (`tools/estilos_js_a_clases.py`): 84 → 33 (los dinámicos y los colores literales de la ventana de ejemplo se quedan).
- La empresa recibe un aviso («Nueva postulación», sin identidad del candidato) en su panel; la bandeja de avisos ya funciona para candidatos y empresas.
- Tests → 125 (sin nuevos tests: aserciones añadidas a los existentes).

**Acción usuario (Google).** Supabase → Authentication → Providers → Google → activar con Client ID y Secret de Google Cloud. En Google Cloud: origen JS `https://talentpact.es`; URI de redirección `https://vqyqedmizxqneniynxqp.supabase.co/auth/v1/callback`. Y en Supabase → URL Configuration, añadir `https://talentpact.es/` a Redirect URLs.

**Ficheros.** `lib/handlers/apply.js`, `apply.mjs`, `08-ofertas-y-ejercicios.js`, `09-acceso.js`, `10-paneles-y-pagos.js`, `19-rrhh.js`, `tfm/tech/scripts/*`, `componentes.css`, `utilidades.css`

---

## 2026-10-15 — Revisión de lo de Iván: fallos del pipeline, encaje y errores ocultos

**Qué.**
- **Privacidad (grave, servidor):** el mismo patrón estaba en las consultas que filtran por consentimiento. Ante cualquier fallo pasajero (timeout, red), el pool repetía la consulta **sin** `pool_visible=is.true` (las empresas verían a candidatos que se ocultaron), `get-contact` repetía **sin** `allow_contact` (entregaría el contacto de quien retiró el consentimiento, art. 7.3 RGPD) y el pago repetía sin ambos (cobraría el desbloqueo de alguien oculto). Ahora solo se repite si la columna falta de verdad. Aplicado a todas las consultas tolerantes (pool, contacto, pago, perfil, empresa, evaluación, ofertas).
- **Errores tapados como «migración pendiente» (servidor):** el mensaje de error de Supabase incluye siempre la ruta (`GET applications?…`), así que cualquier fallo de las tablas `applications` y `notifications` (red, timeout, permisos) se tomaba por «falta la migración» y devolvía una lista vacía sin avisar. Nuevo `faltaEnEsquema()` en `tp.js`, que solo mira el mensaje y exige «does not exist» o «schema cache». Test nuevo.
- **Doble clic en «Aplicar»:** la segunda petición chocaba con el `unique` y respondía «Falta la migración». Ahora se trata como ya postulado (`esDuplicado()`).
- **Encaje:** un candidato sin ninguna skill de la oferta salía con un 30 % (solo por condiciones), así que «Candidatos que encajan» listaba todo el pool. Ahora sin skills pedidas el encaje es 0. Con ofertas que solo piden skills de personas, ya no se regalan 30 puntos de «técnico». Quien se ha postulado sale siempre en su oferta, aunque aún no tenga las skills.
- **Preguntas de la vacante:** se insertaban fuera de la caja de la ficha de oferta (el selector agrupado devolvía siempre `#jobModal`). Ahora van bajo la descripción. En «Ver candidatos» ya no se quedan las de la oferta anterior y van bajo la cabecera, no encajadas junto al botón.
- **Pipeline:** si no se guarda la etapa, el desplegable vuelve a la etapa real y lo dice; si se guarda, confirma. Motivo de descarte con mínimo de 3 caracteres también en el diálogo.
- **Publicar oferta:** había dos copias de `publishJob` (17 y 19); queda una, en 17, con las preguntas de vacante y bloqueo de doble envío (antes, doble clic = oferta publicada dos veces).
- **Pool:** la tabla de 8 columnas desbordaba el panel a 1024 px y todo el panel se desplazaba en horizontal; ahora se desplaza solo la tabla.
- Servidor: «marcar leídos» hace una petición en vez de una por aviso; el pipeline lee la etapa previa en la misma consulta.
- Aviso de postulados ocultos con estilo informativo (antes salía sin fondo).
- **Google desde el portal equivocado:** si una cuenta de candidato entra con Google desde «empresa» (o al revés), se abre su panel pero se le dice; antes cambiaba de panel sin explicación.
- **Ranking:** si fallaba la carga se quedaba en «No se pudo cargar» sin poder reintentar, y sin token se quedaba en «Cargando…» para siempre. Ahora hay «Reintentar» y esqueleto de carga. El pool de empresa también tiene «Reintentar» cuando falla. El texto «Actualizado en tiempo real» no era cierto: ahora dice que usa las notas reales del pool al abrir la pestaña.
- **Privacidad de avisos:** la bandeja devolvía al candidato el `meta` entero del aviso de desbloqueo, con el `company_user_id` de la empresa. Ahora solo salen la oferta y la etapa; el registro completo se queda en la base de datos.
- Tests → 127.

**Ficheros.** `lib/tp.js`, `lib/handlers/apply.js`, `applications.js`, `inbox.js`, `get-talent-pool.js`, `get-contact.js`, `create-checkout-session.js`, `save-profile.js`, `save-company.js`, `save-evaluation.js`, `save-job.js`, `list-jobs.js`, `06-skillpass-y-sesion.js`, `16-pool-real.js`, `index.html`, `10-paneles-y-pagos.js`, `17-ofertas-reales.js`, `19-rrhh.js`, `componentes.css`, `modulos.css`, `tests/rrhh.test.js`, cifras canónicas

---

## 2026-10-15 — Análisis completo del backend

**Qué.** Revisión de las 22 funciones y de las librerías compartidas. Detalle por tema en `05_errores_y_mejoras.md`, sección 7.
- **Notas verificadas falsificables (grave):** el enunciado lo mandaba el navegador. Ahora el servidor corrige con su propia copia del catálogo (`lib/catalogo-retos.json`, `npm run catalogo`) y decide la skill de cada reto. Los retos de oferta se guardan como no verificados hasta que pasen al servidor.
- Pool y SkillPass: una nota verificada manda sobre una no verificada, y el SkillPass marca cuáles lo están.
- **Pagos:** solo pagan cuentas con ficha de empresa; no se abren dos pagos para el mismo candidato; el texto de Stripe lo pone el servidor. Una cuenta de candidato ya no obtiene ficha de empresa.
- Anclaje en blockchain limitado a 3 al día por candidato.
- **Privacidad:** los 500 ya no devuelven la consulta de Supabase al navegador. El borrado de cuenta borra los avisos y no responde «borrado» si algo falla. El perfil valida nombre, teléfono y LinkedIn.
- **Robustez:** límites de tiempo en Supabase, Auth y Anthropic; JSON mal formado → 400; JSON del modelo con texto alrededor ya no tumba la corrección; arreglado `ensureCompanyByUser`.
- Tests → 133 en 17 ficheros (`catalogo.test.js`, `backend.test.js` y casos nuevos en corrector y pagos).

**Acción usuario.** Configurar `EVAL_SIGNING_SECRET` en Netlify: sin él, ninguna nota sale verificada.

**Ficheros.** `lib/tp.js`, `lib/catalogo.js`, `lib/catalogo-retos.json`, `tools/generar_catalogo_servidor.js`, `package.json`, handlers `evaluate-exercise`, `save-evaluation`, `get-talent-pool`, `issue-credential`, `anchor-credential`, `create-checkout-session`, `delete-account`, `save-profile`, `save-company`, `get-company`, `support-chat` (y `errorInterno` en el resto), tests.

---

## 2026-10-15 — Corrector v2.1: rúbrica con pesos, evidencia y clasificaciones sin IA

**Qué.** Detalle y plan en `06_corrector.md`.
- Criterios fijos con peso por tipo de ejercicio y escala anclada; la nota global la calcula el servidor (antes la ponía el modelo «a ojo»).
- Indicadores concretos sacados de la guía de cada ejercicio; el modelo dice cuáles cumple y cuáles faltan.
- Evidencia obligatoria: citas literales que el servidor comprueba. Las inventadas se descartan, y sin evidencia un criterio no pasa de 40.
- Topes aplicados por el servidor: no aborda el escenario 10, copia el enunciado 15, genérica 40, grabación sin transcripción 60.
- Feedback por criterio: cita, qué está bien, qué falta y una acción concreta para subir; más un siguiente paso.
- Clasificaciones (95 ejercicios) corregidas en el servidor con la solución oficial, sin IA y descontando el azar. Antes la «respuesta correcta» llegaba del navegador.
- Web: las clasificaciones ya no pasan por el filtro de texto basura (las puntuaba con un 3) y se etiquetan «Corregido con la solución oficial».
- La clave de Anthropic solo se exige cuando se llama al modelo.
- Tests → 138 en 18 ficheros.

**Pendiente.** Validar con el modelo real y con notas humanas (gold set del catálogo con la asesora).

**Ficheros.** `lib/evaluator.js`, `lib/handlers/evaluate-exercise.js`, `tools/generar_catalogo_servidor.js`, `lib/catalogo-retos.json`, `08-ofertas-y-ejercicios.js`, `tests/corrector-v21.test.js`, `tests/catalogo.test.js`
## 2026-10-15 — Pieza disruptiva + plan semanal

**Qué.** Iván pide ir más allá de soft genérico y de 3 preguntas: que la empresa conozca si el candidato encaja en **su modelo de negocio**. Se documenta el “Escenario del modelo” y se mete en el plan semanal (semanas 5–6).

**Docs.** `06_encaje_modelo_empresa.md`, `07_plan_semanal.md`; preguntas en `00_contexto_reunion.md`.


## 2026-10-15 — Briefing listo para asesora y Xavi

**Qué.** Se reescribe `06_encaje_modelo_empresa.md` como documento de explicación: problema, propuesta en 3 capas, frases listas, límites, recorrido en producto, preguntas de validación y resumen de 30 s. **Sin desarrollar código** hasta validar.

**Para qué.** Que Iván pueda contárselo a la asesora y a Xavi con el mismo texto.


## 2026-10-15 — Taxonomía de aptitudes + dilemas en la oferta (criterio)

**Qué.** Criterio de producto documentado: 4 aptitudes + técnicas; oferta = skills + 3 preguntas + 1–3 dilemas.

**Docs.** `08_taxonomia_aptitudes_y_oferta.md`.


## 2026-10-15 — Taxonomía y dilemas en producto (código)

**Qué.** Clasificación real en filtros de retos y selector de skills al publicar (Cognitivas / Interpersonales / Autogestión / Ejecución / Técnicas). Al publicar: hasta 3 dilemas. Al postularse: el candidato los responde. La empresa los ve en «Ver candidatos».

**Ficheros.** `lib/personas.js`, `save-job.js`, `list-jobs.js`, `apply.js`, `applications.js`, `19-rrhh.js`, `08-ofertas-y-ejercicios.js`, `17-ofertas-reales.js`, `index.html`, `tests/rrhh.test.js`, SQL `tfm/tech/supabase_schema_dilemmas.sql`.

**Supabase.** Ejecutar `supabase_schema_dilemmas.sql` (columnas `jobs.dilemmas` y `applications.dilemma_answers`).

---

## 2026-10-15 — Tres pilares: Hard / Soft / Transferibles

**Qué.** Los filtros de retos y el selector de skills de la oferta pasan a tres pilares claros: **Hard skills**, **Soft skills** y **Transferibles** (sustituye Cognitivas / Interpersonales / Autogestión / Ejecución / Técnicas).

**Ficheros.** `lib/personas.js`, `19-rrhh.js`, `index.html`, `tests/rrhh.test.js`, doc 08.

---

## 2026-10-15 — Una cuenta nueva aparecía con retos de otra sesión

**Qué pasaba.** El progreso que guarda el navegador no sabía de quién era. Al cerrar sesión no se borraba y, al entrar con cualquier cuenta (también una recién creada), se mezclaba con ella y **se subía a la nube** como si fuera suyo. En un ordenador compartido, los retos de una persona acababan en la cuenta de otra.

**Arreglo.**
- El progreso local lleva dueño (id de la cuenta o «invitado»). Al entrar, solo se mezcla si es de esa cuenta; el de otra cuenta se descarta.
- Lo hecho sin sesión ya no se sube solo: se pregunta «¿Son tuyos?» en un diálogo propio. Si se aceptan, se guardan como notas no verificadas.
- Al cerrar sesión (a mano o por inactividad) se vacía el progreso del navegador.
- Tarjeta «Tu Perfil de Skills»:
  - el avatar y el texto («AC · Candidato anónimo») estaban escritos a mano y eran iguales para todos; ahora muestran el alias real («Así te ven las empresas: Candidato #9F3C»);
  - el título «Habilidades verificadas» no era cierto, y se quita;
  - la cuadrícula iba dentro de otra cuadrícula y se descolocaba;
  - «Avanzado» salía en rojo y ahora sale en verde.
- Los diálogos propios (este y el del motivo de descarte) salían pegados arriba a la izquierda por el reset de márgenes: ahora salen centrados.

**Fusión.** El commit `dc38352` se subió con conflictos sin resolver (`<<<<<<<`) en `index.html`, las cifras canónicas y 11 documentos. Están resueltos: se conservan las dos partes en los documentos y se usa el recuento real de tests (139 en 18 ficheros).

**Acción usuario.** Tu cuenta nueva ya tiene en Supabase las notas que se subieron desde el navegador (motivo «(sincronizado desde el dispositivo)»). Para quitarlas, ver la consulta en la respuesta del chat o borrar la cuenta desde Ajustes y crearla de nuevo.

**Ficheros.** `04-estado-y-nube.js`, `07-retos-comunes.js`, `09-acceso.js`, `15-proteccion-acceso.js`, `componentes.css`, `index.html`

---

## Pendiente / siguiente

- Ejecutar `supabase_schema_dilemmas.sql` en Supabase.
- Probar: publicar con dilemas → candidato responde → empresa ve respuestas.
- Validar con asesora / Xavi (docs 06 y 08).
- Seguir `07_plan_semanal.md`.

---

## 2026-10-18 — Plan tras la reunión (documentos, sin cambios de producto)

**Qué.** Once documentos en `docs/plan_post_reunion/` con el enfoque de cada tarea de la reunión: sectores y áreas tipo LinkedIn, rama IA, blockchain de pago, modelo de negocio y precios del candidato, corrector completo, hard y soft skills, base de datos y entrega a empresas, antitrampas, ejercicio por ejercicio (con inventario de los 309) y confianza para empresas. Índice y orden de trabajo en `00_plan_maestro.md`.

**Hallazgo.** Los enunciados y las soluciones de las clasificaciones viajan en el JS público (`07-retos-comunes.js`): se pueden leer sin empezar el reto. Propuesto como fase 0 (doc 08).

**Ficheros.** `docs/plan_post_reunion/*.md`. Sin cambios de código ni de cifras canónicas.

**Añadido (18/10).** `resumen_general.md` (lo general de cada concepto) y su PDF `TalentPact_Plan_resumen.pdf` (16 páginas: portada, índice, resumen visual y una página por concepto). Generador reproducible: `python3 tools/generar_plan_pdf.py` (con `--completo` saca la versión larga con los documentos enteros).

**Cambiado (18/10).** El PDF pasa a ser estructural, no técnico: `estructura_plataforma.md` → `TalentPact_Estructura_plataforma.pdf` (14 páginas, una por parte: la plataforma en una página, mapa de cuatro zonas, cómo se ordena la información, tres pilares, catálogo, recorridos de candidato y empresa, rama IA, cómo se pone la nota, confianza, gratis y de pago, orden de construcción). Generador: `python3 tools/generar_estructura_pdf.py`. Se retira el PDF resumido anterior (se puede regenerar con `tools/generar_plan_pdf.py`).

---

## 2026-10-19 — Búsqueda de candidatos tipo LinkedIn Recruiter (documentos)

**Qué.** Parte 08 nueva en `estructura_plataforma.md` y en el PDF (16 páginas): boceto del buscador con columna fija de filtros principales, secciones plegables (condiciones, evidencia, perfil, actividad y proceso), contador en vivo, listas, notas y búsquedas guardadas. Qué no se copia de Recruiter (nombre, colegio, empresa, red, código postal) y por qué. Nota técnica en el doc 01, §8.

**Ficheros.** `docs/plan_post_reunion/estructura_plataforma.md`, `01_sectores_areas_y_vocabulario.md`, `TalentPact_Estructura_plataforma.pdf`, `tools/generar_estructura_pdf.py`. Sin cambios de código de producto.

---

## 2026-10-19 — Hard y soft skills en la plataforma (documento)

**Qué.** `skills_en_la_plataforma.md` → `TalentPact_Skills_en_la_plataforma.pdf` (10 páginas). Tres pilares; tres grados de confianza (declarada, demostrada, verificada; las soft nunca se declaran); cuatro bandas; catálogo de skills; qué pedimos al candidato (registro, pasaporte básico de tres retos, retos por oferta); cómo lo exige la empresa (imprescindible o valorable con banda mínima por skill, máx. 8 y 4 imprescindibles); encaje con tres estados (cumple, por debajo, pendiente) y orden por grupos; cómo lo ven candidato y empresa. Bocetos de perfil, requisitos y encaje.

**Ficheros.** `docs/plan_post_reunion/skills_en_la_plataforma.md`, `TalentPact_Skills_en_la_plataforma.pdf`; `tools/generar_estructura_pdf.py` admite ahora varios documentos (`skills`). Sin cambios de código de producto.

---

## 2026-10-19 — Oferta: imprescindible o valorable, en tres pasos y desde un documento

**Qué.**
- **Cada skill de la oferta lleva su peso y su mínimo**: imprescindible o valorable, con banda mínima (Aceptable ≥40, Bueno ≥60, Muy bueno ≥80). Máximo 8 skills y 4 imprescindibles. Sustituye al único nivel para toda la oferta (básico ≥30 / intermedio ≥50 / avanzado ≥75). Las ofertas antiguas siguen funcionando: sus skills cuentan como imprescindibles con el mínimo equivalente.
- **Publicar en tres pasos**, como LinkedIn: el puesto → qué tiene que demostrar → condiciones. En el paso 2 salen 6 skills sugeridas según el área (se añaden con un clic) y una búsqueda que solo enseña coincidencias; ya no hay una rejilla con todo el catálogo. Preguntas, dilemas, etiquetas libres y configuración de ejercicios van plegados con su contador. Aviso si la oferta solo pide skills técnicas.
- **Rellenar la oferta desde un documento** (PDF, Word o texto pegado): la función `parse-job-doc` lo lee con Claude (`claude-opus-5-5`, salida con esquema obligatorio y skills limitadas al catálogo del servidor) y propone título, área, descripción, condiciones, salario, skills con peso y mínimo (con la frase del documento que lo justifica), preguntas, dilemas y avisos. Nada se publica sin que la empresa revise los tres pasos; los campos rellenados van marcados. El documento no se guarda. Los criterios discriminatorios del documento (edad, sexo, origen…) no se copian y se avisa.
- **Encaje por requisitos**: cada skill del candidato queda como cumple, por debajo o pendiente (sin prueba no es un suspenso). La lista de candidatos de una oferta se ordena por grupos (cumple las imprescindibles → con condición por hablar → le falta alguna por demostrar → por debajo) y muestra «3 de 3 imprescindibles · 1 de 2 valorables» con una marca por skill. El candidato ve en «Ofertas para ti» cuántas imprescindibles cumple.
- Áreas del formulario en español (Tecnología, Ventas, Recursos humanos…), con los mismos valores internos.

**Arreglado al probar.** `index.html` y 6 documentos (informe técnico, QA de la defensa, README y changelog de la prerreunión, Decisiones y Pendientes de la bóveda) se habían subido en `a765750` con marcas de un conflicto de git sin resolver: la web cargaba siete scripts dos veces (errores «Identifier has already been declared») y las marcas podían verse. Resueltos conservando la versión vigente (en el changelog, las dos partes). Nuevo test que impide volver a subir marcas de conflicto.

**Para el usuario.** Ejecutar `tfm/tech/supabase_schema_requisitos.sql` en Supabase (hasta entonces las ofertas se guardan sin requisitos, con la lista de skills de siempre). `ANTHROPIC_API_KEY` ya está en Netlify; opcional `ANTHROPIC_DOC_MODEL` para usar otro modelo en la lectura de documentos.

**Ficheros.** `netlify/functions/lib/requisitos.js`, `lib/oferta-doc.js`, `lib/handlers/parse-job-doc.js`, `parse-job-doc.mjs`, `save-job.js`, `list-jobs.js`, `lib/catalogo.js`; `assets/js/app/20-requisitos.js`, `07`, `10`, `17`; `index.html`, `componentes.css`; `tfm/tech/supabase_schema_requisitos.sql`; `tests/requisitos.test.js` (10) y `tests/plataforma.test.js` (1). Dependencia nueva: `@anthropic-ai/sdk`. Tests → 150 en 19 ficheros (cifras canónicas y documentos actualizados).

---

## 2026-10-19 — Google para empresas y verificación de empresa

**Revisión de lo subido.** `main` limpio y desplegado: talentpact.es carga la oferta en tres pasos, sin scripts duplicados ni errores en consola; las ofertas cargan aunque falte el SQL de requisitos. Aviso: el commit intermedio `3d66fd1` volvió a subir marcas de conflicto (`stash pop`); `4f265de` las quitó. El test nuevo lo habría parado.

**Qué.**
- **Google.** El acceso con Google ya estaba en el código pero **está desactivado en Supabase** (`npm run check:google`); el botón aparece solo al activarlo. Faltaba el caso de empresa: al entrar por primera vez con Google la ficha nacía solo con el email (y las ofertas salían con el email como nombre). Ahora se abre «Completa los datos de tu empresa» con nombre y web propuestos a partir del dominio corporativo y el nombre de la persona desde Google. Las cuentas creadas con email que tenían los datos solo en la cuenta se copian a la ficha pública sin preguntar. En el acceso de empresa, aviso «entra con la cuenta de Google de tu empresa (Google Workspace)», visible solo si Google está activo.
- **Verificación de empresa** (`lib/verificacion.js`), decidida por el servidor con datos que el usuario no puede editar:
  - *Google Workspace*: Google certifica (claim `hd` de la identidad) que la cuenta es del dominio del email.
  - *Email corporativo*: dominio propio (no Gmail, Hotmail…), email confirmado y el proyecto exige confirmar emails. Hoy la confirmación es automática, así que esta vía no verifica hasta cambiarlo.
  - Se recalcula al abrir el panel o guardar la ficha y se guarda en `companies`. Las ofertas muestran «Empresa verificada» (sin publicar el dominio). En el panel, tarjeta con el estado, el motivo si no está verificada y el botón «Verificar con Google».

**Para el usuario.** Activar Google en Supabase (Client ID y secreto de Google Cloud; valores exactos en Pendientes), ejecutar `tfm/tech/supabase_schema_verificacion.sql` y, cuando se pueda, exigir confirmar el email.

**Ficheros.** `netlify/functions/lib/verificacion.js`, `lib/tp.js`, `get-company.js`, `save-company.js`, `list-jobs.js`; `assets/js/app/21-empresa.js`, `08`, `09`, `17`; `index.html`, `componentes.css`; `tfm/tech/supabase_schema_verificacion.sql`; `tests/verificacion.test.js` (6). Tests → 156 en 20 ficheros; cifras canónicas, informe, Q&A, guion, deck y resumen del plan de negocio actualizados (los HTML de Q&A y guion seguían en 139).

---

## 2026-10-19 — Áreas de empleo como LinkedIn y vocabulario

**Qué.**
- **Un solo vocabulario** (`netlify/functions/lib/taxonomia.json`, copia generada para el navegador en `assets/js/app/01b-taxonomia.js` con `npm run taxonomia`): 7 áreas funcionales con sus especialidades, 12 sectores con los 22 ampliados colgando de ellos, área de cada skill del catálogo y nombre visible en español de cada skill.
- **Área = el puesto, sector = la empresa** (como LinkedIn: función e industria separadas):
  - Tablón de ofertas: filtros por las 7 áreas (antes 10 botones mezclados en inglés: IT / Dev, Data, Business…). La búsqueda encuentra también por área, especialidad y nombre en español de la skill.
  - Publicar oferta: «Área del puesto» con las 7 áreas; al elegirla aparece la **especialidad** (segundo nivel, opcional). Las skills sugeridas dependen del área.
  - Empresa: «Sector de la empresa» con los 12 sectores (ajustes y paso «Completa los datos de tu empresa»).
  - Candidato: «Área que más te interesa» en el registro y en ajustes.
  - Tarjeta de oferta: «Recursos humanos · Selección y atracción de talento».
- **Nombres en español** sin tocar lo guardado: «Recruiting» → «Selección de personal», «Data & Analytics» → «Análisis de datos», «Comunicación Escrita» → «Comunicación escrita»… (oferta, tarjetas, encaje y búsqueda).
- **Ofertas antiguas**: su «sector» (IT, Data, Sales…) se traduce a área al leerlas; al guardar se sigue rellenando el sector antiguo para el código que aún lo lee.
- La lectura del documento de la empresa propone área y especialidad.
- Arreglado: en el tablón público, sin sesión, las condiciones salían en rojo («✕ Jornada completa») comparadas con preferencias que el visitante no había indicado; ahora se muestran neutras. Los filtros de área ya no desmarcan otros filtros de la página.

**Para el usuario.** Ejecutar `tfm/tech/supabase_schema_areas.sql` (rellena el área de las ofertas existentes).

**Ficheros.** `lib/taxonomia.json`, `lib/taxonomia.js`, `tools/generar_taxonomia.js`, `01b-taxonomia.js`, `save-job.js`, `list-jobs.js`, `save-company.js`, `oferta-doc.js`; `07`, `08`, `17`, `20`, `21`; `index.html`; `tests/taxonomia.test.js` (5), ajustes en `ofertas`, `requisitos` y `diseno`. Tests → 161 en 21 ficheros.

---

## 2026-10-19 — Antitrampas: contenido en el servidor, intento único y cámara obligatoria

**Qué pasaba (grave).** Los enunciados, los datos y las **soluciones** de los 103 retos estaban en `07-retos-comunes.js`, que descarga cualquiera: se podía leer un reto sin empezarlo y sacar un 100 en las clasificaciones. Las secuencias numéricas se corregían en el navegador. Se podía abrir un reto, cerrarlo y repetirlo, y la cámara era opcional.

**Qué.**
- **Contenido solo en el servidor** (`lib/catalogo-retos.json`, única fuente; `tools/separar_contenido_retos.js` lo movió una vez). En la web quedan los metadatos. Al empezar, el servidor entrega el enunciado y los datos **sin soluciones ni pistas del corrector**. Se retira `tools/generar_catalogo_servidor.js`; el test de catálogo ahora impide que vuelva contenido al navegador.
- **Un intento por persona y reto** (`retos-intento`, tablas `attempts` y `attempt_requests`): abrir el reto lo consume; el reloj es del servidor; cerrar y volver dentro del plazo retoma el mismo intento. Pasado el plazo, ya está usado: se puede **pedir otra oportunidad explicando el motivo**, que revisa una persona (al aprobarla, el intento se anula solo).
- **Una nota oficial solo se guarda con un intento válido, y una sola vez** (`save-evaluation`); el intento queda «entregado».
- **Cuenta y cámara obligatorias.** Pantalla «Antes de empezar»: activar cámara con vista previa y comprobación de luz y de persona delante, normas, casilla de intento único. Sin cámara activa no se puede empezar; quien no pueda usarla pide una alternativa (por ejemplo, videollamada). Al empezar se pide pantalla completa; salir de ella queda en el informe de integridad. Aviso al cerrar a mitad.
- **Secuencias y clasificaciones** se corrigen en el servidor; si falla la corrección no se inventa una nota local.
- `legal.html` §05: un intento por reto, cámara obligatoria con base en interés legítimo (con EIPD) y alternativa sin cámara. Pendiente de revisión legal.

**Para el usuario.** Ejecutar `tfm/tech/supabase_schema_intentos.sql`. Hacer la EIPD antes de exigir la cámara en producción. Las solicitudes se resuelven de momento con el `update` del propio SQL.

**Ficheros.** `lib/intentos.js`, `lib/handlers/retos-intento.js`, `retos-intento.mjs`, `save-evaluation.js`, `evaluator.js` (`corregirSecuencias`), `evaluate-exercise.js`, `catalogo.js`, `catalogo-retos.json`; `07` (solo metadatos), `08`, `13`, `22-reto-oficial.js`; `index.html`, `componentes.css`, `legal.html`; `tfm/tech/supabase_schema_intentos.sql`; `tests/intentos.test.js` (5), `tests/catalogo.test.js` (3, nuevo). Tests → 168 en 22 ficheros.

---

## 2026-10-19 — SkillPass: el sello en blockchain pasa a ser de pago

**Qué.** «Generar mi SkillPass» emite la credencial gratis (enlace y QR; verify.html y el panel de empresa la muestran como «Emitido por TalentPact»). El sello público en blockchain es un extra de 4,99 € (`SEAL_PRICE_CENTS`), ofrecido en una línea pequeña al final de la tarjeta: pago con Stripe (`pay-seal`, vuelta `?sello=ok`), confirmación con Stripe o webhook, y solo entonces `anchor-credential` ancla (402 `sello_no_pagado` sin pago). Verificar sigue siendo gratis.

**Para el usuario.** Ejecutar `tfm/tech/supabase_schema_sello.sql`. Sin él, el sello sale como «todavía no disponible».

**Ficheros.** `lib/sello.js`, `handlers/pay-seal.js`, `pay-seal.mjs`, `anchor-credential.js`, `stripe-webhook.js`, `verify-credential.js`; `06`, `09`, `99`, `verify.html`, `index.html`, `componentes.css`; `tests/sello.test.js` (2). Tests → 170 en 23 ficheros. Pendiente de revisar en el navegador.

---

## 2026-10-19 — Clasificación de la asesora: áreas y sectores ampliados, 6 dimensiones de competencias

**Qué.**
- **Áreas del puesto:** 9 generales (las 7 resumidas más «Dirección, estrategia y consultoría» y «Sanidad, educación e investigación»), con las 21 de la versión ampliada como «Área concreta». La concreta aparece solo si el área general tiene varias. El tablón filtra por las 9.
- **Sector de la empresa:** 12 generales y «Concretamente» con los 22 ampliados, en dos pasos (Ajustes y «Completa los datos de tu empresa»).
- **Diccionario de competencias** (Word de la asesora): 6 dimensiones y 32 competencias, con su definición, en `taxonomia.json`. Las dimensiones 01, 02 y 05 van a Transferibles; las 03, 04 y 06, a Soft. Cada reto transversal indica qué competencias evalúa. El pilar de una skill ya no se escribe a mano: sale de su dimensión.
- **Catálogo de retos** (portada y panel): al elegir un pilar aparece una segunda fila con sus dimensiones o sus áreas, cada una con su número de retos. En el panel, la dimensión elegida enseña sus competencias y resalta las que tienen reto.
- **Oferta, paso 2:** selector «Tipo de puesto» con los 6 paquetes del diccionario. Sugiere «Del oficio» (por área) y «Competencias para…» (por paquete), y avisa de las competencias del paquete que aún no tienen reto.
- Cambian de pilar: Toma de decisiones (de Soft a Transferibles) y Networking (de Hard a Soft).

**Por qué.** Propuesta de la asesora: versión ampliada, selección progresiva, sector separado del área y competencias sugeridas por tipo de puesto. Detalle y huecos del catálogo: [09_clasificacion_retos_y_competencias.md](09_clasificacion_retos_y_competencias.md).

**Para validar con la asesora.** Las dos áreas generales nuevas, el reparto de dimensiones entre Soft y Transferibles, y las competencias asignadas a cada reto.

**Ficheros.** `lib/taxonomia.json`, `lib/taxonomia.js`, `lib/personas.js`, `tools/generar_taxonomia.js`, `01b-taxonomia.js`, `save-job.js`, `save-company.js`, `oferta-doc.js`; `08`, `09`, `19`, `20`, `21`, `23-clasificacion.js` (nuevo); `index.html`, `componentes.css`; `docs/plan_post_reunion/asesora/` (diccionario original); `tests/taxonomia.test.js` (+2), `tests/rrhh.test.js`. Tests → 172 en 23 ficheros. Sin SQL nuevo.

---

## 2026-10-19 (noche) — Retos en dos bloques: Hard skills (sector → área) y Soft skills (dimensión → enfoque)

**Qué.** Fuera los tres pilares: no hay «Transferibles». **Hard skills:** 10 sectores (las 9 áreas generales e Idiomas) y, dentro, las 21 áreas concretas. Cada reto técnico tiene la suya (`areaConcretaDeSkill`). **Soft skills:** las 6 dimensiones del diccionario y, dentro, sus 32 enfoques. Una skill es soft si tiene dimensión y hard si no. Panel del candidato rehecho: dos tarjetas grandes (Hard / Soft), tarjetas de sectores o dimensiones con su número de retos, chips de áreas o enfoques (los que no tienen reto se ven, desactivados), definición del enfoque elegido, línea de «dónde estás» y filtro Todos / Pendientes / Completados. La portada usa los mismos niveles. En la oferta y en la ficha del candidato solo quedan Hard y Soft.

**Por qué.** Petición del equipo: olvidar la estructura anterior y que los retos se vean divididos así, de forma sencilla y visible.

**Ficheros.** `lib/taxonomia.json`, `lib/taxonomia.js`, `lib/personas.js`, `tools/generar_taxonomia.js`, `01b-taxonomia.js`, `19-rrhh.js`, `20-requisitos.js`, `23-clasificacion.js`; `index.html`, `componentes.css`; `tests/taxonomia.test.js`, `tests/rrhh.test.js`. Tests → 172 (sin cambio de número).

---

## 2026-10-20 — Revisión del código de Iván (14–20/10): ofertas de ejemplo fuera y pipeline acotado

**Qué.**
- Retirado `supabase_seed_ofertas_demo.sql` (4 empresas ficticias y 8 ofertas). Su limpieza nunca funcionaba: buscaba `%@demo.talentpact.es` y los correos eran `rrhh@nortepay.demo.talentpact.es`. En su lugar, `supabase_limpiar_ofertas_demo.sql` borra esas empresas y ofertas por sus ids fijos y por el dominio correcto (hay que ejecutarlo en Supabase).
- Pipeline (`applications`): una empresa ya no puede meter en su proceso, ni avisar, a un candidato que no se ha postulado a esa oferta y que se ha ocultado del pool. Antes bastaba con conocer el id del perfil para mandarle «Enhorabuena: te han elegido».
- Dilemas: la respuesta vacía conserva su hueco (antes se descartaba y las siguientes se corrían al dilema de antes), en el navegador y en el servidor.
- `viewProfile` usa `tpPoolCondChips` sin copia duplicada; `assets/js/README.md` ya no habla de Transferibles.

**Por qué.** Regla de no mostrar contenido de demostración; un candidato oculto no debe recibir avisos de una empresa con la que no ha tenido relación.

**Ficheros.** `tfm/tech/supabase_limpiar_ofertas_demo.sql`, `netlify/functions/lib/handlers/applications.js`, `netlify/functions/lib/handlers/apply.js`, `assets/js/app/08-ofertas-y-ejercicios.js`, `assets/js/app/19-rrhh.js`, `assets/js/app/10-paneles-y-pagos.js`, `tests/pool.test.js`, `tests/rrhh.test.js`. Tests: 174.

---

## 2026-10-20 — Notas en bandas, no de 0 a 100

**Qué.** Cada skill se enseña con su banda (Insuficiente < 40 · Aceptable 40–59 · Bueno 60–79 · Muy bueno ≥ 80) y cuatro segmentos. El candidato ve banda y nota; la empresa ve la banda y el número solo al pasar el ratón. La ficha del candidato para la empresa agrupa las skills en dos bloques (Hard skills / Soft skills). Fuera la nota media global: el pool ya no tiene columna «Score», la tarjeta de candidato de una oferta no lleva el círculo con la media, el panel del candidato cuenta «Skills en Bueno o más» y «Skills demostradas», y la estadística de empresa cuenta candidatos con alguna skill en «Muy bueno». El resultado de un reto muestra la banda junto a la nota.

**Por qué.** Documento «Skills en la plataforma»: la empresa ve lo que se puede defender (una banda), no una cifra exacta; nada de nota media ni de ranking por media.

**Pendiente de decidir.** El ranking del candidato sigue ordenando por media (ahora enseña bandas). El documento de skills pide no tener ranking por media.

**Ficheros.** `assets/js/app/18-interfaz.js` (`tpBanda`, `tpBandaHtml`, `tpBloquesSkills`, `tpChipsBanda`), `netlify/functions/lib/bandas.js`, `07`, `08`, `10`, `16`, `17`, `19`, `23`, `index.html`, `componentes.css`, `tests/bandas.test.js` (2). Tests: 176 en 24 ficheros.

---

## 2026-10-20 — SkillPass definitivo: credencial W3C firmada, revocación, caducidad y sello por lotes (plan 03 completo)

**Qué.**
- **Credencial**: el SkillPass es ahora una credencial verificable W3C VC 2.0, firmada por TalentPact con Ed25519 (`eddsa-jcs-2022`), emisor `did:web:talentpact.es`. Lleva un seudónimo (no el email ni el id del perfil), las skills con su bloque y su **banda** (no la nota exacta), la fecha, si la nota está verificada y la versión de la rúbrica. Caduca a los 12 meses.
- **Revocación**: el titular puede retirar su SkillPass desde el panel; un admin puede revocarlo por fraude con motivo. Lista pública `/status/1` (Bitstring Status List, 131.072 entradas, índice al azar): quien verifica descarga la lista entera y nadie sabe qué credencial mira.
- **Clave pública** en `/.well-known/did.json`: cualquiera comprueba la firma sin preguntarnos.
- **Verificación en cinco estados** (empresa, portada y `verify.html`): válida y vigente, válida pero caducada, revocada, alterada, no encontrada. Detalle con skills en dos bloques y bandas, fecha, verificación, rúbrica; sello público plegado con «Comprobar sin TalentPact» (contrato, raíz, hoja, sal y prueba). Se puede pegar el enlace, el código o subir el .json.
- **Sello por lotes**: pagar el sello (4,99 €) mete la credencial en la cola; `anchor-batch` (función programada, 00:05 UTC) publica una sola raíz de Merkle al día con `anchorRoot` del nuevo contrato `SkillPassRegistryV2` en una capa 2 (Base; Base Sepolia para pruebas). Cada credencial guarda su hoja (keccak256(sal ‖ credencial)) y su prueba. Si el envío falla, vuelve a la cola; con más de 3 días de espera se avisa en el registro. Desaparece el tope de 3 sellados al día.
- **RGPD**: al borrar la cuenta se borran la credencial y su sal; lo publicado queda como un número que ya no se vincula a nadie (explicado en `legal.html` §06).
- **Interfaz** (plan 03 §5.1): «Firmado por TalentPact · válido hasta … · Copiar enlace»; «Sello público: no · Añadir sello (4,99 €)» o plegado con los detalles. Fuera «blockchain» de los titulares: «Habilidades demostradas y verificables».
- Las credenciales v1 (Sepolia, una transacción por huella) se siguen verificando.

**Para el usuario.** 1) `npm run vc:clave` y pegar `VC_SIGNING_KEY` en Netlify. 2) Ejecutar `tfm/tech/supabase_schema_vc.sql`. 3) Fondear la cartera emisora en Base Sepolia y `npm run deploy:contract:v2`; pegar `SKILLPASS_V2_CONTRACT_ADDRESS` (y `SEAL_CHAIN=base` cuando sea en producción). Sin 1, el SkillPass se emite sin firma; sin 2, se emite pero no se puede revocar ni sellar; sin 3, el sello queda en cola.

**Ficheros.** `lib/vc.js`, `lib/merkle.js`, `lib/statuslist.js`, `lib/skillpass.js`, `lib/bandas.js`, `lib/tp.js`; handlers `issue-credential`, `anchor-credential`, `anchor-batch` (nuevo, programado), `verify-credential`, `revoke-credential`, `status-list`, `did-web` (nuevos), `pay-seal`; `SkillPassRegistryV2.sol`; `supabase_schema_vc.sql`; `06-skillpass-y-sesion.js`, `24-verificar.js` (nuevo), `09-acceso.js`, `index.html`, `verify.html` (rehecho con los tokens), `legal.html`, `componentes.css`, `netlify.toml`, `serve-demo.js`, `deploy-contract.js --v2`, `generar-clave-vc.js`; `tests/skillpass-v2.test.js` (8), `tests/sello.test.js`. Tests: 184 en 25 ficheros.

---

## 2026-10-20 — Rama IA: apartado propio con 11 retos complejos (plan 02)

**Qué.**
- Tercer bloque en el catálogo, **Inteligencia artificial**, junto a Hard y Soft (panel del candidato y portada, filtro «IA»): **Rama técnica** (por los 6 itinerarios del plan: Ingeniería de IA/ML, IA generativa/LLM, Investigación, Plataforma, Seguridad, IA aplicada) e **IA en el trabajo** (para cualquier puesto).
- **10 retos técnicos (ola 1)**: Python para IA, Datos para ML, Machine learning, LLM, APIs de LLM, RAG, Agentes, Evaluación de modelos, MLOps/LLMOps y Seguridad de IA. Cada uno con 3 ejercicios: diagnóstico o revisión de un artefacto (código, traza, métricas), diseño o lectura de resultados con restricciones reales (presupuesto, latencia, permisos, Reglamento de IA) y una clasificación que se corrige sin IA. Ejemplos: buscador interno con permisos (35 min), A/B con intervalos y reparto desequilibrado, inyección indirecta en un asistente de correo, agente de reembolsos con límites.
- **IA en el trabajo** (competencia 05.6, cuenta como soft): revisar un informe de IA con 3 errores y un dato confidencial, encargar bien una tarea, y clasificar 8 usos en «Sí / Sí, con controles / No».
- **Corrector 2.2.0**: rúbrica `tecnico_ia` (corrección técnica 35 · justificación 25 · riesgos y límites 20 · comunicación técnica 20) que fija el catálogo, no el navegador; y **errores que penalizan** por ejercicio, escritos como criterio de experto: si la respuesta comete uno (p. ej. «filtra los permisos después de generar»), ese criterio no pasa de su tope. Nunca llegan al navegador.
- Portada: «114 retos (14 transversales, 89 de sector y 11 de inteligencia artificial)», calculado del catálogo.

**Pendiente.** Revisión de los 33 ejercicios por un experto en IA (indicadores y errores que penalizan) y gold set; fase 2 (ejecutar código en un entorno aislado) y defensa de 2 preguntas; itinerarios de IA en la oferta.

**Ficheros.** `tools/retos_ia.json` (contenido), `tools/agregar_retos_ia.js` (lo vuelca en `catalogo-retos.json`, `07-retos-comunes.js` y `taxonomia.json`), `evaluator.js`, `evaluate-exercise.js`, `intentos.js`, `19-rrhh.js`, `23-clasificacion.js`, `18-interfaz.js`, `00-iconos.js`, `index.html`, `tests/rama-ia.test.js` (5). Tests: 189 en 26 ficheros.

---

## 2026-10-20 — Paneles con menú lateral y Ajustes como página propia

**Qué.**
- **Candidato**: menú lateral con Mi perfil, Retos, Ofertas, Ranking, Explorar, Ajustes y Ayuda (antes, pestañas horizontales). Las cifras del perfil pasan a la página «Mi perfil».
- **Empresa**: el panel era una sola página larga; ahora tiene Resumen (cifras, avisos y accesos rápidos), Ofertas (publicar, mis ofertas y sus candidatos), Talento (pool), Verificar credencial, Plan y Ajustes.
- **Ajustes** deja de ser un cajón que tapaba el panel: es una página del menú, con el mismo contenido y los mismos campos (datos, preferencias, privacidad, seguridad, borrar cuenta). El engranaje de la barra superior lleva a ella.
- En móvil el menú es una barra horizontal fija que se desplaza; sin desbordes a 375 px, en claro y en oscuro.

**Ficheros.** `index.html`, `10-paneles-y-pagos.js` (`tpPanelIr`, `openSettings`), `07-retos-comunes.js`, `06`, `08`, `14`, `20`, `componentes.css`.

---

## 2026-10-20 — Seguridad: límites persistentes, CORS cerrado y RLS comprobado en todas las tablas

**Qué.**
- **Límite de frecuencia persistente** (`lib/limites.js`, tabla `rate_events`): el de antes vivía en la memoria de cada instancia y se reiniciaba en cada arranque en frío. Ahora cuenta también en Supabase (la clave se guarda como hash, sin IPs en claro). Se aplica al corrector (60 cada 10 min por cuenta; 12 por IP sin sesión), al chat de ayuda, a la lectura de documentos de oferta, a verificar SkillPass (120 cada 10 min por IP), a emitir SkillPass y a postularse. El navegador manda la sesión al corrector para que el límite vaya por cuenta.
- **CORS cerrado**: las funciones solo aceptan llamadas del propio dominio (`SITE_URL`). Antes cualquier web podía usarlas desde el navegador de un visitante (incluidas las que gastan IA). Solo verificar, la lista de revocación y el documento DID siguen abiertos, porque son públicos por diseño.
- **Sin caché** (`no-store`) y `nosniff` en todas las respuestas de las funciones.
- **RLS**: test que obliga a que toda tabla de los SQL tenga RLS activado y a que `npm run check:rls` la revise (ahora las 14 tablas; antes solo 5).
- Revisado: sin secretos en el repositorio; el webhook de Stripe exige firma; las funciones caras exigen o sesión o límite por IP; el pipeline ya no deja avisar a candidatos ajenos (arreglo del mismo día).

**Para el usuario.** Ejecutar `tfm/tech/supabase_schema_seguridad.sql` y después `npm run check:rls`.

**Pendiente (decisión o configuración, no código).** Exigir confirmar el email; activar la verificación en dos pasos (TOTP) y la protección contra contraseñas filtradas de Supabase; quitar `'unsafe-inline'` de la CSP (requiere pasar los `onclick` del HTML a JavaScript); copias con PITR en Supabase; rotar las claves si alguna se compartió.

**Ficheros.** `lib/limites.js`, `lib/tp.js`, handlers `evaluate-exercise`, `support-chat`, `parse-job-doc`, `verify-credential`, `issue-credential`, `apply`, `status-list`, `did-web`; `08-ofertas-y-ejercicios.js`; `check-rls.js`; `supabase_schema_seguridad.sql`; `tests/seguridad.test.js` (3). Tests: 192 en 27 ficheros.

---

## 2026-10-20 — Mejora de cada ejercicio: los 342, uno por uno

**Qué.**
- **Auditoría** (`tools/auditar_retos.js`): reglas objetivas por ejercicio. Al empezar, 287 de 342 ejercicios fallaban alguna: escenarios de relleno (249), emojis y símbolos (165), análisis sin tabla de datos (72), clasificaciones de 4 opciones (74), guías sin puntos de los que el corrector saca los indicadores, títulos en inglés.
- **72 retos de plantilla reescritos enteros.** Eran «X — Nivel Básico / Caso Práctico / Reto Avanzado», con tablas de «Concepto A / Valor 1» y opciones como «Opción estratégica A»: contenido de relleno de cara al candidato. Ahora cada uno tiene un análisis con una tabla de datos realista y una pregunta en tres partes, un escrito con destinatario y guía en cuatro bloques, y una clasificación de 8 o 9 casos con las categorías explicadas. Cubre tecnología, datos, marketing, comercial, finanzas, personas y legal, operaciones, diseño, educación, comunicación, idiomas (con el ejercicio en inglés, francés o alemán), sectores y emprendimiento.
- **21 retos con contenido real, retocados:** escenarios ampliados, guías numeradas y títulos en español. Además:
  - **Soluciones fuera de los enunciados:** el código de tres ejercicios llevaba marcado dónde estaba cada error (`// Bug 1: no suma`).
  - **Guías que ya no resuelven el ejercicio:** varias daban las fórmulas de Excel, el truco del LEFT JOIN o el `set()` de Python.
  - **Un ejercicio arreglado:** la comprensión en inglés preguntaba por un mensaje que no aparecía en ningún sitio.
- **Rama IA:** escenarios de clasificación explicados.
- **Corrector:** reconoce las guías numeradas con «1.» al principio de línea (antes solo «1)»). Las guías de los retos ya reescritos, como RGPD, le llegaban como un único indicador.
- **Catálogo:** todo el contenido sin ✓/✕/⚠︎, con categorías en minúscula y sin el campo de emoji de cada reto.
- **Test nuevo** (`tests/catalogo-calidad.test.js`, 3): obliga a que la auditoría quede a cero, a que no vuelva ninguna plantilla y a que el código no lleve marcados los errores.

**Pendiente.** Revisión de contenido por la asesora (soft skills) y por expertos de cada área; los retos de oferta (`EX_DB`) siguen fuera del catálogo del servidor.

**Ficheros.** `tools/mejoras_retos/01…14_*.json` (contenido revisable), `tools/aplicar_mejoras_retos.js`, `tools/auditar_retos.js`, `catalogo-retos.json`, `07-retos-comunes.js`, `evaluator.js`, `tools/retos_ia.json`, `tests/catalogo-calidad.test.js`. Tests: 195 en 28 ficheros.

---

## 2026-10-20 — Arreglo al ejecutar retos y cierre de una fuga de soluciones

**Qué.**
- **Enunciados de los retos**: se pintaban tal cual (`<p>${ex.scenario}</p>`). El código de un ejercicio (por ejemplo, el `<input>` de un componente React) se convertía en HTML real dentro del enunciado, y el texto salía sin párrafos ni bloques de código. Ahora se escapa, se separa en párrafos y el código va en un bloque monoespaciado (`tpFormatoEnunciado`). Escapados también la tabla de los análisis, las opciones y categorías de las clasificaciones, y el destinatario y el asunto de los correos.
- **Guía de respuesta visible**: iba como texto de ayuda dentro del cuadro de respuesta y desaparecía al empezar a escribir. Ahora está en un recuadro fijo encima («Cómo organizar tu respuesta»).
- **Fuga de soluciones**: sin carpeta de publicación en `netlify.toml`, Netlify servía el repositorio entero, así que `talentpact.es/netlify/functions/lib/catalogo-retos.json` (enunciados y soluciones de todos los retos), `tools/` y `tests/` se podían descargar. Bloqueados con redirecciones 404 forzadas (también `tfm/tech/`, la bóveda y los ficheros internos). `serve-demo.js` bloquea lo mismo y hay una página `404.html`.
- Comprobado en el navegador: análisis, correo, clasificación de 2, 3 y 4 categorías, secuencias y un reto de IA se pintan bien, y una clasificación se corrige de principio a fin con la solución del servidor.

**Ficheros.** `08-ofertas-y-ejercicios.js`, `18-interfaz.js`, `componentes.css`, `netlify.toml`, `serve-demo.js`, `404.html`, `tests/bandas.test.js`, `tests/seguridad.test.js`. Tests: 197 en 28 ficheros.

---

## 2026-10-21 — «Buscar candidatos» al estilo Recruiter, cribado en ofertas y desbloqueos gratis

**Qué.**
- **Talento → «Buscar candidatos».** Columna de filtros principales (puesto o área, ubicación con remoto y «acepta mudarse», skills demostradas con banda mínima, tipo de skill, situación de búsqueda, sector, palabras clave) y tres secciones plegables con filas «+ campo» (Condiciones del puesto, Evidencia, Interés y actividad). Contador «N candidatos encajan de M en el pool», recuento junto a cada opción, filtros activos como etiquetas que se quitan con un clic y, si no sale nadie, qué filtro quitar y cuántos aparecerían. En móvil la columna se pliega tras un botón para ver antes los resultados.
- **Buscar con IA.** Describir el perfil o importar un documento (o usar una oferta propia) y convertirlo en filtros revisables. Usa `parse-job-doc` en modo búsqueda; si la IA no responde, un lector local saca área, skills, modalidad, jornada, contrato, ciudad, salario y disponibilidad.
- **Situación de búsqueda («open to work»).** Nueva preferencia del candidato: busca activamente, abierto a propuestas o no. Se ve en cada tarjeta y se puede filtrar.
- **«Le interesa tu empresa».** Botón «Me interesa esta empresa» en la oferta; también cuenta haberse postulado a una oferta de la empresa. La empresa solo recibe un sí/no para ella, nunca la lista del candidato.
- **Preguntas de cribado** en la oferta (hasta 6, de sí o no): de **contrato** (confirmar condiciones) y de **descarte** (requisitos). Se proponen a partir de los campos de la oferta y se rechazan las que preguntan por datos protegidos (edad, nacionalidad, hijos, estado civil, religión, salud, ideología…). No descartan solas: si el candidato no da la respuesta de una eliminatoria, se le avisa antes de enviar; la empresa ve «No cumple» y puede «Descartar por cribado» con un clic y el motivo ya escrito.
- **Desbloqueos gratis.** Las 3 primeras ofertas que publica una empresa incluyen 1 desbloqueo de contacto gratis cada una. Se ofrece en el modal de pago y se ve en Talento, Ofertas y Plan. El servidor cuenta y vuelve a contar para que dos clics a la vez no gasten de más.

**Para el usuario.** Ejecutar `tfm/tech/supabase_schema_cribado.sql` (columnas `jobs.screening` y `applications.screening_answers`). Sin él, las ofertas se publican sin cribado y nada falla.

**Ficheros.** `get-talent-pool.js`, `lib/gratis.js`, `unlock-free` (handler y entrada), `lib/cribado.js`, `save-job.js`, `list-jobs.js`, `apply.js`, `applications.js`, `oferta-doc.js`, `parse-job-doc.js`, `lib/notify.js`, `index.html`, `08`, `14`, `16`, `17`, `19`, `25-talento.js`, `26-cribado.js`, `componentes.css`, `supabase_schema_cribado.sql`, `tests/talento.test.js` (7). Detalle en [11_busqueda_candidatos.md](11_busqueda_candidatos.md). Tests: 204 en 29 ficheros.
