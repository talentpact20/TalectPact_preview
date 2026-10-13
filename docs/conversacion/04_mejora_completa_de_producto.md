# TalentPact: mejora completa de producto

Oct 13, 2026 · @xavier

## Resumen ejecutivo

TalentPact ya es un producto real: candidatos que demuestran habilidades con retos corregidos por IA, empresas que buscan en un pool anónimo y pagan 49 € por contacto, y un SkillPass verificable en blockchain. La base técnica, de seguridad y legal es sólida; lo que falta es completar el proceso de selección después del pago y demostrar que la nota predice el rendimiento.

**A dónde debe llegar.** La herramienta con la que una empresa europea contrata perfiles junior por lo que saben hacer, en días en vez de semanas, con una nota en la que puede confiar y que el candidato puede llevarse consigo.

**Las cinco prioridades, en orden**

1. **Activar lo construido.** Ejecutar las tres migraciones de Supabase, asignar el rol de administrador y publicar la primera oferta real. Sin esto, ofertas y pool están vacíos.
2. **Cerrar el proceso de selección.** Pipeline por oferta (aplicado, preseleccionado, entrevista, oferta, contratado o descartado), notificaciones y agenda de entrevistas.
3. **Una nota en la que confiar.** Catálogo de retos y rúbricas en el servidor, SkillPass solo con notas verificadas, transcripción de audio y vídeo, bandeja de revisión humana.
4. **Blindaje.** Autenticación en dos pasos para empresas, reglas de acceso en la base de datos (RLS), límite global de peticiones e integración continua.
5. **Cumplimiento antes de escalar.** Evaluación de impacto (EIPD), contratos con proveedores, condiciones para empresas y la documentación de alto riesgo del AI Act antes del 2 de diciembre de 2027.

Este documento reúne todo: lo que hay, cómo mejorar cada área, la hoja de ruta, los riesgos y el registro de cambios ya hechos.

## Estado actual

El producto cubre bien todo hasta el pago del contacto; a partir de ahí el proceso de selección queda fuera de la plataforma.

| Área | Lo que ya funciona | Lo que falta |
| --- | --- | --- |
| Candidato | Registro con email, Google o LinkedIn; 102 retos en 25 áreas; preferencias de jornada, modalidad, contrato y salario; ranking real; SkillPass | Candidato ideal por oferta, avisos, apelar una nota |
| Empresa | Publicar, cerrar y reabrir ofertas reales; ficha de empresa; pool anónimo filtrable; encaje por oferta; pago y contacto real | Pipeline por oferta, entrevistas, varios usuarios por empresa |
| Corrector | Corrector v2 en servidor, filtro de prompt injection, recibos firmados, banco de pruebas con κ | Catálogo en servidor, doble corrector, transcripción de grabaciones |
| Integridad | Cámara con consentimiento, anti-copia, salidas de pestaña, informe de riesgo | Detección de caras en todos los navegadores, pantalla completa |
| SkillPass | Hash anclado en Ethereum Sepolia y verificador público | Sellar solo notas verificadas; red principal |
| Pagos | Stripe Checkout, webhook firmado, sin cobro por perfiles no reales ni sin permiso de contacto | Planes Pro y Enterprise, facturas |
| Backoffice | Métricas reales con rol de servidor, sin datos personales | Bandeja de revisión humana, alertas |
| Plataforma | Netlify con API moderno (19 funciones), Supabase, cabeceras de seguridad, 110 tests | RLS, CI, monitorización, staging |
| Diseño | Inter, iconos de línea, tema sobrio, sin contenido de ejemplo | Sistema de diseño documentado, auditoría de accesibilidad |
| Legal | Política de privacidad, cookies, información sobre la IA y la supervisión de pruebas | EIPD, RAT, contratos con empresas y proveedores, aviso legal con sociedad |

**Para que todo esto se vea en talentpact.es** hay que ejecutar en Supabase `supabase_schema_integrity.sql`, `supabase_schema_pool.sql` y `supabase_schema_jobs.sql`; hoy la sección de ofertas muestra "No se han podido cargar las ofertas" porque la tabla no existe.

## Visión y posicionamiento

TalentPact debe ser el lugar donde las habilidades se demuestran una vez y sirven para muchas empresas: el candidato hace los retos, el resultado es suyo y verificable, y la empresa solo paga cuando quiere hablar con alguien.

**Propuesta de valor**

| Para | Problema que resuelve | Lo que recibe |
| --- | --- | --- |
| Candidato junior | Sin experiencia, el CV no dice lo que sabe hacer; cada empresa le pide pruebas distintas | Retos gratuitos, feedback por criterio, un perfil anónimo que las empresas encuentran por mérito y un SkillPass que puede enseñar en cualquier sitio |
| Empresa | Cribar CV lleva semanas y no predice el rendimiento; las pruebas propias cuestan tiempo de su equipo | Un pool ya evaluado y filtrable por skills y condiciones, pago por resultado y cumplimiento del AI Act incorporado |

**Frente a las alternativas**

| Alternativa | En qué es fuerte | Lo que TalentPact hace distinto |
| --- | --- | --- |
| Portales de empleo basados en CV | Volumen de ofertas y candidatos | Se busca por habilidad demostrada, no por CV; el perfil es ciego hasta el pago |
| Plataformas de pruebas técnicas para empresas | Bancos de pruebas profundos, sobre todo de programación | El candidato hace los retos una vez para todas las empresas y se queda con el resultado; perfiles no técnicos (marketing, ventas, RRHH, finanzas) |
| ATS (software de gestión de candidaturas) | Organizar el proceso interno | TalentPact aporta los candidatos ya evaluados; debe integrarse con el ATS, no sustituirlo |
| Agencias de selección | Acompañamiento y cierre de la contratación | Coste por contacto de 49 € frente a una comisión por contratación; más rápido y auditable |

**Principios de producto** que deben guiar cada mejora:

- **Mérito antes que identidad**: nada de nombre, foto, edad ni CV hasta que la empresa decide contactar.
- **La nota es del candidato**: verificable, explicable y apelable.
- **La IA propone, una persona decide**: ninguna señal automática descarta a nadie.
- **Solo datos reales**: ni perfiles, ni ofertas, ni métricas de ejemplo en el producto.
- **Cumplimiento por diseño**: cada función nueva pasa por la pregunta "qué dato trata y con qué base".

## Proceso de selección de punta a punta

Un proceso completo tiene ocho etapas. Hoy están construidas las cinco primeras; las tres últimas (entrevista, decisión y cierre) ocurren fuera de TalentPact, y es ahí donde se pierde el dato que haría la nota más valiosa: si la persona contratada rinde.

> **[Diagrama: proceso de selección · 8 etapas]** — se ve en el PDF de `pdf/` o en el documento online.

El bucle de la izquierda es lo que hace que el producto mejore con el uso: la valoración del contratado a los 3 y 6 meses dice qué notas y qué retos predicen el rendimiento.

| Etapa | Hoy | Mejora | Cómo |
| --- | --- | --- | --- |
| 1. Oferta | Oferta real con condiciones, skills requeridas, nivel y tipo de retos | Plazas, fecha de cierre, retos elegidos del catálogo y "candidato ideal" | Columnas nuevas en `jobs` y un paso del formulario de publicación |
| 2. Atracción | Listado público con filtros; encaje por skills y condiciones | Nota de encaje ponderada y aviso semanal de ofertas que encajan | Cálculo en servidor; correo con Resend o Postmark |
| 3. Evaluación | Retos con corrector v2, integridad y cámara | Retos del catálogo en servidor, datos distintos por intento, transcripción | Tabla `challenges` versionada; servicio de transcripción |
| 4. Preselección | Pool anónimo con riesgo de integridad; candidatos por oferta ordenados por encaje | Lista corta por oferta y bandeja de revisión humana | Tabla `applications` |
| 5. Desbloqueo | Pago con Stripe, contacto real, registro de la cesión | Aviso al candidato y planes con contactos incluidos | Webhook → correo; Stripe Billing |
| 6. Entrevista | No existe | La empresa propone huecos; el candidato elige | Enlace de Cal.com o Google Calendar desde la ficha |
| 7. Decisión | No existe | Estados con motivo obligatorio de descarte | Historial en `applications` (trazabilidad del AI Act) |
| 8. Cierre | No existe | Feedback al descartado, encuesta de rendimiento a 3 y 6 meses | Correos programados; la encuesta alimenta la validez predictiva |

**La pieza que lo une: `applications`.** Una fila por candidato y oferta con estado, fechas de cada cambio, quién lo hizo y motivo. Con ella la empresa ve su embudo, el candidato sabe en qué punto está cada proceso y TalentPact puede medir el tiempo hasta contratar y qué notas predicen una contratación.

## Experiencia del candidato

El candidato tiene que sentir en cinco minutos que TalentPact le sirve: un reto hecho, una nota explicada y ofertas que encajan con su vida (jornada, ciudad, salario), no solo con sus skills.

**Preferencias y "candidato ideal"**

Ya está hecho: el candidato marca jornada (completa, media jornada, por horas o prácticas), modalidad, contrato, salario mínimo, ciudad, horas a la semana, disponibilidad y si se mudaría; las ofertas muestran ✓ o ✕ por condición y se pueden filtrar.

Lo siguiente es el **candidato ideal por oferta**: la empresa define, al publicar, el perfil que busca y el sistema lo usa en los dos sentidos.

| Elemento del candidato ideal | Ejemplo | Para qué sirve |
| --- | --- | --- |
| Skills con nota mínima | Pensamiento analítico ≥ 70, Comunicación escrita ≥ 60 | Encaje por skills medible, no solo "la tiene o no" |
| Skills deseables | Excel ≥ 60 | Desempatar sin excluir |
| Condiciones | Media jornada de 20 h, híbrido en Madrid, salario 18-22 k€ | Encaje de condiciones exacto, incluidas las horas |
| Disponibilidad | Incorporación en 15 días | Filtrar a quien no puede empezar a tiempo |
| Integridad mínima | Solo notas verificadas, riesgo bajo o medio | Pool de confianza para procesos exigentes |

El candidato ve el porcentaje de encaje y **qué le falta** ("te faltan 8 puntos en Comunicación escrita: haz el reto intermedio"), que es la mejor invitación a seguir practicando.

**Mejoras del recorrido**

1. **Primer reto guiado**: al registrarse, un reto corto de 5 minutos con feedback inmediato, en vez de un panel vacío.
2. **Feedback accionable**: cada criterio con lo que estuvo bien, lo que falta y un ejemplo de respuesta de nivel superior.
3. **Apelar una nota**: botón "Pedir revisión" con plazo de respuesta (art. 22 RGPD).
4. **Ajustes razonables**: más tiempo para personas con discapacidad acreditada, sin que conste en el perfil que ve la empresa.
5. **Avisos**: una empresa ha desbloqueado tu perfil, nuevas ofertas que encajan, cambios de estado en tus procesos.
6. **Estado de mis procesos**: en qué etapa está cada oferta a la que has aplicado.
7. **SkillPass para compartir**: enlace público y QR listos para el CV, LinkedIn o un correo.
8. **Ocultarme al encontrar trabajo**: al marcar "contratado", el perfil sale del pool automáticamente (el "kill switch" que antes se prometía sin existir).
9. **Modo invitado** para probar un reto sin cuenta, con el resultado guardado solo en el navegador hasta registrarse.

## Experiencia de la empresa

La empresa debe poder ir de "necesito un analista" a "tengo tres entrevistas" sin salir de TalentPact, y llevarse a su ATS lo que ya decidió.

**Ya funciona**: publicar, cerrar y reabrir ofertas reales con condiciones; ficha pública de empresa (descripción, sector, web, ubicación); pool anónimo filtrable por jornada, modalidad y notas verificadas; candidatos de cada oferta ordenados por encaje (70 % skills, 30 % condiciones); pago y contacto real.

| Mejora | Por qué | Cómo |
| --- | --- | --- |
| Pipeline por oferta en tablero | Ver el embudo y mover candidatos entre etapas | Vista kanban sobre `applications` |
| Comparar candidatos lado a lado | Decidir entre finalistas con la misma rúbrica | Vista de 2 a 4 perfiles con notas por criterio y respuestas anónimas |
| Ver la respuesta, no solo la nota | La empresa confía más si lee cómo resolvió el reto | Mostrar la respuesta anónima y el feedback por criterio antes de pagar |
| Varios usuarios por empresa | Selección en equipo: RRHH y responsable de área | Tabla `company_members` con roles (admin, reclutador, evaluador) |
| Notas internas y valoraciones | Registrar por qué se avanza o se descarta | Comentarios por candidatura, visibles solo para la empresa |
| Retos propios de la empresa | El servicio "a medida" de 299 € por vacante | Editor de retos con plantilla y revisión de TalentPact |
| Planes Pro y Enterprise | 5 contactos incluidos o ilimitados | Stripe Billing con suscripción y contador de contactos |
| Facturas | Obligación fiscal y requisito de cualquier cliente B2B | Stripe Invoicing con NIF y dirección de los ajustes de facturación |
| Integración con ATS | Las empresas medianas ya usan uno | Exportar candidato desbloqueado a Personio, Workable o Teamtailor (API o CSV) |
| Guía de uso responsable | Obligación del AI Act (art. 26) para la empresa | Página con qué mide la nota, zona de duda, supervisión humana y conservación de registros |

## Retos y catálogo

El catálogo es el activo principal del producto: 102 retos en 25 áreas, cada uno con tres ejercicios de dificultad creciente. Hoy vive en un fichero de 325 KB del navegador; tiene que pasar a la base de datos, con versiones y revisión experta, porque de él depende que la nota signifique algo.

**Tipos de ejercicio y su estado**

| Tipo | Cómo se corrige hoy | Problema | Mejora |
| --- | --- | --- | --- |
| Análisis de datos | Corrector v2 con rúbrica y conceptos esperados | — | Datos distintos por intento para que no circulen respuestas |
| Redacción (email) | Corrector v2 con rúbrica de comunicación | — | Rúbrica por puesto (ventas, RRHH, atención al cliente) |
| Clasificación y decisión | Aciertos deterministas más corrector | — | Banco de ítems más grande y aleatorio |
| Cognitivo (secuencias) | Aciertos deterministas | Pocas secuencias: se aprenden | Generación paramétrica de secuencias |
| Audio y vídeo | Se puntúa haber grabado, no el contenido | **La nota no es válida** | Transcribir y corregir la transcripción con la rúbrica |
| Auditoría de imagen y subida de archivo | Corrector sobre la descripción del candidato | El archivo no se analiza | Analizar el archivo con un modelo multimodal |

**Gobierno del contenido**

1. **Catálogo en el servidor**: tabla `challenges` con versión, rúbrica, conceptos esperados y nivel; el navegador solo recibe lo que necesita para mostrar el reto, y el corrector toma el enunciado del servidor, no del cliente.
2. **Revisión experta**: cada reto lo valida un profesional del área, con tres respuestas ancla (floja, correcta y excelente) que fijan la escala.
3. **Calibración por reto**: cuando un reto acumula 50 respuestas, se compara la distribución de notas con la de los demás; si es demasiado fácil o difícil, se revisa.
4. **Retirada y rotación**: un reto con respuestas filtradas o con sesgo detectado se retira y se sustituye por una versión nueva; las notas antiguas quedan marcadas con la versión.
5. **Plantillas por puesto**: las ofertas usan ya plantillas por sector (marketing, ventas, idiomas, diseño, RRHH); faltan las de IT, datos, finanzas, legal y operaciones, que hoy caen en un ejercicio genérico.
6. **Retos a medida**: flujo para que la empresa pida un reto propio, TalentPact lo diseñe con su rúbrica y quede en el catálogo de esa empresa.

## Corrector con IA

La nota ya es difícil de manipular; el siguiente paso es demostrar que es justa y que predice algo. Un producto de selección se juzga por si las personas con buena nota rinden bien en el puesto.

**Lo que ya hace el Corrector v2**: reglas y rúbrica en el servidor; respuesta delimitada con un identificador aleatorio; filtro de prompt injection (3 de 3 ataques del banco bloqueados, 0 falsos positivos en 9 respuestas legítimas); nota limitada a 60 ante una señal leve; recibo firmado por ejercicio; `temperature = 0`; prohibición de penalizar ortografía o idioma y de suponer rasgos personales.

| Dimensión | Qué medir | Objetivo | Cómo |
| --- | --- | --- | --- |
| Fiabilidad | Misma respuesta, misma nota | Diferencia media ≤ 3 puntos | Banco de pruebas en CI en cada cambio de prompt o modelo |
| Acuerdo con expertos | κ cuadrática frente a correctores humanos | ≥ 0,80 | Gold set de 12 a 100 ítems por familia de retos |
| Validez predictiva | Correlación entre nota y valoración del contratado | Positiva y estable | Encuesta de rendimiento a 3 y 6 meses |
| Equidad | Diferencia de nota con respuestas equivalentes y señales demográficas distintas | Sin diferencia significativa | Pares controlados por género, edad y lengua materna |
| Robustez | Bloqueo de ataques y falsas alarmas | 100 % y 0 | Corpus de 30 variantes de ataque |
| Supervisión humana | Notas limitadas, bloqueadas o con riesgo alto revisadas | 100 % en menos de 48 h | Bandeja de revisión en el backoffice |

**Mejoras, por orden**

1. **Catálogo en servidor**: el corrector toma enunciado y rúbrica de la base de datos (sección anterior).
2. **SkillPass solo con notas verificadas**: filtrar por `integrity.verified` al emitir la credencial.
3. **Transcripción de audio y vídeo** antes de corregir.
4. **Doble corrector en la zona de duda** (45-55 puntos o a ±5 de un umbral): segundo modelo y, si difieren más de 15 puntos, revisión humana.
5. **Bandeja de revisión y apelaciones** con motivo y rastro de cambios.
6. **Modelos vigentes**: revisar la cascada de modelos del corrector y del chat y recalibrar con el banco en cada cambio.
7. **Coste bajo control**: medido 0,0165 € por evaluación (objetivo < 0,04 €); vigilarlo en el backoffice con una alerta si se dispara.

## Integridad de las pruebas

Cada ejercicio genera un informe de integridad (riesgo bajo, medio o alto) que ve una persona; ninguna señal descarta a nadie. Lo que corre en el navegador disuade y deja rastro, pero se puede saltar: la garantía real es el recibo firmado del servidor y, al final, la entrevista.

| Control | Estado | Siguiente paso |
| --- | --- | --- |
| Cámara con consentimiento; vídeo analizado en el navegador y descartado | Hecho | Detección de caras en todos los navegadores con MediaPipe (local, sin enviar imágenes) |
| Copiar, cortar, pegar, arrastrar, imprimir y atajos bloqueados | Hecho | — |
| Texto insertado de golpe sin teclear | Hecho | Cadencia de escritura: detectar respuestas transcritas de otra pantalla |
| Salidas de pestaña, pérdida de foco y enunciado difuminado | Hecho | Pantalla completa obligatoria en nivel avanzado |
| Cronómetro que no se reinicia al salir y volver | Hecho | — |
| Marca de agua con alias y hora | Hecho | — |
| Filtro de prompt injection en servidor | Hecho | Ampliar el corpus de ataques |
| Retos que no se resuelven pegando en un chatbot | Pendiente | Datos por intento, preguntas encadenadas y una pregunta oral de 60 segundos sobre lo que escribió |

**Límite que no debe cruzarse**: ni reconocimiento facial para identificar ni inferencia de emociones (prohibida por el AI Act en el trabajo). La cámara solo comprueba presencia.

## Diseño, marca, accesibilidad y móvil

La interfaz ya tiene aspecto de producto profesional (Inter, iconos de línea, monogramas por reto, paleta sobria, sin emojis ni animaciones de aparición). Lo que falta es convertirlo en un sistema que no se degrade con cada cambio.

| Mejora | Por qué | Cómo |
| --- | --- | --- |
| Sistema de diseño documentado | Hoy conviven `app.css` (130 KB), `modulos.css` y `tema.css` | Tokens únicos (color, espacio, radio, tipografía) y una página con cada componente |
| Quitar estilos en línea del JavaScript | Muchas plantillas llevan `style="…"`: cada pantalla se ve un poco distinta | Clases de componente; permite también endurecer la CSP |
| Accesibilidad WCAG 2.2 AA | Obligación legal en servicios a consumidores y requisito de empresas grandes | Auditoría con axe; contraste, foco visible, etiquetas, navegación por teclado en los retos |
| Retos usables en móvil | Muchos candidatos junior usan solo el móvil | Revisar tablas de datos, grabación y temporizador en pantallas de 375 px |
| Modo oscuro | Uso prolongado y preferencia frecuente | Redefinir los tokens bajo `prefers-color-scheme` |
| Estados vacíos y de carga coherentes | Ya existen ("Todavía no hay ofertas…"); faltan esqueletos de carga | Componente único de vacío, error y carga |
| Identidad de marca | El logotipo y la paleta están; falta voz y fotografía | Guía breve de tono (claro, directo, sin promesas que el producto no cumple) |
| Ilustraciones del proceso | La portada explica con texto | Diagramas simples del recorrido candidato-empresa |

## Arquitectura y plataforma

Netlify y Supabase son la combinación correcta para esta fase. Las 19 funciones ya usan el API moderno de Netlify (60 s por petición; el modo antiguo deja de aceptarse en julio de 2027), y la web está separada en 18 scripts por dominio más tres hojas de estilo.

> **[Diagrama: arquitectura · actual y objetivo]** — se ve en el PDF de `pdf/` o en el documento online.

El navegador solo habla directamente con Supabase para iniciar sesión; notas, pagos, contactos y ofertas pasan por funciones que deciden con el token.

**Estructura actual**

```
index.html                    marcado
assets/css/                   app.css, modulos.css, tema.css
assets/js/app/00–17, 99       scripts por dominio en orden de carga
netlify/functions/*.mjs       19 entradas del API moderno
netlify/functions/lib/        adaptador, handlers, Supabase, corrector, chat
tfm/tech/*.sql                esquema y migraciones de Supabase
tests/                        110 tests sin red ni claves
```

**Pasos de evolución**

1. **Módulos ES con Vite**: imports explícitos en lugar de ámbito global; un build que minimiza, versiona y elimina código muerto. Acaba con el riesgo de orden de carga entre scripts.
2. **TypeScript** empezando por los tipos compartidos de evaluación, recibo, oferta y candidatura, usados a la vez por cliente y funciones.
3. **Funciones de datos en Supabase Edge Functions con RLS**: perfiles, ofertas, pool y contacto junto a la base de datos y protegidos por sus reglas, en vez de la clave de servicio en cada función.
4. **Cola para lo lento**: transcripciones, doble corrección y correos en segundo plano (funciones en segundo plano de Netlify o colas de Supabase).
5. **Entornos separados**: proyecto Supabase de staging, previsualizaciones por rama en Netlify y claves de prueba fuera de producción.
6. **Blockchain en red principal o L2** cuando haya clientes: Sepolia es una red de pruebas sin garantía de permanencia.

## Seguridad por capas

Los agujeros graves están cerrados: ninguna función confía en un identificador enviado por el navegador, el cliente no escribe prompts, el contacto solo sale con pago confirmado y consentimiento, y el backoffice exige un rol que solo asigna el servidor.

| Capa | Hecho | Pendiente |
| --- | --- | --- |
| Navegador | CSP, `frame-ancestors 'none'`, HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy`; todo el texto de usuario y del modelo se escapa | Quitar `'unsafe-inline'` de la CSP (requiere sacar los `onclick` del HTML) |
| Acceso | Contraseña de 10 caracteres con letras y números, bloqueo progresivo tras 5 intentos, cierre por 30 min de inactividad | Autenticación en dos pasos (TOTP de Supabase) obligatoria para empresas y administradores |
| Funciones | Identidad desde el token; rol admin en `app_metadata`; límites de tamaño; límite de frecuencia por instancia | Límite global por usuario e IP; CORS al dominio propio |
| Datos | Contacto entregado solo tras pago y consentimiento, con registro en `contact_access`; pool sin datos personales | RLS en todas las tablas y comprobación en CI; cifrado de teléfono y LinkedIn |
| Pagos | Importe fijado en servidor, webhook firmado, retorno solo a dominio propio, sin cobro por perfiles inexistentes u ocultos | — |
| Operación | Servidor local sin exposición de secretos | Rotación de `EVAL_SIGNING_SECRET` y de la clave del emisor; copias diarias; pentest externo antes de clientes grandes |

## Legal y cumplimiento

TalentPact es un sistema de IA de alto riesgo (selección de personal, anexo III del AI Act) que trata datos personales, usa cámara y cobra a empresas. El detalle está en [Marco legal y cumplimiento de TalentPact](https://claude.ai/code/artifact/eeafbb53-8947-449b-9bd8-44af28975821); aquí, lo esencial.

**Ya cumplido en el producto**: anonimato hasta el pago; minimización (el vídeo no sale del dispositivo); ninguna decisión automática de descarte; recibos de evaluación como registro; chat que se presenta como IA (art. 50 AI Act, en vigor desde agosto de 2026); consentimiento de contacto comprobado en servidor; borrado completo de cuenta; política de privacidad con tratamientos, bases y plazos.

**Pendiente, por orden**

- [ ] Constituir la sociedad y completar el aviso legal (NIF, domicilio, registro).
- [ ] Evaluación de impacto (EIPD) antes de tratar datos reales a escala.
- [ ] Registro de actividades de tratamiento.
- [ ] Aceptar y archivar los contratos de encargo de Supabase, Netlify, Anthropic y Google.
- [ ] Condiciones de contratación para empresas, con responsabilidad sobre el contacto desbloqueado.
- [ ] Términos de uso para candidatos, aceptados al registrarse.
- [ ] Protocolo de brechas (72 h a la AEPD).
- [ ] Guía de uso para empresas (art. 26 AI Act).
- [ ] Valorar con un abogado si TalentPact debe declararse agencia de colocación (Ley 3/2023 de Empleo).
- [ ] Documentación técnica, gestión de riesgos y registro en la base de datos de la UE antes del 2 de diciembre de 2027.

## Ingeniería, calidad y operaciones

Hay 110 tests que corren sin red ni claves y cubren corrector, identidad, pagos, pool, ofertas, plataforma y coherencia de cifras. El 12 de octubre se publicó un commit a medias que dejó talentpact.es en blanco; ya hay tests que lo habrían bloqueado, pero solo sirven si se ejecutan antes de publicar.

**Lección del 12 de octubre**: un script con un error de sintaxis dejó sin definir paneles y secciones, y la portada quedó en blanco. Los tests nuevos (todos los scripts compilan, `index.html` carga exactamente los ficheros que existen, sin avisos de demostración) fallan con esa versión. Falta que se ejecuten solos antes de cada despliegue.

| Mejora | Cómo |
| --- | --- |
| Integración continua | GitHub Actions con `npm test` y `netlify functions:build` en cada push; proteger `main` para que no se fusione nada en rojo |
| Despliegue condicionado a los tests | En Netlify, comando de build `npm test`: si falla, no se publica |
| Tests de navegador | Playwright con tres recorridos: reto completo, publicar oferta y filtrar pool, pago en modo prueba |
| Previsualización por rama | Deploy Previews de Netlify con un Supabase de staging |
| Monitorización | Sentry en cliente y funciones; alerta si una función supera un 2 % de errores |
| Panel de salud | Latencia y coste del corrector por día en el backoffice |
| Versión de Node fijada | `engines` en `package.json` y `NODE_VERSION` en Netlify |
| Higiene del repositorio | Quitar el `.pptx` duplicado por mayúsculas, `.DS_Store` y `deno.lock`; mover PDF y PPTX generados a una release |
| Disciplina de commits | Un cambio, un commit con mensaje descriptivo; nunca publicar mientras alguien (persona o asistente) está a mitad de un cambio |

## Negocio, precios y métricas

El modelo cobra a la empresa por resultado y deja gratis al candidato; el coste variable es mínimo (IA y Stripe), así que el margen bruto previsto es del 93,5 %. Las cifras salen del modelo financiero del TFM (`tfm/cifras_canonicas.json`).

| Palanca | Precio | Estado en el producto |
| --- | --- | --- |
| Desbloqueo de contacto | 49 € por contacto | Construido con Stripe |
| Plan Pro | 199 €/mes, 5 contactos y ofertas ilimitadas | Pendiente (Stripe Billing) |
| Plan Enterprise | 499 €/mes, contactos ilimitados y soporte dedicado | Pendiente |
| Retos a medida | 299 € por vacante | Pedido desde el formulario; falta el flujo de entrega |
| Candidato Premium | 5 € por reto a partir de 5 retos por semana | Pendiente: hoy no hay límite semanal real |

| Proyección del modelo | 2026 | 2027 | 2028 |
| --- | --- | --- | --- |
| Empresas cliente | 24 | 129 | 284 |
| ARR a diciembre | 41.973 € | 224.878 € | 496.530 € |
| Margen bruto | 93,5 % | 93,3 % | 93,8 % |

Punto de equilibrio previsto: mayo de 2028. LTV/CAC: 11-17x. Coste medido de IA: 0,0165 € por evaluación.

> **[Diagrama: árbol de métricas · de la North Star a sus palancas]** — se ve en el PDF de `pdf/` o en el documento online.

La rama de arriba se trabaja con producto y ventas (más ofertas, más candidatos que encajan); la de abajo, con la calidad del corrector, y es la que convierte un contacto en una contratación.

**Métrica principal (North Star)**: **contrataciones confirmadas al mes** a través de TalentPact. Exige cerrar el proceso (etapas 6 a 8) para poder medirla; hasta entonces, el mejor indicador adelantado es **contactos desbloqueados al mes**.

| Etapa | KPI | Dónde se mide |
| --- | --- | --- |
| Atracción de candidatos | Registros/semana; % que completa el primer reto | Supabase + analítica con consentimiento |
| Evaluación | Retos completados por candidato; % de notas verificadas | Backoffice |
| Pool | Candidatos visibles con al menos 3 skills | Backoffice |
| Empresas | Ofertas abiertas; empresas activas al mes | Backoffice |
| Conversión | Contactos desbloqueados por oferta; ingresos | Backoffice (Stripe) |
| Resultado | Entrevistas y contrataciones por contacto; tiempo hasta contratar | `applications` (pendiente) |
| Calidad | Valoración del contratado a 3 y 6 meses | Encuesta (pendiente) |

## Hoja de ruta

Cinco fases. Cada una se cierra solo cuando cumple su puerta, medida con datos y no con fechas. Las semanas son una estimación para un equipo de dos fundadores más un desarrollador.

> **[Diagrama: hoja de ruta · 5 fases y sus puertas]** — se ve en el PDF de `pdf/` o en el documento online.

| Fase | Duración estimada | Contenido | Puerta para pasar |
| --- | --- | --- | --- |
| 0. Activar | 1 semana | Migraciones de Supabase, rol admin, CI con tests, higiene del repositorio, primera oferta real | La web muestra ofertas y pool reales; CI en verde bloquea publicaciones rotas |
| 1. Nota fiable | 3-4 semanas | Catálogo en servidor, SkillPass solo verificado, transcripción, bandeja de revisión, apelaciones, autenticación en dos pasos | κ ≥ 0,80 en el banco sobre el corrector v2 |
| 2. Proceso completo | 4-6 semanas | `applications`, tablero por oferta, candidato ideal, comparador, entrevistas, avisos | Una empresa piloto contrata a alguien de principio a fin en TalentPact |
| 3. Ingresos | 3-4 semanas | Planes Pro y Enterprise, facturas, varios usuarios por empresa, exportación a ATS, Candidato Premium | Primer cliente de pago recurrente |
| 4. Escala y cumplimiento | Continuo hasta diciembre de 2027 | EIPD y contratos, RLS y Edge Functions, Vite y TypeScript, doble corrector, validez predictiva, documentación del AI Act, pentest | Revisión jurídica favorable y auditoría de sesgo publicada |

**Equipo y presupuesto**. El modelo financiero prevé una ronda pre-semilla de 180.000 € y 50.000 € de ENISA. Con ese marco, el orden de gasto razonable es: desarrollador a tiempo completo (fases 1 a 3), revisión jurídica externa (EIPD, contratos, agencia de colocación) antes de la fase 2, y expertos de área por reto para la revisión del catálogo. El gasto en IA no es un problema: a 0,0165 € por evaluación, 10.000 evaluaciones cuestan unos 165 € al mes.

## Riesgos y mitigaciones

El mayor riesgo no es técnico: es el arranque del mercado, porque sin candidatos no vienen empresas y sin ofertas no vienen candidatos.

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| Mercado vacío al arrancar (huevo y gallina) | Alto | Empezar por un nicho (perfiles junior de datos y marketing en una ciudad); acuerdos con universidades y másteres para llenar el pool; primeras ofertas con empresas piloto |
| La nota no predice el rendimiento | Alto | Encuesta a 3 y 6 meses, validez predictiva medida y publicada; rúbricas revisadas por expertos |
| Sesgo en el corrector | Alto | Auditoría por género, edad y lengua; anonimato; supervisión humana; ningún descarte automático |
| Trampas con chatbots externos | Medio | Integridad en navegador, retos con datos por intento y pregunta oral; la entrevista como última comprobación |
| Incumplimiento del AI Act en diciembre de 2027 | Alto | Fase 4 de la hoja de ruta empieza ya; documentación técnica escrita a medida que se construye |
| Brecha de datos de contacto | Alto | Contacto solo tras pago, registro de cesiones, RLS, autenticación en dos pasos, protocolo de brechas |
| Dependencia de un proveedor de IA | Medio | Cascada de modelos y banco de pruebas para cambiar de modelo con evidencia |
| Publicar una versión rota | Medio | Ya ocurrió; CI obligatoria y despliegue condicionado a los tests |
| Coste de IA si el uso se dispara | Bajo | 0,0165 € por evaluación; límite de frecuencia; alerta de coste en el backoffice |
| Que se considere agencia de colocación | Medio | Consulta jurídica y, si procede, declaración responsable antes de cobrar a escala |

## Registro de cambios

Todo lo que ya se ha cambiado en esta serie de revisiones, de lo más reciente a lo más antiguo. Los tests pasaron de 84 a 110.

| Fecha | Área | Cambio |
| --- | --- | --- |
| 13 oct 2026 | Web | Quitados los últimos avisos de "demostración" y "preview"; test que impide que vuelvan (commit `9bea312`) |
| 13 oct 2026 | Web | Arreglada la página en blanco de talentpact.es: publicada la versión completa y tests de compilación y de ficheros cargados (commit `a752a52`) |
| 12 oct 2026 | Legal | Chat presentado como IA (art. 50); consentimiento de contacto comprobado en servidor; página legal reescrita (supervisión de pruebas, plazos por dato, revisión humana); reglas de equidad en el corrector |
| 12 oct 2026 | Producto | Fin de lo demo: ofertas reales (`list-jobs`, `save-job`), backoffice real (`admin-metrics`) con rol de servidor, ranking real, ficha de empresa, sin contactos ni métricas inventadas |
| 12 oct 2026 | Diseño | Inter, tema sobrio, unos 800 emojis sustituidos por iconos de línea y monogramas, portada nueva, textos corregidos |
| 12 oct 2026 | Marketplace | Pool real (`get-talent-pool`) y contacto real tras pago (`get-contact`) con registro de cesiones; "Ver candidatos" por encaje real |
| 12 oct 2026 | Plataforma | Funciones migradas al API moderno de Netlify; `ethers` y `stripe` incluidos en el paquete; web dividida en scripts por dominio; README de estructura |
| 12 oct 2026 | Seguridad | Chat de soporte sin prompt del cliente; contraseña de admin fuera del código; ofertas y respuestas del modelo escapadas; no se cobra por perfiles no reales |
| 12 oct 2026 | Corrector | Corrector v2: reglas en servidor, filtro de inyección, recibos firmados, verificación al guardar |
| 12 oct 2026 | Integridad | Cámara con consentimiento, anti-copia, pestañas, cronómetro que no se reinicia, marca de agua, informe de riesgo |
| 12 oct 2026 | Selección | Preferencias de jornada, modalidad, contrato y salario; condiciones en las ofertas; filtros y encaje |
| 12 oct 2026 | Acceso | Política de contraseñas, bloqueo progresivo, cierre por inactividad, cabeceras de seguridad |
| 12 oct 2026 | Seguridad | Cinco funciones dejaron de aceptar un `userId` del navegador; servidor local sin exposición de `.git` ni `.env` |
| 12 oct 2026 | Correcciones | Barra de perfil falsa, nota peor que sobrescribía, salario y modalidad que se perdían al publicar, `#NaN` en el pool, alias aleatorio en el pago, "null" al copiar el contacto |

## Documentos relacionados y fuentes

**Documentos de esta serie**

- [Marco legal y cumplimiento de TalentPact](https://claude.ai/code/artifact/eeafbb53-8947-449b-9bd8-44af28975821): RGPD, AI Act, LSSI, documentos legales y su estado.
- [Guía de mejora integral de TalentPact](https://claude.ai/code/artifact/58fcd838-2217-489a-96cd-3fd585971ebc): auditoría de fallos y decisión sobre Netlify.
- [Cómo llevar TalentPact al siguiente nivel](https://claude.ai/code/artifact/5ace29bf-0ebf-4fff-a831-9a1401255b94): integridad, Corrector v2 y condiciones de empleo.

**En el repositorio**

- `tfm/cifras_canonicas.json`: fuente de las cifras de negocio y de tests.
- `tfm/tech/*.sql`: esquema y migraciones de Supabase.
- `assets/js/README.md`: estructura del código de cliente.
- `legal.html`: política de privacidad, cookies, IA y supervisión de pruebas publicadas.

**Fuentes externas consultadas**

- [Netlify, configuración de funciones](https://docs.netlify.com/build/functions/configuration/) y [compatibilidad Lambda](https://docs.netlify.com/build/functions/lambda-compatibility/): límite de 60 s y fin del modo Lambda en julio de 2027.
- [Vercel, duración de funciones](https://vercel.com/docs/functions/configuring-functions/duration) y [límites de Supabase Edge Functions](https://supabase.com/docs/guides/functions/limits).
- [AI Act, anexo III](https://artificialintelligenceact.eu/annex/3/) y [artículo 26](https://artificialintelligenceact.eu/article/26/).
- [ActuIA sobre el Reglamento 2026/1744](https://www.actuia.com/en/news/ai-act-obligations-in-force-and-delays-under-omnibus-2026-1744/) y [Gibson Dunn sobre el ómnibus del AI Act](https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/).
- [LSSI-CE, texto consolidado en el BOE](https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758).
