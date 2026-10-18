# 09 · Definir ejercicio por ejercicio

Tarea de la reunión: «Definir ejercicio por ejercicio».
El catálogo tiene **103 retos y 309 ejercicios** (124 de redacción, 95 de clasificación, 88 de análisis, 1 de secuencias y 1 de audio). Este documento fija **la ficha** que debe tener cada ejercicio, la aplica completa a los **42 ejercicios de soft skills y transferibles** (los que más miran las empresas, según la asesora) y deja el inventario de los 309 en [`09b_inventario_ejercicios.md`](09b_inventario_ejercicios.md) como hoja de trabajo.

---

## 1. La ficha de un ejercicio

Basada en el diccionario de competencias (§3.3, «Estructura de una evaluación digital») y en lo que necesita el corrector (doc 05) y el antitrampas (doc 08):

| Campo | Qué es | Ejemplo |
| --- | --- | --- |
| ID y versión | `common_leadership.e1@2` | |
| Competencia(s) | Código del diccionario, máx. 2 | 03.5 |
| Pilar y área | Soft / Transferibles / Hard; área funcional (doc 01) | Soft · transversal |
| Nivel | Junior / Intermedio / Sénior (cambia los descriptores) | Intermedio |
| Formato y tiempo | Redacción, clasificación con justificación, análisis, simulación, bandeja… | Redacción · 12 min |
| Escenario | Plantilla con parámetros `{…}` | |
| Parámetros de variante | Qué cambia entre intentos | antigüedad, n.º de plazos fallados, quién presiona |
| Consigna visible | Lo que se pide, sin dar la solución | |
| Indicadores (3–5) | Qué tiene que aparecer, observable | «Nombra al menos un hecho concreto con fecha o dato» |
| Errores que penalizan | Fallos de fondo y su tope | «Culpa o etiqueta a la persona» → tono ≤ 40 |
| Rúbrica | Familia de rúbrica del servidor (doc 05) | Comunicación |
| Ancla | Una respuesta floja y una buena, con nota | (en el gold set) |
| Integridad mínima | Estándar / Supervisado / Alto | Estándar |
| Revisado por | Persona y fecha | Asesora, dd/mm |

Regla nueva para las guías: **la consigna dice qué se va a valorar, no da la respuesta.** Hoy varias guías listan las ideas que el candidato debería tener (por ejemplo, en Creatividad: «Piensa en: guerrilla marketing, partnerships, contenido viral…»). Eso iguala a todo el mundo por arriba y el reto deja de discriminar. Propuesta: la guía pasa a «Se valorará: originalidad, viabilidad con 0 €, concreción día a día».

## 2. Problemas transversales encontrados al revisar los 42

1. **Soluciones en el navegador** de las clasificaciones (doc 08, §1). Prioridad máxima.
2. **Guías que dan la respuesta** (Creatividad e1–e3, Toma de decisiones e1, Resolución de problemas e3 da la población de Barcelona).
3. **Secuencias numéricas conocidas** (Fibonacci, ×3, ×2+1): se encuentran en cualquier buscador y miden poco para un puesto. Propuesta: sustituir por un problema de razonamiento con datos del propio escenario.
4. **Ejercicios encadenados** («Con los datos anteriores…»): bien para la coherencia, pero obliga a que la variante cambie los tres a la vez.
5. **Nombres en inglés** en títulos («Inbox Zero Challenge», «Pivot Decision», «Escalation Management»): pasar a español (doc 01, §4).
6. **Competencias que faltan**: ningún ejercicio mide escucha activa, responsabilidad, adaptabilidad o resiliencia (doc 06, §3). Se proponen fichas nuevas en §4.

## 3. Los 42 ejercicios, uno a uno

Formato de cada tabla: competencia · indicadores (propuesta para que la asesora los revise) · errores que penalizan · parámetros de variante.

### 3.1 Pensamiento analítico y crítico (`common_analytical`)

| Ej. | Comp. | Indicadores | Penaliza | Variante |
| --- | --- | --- | --- | --- |
| e1 Diagnóstico de métricas | 01.1 | Interpreta cada métrica con su referencia (churn alto para SaaS, NPS medio) · relaciona churn con CAC/LTV · distingue hecho de hipótesis · 3 acciones priorizadas y ligadas al diagnóstico | Acciones sin relación con los datos → plan ≤ 40 | MRR, churn, CAC, NPS y tipo de empresa |
| e2 Priorización de iniciativas | 01.3 | Clasificación (sin IA) + **justificación de la n.º 1**: coste frente a impacto en la métrica crítica | Justifica con preferencias, no con datos | Coste e impacto de cada iniciativa |
| e3 Informe ejecutivo | 04.1 | Titular del estado en la primera frase · 3 métricas con tendencia · riesgo principal · acciones con plazo · ≤ 150 palabras | Supera 200 palabras → concisión ≤ 40 | Hereda la variante de e1 |

### 3.2 Comunicación clara y adaptativa (`common_communication`)

| Ej. | Comp. | Indicadores | Penaliza | Variante |
| --- | --- | --- | --- | --- |
| e1 Correo de malas noticias | 04.1 | Reconoce el esfuerzo con un detalle concreto · explica la decisión sin culpar a dirección ni a la persona · perspectiva constructiva · siguiente paso con fecha | Condescendencia o promesas que no puede cumplir | Semanas de trabajo, motivo del rechazo |
| e2 Correo persuasivo | 04.3 | Dato de contexto, no opinión · beneficio para la empresa · piloto acotado y medible · anticipa una objeción | Argumenta solo por beneficio propio | Propuesta (remoto, horario, herramienta) |
| e3 Conflicto por escrito | 04.4 | No toma partido · reconoce ambas posturas · propone encuentro con agenda y duración · vuelve al objetivo común | Señala a uno como culpable | Motivo del desacuerdo, días sin hablar |

### 3.3 Razonamiento lógico (`common_logic`)

| Ej. | Comp. | Indicadores | Penaliza | Variante |
| --- | --- | --- | --- | --- |
| e1 Secuencias numéricas | 01.1 | Acierto (sin IA, descontando azar) | — | **Sustituir** por series no publicadas o generadas, o retirar |
| e2 Razonamiento verbal | 01.1 | Acierto + justificación de una inválida | — | Banco de 20 silogismos; se sacan 4 al azar |
| e3 Problema estructurado | 02.2 | Asignación válida en plazo · explica el paralelismo · identifica el cuello (persona con menos disponibilidad) | Plan imposible con los días dados → contenido ≤ 30 | Disponibilidades y duraciones |

### 3.4 Idioma: inglés (`common_english`) → pasa al bloque de idiomas

| Ej. | Comp. | Indicadores | Penaliza | Variante |
| --- | --- | --- | --- | --- |
| e1 Llamada con cliente (audio) | Idioma oral | Se disculpa · recoge datos del caso · propone solución concreta · registro adecuado | Sin transcripción no se corrige (tope 60 hoy; con H1 desaparece) | Motivo de la queja |
| e2 Correo profesional | Idioma escrito | Presentación breve · tema concreto y beneficio mutuo · fecha y formato · qué aporta y qué pide · ≤ 150 palabras | — | Tipo de colaboración |
| e3 Comprensión | Idioma comprensión | Acierto (sin IA) | — | Banco de afirmaciones |

### 3.5 Toma de decisiones y juicio (`common_decisions`)

| Ej. | Comp. | Indicadores | Penaliza | Variante |
| --- | --- | --- | --- | --- |
| e1 Crisis de prioridades | 02.2 | Ordena por impacto y urgencia · decide hacer/delegar/posponer en cada una · el fallo en producción va primero o delegado con responsable · cierra antes de irse (traspaso) | Intenta hacerlo todo | Contenido de la bandeja y horas disponibles |
| e2 Dilema ético | 06.2 | Habla primero con el compañero (o justifica por qué no) · frase concreta de lo que diría · qué hace si no rectifica · no oculta el dato al consejo | Encubre o pacta silencio → criterio ético ≤ 20 | Tipo de manipulación, relación con la persona |
| e3 Decisión con datos incompletos | 01.3 | Clasificación + qué dato pediría antes de decidir | — | Factores y su peso |

### 3.6 Resolución de problemas (`common_problemsolving`)

| Ej. | Comp. | Indicadores | Penaliza | Variante |
| --- | --- | --- | --- | --- |
| e1 Cuello de botella | 05.5 | Localiza la etapa más lenta con los datos · separa causa de síntoma · soluciones por etapa con su ahorro estimado · cómo mediría el efecto | Soluciones genéricas sin cifras | Días por etapa y objetivo |
| e2 Diseñar un sistema de referidos | 05.5 | Incentivo para ambas partes · seguimiento · cuándo se activa · métricas · antifraude | Olvida el fraude → aplicabilidad ≤ 50 | Tipo de producto, margen |
| e3 Estimación rápida | 01.1 | Descompone en factores · supuestos explícitos · cálculo correcto · contraste de orden de magnitud | — | **Quitar la población de la guía**; cambiar ciudad y producto |

### 3.7 Trabajo en equipo (`common_teamwork`)

| Ej. | Comp. | Indicadores | Penaliza | Variante |
| --- | --- | --- | --- | --- |
| e1 Delegación efectiva | 03.3 | Asigna según skill y disponibilidad · explica cada asignación · detecta la persona sobrecargada · deja un punto de control | Asigna a quien no tiene disponibilidad | Personas, cargas y tareas |
| e2 Feedback constructivo | 03.2 | Trato de igual · error concreto, no general · ayuda concreta · mira al futuro | Culpa o tono superior → tono ≤ 40 | Tipo de error y quién se quejó |
| e3 Decisión grupal | 04.4 | Criterios objetivos antes de opiniones · da voz con límite de tiempo · propuesta justificada · compromiso de todos tras decidir | Decide por autoridad sin criterios | Tecnologías y plazo |

### 3.8 Creatividad e innovación aplicada (`common_creativity`)

| Ej. | Comp. | Indicadores | Penaliza | Variante |
| --- | --- | --- | --- | --- |
| e1 Ideas para retener socios | 05.4 | 5 ideas distintas entre sí · ninguna obvia (descuento, más clases) · cómo funciona cada una · **un experimento barato** para validar la mejor | Ideas obvias → contenido ≤ 40 | Sector y tasa de abandono. **Quitar las pistas de la guía** |
| e2 Campaña con 0 € | 05.4 | Plan día a día · todas las acciones sin coste real · una métrica de éxito · aprovecha lo local | Incluye gasto o anuncios | Ciudad, producto, plazo |
| e3 Rediseño de la espera | 05.4 | Parte del problema del usuario · soluciones simples y viables · prioriza una · cómo sabría que funciona | Propone cambiar el sistema médico (fuera de alcance) | Tipo de espera (hospital, administración, aeropuerto) |

### 3.9 Liderazgo (`common_leadership`)

| Ej. | Comp. | Indicadores | Penaliza | Variante |
| --- | --- | --- | --- | --- |
| e1 Conversación difícil | 03.5 | Apertura sin atacar · hechos con dato (plazos, fechas) · pregunta abierta antes de juzgar · expectativas claras · plan con plazo y seguimiento | Etiqueta a la persona («eres poco comprometido») → tono ≤ 40 | Antigüedad, n.º de plazos fallados, quién presiona |
| e2 Decisión impopular | 05.3 | Contexto honesto · reconoce el trabajo · decisión clara sin ambigüedad · qué pasa ahora · espacio para preguntas | Dorar la píldora o culpar a «arriba» | Proyecto y motivo |
| e3 Motivar en crisis | 03.1 | No minimiza · da perspectiva · plan para mañana con responsables · mensaje creíble | Promesas falsas («no pasa nada») | Pérdida (cliente, ronda, persona clave) |

### 3.10 Planificación y priorización (`common_time`)

| Ej. | Comp. | Indicadores | Penaliza | Variante |
| --- | --- | --- | --- | --- |
| e1 Bandeja del lunes | 02.2 | Clasificación + justificación de lo primero | — | Correos y hora de la reunión |
| e2 Planificación semanal | 02.2 | Bloques de trabajo profundo · reuniones fijas respetadas · qué sacrifica y a qué dice no · margen para imprevistos · cabe en la jornada | Más de 9 h al día → aplicabilidad ≤ 40 | Compromisos de la semana |
| e3 Interrupciones | 02.2 | Clasificación + cómo responde a la más delicada | — | Interrupciones y su urgencia |

### 3.11 Orientación al cliente (`common_customer`)

| Ej. | Comp. | Indicadores | Penaliza | Variante |
| --- | --- | --- | --- | --- |
| e1 Cliente enfadado | 01.4 | Reconoce sin justificarse · asume responsabilidad · solución concreta con fecha · compensación proporcionada · seguimiento | «Lo estamos mirando» sin acción | Importe, semanas, amenaza |
| e2 Decir no con elegancia | 04.5 | Valida sin ceder · reencuadra en valor · alternativa que no es descuento · cierre seguro | Cede el descuento | % pedido, margen |
| e3 Escalado de incidencias | 02.2 | Clasificación + a quién avisa | — | Tickets |

### 3.12 Negociación (`common_negotiation`)

| Ej. | Comp. | Indicadores | Penaliza | Variante |
| --- | --- | --- | --- | --- |
| e1 Negociar el salario | 04.5 | Agradece · entusiasmo creíble · dato de mercado · contraoferta concreta (cifra, no rango) · flexibilidad en otra variable | Ultimátum o pide sin dato | Oferta y rango de mercado, ciudad |
| e2 Cerrar un acuerdo B2B | 04.5 | Reconoce el momento · cuantifica el coste de esperar · reduce el riesgo (piloto, cancelación) · próximo paso con fecha | Presión agresiva | Precio, objeción, mes |
| e3 Proveedor que sube precio | 04.5 | Clasificación + su primera jugada | — | % de subida, coste de migrar |

### 3.13 Excel y datos (`common_excel`) → pasa a Hard («Análisis de datos en hoja de cálculo»)

| Ej. | Comp. | Indicadores | Penaliza | Variante |
| --- | --- | --- | --- | --- |
| e1 Análisis de ventas | Hard | Mejor y peor con criterio explícito (no solo ventas totales) · patrón · acción | Conclusión con una sola métrica | Datos de la tabla |
| e2 Panel de 5 métricas | Hard | 5 métricas con fórmula · por qué cada una · gráfico adecuado · frecuencia | Métricas de vanidad | Tipo de negocio |
| e3 Fórmulas | Hard | Clasificación | — | Banco de tareas |

### 3.14 Pensamiento estratégico (`common_strategy`)

| Ej. | Comp. | Indicadores | Penaliza | Variante |
| --- | --- | --- | --- | --- |
| e1 Análisis competitivo | 01.2 | Lee la tabla de competidores · hueco claro · a qué renuncia · primer paso | Copia a un competidor | Mercado, ciudad y competidores (ficticios) |
| e2 Oportunidad o trampa | 01.2 | Clasificación + justificación de la más dudosa | — | Banco de oportunidades |
| e3 Cambio de rumbo | 01.2 | Parte de los datos de uso · opción elegida y modelo de ingresos · qué abandona · cómo lo valida en 30 días | Decide sin mirar los datos | Usuarios, ingresos, función estrella |

## 4. Fichas nuevas (ola 1 del doc 06)

| Reto nuevo | Comp. | Ejercicios (formato) | Indicadores clave |
| --- | --- | --- | --- |
| **Escucha activa** | 04.2 | e1 Simulación con una persona preocupada por un cambio (texto, 8 turnos) · e2 Resumir en 5 líneas lo que pide un cliente en un mensaje largo y desordenado · e3 Clasificar respuestas como «escucha» o «no escucha» | Pregunta antes de proponer · reformula · detecta la preocupación de fondo · no promete lo que no puede |
| **Responsabilidad** | 02.3 | e1 Correo a tu responsable: se te pasó un plazo que afecta a un cliente · e2 Juicio situacional: incidencia heredada · e3 CAR breve | Reconoce sin excusas · avisa a tiempo · propone arreglo · aprende algo concreto |
| **Adaptabilidad** | 05.1 | e1 Caso con giro: a mitad del reto cambia el requisito principal · e2 Reorganizar un plan tras perder a una persona · e3 Clasificación | Replantea sin perder el objetivo · explica qué cambia y qué mantiene |
| **Resiliencia** | 06.3 | e1 Rechazo de un cliente clave: qué haces el día siguiente · e2 Semana con tres contratiempos · e3 CAR breve | Prioriza · pide apoyo · recupera el ritmo · sin dramatizar ni negar |
| **Integridad** | 06.2 | e1 Presión para presentar una métrica engañosa · e2 Conflicto de interés · e3 Clasificación de situaciones | Declara · protege la confidencialidad · sostiene el límite · documenta |
| **IA en el trabajo** | 05.6 | Los tres del doc 02, §5 | Verifica · protege datos · documenta |

## 5. Cómo se hace el resto (267 ejercicios de área)

1. Orden por demanda real: primero las áreas de las ofertas publicadas en Supabase y de los Eventos Impact; luego el resto.
2. Por cada reto: ficha completa, variante, y revisión de un profesional del área (red de expertos del doc 02).
3. Objetivo realista: 2–3 retos por semana. Con 10 retos priorizados en un mes se cubren las áreas que más se piden.
4. El inventario [`09b_inventario_ejercicios.md`](09b_inventario_ejercicios.md) se actualiza al cerrar cada ficha.

## 6. Decisiones para el equipo

- [ ] ¿Validamos con la asesora los indicadores de las tablas del §3?
- [ ] ¿Retiramos las secuencias numéricas?
- [ ] ¿Quitamos de las guías las pistas que dan la respuesta?
- [ ] ¿Escribimos primero los 6 retos nuevos de la ola 1?
