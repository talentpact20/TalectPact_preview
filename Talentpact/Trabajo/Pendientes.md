# Pendientes

## Decide el equipo
- [ ] **Plan post reunión** (`docs/plan_post_reunion/00_plan_maestro.md`, §5): fase 0 antitrampas, diccionario canónico, 12 sectores + 7 áreas, intento oficial cada 30 días, precios (Plus 6,99 €/mes · 49 €/año, sello 4,99 €, certificación IA 39 €, perfil IA 89 €), prueba gratuita 30 días, quién hace el gold set, pago del candidato con Stripe. Ver [[Plan post reunión]].
- [ ] **Skills en la plataforma** (19/10, `skills_en_la_plataforma.md`, parte 08): grados declarada/demostrada/verificada, pasaporte básico de 3 retos. Hecho en código el 19/10: imprescindible/valorable con banda mínima por skill, oferta en 3 pasos, relleno desde documento y encaje en 3 estados.
- [ ] **Búsqueda de candidatos tipo LinkedIn Recruiter** (19/10): columna fija + secciones plegables (condiciones, evidencia, perfil, actividad) + contador en vivo + listas, notas y búsquedas guardadas. ¿Parte avanzada solo en Pro/Enterprise? Ver `estructura_plataforma.md`, parte 08, y doc 01 §8.
- [x] **Ofertas de ejemplo en producción** (20/10): decidido quitarlas. Seed retirado del repo.

- [ ] Decisiones de `04_estrategia.md`: perfil de trabajo inicial, plazo entre reintentos, nota por bloques, pool solo para empresas verificadas. Ver [[Estrategia]].

- [x] Análisis completo del backend (15/10): ver `docs/Cambios_prereunion/05_errores_y_mejoras.md`, sección 7.
- [ ] Pasar los retos de oferta (`EX_DB`) al catálogo del servidor; límite de frecuencia persistente para el corrector; transcripción del audio.

- [x] Corrector v2.1 (15/10): rúbrica con pesos, evidencia verificada, topes en servidor, clasificaciones sin IA. Ver `docs/Cambios_prereunion/06_corrector.md`.
- [ ] Corrector: gold set del catálogo con notas humanas (asesora) y banco v2 sobre el corrector real; bandas para la empresa; doble corrección cerca de los cortes.

## Supabase (usuario)
- [ ] **Ejecutar `supabase_schema_seguridad.sql`** (límite de frecuencia persistente) y luego `npm run check:rls`.
- [ ] **SkillPass v2**: `npm run vc:clave` → `VC_SIGNING_KEY` en Netlify; ejecutar `supabase_schema_vc.sql`; fondear la cartera en Base Sepolia y `npm run deploy:contract:v2` → `SKILLPASS_V2_CONTRACT_ADDRESS`. Para producción, `SEAL_CHAIN=base`. Ver changelog 20/10.
- [ ] **Ejecutar `supabase_limpiar_ofertas_demo.sql`** para borrar las 4 empresas y 8 ofertas de ejemplo que siguen en producción.
- [ ] **Ejecutar `supabase_schema_intentos.sql`** (intento único por reto y solicitudes). Sin él los retos funcionan sin control de intento. Resolver solicitudes, de momento, con el `update` que trae el propio SQL.
- [ ] **Ejecutar `supabase_schema_areas.sql`** (área y especialidad en `jobs`; rellena las ofertas existentes desde su sector antiguo). Sin él, el área se deduce del sector antiguo y la especialidad no se guarda.
- [ ] **Activar Google** (Authentication → Sign In / Providers → Google, con el Client ID y el secreto de Google Cloud). En Google Cloud: origen `https://talentpact.es` y redirección `https://vqyqedmizxqneniynxqp.supabase.co/auth/v1/callback`. Comprobar con `npm run check:google -- https://talentpact.es`. El código ya está: el botón aparece solo.
- [ ] **Ejecutar `supabase_schema_verificacion.sql`** (columnas de verificación en `companies`). Sin él, la verificación se calcula pero no se guarda y las ofertas no muestran el sello.
- [ ] **Exigir confirmar el email** (desactivar la confirmación automática): hasta entonces un email corporativo no verifica a la empresa; solo Google Workspace.
- [ ] **Ejecutar `supabase_schema_requisitos.sql`** (requisitos imprescindible/valorable por skill en `jobs`). Sin él, las ofertas se guardan sin requisitos.
- [ ] **Activar Google** en Authentication → Providers (hoy Google y LinkedIn están desactivados; ver `docs/Cambios_prereunion/01_changelog.md`, 15/10). Añadir `https://talentpact.es/` a Redirect URLs.
- [ ] Decidir si se exige confirmar el email al registrarse (hoy `mailer_autoconfirm` está activo: cualquiera puede registrarse con un correo ajeno).
- [ ] Ejecutar `supabase_schema_pool_fix.sql` si falta.
- [ ] Ejecutar `supabase_schema_rrhh_corto.sql` (preguntas de vacante, avisos, pipeline).
- [ ] Rol admin en `app_metadata` y **`EVAL_SIGNING_SECRET` en Netlify** (sin él ninguna nota sale verificada).
- [ ] Ejecutar `supabase_schema_dilemmas.sql` (dilemas en oferta + respuestas al postularse).
- [ ] Rol admin en `app_metadata` y `EVAL_SIGNING_SECRET` en Netlify.

## Código (Claude)
- [x] Menú lateral en los paneles de candidato y empresa y Ajustes como página propia (20/10).
- [x] Rama IA (20/10): bloque propio en el catálogo, 10 retos técnicos de la ola 1 + IA en el trabajo (33 ejercicios), rúbrica técnica y errores que penalizan (corrector 2.2.0).
- [ ] Rama IA: revisión por un experto, gold set, itinerarios en la oferta, fase 2 (sandbox) y defensa de 2 preguntas; ola 2 (6 competencias).
- [x] Blockchain definitivo (plan 03): VC 2.0 firmada, revocación, caducidad, verificación en 5 estados, lote Merkle diario, contrato v2 (20/10).
- [ ] Blockchain: verificación por lotes (CSV) y API `GET /verify/{id}` para Pro/Enterprise; multifirma 2 de 2 como emisor del contrato v2; EBSI más adelante.
- [x] Pasada de seguridad (20/10): límites persistentes, CORS cerrado, no-store, RLS de las 14 tablas comprobado por test.
- [ ] Seguridad siguiente: quitar 'unsafe-inline' de la CSP (pasar los onclick a JS), TOTP y protección de contraseñas filtradas en Supabase, PITR.
- [ ] Mejorar cada ejercicio uno por uno (pedido el 20/10, después de lo demás).
- [x] Revisión del código de Iván (20/10): seed fuera, pipeline solo con postulados o visibles en el pool, dilemas alineados.
- [x] Antitrampas fase 0 + intento único + cámara obligatoria (19/10): contenido y soluciones fuera del navegador, `retos-intento`, comprobación previa, pantalla completa, solicitudes de reapertura y de alternativa a la cámara, secuencias corregidas en el servidor. Pendiente de commit.
- [ ] Backoffice: cola de solicitudes (reapertura / sin cámara) con aprobar y rechazar, y aviso al candidato en su bandeja.
- [ ] Antitrampas siguientes: variantes por intento (datos distintos y detalle trampa), defensa de 2 preguntas, patrón de escritura, detección de móvil y segunda persona, segundo monitor; retos de oferta (`EX_DB`, `03-datos-retos.js`) aún con contenido en el navegador.
- [ ] Legal: evaluación de impacto (EIPD) antes de activar la cámara obligatoria en producción; revisar `legal.html` §05 con asesoría.
- [x] Áreas de empleo tipo LinkedIn y vocabulario (19/10): `taxonomia.json` único (7 áreas + especialidades, 12 sectores + ampliados, nombres de skills en español), oferta con área y especialidad, tablón filtrado por área, sector de empresa (12), área de interés del candidato. Pendiente de commit.
- [x] Clasificación de la asesora (19/10): 9 áreas generales con las 21 concretas, 12 sectores con los 22 concretos (en dos pasos), 6 dimensiones y 32 competencias, catálogo de retos filtrado por pilar y luego por dimensión o área, tipo de puesto en la oferta con competencias sugeridas. Ver `docs/Cambios_prereunion/09_clasificacion_retos_y_competencias.md`. Pendiente de commit.
- [x] Retos en dos bloques (19/10, noche): Hard skills (sector → área) y Soft skills (dimensión → enfoque); fuera Transferibles. Pendiente de commit.
- [ ] Validar con la asesora: las dos áreas generales nuevas (Dirección y Sanidad/educación), llamar «sectores» a esas áreas generales dentro de Hard skills, y los enfoques de cada reto.
- [ ] Retos para las 16 competencias sin reto (dimensión 06 entera; casi toda la 02 y la 03), usando el «reto sugerido» de cada ficha del diccionario. Rúbricas con los anclajes 1/3/5 y la escala NE + 1–5.
- [ ] Siguiente de áreas: filtro de área en el pool; «Recomendados para ti» por área del candidato; códigos ESCO.
- [x] Google integrado para empresas (paso «Completa los datos de tu empresa», aviso de Workspace) y verificación de empresa con sello en las ofertas (19/10). Pendiente de commit.
- [ ] Decidir si el pool o el desbloqueo exigen empresa verificada (propuesta del doc 04_estrategia).
- [x] Oferta: imprescindible o valorable con banda mínima, tres pasos tipo LinkedIn, relleno desde documento con IA (`parse-job-doc`), encaje por grupos (19/10). Pendiente de commit.
- [ ] Probar `parse-job-doc` con documentos reales de empresas (cuando esté desplegado) y revisar la calidad de las propuestas.
- [x] Ficha del candidato en la empresa: dos bloques (Hard / Soft) con banda; fuera la nota media (20/10).
- [ ] ¿Se quita el ranking del candidato? Ordena por media, y el documento de skills pide no tenerlo.
- [ ] **Fase 0 (grave)**: enunciados y soluciones de las clasificaciones están en `07-retos-comunes.js` (público). Servirlos desde el servidor al empezar el intento; reloj e intento de servidor (doc 08 del plan post reunión). Pendiente de aprobación.
- [x] **Seguridad (XSS)**: en `08-ofertas-y-ejercicios.js` (renderJobs) el nombre de empresa y las skills se insertan sin escapar en la portada.
- [x] Rediseñar tarjeta de oferta (empresa arriba, máx. 4 skills + «+N», sector en español, sin colores a mano en `TP_MONO_TINTS`).
- [x] Pipeline: el selector de etapa depende del botón de contacto; los que no aceptan contacto se quedan sin etapa. Usar `data-ref` en la tarjeta.
- [x] Sustituir `window.prompt` del motivo de descarte por un diálogo propio.
- [x] (parcial: 84→33) Pasar a clases los ~137 `style="…"` que generan los scripts.
- [x] Privacidad: ante un fallo pasajero, el pool, el contacto y el pago repetían la consulta sin los filtros de consentimiento (`pool_visible`, `allow_contact`). Corregido con `faltaEnEsquema()`.
- [x] Revisión del código de Iván (15/10): errores tapados como «migración pendiente», doble clic en Aplicar y en Publicar, encaje del 30 % sin skills, preguntas de vacante fuera de la ficha, tabla del pool desbordando el panel.
- [x] Tres pilares Hard / Soft / Transferibles + dilemas en oferta/postulación (15/10). Falta SQL dilemas en Supabase.
- [ ] Engordar catálogo: escucha, resiliencia, proactividad, pensamiento lateral, etc. (huecos del doc 08).
- [ ] Encaje: las condiciones desconocidas (candidato sin preferencias) cuentan como encaje completo (30 puntos). ¿Contarlas como neutras?
- [ ] Email real del aviso de desbloqueo (hoy solo bandeja in-app).
