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

---

## Pendiente / siguiente

- Deploy a Netlify.
- Email real del aviso (hoy es bandeja in-app; Resend/SMTP después).
- Encaje ponderado fino opcional (ya hay boost si la oferta pide skills de Personas).
