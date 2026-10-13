# Conversación final para seguir

Este fichero resume, ordenada y limpia, toda la conversación de trabajo sobre TalentPact (12 y 13 de octubre de 2026): qué se pidió, qué se hizo en el código, qué quedó pendiente y cuál es el concepto con el que seguimos. Está pensado para que, al importar el proyecto o abrir una conversación nueva, **salga todo** sin tener que recordar nada.

- Los cinco documentos de mejora completos están en [`docs/conversacion/`](docs/conversacion/README.md), en Markdown (texto) y en PDF (con los diagramas y bocetos).
- [`CLAUDE.md`](CLAUDE.md) hace que Claude Code cargue este fichero automáticamente al abrir el repositorio.
- Si se importa en otra herramienta, basta con pegar el bloque del apartado 11.

---

## 1. Qué es TalentPact

Marketplace de contratación por habilidades demostradas, no por currículum. TFM del máster Fintech de Xagri e Ivan Sánchez.

| Pieza | Cómo funciona |
| --- | --- |
| Candidato | Hace retos (ejercicios reales de un puesto); un corrector con IA los puntúa con rúbrica; aparece **anónimo** en el pool de talento |
| Empresa | Publica ofertas, filtra el pool por skills y condiciones, y paga **49 €** (Stripe) para desbloquear el contacto de un candidato que lo permite |
| SkillPass | Credencial con las skills validadas; su hash se ancla en **Ethereum Sepolia** para poder verificarla |
| Datos | Supabase (autenticación + base de datos) |
| Web | https://talentpact.es, publicada en Netlify desde GitHub `talentpact20/TalectPact_preview`, rama `main` |

## 2. Reglas acordadas (mantenerlas siempre)

1. **Responder en español.**
2. **Nada de contenido de demostración.** Ni ofertas, empresas, candidatos, rankings o métricas inventadas, ni etiquetas "preview" o "versión preliminar". Todo sale de Supabase; si no hay datos se muestra un estado vacío profesional ("Todavía no hay ofertas…"). Para probar la interfaz, simular respuestas solo en el navegador, nunca en el repositorio.
3. **Aspecto profesional**: sin emojis, diseño sobrio (Inter, tinta + verde azulado), iconos de línea.
4. **Commit y push solo cuando el usuario lo aprueba**, cada vez.
5. **No introducir credenciales ni crear cuentas** en el Supabase, Stripe o Netlify reales: eso lo hace el usuario.
6. **Cifras canónicas**: el número de tests y otras cifras viven en `tfm/cifras_canonicas.json`; `tests/coherencia-docs.test.js` obliga a que README, informe técnico, guiones y deck digan lo mismo. Si cambia una cifra hay que actualizar todo y regenerar con `node entrega_final/build_informe_html.js`. Los PDF/DOCX/PPTX ya exportados de `entrega_final/` quedan desfasados y hay que regenerarlos a mano.
7. **Textos legales veraces**: no inventar razón social, NIF ni domicilio.
8. **La integridad nunca descarta sola** y la cámara **nunca** infiere emociones (prohibido por el Reglamento de IA en el trabajo).

## 3. Cronología de la conversación

| # | Petición del usuario | Qué se hizo |
| --- | --- | --- |
| 1 | "Empieza a buscar errores y mejorar el producto" | Auditoría completa; fallos graves cerrados (ver apartado 6) |
| 2 | Hacerlo profesional: permisos de cámara, bloquear prompt injection, anti-copia, jornada parcial/completa, capas de login y protección, nuevo corrector; documento "Cómo llevar TalentPact al siguiente nivel" | Corrector v2, módulo de integridad, preferencias de empleo, protección de acceso; documento 01 |
| 3 | Guía completa de mejora, ¿es Netlify lo correcto?, estructurar el código, buscar todos los fallos | Funciones migradas a la API moderna de Netlify; `index.html` de 858 KB troceado en scripts por dominio; documento 02 |
| 4 | "Haz el pool real y el contacto real" | `get-talent-pool` y `get-contact` contra Supabase, con consentimiento del candidato y registro de accesos |
| 5 | Empezar por el rediseño visual y el documento legal; "todo lo demo tiene que desaparecer" | Rediseño (Inter, iconos, monogramas, sin emojis), ofertas reales (`list-jobs`/`save-job`), backoffice real (`admin-metrics`), `legal.html` actualizado; documento 03 |
| 6 | "La página web sale toda en blanco" | Causa: un error de sintaxis en `10-paneles-y-pagos.js` y un `index.html` que no cargaba los scripts nuevos tras un commit a medias. Arreglado, publicado (commits `a752a52` y `9bea312`) y protegido con tests |
| 7 | Documento "TalentPact mejora completa de producto" con absolutamente todo | Documento 04 |
| 8 | Documento más completo: de los ejercicios a la corrección, la web y los dashboards, para **filtrar a las personas que entran en un evento Impact de grandes empresas** | Documento 05 |
| 9 | "Céntrate en mejoras visuales también, de manera completa" | Sección "Mejoras visuales" del documento 05: medición del CSS, sistema de diseño, 14 componentes, gráficos, 15 pantallas y 4 bocetos |
| 10 | "Arregla esta conversación, ponla en el código y pon el concepto para seguir" | Este fichero, `CLAUDE.md` y `docs/conversacion/` |

## 4. Estado actual del código

**Pruebas**: `npm test` → **110 tests en 13 ficheros, todos en verde** (sin red ni claves).

**Arquitectura**

```
index.html                         solo marcado; carga los scripts en orden numérico
legal.html                         aviso legal, privacidad, cookies, IA e integridad
assets/css/app.css                 estilos base
assets/css/modulos.css             integridad, preferencias, filtros
assets/css/tema.css                tema profesional (se carga el último y redefine)
assets/js/app/NN-*.js              scripts clásicos que comparten ámbito global (ver assets/js/README.md)
  00-iconos.js                     iconos de línea (generado por tools/iconos.py)
  01..12                           datos, grabación, retos, nube, QR, SkillPass, ofertas, acceso, paneles y pagos, backoffice, soporte
  13-integridad.js                 TPIntegrity: cámara con consentimiento, anti-copia, pestañas, cronómetro
  14-empleo.js                     TPEmpleo: jornada, modalidad, contrato, salario, ciudad, disponibilidad
  15-proteccion-acceso.js          TPAuthGuard: política de contraseñas, bloqueo por intentos, cierre por inactividad
  16-pool-real.js                  TPPool / TPRanking: pool y contacto reales
  17-ofertas-reales.js             TPOfertas: ofertas reales, publicar/cerrar, estados vacíos
  99-arranque.js                   restaura la sesión cuando todo está cargado
netlify/functions/<nombre>.mjs     19 entradas de la API moderna → lib/adaptador.mjs → lib/handlers/<nombre>.js
netlify/functions/lib/tp.js        Supabase, autenticación por token, blockchain, Stripe
netlify/functions/lib/evaluator.js Corrector v2
tfm/tech/supabase_schema_*.sql     esquema y migraciones
tests/*.test.js                    110 tests
serve-demo.js                      servidor local (127.0.0.1:8888) que ejecuta las mismas funciones que Netlify
```

**Funciones (19)**: `evaluate-exercise`, `save-evaluation`, `support-chat`, `save-profile`, `save-company`, `get-company`, `get-progress`, `delete-account`, `issue-credential`, `anchor-credential`, `verify-credential`, `create-checkout-session`, `confirm-checkout`, `stripe-webhook`, `get-talent-pool`, `get-contact`, `list-jobs`, `save-job`, `admin-metrics`.

**Decisiones técnicas importantes**

- La identidad sale **siempre del token** de sesión (`authUser`), nunca de un `userId` enviado por el navegador.
- El rol de administrador es `app_metadata.role === 'admin'` (solo lo asigna el servidor; `user_metadata` no vale).
- **Corrector v2**: instrucciones y rúbrica en el servidor; respuesta del candidato delimitada con un código de un solo uso; detección de manipulación con señales ponderadas (bloqueo con peso ≥ 2, nota limitada a 60 con peso 1); recibo HMAC por ejercicio (`EVAL_SIGNING_SECRET`) que `save-evaluation` comprueba (mismo reto, menos de 24 h, sin repetir, media coherente). El modo con prompts crudos solo existe con `EVAL_ALLOW_RAW_PROMPTS=1` para el banco de pruebas.
- **Netlify**: API moderna (límite síncrono de 60 s). El modo Lambda (`exports.handler`) deja de aceptarse el 1 de julio de 2027. Las entradas importan `ethers` y `stripe` y los inyectan (`tp.usarEthers`, `tp.usarStripe`) porque el empaquetador no incluye dependencias cargadas de forma perezosa.
- **Contacto**: solo tras pago confirmado de esa empresa, solo si el candidato tiene `allow_contact`, y cada entrega queda en `contact_access`.
- La lista pública de ofertas nunca expone `company_user_id`.

**Variables de entorno en Netlify**: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (o `SUPABASE_SERVICE_ROLE_KEY`), `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `EVAL_SIGNING_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `UNLOCK_PRICE_CENTS`, `UNLOCK_CURRENCY`, `SEPOLIA_RPC`, `ISSUER_PRIVATE_KEY`, `SKILLPASS_CONTRACT_ADDRESS`, `SITE_URL`.

## 5. Pendiente que solo puede hacer el usuario

1. **Ejecutar en Supabase, en este orden**: `tfm/tech/supabase_schema_integrity.sql`, `tfm/tech/supabase_schema_pool.sql` y `tfm/tech/supabase_schema_jobs.sql`. Hasta entonces, ofertas, pool y backoffice dan error en la web publicada.
2. **Asignar `app_metadata.role = "admin"`** a la cuenta del backoffice (Supabase → Authentication → Users).
3. **Definir `EVAL_SIGNING_SECRET`** en Netlify (`openssl rand -hex 32`).
4. **Regenerar los PDF, DOCX y PPTX** de `entrega_final/` (citan cifras antiguas de tests).
5. **Completar el aviso legal** con los datos reales del titular cuando exista la sociedad.

## 6. Errores encontrados y corregidos

| Fallo | Corrección |
| --- | --- |
| Cinco funciones aceptaban un `userId` del navegador sin token: se podían leer datos de otro candidato o inyectarle notas | Identidad solo desde el token; `tests/identidad.test.js` |
| El navegador enviaba el prompt del corrector: el candidato podía reescribir su examen | Corrector v2 en el servidor |
| El chat de soporte era un proxy abierto a la API de Anthropic | Prompt en el servidor (`lib/support-prompt.js`) |
| Tras pagar, la empresa recibía un contacto inventado | `get-contact` real |
| Funciones en modo Lambda obsoleto | Migradas a la API moderna |
| El servidor local servía `.git` y `.env`, se caía con una URL rara y escuchaba en toda la red | Bloqueo de rutas ocultas, 400 en URL inválida, `127.0.0.1` |
| Contraseña del superadmin escrita en el JavaScript y panel con datos falsos | Backoffice real con rol de servidor |
| Cronómetro reiniciable, nota peor que sobrescribía la mejor, feedback sin escapar | Corregidos |
| Web publicada en blanco | Error de sintaxis y carga de scripts corregidos; tests que comprueban que todos los scripts compilan y que `index.html` carga exactamente los que existen |
| El menú lateral del backoffice heredaba el estilo fijo de la navegación global | Cambiado a `<aside>` |
| El aviso de consentimiento de cámara se repetía en cada ejercicio sin cámara | El consentimiento ya no se reinicia |

## 7. Documentos de mejora

| # | Documento | Local | Online |
| --- | --- | --- | --- |
| 01 | Cómo llevar TalentPact al siguiente nivel | [md](docs/conversacion/01_como_llevar_talentpact_al_siguiente_nivel.md) · [pdf](docs/conversacion/pdf/01_como_llevar_talentpact_al_siguiente_nivel.pdf) | https://claude.ai/code/artifact/5ace29bf-0ebf-4fff-a831-9a1401255b94 |
| 02 | Guía de mejora integral | [md](docs/conversacion/02_guia_de_mejora_integral.md) · [pdf](docs/conversacion/pdf/02_guia_de_mejora_integral.pdf) | https://claude.ai/code/artifact/58fcd838-2217-489a-96cd-3fd585971ebc |
| 03 | Marco legal y cumplimiento | [md](docs/conversacion/03_marco_legal_y_cumplimiento.md) · [pdf](docs/conversacion/pdf/03_marco_legal_y_cumplimiento.pdf) | https://claude.ai/code/artifact/eeafbb53-8947-449b-9bd8-44af28975821 |
| 04 | Mejora completa de producto | [md](docs/conversacion/04_mejora_completa_de_producto.md) · [pdf](docs/conversacion/pdf/04_mejora_completa_de_producto.pdf) | https://claude.ai/code/artifact/f04d3825-aaf7-4892-893d-996f9bc5ee2f |
| 05 | Eventos Impact: plan de mejora completo (incluye mejoras visuales) | [md](docs/conversacion/05_eventos_impact_plan_completo.md) · [pdf](docs/conversacion/pdf/05_eventos_impact_plan_completo.pdf) | https://claude.ai/code/artifact/1671affc-4f49-442f-9279-4e1cb074c595 |

El 05 es el más reciente y el que manda: integra lo de los anteriores aplicado al evento.

## 8. El concepto para seguir

**TalentPact como filtro de entrada a eventos Impact con grandes empresas.** Cada asistente demuestra lo que sabe hacer *antes* del evento; cada empresa llega con una lista corta de candidatos anónimos ordenados por encaje y con reuniones de 15 minutos ya agendadas. Ninguna reunión del día es al azar: existe porque la empresa la pidió tras ver una nota verificada y el candidato aceptó.

**Recorrido**: inscripción en el micrositio (T-4 semanas) → batería de retos de 45 min en línea con modo integridad → corrección con IA y revisión humana en la zona de duda → lista corta (la empresa elige, el candidato acepta) → agenda automática → día del evento con check-in por QR y caso en vivo de 10 min → seguimiento hasta 30 días después.

**Seis puertas del filtro** (el sistema ordena y propone; las personas deciden):

1. Inscripción (datos y consentimientos; nunca descarta).
2. Batería de retos (la completa el candidato).
3. Nota por competencia frente al mínimo que fija la empresa por puesto.
4. Encaje de condiciones (jornada, modalidad, ubicación, salario, incorporación).
5. Revisión humana (zona de duda y riesgo de integridad alto).
6. Lista corta y reunión (empresa y candidato).

**Encaje con un puesto (0-100)**: `Encaje = 60·S + 25·C + 15·D`, donde S es el cumplimiento de skills (media de nota/mínimo con tope 1), C la fracción de condiciones que coinciden y D la disponibilidad en la fecha (1 o 0).

**Ejercicios**: tronco común de 20 min (análisis de datos, redacción, razonamiento) + módulo de perfil de 25 min (consultoría, datos, finanzas, marketing, ventas, tecnología, RR. HH., operaciones, idiomas) + caso en vivo en la sala. Datos distintos en cada intento, bancos de ítems amplios, transcripción de voz y vídeo, rúbrica por puesto con respuestas ancla.

**Corrección**: estable (doble corrección, mediana si difieren más de 10 puntos, salida estructurada, versionado), comparable (calibración previa con cada empresa hasta correlación ≥ 0,8, percentil por reto, banco de regresión) y revisable (revisión obligatoria cerca del corte, muestreo del 10 %, derecho del candidato a pedir revisión en 72 h). Corrección ciega y análisis de tasas de paso por grupo.

**Dashboards**: candidato (pasos del evento, una tarjeta "Lo siguiente", resultados por criterio, empresas interesadas, agenda y QR); empresa (puestos, ranking por encaje, ficha anónima, lista corta en equipo, valoración tras cada reunión, informe); organizador (configuración, embudo en directo, calidad de la evaluación, agenda, check-in, mapa de mesas, cierre).

**Mejoras visuales** (medido en el CSS actual): 97 colores escritos a mano → 14 tokens semánticos; 58 tamaños de letra → 8; 55 `!important` → 0; 277 estilos en línea → 0; 7 puntos de corte → 3; sin modo oscuro → automático. CSS por capas (`@layer`), 14 componentes comunes, gráficos con reglas fijas y criterios de aceptación por pantalla (solo tokens, estados vacío/carga/error, 375 y 1440 px, teclado, accesibilidad AA, modo oscuro).

**Técnico nuevo**: tablas `events`, `event_companies`, `event_roles`, `event_registrations`, `event_shortlists`, `event_meetings`, `evaluation_reviews` con RLS; funciones `event-register`, `event-ranking`, `event-shortlist`, `event-schedule`, `event-checkin`, `evaluation-review` y `evaluate-queue` (corrección en segundo plano).

**Legal del evento**: sistema de alto riesgo (anexo III del Reglamento de IA; obligaciones desde el 2 de diciembre de 2027 tras el Reglamento 2026/1744, transparencia ya en vigor desde agosto de 2026); EIPD antes del primer evento; registros de evaluación al menos 6 meses; consentimientos separados; borrado o anonimización a los 12 meses.

**Plan**: 8 semanas de construcción para dos personas, ventana de retos en las semanas 9-11 y evento en la semana 12. Orden de recorte si falta tiempo: exportación a ATS, inglés, ejercicios de código con ejecución, voz y vídeo. No se recorta: corrección calibrada, revisión humana, consentimientos y agenda.

## 9. Próximos pasos en el código, por orden

1. **Base de diseño** (fase 1 del plan visual): tokens semánticos en `:root` con modo oscuro, escala tipográfica de 8 pasos, capas `@layer`; fundir `tema.css` y `app.css`; eliminar `!important` y los estilos en línea de `index.html` y de los scripts.
2. **Componentes** (fase 2): botón, campo, chip de estado, barra de nota con mínimo, insignia de integridad, tarjeta KPI, tabla, pasos, cronómetro, estado vacío, esqueleto de carga, aviso, panel lateral, QR; con una página interna que los muestre en claro y oscuro.
3. **Modelo de datos del evento**: migración `tfm/tech/supabase_schema_events.sql` con las 7 tablas y RLS.
4. **Funciones del evento** con sus tests (encaje, reglas de agenda, permisos).
5. **Pantallas del evento**: micrositio `/impact`, inscripción en 3 pasos, pantalla de ejercicio, resultado, pestaña Evento del candidato, ranking y lista corta de empresa, panel del organizador, check-in.
6. **Corrector**: doble corrección, salida estructurada, versionado y cola en segundo plano.

Cada paso: tests en verde, cifra canónica de tests actualizada si cambia, y commit solo con aprobación.

## 10. Cómo arrancar y comprobar

```bash
npm install
npm test
npm run dev
```

`npm run dev` abre el servidor local en http://127.0.0.1:8888 (configurado también en `.claude/launch.json` como "demo"). Sin las variables de entorno las funciones responden con errores controlados; la interfaz muestra estados vacíos.

## 11. Para pegar al importar en una conversación nueva

> Estoy trabajando en TalentPact (repositorio `TalectPact_preview`). Lee primero `CONVERSACION_FINAL_PARA_SEGUIR.md` y, si necesitas detalle, los documentos de `docs/conversacion/` (el 05 es el que manda). Respeta las reglas del apartado 2: responde en español, nada de contenido de demostración, commit solo cuando lo apruebe y no toques credenciales. Seguimos por el apartado 9, paso 1.
