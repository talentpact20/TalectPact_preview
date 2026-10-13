# TalentPact en eventos Impact: plan de mejora completo

Oct 13, 2026 · @xavier

## Resumen y caso de uso

En un evento Impact con grandes empresas, TalentPact es el filtro de entrada: cada asistente demuestra lo que sabe hacer **antes** de llegar, y cada empresa entra al evento con una lista corta de personas que encajan y reuniones ya agendadas. El evento deja de ser un intercambio de CV y se convierte en entrevistas con candidatos preevaluados.

**Cómo funciona en una frase**: el candidato se inscribe, hace una batería de retos de 45 minutos en línea, la IA la corrige con supervisión humana, las empresas ven perfiles anónimos ordenados por encaje, eligen a quién quieren conocer y el día del evento cada candidato tiene su agenda de reuniones.

**Lo que gana cada parte**

| Parte | Hoy, en un evento de empleo típico | Con TalentPact |
| --- | --- | --- |
| Gran empresa | Cientos de CV en un stand y poco tiempo para distinguir a nadie | Lista corta por puesto, notas por competencia y reuniones de 15 minutos con quien encaja |
| Candidato | Hacer cola en stands y entregar el mismo CV sin saber si encaja | Saber de antemano con qué empresas tiene reunión y por qué |
| Organizador | Medir el éxito por asistentes | Medir por reuniones, segundas entrevistas y contrataciones |

**Qué hay que construir** (el resto del producto ya existe): el concepto de evento con su inscripción y micrositio, una batería de retos de evento, el matching y la agenda de reuniones, el check-in con QR y tres paneles (candidato, empresa y organizador) en modo evento. Calendario estimado: 8 semanas hasta el primer evento.

Este documento recorre todo el producto, de los ejercicios a la corrección, la web y los paneles, y para cada parte dice qué hay y cómo mejorarlo.

## El evento de punta a punta

El trabajo pesado ocurre antes del evento: la inscripción y los retos abren cuatro semanas antes y se cierran 72 horas antes, para que las empresas elijan y la agenda esté lista el día anterior.

> **[Diagrama: recorrido del candidato · 6 pasos, de la inscripción a la sala]** — se ve en el PDF de `pdf/` o en el documento online.

Lo que ocurre en la sala es solo el último paso de un filtro que empieza cuatro semanas antes; la tabla detalla qué hace cada parte en cada momento.

| Momento | Candidato | Empresa | Organizador |
| --- | --- | --- | --- |
| T-4 semanas | Se inscribe en el micrositio del evento y elige los puestos que le interesan | Publica sus puestos para el evento con el perfil ideal | Abre inscripciones y comunica el evento |
| T-4 a T-3 días | Hace la batería de retos (45 min, en línea, con integridad) | Ve el pool del evento y marca a quién quiere conocer | Sigue en directo inscripciones, retos y revisiones |
| T-3 a T-1 días | Recibe su resultado, su SkillPass y su agenda | Confirma su lista corta y sus franjas | Ejecuta el matching y publica las agendas |
| Día del evento | Check-in con QR, reuniones de 15 minutos, caso en vivo opcional | Entrevistas, notas y valoración de cada reunión en el móvil | Control de sala, reasignación de huecos libres |
| T+1 a T+30 días | Ve quién quiere una segunda entrevista; feedback de cada empresa | Desbloquea contactos, avanza candidatos en su pipeline | Informe del evento: reuniones, segundas entrevistas y contrataciones |

**La diferencia con un evento de empleo normal**: ninguna reunión del día es al azar. Cada una existe porque la empresa la ha pedido tras ver una nota verificada y el candidato ha aceptado.

## Cómo se filtra a una persona

Nadie queda fuera por una señal automática: el filtro ordena y propone, y las personas (empresa, revisor, candidato) deciden. Cada asistente pasa por seis puertas, y en cada una sabe qué se mira.

> **[Diagrama: las seis puertas del filtro · quién decide en cada una]** — se ve en el PDF de `pdf/` o en el documento online.

Las puertas del sistema solo ordenan o piden completar datos; las que pueden dejar a alguien sin reunión las decide una persona.

| Puerta | Qué se comprueba | Quién decide | Si no la pasa |
| --- | --- | --- | --- |
| 1. Inscripción | Datos mínimos, consentimiento, puestos de interés, idiomas, jornada, modalidad, ciudad y disponibilidad | El sistema (datos completos) | Se le pide completarlos; no hay descarte |
| 2. Batería de retos | Que complete los ejercicios de su perfil dentro del plazo | El candidato | Puede asistir, pero sin lista corta ni reuniones |
| 3. Nota por competencia | Cada skill contra el mínimo que fija la empresa para cada puesto | El sistema propone | Se le muestra qué le falta y puede repetir un reto antes del cierre |
| 4. Encaje de condiciones | Jornada, modalidad, ubicación, salario y fecha de incorporación | El sistema propone | No aparece en ese puesto; sí en los que encajan |
| 5. Revisión humana | Notas en zona de duda (45-55 o a ±5 del umbral) y riesgo de integridad alto | Un revisor de TalentPact | El revisor confirma, corrige o pide un reto de control |
| 6. Lista corta y reunión | La empresa elige y el candidato acepta | Empresa y candidato | Sigue en el pool para después del evento |

**Fórmula de encaje con un puesto** (de 0 a 100):

```latex
\text{Encaje} = 60 \cdot S + 25 \cdot C + 15 \cdot D
```

S es el cumplimiento de skills: la media, sobre las skills que pide la empresa, de la nota del candidato dividida por el mínimo exigido, con tope en 1. C es la fracción de condiciones que coinciden (jornada, modalidad, ubicación, salario). D vale 1 si puede incorporarse en la fecha que pide la empresa y 0 si no. La empresa ve la puntuación y el desglose; el candidato ve qué le falta.

**Reglas que protegen al candidato**: la integridad nunca descarta sola; la nota que cuenta es la mejor de cada skill; el candidato puede repetir un reto antes del cierre; y puede ocultarse de una empresa concreta.

## Ejercicios

La batería del evento dura 45 minutos: un tronco común de 20 minutos que hacen todos (y que permite comparar a cualquiera con cualquiera) y un módulo de perfil de 25 minutos según el puesto que elige. En la sala, un caso en vivo de 10 minutos confirma la nota.

**Tronco común (20 min, todos)**

| Ejercicio | Tipo | Duración | Qué mide | Corrección |
| --- | --- | --- | --- | --- |
| Diagnóstico de métricas de una empresa | Análisis de datos | 8 min | Leer datos, detectar el problema, priorizar acciones | Corrector v2 con rúbrica de análisis |
| Email a un cliente o directivo | Redacción | 7 min | Estructura, tono, propuesta concreta | Corrector v2 con rúbrica de comunicación |
| Secuencias lógicas | Razonamiento | 5 min | Razonamiento abstracto bajo tiempo | Automática (aciertos) |

**Módulo de perfil (25 min, uno por candidato)**

| Perfil que piden las grandes empresas | Ejercicios (de los retos y plantillas existentes) | Formato |
| --- | --- | --- |
| Consultoría y análisis de negocio | Priorización de iniciativas con restricciones; informe ejecutivo | Clasificación + redacción |
| Datos y BI | Consultas sobre un esquema de tablas; interpretación de un cuadro de mando | Texto con datos |
| Finanzas y control | Ratios y desviaciones de presupuesto; recomendación a dirección | Análisis + redacción |
| Marketing digital | Optimización de campañas con datos de canales | Análisis de datos |
| Ventas y desarrollo de negocio | Llamada de prospección y seguimiento | Voz (transcrita) |
| Tecnología | Depurar un fragmento de código y explicar la solución | Texto con código |
| Personas y RRHH | Conflicto en un equipo; plan de incorporación | Vídeo (transcrito) + redacción |
| Operaciones y cadena de suministro | Asignación de recursos con capacidad limitada | Clasificación + análisis |
| Idiomas (complemento) | Reclamación de un cliente en inglés | Voz (transcrita) |

**Caso en vivo en la sala (10 min)**: el entrevistador plantea una variante del ejercicio que el candidato ya hizo ("¿y si el presupuesto fuera la mitad?") y lo valora con la misma rúbrica en el móvil. Es la mejor defensa contra respuestas hechas con ayuda externa y la mejor prueba de que la nota se sostiene.

**Cómo mejorar cada tipo de ejercicio**

| Tipo | Problema hoy | Mejora |
| --- | --- | --- |
| Análisis y redacción | Mismo enunciado para todos: las respuestas pueden circular | Datos generados por intento (mismas proporciones, cifras distintas) |
| Clasificación | Pocos ítems | Banco de 30-50 ítems por reto y selección aleatoria |
| Razonamiento | Pocas secuencias, se aprenden | Generación paramétrica de secuencias |
| Voz y vídeo | Se puntúa haber grabado, no lo que se dice | Transcribir y corregir el texto con la rúbrica; obligatorio antes del evento |
| Código | No existe un tipo propio | Editor con ejecución de pruebas en un entorno aislado |
| Todos | La rúbrica es general | Rúbrica por puesto, revisada con la empresa, con tres respuestas ancla (floja, correcta, excelente) |

**Checklist para diseñar un ejercicio de evento**: mide una competencia que la empresa nombra en su oferta; cabe en el tiempo; tiene rúbrica con pesos y respuestas ancla; no se resuelve copiando el enunciado en un chatbot sin entenderlo; lo ha probado una persona del perfil antes del evento; y tiene variante para el caso en vivo.

## Corrección

Hoy el corrector v2 ya hace lo importante: las instrucciones viven en el servidor, la respuesta del candidato va delimitada con un código de un solo uso, se detectan intentos de manipular la nota (bloqueo con dos señales, techo de 60 con una) y cada nota sale firmada con un recibo que el servidor comprueba antes de guardarla. Para un evento con grandes empresas hay que dar tres pasos más: que la nota sea **estable**, que sea **comparable** entre candidatos y empresas, y que sea **revisable** por una persona.

**1. Estabilidad: la misma respuesta, la misma nota**

| Mejora | Cómo | Objetivo medible |
| --- | --- | --- |
| Doble corrección | Dos llamadas independientes; si difieren más de 10 puntos, una tercera y se toma la mediana | Desviación entre corridas ≤ 5 puntos |
| Temperatura 0 y salida estructurada | Puntuación por criterio en JSON validado; la nota final la calcula el servidor con los pesos | Ninguna nota fuera de la escala o sin desglose |
| Respuestas ancla en el prompt | Tres ejemplos puntuados por reto (floja, correcta, excelente) | La nota de las anclas se reproduce ±5 |
| Versionado | Cada nota guarda versión de rúbrica, de prompt y de modelo | Se puede explicar cualquier nota meses después |

**2. Comparabilidad: el 75 de hoy vale lo mismo que el de mañana**

- **Calibración previa con cada empresa**: dos semanas antes, la empresa puntúa a mano 15-20 respuestas de prueba por reto; se ajustan pesos y anclas hasta que la correlación entre la nota de la IA y la de la empresa sea ≥ 0,8.
- **Normalización por reto**: además de la nota bruta se muestra el percentil dentro del evento, porque unos retos son más duros que otros.
- **Banco de respuestas de referencia**: cada reto conserva su conjunto de respuestas calibradas y se vuelve a pasar cuando cambia el modelo o el prompt (prueba de regresión antes de cada evento).

**3. Revisión humana: la IA propone, la persona decide**

| Caso | Qué pasa |
| --- | --- |
| Nota cerca del corte (±5 puntos) | Revisión obligatoria por un evaluador antes de cerrar la lista corta |
| Señales de integridad de riesgo medio o alto | Revisión y, si procede, repetición supervisada en la sala |
| El candidato pide revisión | Formulario en su panel; respuesta en 72 horas con la rúbrica a la vista |
| Muestreo aleatorio | Un 10 % de las notas las revisa una persona para vigilar sesgos y deriva del modelo |

**4. Explicación al candidato y a la empresa**: cada nota llega con el desglose por criterio, una frase de fortalezas y una de mejora, y la versión de la rúbrica. Al candidato se le dice siempre que la nota la propone un sistema de IA y que una persona puede revisarla (obligación de transparencia del Reglamento de IA en vigor desde agosto de 2026).

**5. Sesgo y equidad**: el corrector no recibe nombre, foto, edad, universidad ni ningún dato identificativo, solo la respuesta. Tras cada evento se comparan las tasas de paso por grupo (cuando el candidato lo declare voluntariamente) y se documenta el resultado; si un grupo pasa menos de un 80 % de lo que pasa el grupo con mejor tasa, se revisa el reto.

**6. Coste y latencia**: con doble corrección el coste por evaluación sube de céntimos a unos pocos céntimos más, asumible para un evento de cientos de candidatos. La corrección se hace en cola y el candidato ve "Corrigiendo…" con aviso por email, para no depender del límite de 60 segundos de las funciones.

## Integridad antes y en la sala

En un evento con grandes empresas la pregunta que hará cualquier responsable de selección es: "¿cómo sé que lo hizo él?". La respuesta es una cadena de capas, ninguna perfecta por sí sola, y una regla clara: **ninguna señal descarta a nadie automáticamente; solo envía el caso a revisión o a la sala**.

| Capa | Antes del evento (online) | En la sala |
| --- | --- | --- |
| Identidad | Cuenta verificada por email; móvil verificado por SMS para el evento | DNI contra la inscripción en el check-in (lo ve el organizador, no la empresa) |
| Entorno | Pantalla completa, aviso al cambiar de pestaña, bloqueo de pegar en las respuestas (ya existe: TPIntegrity) | Dispositivo del evento o del candidato con el mismo modo examen |
| Cámara | Opcional y con consentimiento; solo comprueba presencia de una persona, sin reconocimiento ni análisis de emociones (prohibido en el trabajo por el Reglamento de IA) | No necesaria: hay personas delante |
| Contenido | Detección de manipulación del corrector (corrector v2); comparación de similitud entre respuestas del mismo evento | Caso en vivo: variante del ejercicio que debe defender en 10 minutos |
| Tiempo | Registro de tiempos por ejercicio; aviso si se resuelve en un tiempo imposible | Cronómetro visible para todos |
| Recibo | Nota firmada con HMAC; el servidor rechaza notas manipuladas | El evaluador ve si la nota está verificada |

**Qué añadir para el evento**

1. **Similitud entre respuestas**: al cerrar la ventana de retos, comparar todas las respuestas de cada reto y marcar pares muy parecidos para revisión.
2. **Tiempo mínimo razonable** por ejercicio, calibrado con las pruebas previas.
3. **Repetición supervisada**: si hay dudas, el candidato repite una variante en la sala; la nota que cuenta es la de la sala.
4. **Informe de integridad por candidato** en el panel del evaluador: verde (sin señales), ámbar (revisar), rojo (repetir en sala), siempre con el motivo explicado.
5. **Política publicada** antes de inscribirse: qué se registra, para qué y qué consecuencias tiene. Lo que no se explica antes no se puede usar después.

## Página web

**Micrositio del evento** (`talentpact.es/impact`): una sola página, sin menú del producto general, pensada para el móvil porque la mayoría llegará desde un enlace en redes o un QR.

| Bloque | Contenido |
| --- | --- |
| Cabecera | Nombre del evento, fecha, lugar y un botón: "Inscríbete y haz los retos" |
| Cómo funciona | Tres pasos: retos online de 45 minutos → lista corta → reuniones de 15 minutos con las empresas |
| Empresas | Logos de las empresas que participan (con su permiso) y los perfiles que buscan |
| Fechas | Cierre de inscripción, ventana de retos, publicación de la lista corta, día del evento |
| Qué se evalúa y cómo | Ejemplo de reto, rúbrica resumida, que la corrección la propone una IA y la revisa una persona |
| Privacidad | Anonimato hasta que tú aceptes el contacto; enlace al texto legal del evento |
| Preguntas frecuentes | Plazos, accesibilidad, qué pasa si no paso, cómo pedir revisión |

**Inscripción en tres pantallas**: (1) cuenta con email y contraseña o enlace mágico; (2) perfil mínimo: puesto que buscas, jornada, modalidad, ciudad, disponibilidad e idiomas; (3) consentimientos separados (evento, contacto con empresas, cámara opcional). Al terminar, la persona entra directamente en sus retos.

**Mejoras generales de la web**

| Área | Hoy | Mejora |
| --- | --- | --- |
| Rendimiento | Un solo `index.html` grande con todos los scripts | Cargar cada panel cuando se abre; objetivo de carga < 2 s en 4G |
| Navegación | Paneles modales sobre la misma URL | Rutas propias (`/retos`, `/panel`, `/empresa`) para poder compartir y volver atrás |
| Accesibilidad | Contraste y foco mejorados en el rediseño | Auditoría WCAG 2.2 AA; tiempo extra configurable para quien lo necesite |
| Idiomas | Español | Inglés para eventos con empresas internacionales |
| Confianza | Texto legal completo | Página "Cómo evaluamos" con la metodología y la rúbrica pública |
| Analítica | Ninguna | Embudo sin cookies de terceros: visita → inscripción → retos completados |
| Estados vacíos | Ya existen (sin datos de ejemplo) | Mantener: el producto solo muestra datos reales |

## Dashboard del candidato

El candidato tiene que saber en todo momento **en qué punto está y qué le toca hacer**. Hoy el panel muestra progreso, notas y SkillPass; para el evento se añade una pestaña "Evento" que manda sobre todo lo demás mientras dure.

| Bloque | Qué muestra | Por qué |
| --- | --- | --- |
| Estado del evento | Inscrito → Retos pendientes → Corrigiendo → En lista corta / No seleccionado → Reuniones | Elimina la ansiedad de "no sé qué pasa" |
| Retos | Los 2 retos asignados, tiempo estimado, plazo y botón de empezar | Una sola acción clara |
| Resultados | Nota por criterio, percentil en el evento, fortalezas y mejora, botón "Pedir revisión" | Transparencia y derecho a revisión |
| Empresas interesadas | Qué empresas le han preseleccionado (sin que ellas vean aún su identidad) y botón para aceptar o rechazar el contacto | El candidato decide cuándo deja de ser anónimo |
| Agenda | Reuniones confirmadas: empresa, hora, mesa, QR de entrada | Lo que necesita el día del evento, en el móvil |
| Después | Encuesta de 3 preguntas, siguiente paso con cada empresa, SkillPass con las skills validadas | Cierra el ciclo y deja algo de valor aunque no haya oferta |

**Mejoras del panel general (fuera del evento)**: historial de intentos con la evolución de la nota, recomendación del siguiente reto según las skills que más piden las ofertas abiertas, aviso cuando una oferta encaja con su perfil y preferencias (jornada, modalidad, ciudad), y control de privacidad en un solo sitio (visible en el pool, acepta contacto, descargar o borrar mis datos).

## Dashboard de la empresa

Una gran empresa llega al evento con 3-5 puestos y un equipo de 2-4 personas. Su panel tiene que responder a una sola pregunta: **¿a quién veo y en qué orden?**

| Vista | Qué hace | Estado hoy |
| --- | --- | --- |
| Mis puestos | Crear los puestos del evento con skills, jornada, modalidad y número de reuniones | Existe para ofertas (save-job); falta asociarlas al evento |
| Ranking del evento | Candidatos anónimos ordenados por encaje, con nota por skill, percentil, integridad y preferencias | Existe el pool real (get-talent-pool); falta filtro por evento y encaje por puesto |
| Ficha anónima | Alias, notas por criterio, respuestas completas, SkillPass, disponibilidad | Parcial: falta ver la respuesta escrita completa |
| Lista corta | Marcar hasta N candidatos por puesto; comentarios internos del equipo | Nuevo |
| Reuniones | Agenda del día con mesa y hora; tras cada reunión, valoración rápida (1-5 + siguiente paso) | Nuevo |
| Contacto | Desbloqueo con consentimiento del candidato; en el evento va incluido en el precio del paquete | Existe (get-contact + Stripe); falta modalidad paquete |
| Informe final | Candidatos vistos, entrevistados, siguientes pasos, coste por contratación | Nuevo |

**Filtros que piden las empresas**: puesto, nota mínima por skill, jornada (completa/parcial), modalidad, ciudad, disponibilidad, idiomas, integridad verificada. Nunca: edad, género, nacionalidad ni foto.

**Colaboración del equipo**: varias personas de la misma empresa con roles (responsable, entrevistador), comentarios por candidato y voto rápido (sí / quizás / no) para cerrar la lista corta en una reunión de 20 minutos.

**Exportación**: lista corta y valoraciones en CSV o directamente a su ATS (Workday, SuccessFactors, Greenhouse) en una fase posterior.

Boceto de la vista principal:

> **[Diagrama: boceto del ranking de empresa · filtros, encaje, integridad y condiciones]** — se ve en el PDF de `pdf/` o en el documento online.

El boceto no lleva datos reales: las barras solo ilustran el orden por encaje y el aviso "Revisar" envía el caso a revisión humana, no lo descarta.

## Dashboard del organizador

El organizador del Impact necesita controlar el evento entero sin depender del equipo técnico. Sería una extensión del backoffice actual (que ya muestra métricas reales con el rol de administrador).

| Módulo | Funciones |
| --- | --- |
| Configuración | Crear el evento: fechas, aforo, empresas, puestos, retos asignados por perfil, nota de corte, duración de reuniones, mesas |
| Embudo en directo | Inscritos → empezaron retos → terminaron → en lista corta → con reunión → asistieron → con siguiente paso |
| Calidad de la evaluación | Distribución de notas por reto, notas pendientes de revisión humana, casos de integridad, coste de IA |
| Empresas | Estado de cada empresa: puestos creados, lista corta cerrada, reuniones asignadas |
| Agenda | Generar la agenda automáticamente, ajustarla a mano y enviar confirmaciones |
| Check-in | Lectura del QR de cada candidato desde el móvil del personal; lista de asistencia en tiempo real |
| Día del evento | Mapa de mesas, reuniones en curso, retrasos, huecos libres para reasignar a candidatos en lista de espera |
| Cierre | Informe para patrocinadores y empresas; encuesta de satisfacción; borrado programado de datos |

**Métricas en directo que importan el día del evento**: asistencia sobre confirmados, reuniones a tiempo, huecos libres, candidatos sin ninguna reunión (objetivo: cero entre los que están en lista corta).

## Matching y agenda de reuniones

**Paso 1. Encaje candidato-puesto.** Para cada par se calcula el encaje (ver la fórmula de la sección de filtrado): nota de las skills que pide el puesto, cumplimiento de condiciones (jornada, modalidad, ciudad) y disponibilidad. Las condiciones obligatorias que no se cumplen eliminan el par; las deseables solo restan.

**Paso 2. Listas cortas.** Cada empresa ve su ranking y marca su lista corta. Si no la cierra a tiempo, se propone automáticamente con los mejores N por encaje para que pueda confirmarla de un clic.

**Paso 3. Preferencias del candidato.** Los candidatos en una o más listas cortas ordenan las empresas que les interesan y aceptan el contacto.

**Paso 4. Agenda.** Asignación de reuniones de 15 minutos con estas reglas:

1. Solo se cita a un par si ambos lo quieren (empresa en lista corta, candidato acepta).
2. Se prioriza por encaje y por preferencia del candidato.
3. Cada candidato en lista corta tiene al menos una reunión; máximo 4 para que pueda atenderlas.
4. Cada empresa tiene como máximo las reuniones que caben en sus mesas y horas.
5. Entre dos reuniones del mismo candidato hay al menos 5 minutos.

Con cientos de candidatos y decenas de empresas basta un algoritmo voraz con estas reglas y una pasada de mejora; no hace falta un optimizador complejo. El organizador puede mover reuniones a mano y el sistema avisa de choques.

**Paso 5. Lista de espera.** Si un candidato no se presenta, el hueco se ofrece en el momento al siguiente de la lista corta que esté en la sala (aviso al móvil).

## Mejoras visuales

El rediseño ya cambió la cara del producto: tipografía Inter, paleta sobria de tinta y verde azulado, iconos de línea, monogramas en lugar de emojis y estados vacíos en vez de datos de ejemplo. Pero se hizo **por encima** del CSS antiguo (`tema.css` redefine a `app.css`), y eso se nota al medirlo:

| Indicador (medido en el código actual) | Hoy | Objetivo |
| --- | --- | --- |
| Colores distintos escritos a mano en el CSS | 97 | 14 tokens semánticos |
| Tamaños de letra distintos | 58 | 8 de una escala |
| Reglas con `!important` | 55 | 0 (salvo accesibilidad) |
| Atributos `style="…"` en `index.html` | 140 | 0 |
| Atributos `style="…"` generados en los scripts | 137 | Solo posiciones calculadas |
| Puntos de corte para móvil | 7 distintos (600 a 1024 px) | 3 (640, 1024, 1280) |
| Modo oscuro | No | Sí, automático |
| Líneas de CSS | 1.693 en 3 ficheros que se pisan | Un sistema por capas |

Para un evento con grandes empresas esto importa por dos razones: sus equipos juzgan la seriedad del producto en los primeros segundos, y el candidato hace los retos en el móvil, con prisa y nervios. Cada pantalla tiene que verse igual de cuidada que la portada.

### Principios

1. **Una acción principal por pantalla.** Si el candidato tiene que hacer algo, solo hay un botón destacado.
2. **El dato manda.** Notas, encaje y estado se ven antes que la decoración; los números con cifras tabulares para que se alineen.
3. **El color significa algo.** Verde azulado = acción de marca; verde, ámbar y rojo solo para estados; nunca color como único indicador (siempre con texto o icono).
4. **Calma en el examen.** La pantalla del ejercicio no tiene menús, anuncios ni animaciones; solo enunciado, respuesta y tiempo.
5. **Anonimato visible.** Mientras el candidato no acepta el contacto, la interfaz de empresa lo muestra con alias y un avatar neutro, y lo dice.
6. **Móvil primero para el candidato, escritorio primero para la empresa y el organizador.**

### Sistema de diseño

**Color: tokens semánticos** (un nombre por función, con su valor claro y oscuro). Los componentes solo usan estos nombres, nunca un hexadecimal.

| Token | Uso | Claro | Oscuro |
| --- | --- | --- | --- |
| `--c-fondo` | Fondo de página | `#f9fafb` | `#0c1220` |
| `--c-superficie` | Tarjetas, modales, tablas | `#ffffff` | `#1b2333` |
| `--c-superficie-2` | Zonas secundarias, cabeceras de tabla | `#f2f4f7` | `#323c4e` |
| `--c-borde` | Bordes y separadores | `#e4e7ec` | `#323c4e` |
| `--c-texto` | Texto principal | `#0c1220` | `#f2f4f7` |
| `--c-texto-2` | Texto secundario | `#4a5568` | `#98a2b3` |
| `--c-marca` | Botones principales, enlaces, selección | `#0b6e5f` | `#3aa892` |
| `--c-marca-suave` | Fondo de selección y destacados | `#f1f8f6` | `#08574b` con transparencia |
| `--c-foco` | Anillo de foco del teclado | `#2f5bd3` | `#8aa6f0` |
| `--c-ok` | Verificada, cumple, asistió | `#0f8a76` | `#3aa892` |
| `--c-aviso` | Revisar, retraso, zona de duda | `#c2700b` | `#e0a24a` |
| `--c-error` | Error, no presentado | `#c8372d` | `#ef7a70` |
| `--c-info` | Información neutra | `#2f5bd3` | `#8aa6f0` |
| `--c-evento` | Acento del evento Impact (solo micrositio y credencial) | El de la marca del organizador | Igual, ajustado a contraste |

Todos los pares texto/fondo cumplen contraste 4,5:1 (texto normal) y 3:1 (texto grande e iconos), comprobado en claro y en oscuro.

**Tipografía**: Inter para todo, con cifras tabulares (`font-variant-numeric: tabular-nums`) en notas, tiempos y tablas. Ocho tamaños sustituyen a los 58 actuales:

| Paso | Tamaño / interlineado | Uso |
| --- | --- | --- |
| Display | 44 / 1,1 (32 en móvil) | Titular de portada y micrositio |
| Título 1 | 32 / 1,2 | Título de página |
| Título 2 | 24 / 1,25 | Sección |
| Título 3 | 20 / 1,3 | Tarjeta, modal |
| Destacado | 17 / 1,45 | Entradilla, nota grande secundaria |
| Cuerpo | 15 / 1,6 | Texto normal (ya es el actual) |
| Pequeño | 13 / 1,5 | Tablas, ayudas, metadatos |
| Micro | 12 / 1,4 | Etiquetas de eje, chips |

**Espaciado**: múltiplos de 4 (4, 8, 12, 16, 24, 32, 48, 64). **Radios**: 8 (controles), 12 (tarjetas), 16 (modales), redondo (chips). **Elevación**: tres niveles (borde, tarjeta, modal); en modo oscuro se sustituye la sombra por un borde más claro. **Iconos**: el set de línea actual (`00-iconos.js`) a 16, 20 y 24 px, trazo 1,75. **Movimiento**: 150 ms para cambios de estado, 250 ms para paneles que entran; nada se mueve si el sistema pide reducir movimiento (ya existe esa regla).

**Arquitectura del CSS**: capas `@layer reset, tokens, base, componentes, pantallas, utilidades`, de modo que el orden lo decide la capa y no el `!important`. `tema.css` y `app.css` se funden en ficheros por componente; los 277 estilos en línea pasan a clases.

### Componentes

| Componente | Cómo se ve | Detalle que marca la diferencia |
| --- | --- | --- |
| Botón | Principal (marca), secundario (borde), terciario (texto), peligro | Estado de carga dentro del botón; nunca dos principales juntos |
| Campo de formulario | Etiqueta encima, ayuda debajo, error en rojo con icono | Validación al salir del campo, no al teclear |
| Chip de estado | Punto de color + texto (Verificada, Revisar, Pendiente) | El texto siempre presente, para daltónicos |
| Barra de nota | Barra horizontal 0-100 con marca vertical del mínimo del puesto | Se entiende sin leer el número |
| Insignia de integridad | Escudo verde / ámbar / gris con el motivo al pasar el ratón | Nunca rojo para "sospechoso": el ámbar dice "revisar" |
| Tarjeta KPI | Etiqueta, cifra grande tabular, variación y mini tendencia | Mismo alto en toda la fila |
| Tabla | Cabecera fija, filas de 48 px, columnas numéricas alineadas a la derecha | Ordenar por columna y fila entera clicable |
| Pasos (stepper) | Puntos unidos por una línea: hecho, actual, pendiente | Es la pieza central del panel del candidato |
| Cronómetro | Fijo arriba, cifras tabulares; ámbar en los últimos 5 minutos | Sin parpadeos ni sonidos |
| Estado vacío | Icono de línea, una frase, una acción | Ya existe; unificar texto y tamaño |
| Esqueleto de carga | Bloques grises con la forma del contenido | Sustituye a "Cargando…" |
| Aviso (toast) | Abajo en móvil, arriba a la derecha en escritorio | Con acción de deshacer cuando aplique |
| Panel lateral | Ficha del candidato sin salir del ranking | Teclas arriba/abajo para pasar al siguiente |
| QR de entrada | A pantalla completa, brillo máximo, nombre y hora debajo | Funciona sin conexión (guardado al confirmar) |

### Visualización de datos en los dashboards

| Pregunta del usuario | Gráfico | Por qué |
| --- | --- | --- |
| ¿Cumplo el mínimo de cada skill? | Barras horizontales con marca del mínimo | Comparar contra un umbral |
| ¿Dónde estoy respecto al resto? | Punto sobre una línea de percentiles | Posición, no cantidad |
| ¿Cómo evoluciono? | Línea de mis intentos por skill | Tendencia en el tiempo |
| ¿Quién encaja mejor? | Ranking con barra de encaje y desglose S/C/D al pasar el ratón | Ordenar y explicar |
| ¿Dónde se pierden candidatos? | Embudo horizontal con el porcentaje que pasa entre etapas | La caída es el mensaje |
| ¿Está bien calibrado el reto? | Histograma de notas con línea de corte y zona de duda sombreada | Ver la forma de la distribución |
| ¿Cómo va la sala ahora? | Mapa de mesas con color por estado | Lectura en un vistazo, de pie y con el móvil |
| ¿Cuánto cuesta la IA? | Cifra grande y mini tendencia | Control, no análisis |

Reglas: nada de tartas ni 3D; ejes que empiezan en cero en las barras; un solo color de acento por gráfico y gris para el resto; cada gráfico con su título en forma de conclusión y la tabla de datos accesible debajo. Librería propuesta: SVG propio para barras y embudos (ligero) y una librería pequeña solo para histogramas y líneas.

### Pantalla por pantalla

| Pantalla | Hoy | Mejora visual |
| --- | --- | --- |
| Portada | Rediseñada, secciones largas | Titular de una frase, captura real del producto en lugar de ilustraciones, tres pasos con iconos, logos de empresas solo con permiso, un único botón principal |
| Micrositio del evento | No existe | Cabecera con fecha y lugar, línea de tiempo de tres pasos, empresas y perfiles, botón de inscripción fijo abajo en móvil |
| Registro | Modal con pestañas | Tres pasos con barra de progreso, requisitos de la contraseña que se marcan al cumplirse, consentimientos como casillas separadas con resumen claro |
| Catálogo de retos | Tarjetas con monograma | Filtros como chips, duración y dificultad visibles, marca de "hecho" y mejor nota, retos del evento arriba con el acento del evento |
| Ejercicio | Modal con enunciado y respuesta | Pantalla completa: enunciado a la izquierda, respuesta a la derecha (pestañas en móvil), cronómetro fijo, "Guardado" visible, contador de palabras, indicador de integridad discreto |
| Corrigiendo | Espera sin información | Tres pasos (recibida, corrigiendo, lista) y aviso de que llegará un email |
| Resultado | Nota y comentario | Nota grande, barra por criterio con el mínimo, percentil en el evento, fortalezas y mejora en dos tarjetas, insignia de nota verificada, botón "Pedir revisión" |
| Panel del candidato | Pestañas con progreso y notas | Pasos del evento arriba, una tarjeta "Lo siguiente", agenda y QR, ajustes de privacidad agrupados |
| SkillPass | Hash en la cadena, poco visible | Credencial visual compartible (imagen para LinkedIn) con QR de verificación y la marca del evento |
| Panel de empresa | Tablas y formularios | Ranking con barras, filtros laterales persistentes, ficha en panel lateral, comparador de 2-3 candidatos, lista corta como tablero sí / quizás / no |
| Panel del organizador | Backoffice con KPI y tablas | Embudo, mapa de mesas, cronología del día, alertas arriba, modo pantalla grande para proyectar |
| Check-in | No existe | Escáner a pantalla completa y resultado grande: verde con nombre y mesa, ámbar si no tiene reunión, rojo si no está inscrito |
| Emails | Texto | Plantilla con la marca, un botón, legible en móvil y modo oscuro |
| Legal | Página larga | Índice lateral fijo y un resumen en lenguaje claro al principio de cada apartado |
| Chat de ayuda | Botón flotante | No tapa botones en móvil y se oculta durante los ejercicios |

Boceto de la pantalla del ejercicio:

> **[Diagrama: pantalla del ejercicio · enunciado, respuesta, tiempo e integridad]** — se ve en el PDF de `pdf/` o en el documento online.

El borde de color marca dónde se escribe; el cronómetro y el modo integridad están siempre a la vista, pero sin llamar la atención.

Boceto del resultado del candidato:

> **[Diagrama: resultado del candidato · nota, percentil, criterios y revisión]** — se ve en el PDF de `pdf/` o en el documento online.

Un criterio por debajo del mínimo se pinta en ámbar, no en rojo: indica qué reforzar, no un suspenso. Las barras son ilustrativas.

Boceto del panel del candidato en el móvil durante el evento:

> **[Diagrama: panel del candidato en el móvil · pasos del evento, siguiente acción, agenda y QR]** — se ve en el PDF de `pdf/` o en el documento online.

El paso actual y la tarjeta "Lo siguiente" comparten el color de acento: es lo único que pide atención. El QR queda guardado en el teléfono para que la entrada no dependa de la cobertura de la sala.

Boceto del panel del organizador el día del evento:

> **[Diagrama: panel del organizador · alertas, indicadores, embudo y mapa de mesas]** — se ve en el PDF de `pdf/` o en el documento online.

Las alertas van arriba porque el día del evento importa más actuar que analizar; el embudo y el mapa responden de un vistazo a dónde se pierde gente y qué mesas están libres. Ninguna cifra del boceto es real.

### Móvil, accesibilidad y modo oscuro

- **Móvil**: objetivos táctiles de 44 px mínimo, barra de acción fija abajo, tablas que se convierten en tarjetas por debajo de 640 px, teclado que no tapa el campo activo, sin desplazamiento horizontal.
- **Accesibilidad (WCAG 2.2 AA)**: foco visible en todo, orden de tabulación lógico, etiquetas en todos los campos, avisos anunciados al lector de pantalla, cronómetro que se puede ampliar (tiempo extra configurable), textos al 200 % sin romper el diseño.
- **Modo oscuro**: automático según el sistema y con selector manual; especialmente útil en la sala, con poca luz, para el personal de check-in.
- **Rendimiento visual**: fuentes con `font-display: swap`, imágenes con tamaño reservado (sin saltos), esqueletos en lugar de pantallas en blanco.

### Marca del evento

El evento lleva la marca del organizador sin romper la de TalentPact: el acento `--c-evento` solo aparece en el micrositio, en los retos del evento, en la credencial y en el QR. Para la sala: carteles con el QR de la agenda, numeración de mesas igual que en el mapa del organizador, y una pantalla con las reuniones que empiezan en los próximos minutos (por alias, sin nombres).

### Plan visual y criterios de aceptación

| Fase | Semana del plan | Trabajo |
| --- | --- | --- |
| 1. Tokens y limpieza | 1-2 | Tokens semánticos, escala tipográfica, capas CSS, eliminar `!important` y estilos en línea |
| 2. Componentes | 2-3 | Los 14 componentes de la tabla, con una página interna que los muestra todos en claro y oscuro |
| 3. Pantallas del evento | 3-5 | Micrositio, registro, ejercicio, resultado, panel del candidato, ranking de empresa |
| 4. Dashboards y sala | 5-6 | Panel del organizador, mapa de mesas, check-in, credencial |
| 5. Revisión | 7-8 | Capturas automáticas de cada pantalla en móvil y escritorio, claro y oscuro, comparadas en cada cambio; prueba con 5 candidatos y 2 empresas |

Una pantalla está terminada cuando: usa solo tokens; tiene estado vacío, de carga y de error; funciona a 375 px y a 1440 px; se maneja entera con teclado; pasa la comprobación automática de accesibilidad sin errores; y se ve bien en modo oscuro.

## Datos y legal del evento

Un sistema que usa IA para filtrar candidatos es de **alto riesgo** según el Reglamento europeo de IA (anexo III, empleo). Con el aplazamiento aprobado en 2026, las obligaciones de alto riesgo se aplican desde el 2 de diciembre de 2027, pero las de transparencia ya están en vigor desde agosto de 2026 y las grandes empresas pedirán cumplimiento desde el primer día. Conviene diseñar ya como si aplicaran.

| Tema | Qué hacer | Quién |
| --- | --- | --- |
| Roles | TalentPact es proveedor del sistema; cada empresa y el organizador son responsables del despliegue en su uso | Contrato con cada parte |
| Base jurídica | Consentimiento explícito para participar en el evento y, aparte, para compartir datos de contacto | Inscripción |
| Transparencia | Avisar de que la nota la propone una IA, cómo funciona y que una persona revisa | Micrositio, retos y panel |
| Decisión humana | Ninguna exclusión sin revisión humana posible; derecho a pedir revisión (RGPD art. 22) | Proceso de revisión |
| Prácticas prohibidas | Nada de inferir emociones por cámara o voz en un contexto laboral | Diseño (ya cumplido) |
| Registros | Conservar los registros de evaluación al menos 6 meses (versiones, notas, revisiones) | Base de datos |
| Evaluación de impacto | EIPD (RGPD art. 35) antes del primer evento | TalentPact + organizador |
| Encargados | Contrato de encargo con Supabase, Netlify, Stripe y el proveedor de IA; transferencias internacionales cubiertas | TalentPact |
| Conservación | Datos del evento borrados o anonimizados a los 12 meses salvo que el candidato quiera mantener su perfil | Tarea programada |
| Accesibilidad | Ajustes razonables (tiempo extra, formato alternativo) a petición | Inscripción |

**Documentos que hay que tener listos**: aviso legal y política de privacidad del evento (ampliación de `legal.html`), condiciones para empresas, acuerdo de encargo de tratamiento, EIPD, ficha técnica del sistema de IA (para qué sirve, límites, métricas de calidad y sesgo) y procedimiento de revisión.

## Cambios técnicos

La arquitectura actual aguanta un evento: web estática en Netlify, funciones con la API moderna, Supabase para autenticación y datos, Stripe para pagos. Lo que falta es el modelo de datos del evento y unas pocas funciones nuevas.

**Tablas nuevas (Supabase)**

| Tabla | Campos principales |
| --- | --- |
| `events` | id, nombre, fechas (inscripción, retos, lista corta, evento), aforo, nota de corte, estado |
| `event_companies` | event\_id, company\_user\_id, mesas, franjas, número máximo de reuniones |
| `event_roles` | event\_id, job\_id, retos asignados, pesos de la rúbrica |
| `event_registrations` | event\_id, user\_id, perfil elegido, consentimientos con fecha, estado, check-in |
| `event_shortlists` | event\_id, job\_id, profile\_id, marcado por, comentario, voto |
| `event_meetings` | event\_id, job\_id, profile\_id, mesa, hora, estado, valoración, siguiente paso |
| `evaluation_reviews` | evaluation\_id, revisor, nota anterior, nota nueva, motivo |

Todas con políticas de seguridad por filas: el candidato solo ve lo suyo, la empresa solo sus puestos y listas, el organizador su evento.

**Funciones nuevas**

| Función | Qué hace |
| --- | --- |
| `event-register` | Inscribe y guarda consentimientos |
| `event-ranking` | Ranking por puesto con el encaje calculado (reutiliza get-talent-pool) |
| `event-shortlist` | Marcar, desmarcar, votar y comentar |
| `event-schedule` | Genera y ajusta la agenda (solo organizador) |
| `event-checkin` | Valida el QR firmado del candidato |
| `evaluation-review` | Revisión humana con traza |
| `evaluate-queue` | Corrección en segundo plano (función en segundo plano de Netlify, hasta 15 minutos) |

**Pantallas nuevas**: micrositio `/impact`, pestaña Evento en el panel del candidato, ranking y lista corta de la empresa, agenda, panel del organizador y lector de QR.

**Capacidad**: un pico de 500 candidatos haciendo retos a la vez son unas 1.000 correcciones en una hora; con la cola y doble corrección es asumible, pero hay que hacer una prueba de carga dos semanas antes y comprobar los límites de la API del modelo. Las pruebas automatizadas (hoy 110) se amplían con las reglas de agenda, encaje y permisos.

## Métricas de éxito

| Métrica | Objetivo del primer evento | Cómo se mide |
| --- | --- | --- |
| Inscritos que terminan los retos | ≥ 60 % | Embudo del organizador |
| Asistencia a reuniones confirmadas | ≥ 85 % | Check-in |
| Reuniones valoradas 4-5 por la empresa | ≥ 50 % | Valoración tras cada reunión |
| Candidatos con siguiente paso | ≥ 25 % de la lista corta | Panel de empresa |
| Contrataciones a 90 días | Seguimiento (sin objetivo el primer año) | Encuesta a empresas |
| Concordancia IA - evaluador humano | Correlación ≥ 0,8 | Calibración y muestreo del 10 % |
| Notas modificadas tras revisión | ≤ 10 % | `evaluation_reviews` |
| Satisfacción del candidato (incluidos no seleccionados) | ≥ 4/5 | Encuesta |
| Satisfacción de la empresa | ≥ 4/5 y repetiría | Encuesta |
| Coste de IA por candidato | < 0,50 € | Backoffice |
| Incidencias de integridad confirmadas | Documentadas, sin objetivo numérico | Panel de integridad |

## Plan de trabajo

Ocho semanas de trabajo para dos personas, con el evento en la semana 12 (las semanas 9-11 son la ventana de inscripción y retos).

> **[Diagrama: plan por semanas · construcción, ventana de retos, evento y cierre]** — se ve en el PDF de `pdf/` o en el documento online.

Los bloques de construcción se solapan una semana para que cada uno arranque con lo anterior casi listo; de la semana 9 a la 11 los candidatos hacen los retos.

| Semanas | Bloque | Entregables |
| --- | --- | --- |
| 1 | Base | Migraciones pendientes de Supabase aplicadas; tablas del evento; rol de organizador |
| 1-2 | Ejercicios | Tronco común y módulos de perfil; rúbricas por puesto; datos variables por intento |
| 2-3 | Corrección | Doble corrección, salida estructurada, versionado, cola en segundo plano, revisión humana |
| 3-4 | Web | Micrositio `/impact`, inscripción en tres pantallas, textos legales del evento |
| 4-5 | Dashboards | Pestaña Evento del candidato; ranking y lista corta de empresa |
| 5-6 | Agenda | Matching, agenda automática, QR y check-in, panel del organizador |
| 6-7 | Calibración | Empresas puntúan respuestas de prueba; ajuste de pesos y anclas; prueba con 20-30 candidatos reales |
| 7-8 | Ensayo | Prueba de carga, simulacro del día del evento, EIPD cerrada, formación de evaluadores |
| 9-11 | Ventana | Inscripción y retos abiertos; revisión humana continua |
| 12 | Evento | Reuniones, check-in, valoraciones |
| 13-16 | Cierre | Informe, encuestas, seguimiento de contrataciones, borrado programado |

Si el tiempo aprieta, el orden de recorte es: exportación a ATS, inglés, ejercicios de código con ejecución, voz y vídeo. Lo que no se recorta: corrección calibrada, revisión humana, consentimientos y agenda.

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
| --- | --- | --- | --- |
| Las empresas no se fían de la nota de la IA | Alta | Alto | Calibración con ellas, respuestas completas visibles, caso en vivo en la sala |
| Pocos candidatos terminan los retos | Media | Alto | 45 minutos máximo, recordatorios, poder pausar entre ejercicios |
| Respuestas hechas con ayuda de IA externa | Alta | Medio | Datos por intento, similitud, tiempos, caso en vivo |
| Pico de correcciones el último día | Alta | Medio | Cola, límites del proveedor revisados, cierre escalonado por perfiles |
| Sesgo en la corrección | Media | Alto | Corrección ciega, análisis de tasas de paso, revisión de retos |
| Incumplimiento legal | Baja | Alto | EIPD, consentimientos, transparencia, contratos de encargo |
| No presentados el día del evento | Media | Medio | Confirmación 48 h antes, lista de espera en la sala |
| Caída de un proveedor (IA, Supabase) | Baja | Alto | Corrección de reserva sin IA marcada como provisional; agenda exportada en PDF |
| Migraciones de Supabase sin aplicar | Alta hoy | Alto | Primera tarea de la semana 1 |

## Resto del producto

El evento es el escaparate, pero todo lo que se construye para él mejora el producto de todos los días:

| Área | Qué se queda después del evento |
| --- | --- |
| Retos | Banco ampliado, rúbricas por puesto, datos variables: el catálogo general es más fiable |
| Corrección | Doble corrección, calibración y revisión humana para todas las notas |
| Pool de talento | Encaje por puesto en lugar de solo nota media; filtros de condiciones |
| Ofertas | Ofertas vinculadas a retos concretos: "para optar, haz este reto" |
| Empresas | Equipos con roles, comentarios, listas cortas, informes |
| Candidatos | Estado claro, revisión, SkillPass con skills verificadas en evento |
| Modelo de negocio | Además del desbloqueo de 49 €: paquete por evento para empresas y licencia para organizadores |
| Backoffice | Panel del organizador reutilizable para ferias de empleo de universidades y escuelas de negocio |

También quedan pendientes las mejoras generales ya identificadas: rutas propias en la web, carga por partes, inglés, auditoría de accesibilidad y analítica sin cookies.

## Anexo: inventario pantalla por pantalla

| Pantalla | Quién | Estado hoy | Qué cambia para el evento |
| --- | --- | --- | --- |
| Portada | Todos | Rediseñada, sin datos de ejemplo | Banner del evento activo |
| Micrositio `/impact` | Visitante | No existe | Nuevo |
| Registro e inicio de sesión | Todos | Política de contraseñas y protecciones de acceso | Enlace mágico; vínculo con el evento |
| Catálogo de retos | Candidato | Existe | Retos del evento destacados y bloqueados al resto |
| Ejercicio | Candidato | Modo integridad, consentimiento de cámara, bloqueo de pegar | Datos por intento, temporizador del evento |
| Resultado | Candidato | Nota con recibo verificado | Desglose por criterio, percentil, pedir revisión |
| Panel del candidato | Candidato | Progreso, notas, SkillPass, preferencias de empleo | Pestaña Evento, agenda, QR |
| SkillPass y verificación | Candidato / empresa | Hash en Sepolia | Marca "verificado en evento" |
| Panel de empresa | Empresa | Perfil, ofertas reales, pool real | Puestos del evento, ranking por encaje, lista corta |
| Desbloqueo de contacto | Empresa | Stripe 49 € con consentimiento del candidato | Incluido en paquete del evento |
| Ofertas | Todos | Lista real o estado vacío | Ofertas del evento etiquetadas |
| Chat de ayuda | Todos | Instrucciones en el servidor | Preguntas frecuentes del evento |
| Backoffice | Administrador | Métricas reales con rol de servidor | Panel del organizador, check-in, agenda |
| Legal | Todos | Actualizado sin textos de prueba | Anexo del evento, ficha del sistema de IA |
