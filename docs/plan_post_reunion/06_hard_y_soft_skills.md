# 06 · Hard y soft skills: cómo mejorarlo

Tarea de la reunión: «Acabar de enfocar el tema hard y soft skills».
Fuentes: `TalentPact_Diccionario_Competencias.docx` (v2.0: 6 dimensiones, 32 competencias, anclajes 1/3/5), `TalentPact_Diccionario_Exclusivo_AI_Hard_Skills.docx` (v4.0) y la decisión del 15/10 de los **tres pilares** (Hard · Soft · Transferibles), ya en código (`19-rrhh.js`, `personas.js`).

---

## 1. Diagnóstico

1. **Dos vocabularios a la vez.** El código usa 14 nombres del catálogo antiguo («Trabajo en Equipo», «Gestión del Tiempo») y el doc 08 añadió otros («Inteligencia emocional», «Proactividad»). El diccionario nuevo tiene 32 competencias con definición y anclajes. Hay que elegir uno como **canónico**: el diccionario.
2. **Cobertura baja.** De las 32 competencias del diccionario, el catálogo actual mide de verdad unas 12. Faltan algunas que más pide una empresa (escucha activa, responsabilidad, adaptabilidad, resiliencia, integridad).
3. **Mezcla de herramientas y competencias.** «Excel y Datos» e «Inglés» están entre las soft skills; ya se movieron a Hard en la interfaz, pero el catálogo del servidor sigue con `category: "soft"`.
4. **La nota de una skill sale de un solo reto** y no distingue «no observado» de «observado y flojo».

## 2. Los tres pilares, alineados con el diccionario

| Pilar visible | Dimensiones del diccionario | Por qué aquí |
| --- | --- | --- |
| **Soft skills** (cómo es con las personas y consigo mismo) | 03 Liderazgo de personas · 04 Influencia, colaboración y relaciones · 06 Autoliderazgo e integridad | Es lo que la asesora llamó «cómo es con personas»: lo primero que pregunta una empresa después de las condiciones. |
| **Transferibles** (cómo piensa y cómo ejecuta, en cualquier puesto) | 01 Pensamiento estratégico y criterio · 02 Ejecución y resultados · 05 Transformación, innovación y adaptabilidad | Viajan de un sector a otro: un analista y un jefe de obra priorizan igual. |
| **Hard skills** (lo del oficio) | Por área funcional (doc 01) + rama IA (doc 02) + idiomas + herramientas | Se miden con trabajo real del puesto. |

### 2.1 Las 32 competencias y lo que ya tenemos

| Código | Competencia (nombre canónico) | Pilar | Reto actual que la mide | Estado |
| --- | --- | --- | --- | --- |
| 01.1 | Pensamiento analítico y crítico | Transferibles | Pensamiento Analítico; Razonamiento Lógico (parte) | Cubierta |
| 01.2 | Pensamiento estratégico | Transferibles | Pensamiento Estratégico | Cubierta |
| 01.3 | Toma de decisiones y juicio | Transferibles | Toma de Decisiones | Cubierta |
| 01.4 | Visión de negocio y orientación al cliente | Transferibles | Atención al Cliente (parte) | Parcial |
| 01.5 | Gestión de la complejidad y ambigüedad | Transferibles | — | **Falta** |
| 02.1 | Orientación a resultados | Transferibles | — | **Falta** |
| 02.2 | Planificación y priorización | Transferibles | Gestión del Tiempo | Cubierta |
| 02.3 | Responsabilidad y autonomía | Transferibles | — | **Falta** |
| 02.4 | Iniciativa y proactividad | Transferibles | — | **Falta** |
| 02.5 | Mejora continua y calidad | Transferibles | Resolución de Problemas (Cuello de botella, parte) | Parcial |
| 03.1 | Inspiración y movilización | Soft | Liderazgo (Motivar en crisis) | Parcial |
| 03.2 | Desarrollo del talento y feedback | Soft | Trabajo en Equipo (Feedback constructivo) | Parcial |
| 03.3 | Delegación y empoderamiento | Soft | Trabajo en Equipo (Delegación efectiva) | Parcial |
| 03.4 | Construcción de equipos inclusivos | Soft | — | **Falta** |
| 03.5 | Gestión del desempeño y conversaciones difíciles | Soft | Liderazgo (Conversación difícil) | Parcial |
| 04.1 | Comunicación clara y adaptativa | Soft | Comunicación Escrita | Cubierta |
| 04.2 | Escucha activa y empatía | Soft | — | **Falta** |
| 04.3 | Influencia sin autoridad | Soft | Comunicación Escrita (Email persuasivo) | Parcial |
| 04.4 | Colaboración transversal | Soft | Trabajo en Equipo (Decisión grupal) | Parcial |
| 04.5 | Negociación y resolución de desacuerdos | Soft | Negociación | Cubierta |
| 04.6 | Construcción de relaciones y confianza | Soft | — | **Falta** |
| 05.1 | Adaptabilidad | Transferibles | — | **Falta** |
| 05.2 | Aprendizaje continuo | Transferibles | — | **Falta** |
| 05.3 | Liderazgo del cambio | Transferibles | Liderazgo (Decisión impopular, parte) | Parcial |
| 05.4 | Creatividad e innovación aplicada | Transferibles | Creatividad | Cubierta |
| 05.5 | Resolución de problemas | Transferibles | Resolución de Problemas | Cubierta |
| 05.6 | Criterio digital y uso responsable de IA | Transferibles | — | **Falta** (doc 02, «IA en el trabajo») |
| 06.1 | Autoconocimiento y apertura al feedback | Soft | — | **Falta** |
| 06.2 | Integridad y criterio ético | Soft | Toma de Decisiones (Dilema ético) | Parcial |
| 06.3 | Resiliencia y autorregulación | Soft | — | **Falta** |
| 06.4 | Curiosidad intelectual | Soft | — | **Falta** |
| 06.5 | Determinación y perseverancia inteligente | Soft | — | **Falta** |

Resumen: **8 cubiertas, 10 parciales, 14 sin reto.** Pasan a Hard: «Excel y Datos» (herramienta) e «Inglés (Speaking)» (idiomas).

Los nombres del doc 08 se mantienen como **alias** para no romper ofertas ya publicadas: «Escucha» → 04.2 · «Inteligencia emocional» → 04.2 + 06.3 · «Resiliencia» → 06.3 · «Gestión de la incertidumbre» → 01.5 · «Proactividad», «Iniciativa» → 02.4 · «Responsabilidad personal» → 02.3 · «Pensamiento lateral» → 05.4 · «Agilidad de aprendizaje» → 05.2 · «Trabajo en equipo» → 04.4.

## 3. Prioridad para completar el catálogo

No hace falta tener las 32 a la vez; el propio diccionario recomienda empezar con 6–8 y 2–3 familias de puestos. Orden propuesto (por lo que pide una empresa y lo que dijo la asesora):

| Ola | Competencias nuevas | Motivo |
| --- | --- | --- |
| 1 | 04.2 Escucha activa · 02.3 Responsabilidad · 05.1 Adaptabilidad · 06.3 Resiliencia · 06.2 Integridad (reto propio) · 05.6 Criterio digital | Las más pedidas en puestos junior y de atención a personas; ya estaban en pendientes. |
| 2 | 02.1 Resultados · 02.4 Iniciativa · 01.5 Ambigüedad · 04.3 Influencia (reto propio) · 03.2 Feedback (reto propio) | Puestos con autonomía y de coordinación. |
| 3 | 03.1, 03.3, 03.4, 03.5, 05.3 como **reto de liderazgo completo** · 04.6 · 06.1 · 06.4 · 06.5 · 02.5 · 05.2 | Mandos y perfiles sénior. |

Cada reto nuevo se escribe con la ficha del doc 09 y sus indicadores los revisa la asesora.

## 4. Formatos: no todo se mide con un correo

Hoy el 40 % de los ejercicios son correos. El diccionario (§3.2) dice qué formato sirve para qué. Propuesta de formatos nuevos:

| Formato | Para qué competencias | Cómo funciona | Límite |
| --- | --- | --- | --- |
| **Juicio situacional** (ya existe como «decisión») | 01.3, 02.2, 06.2 | Elegir y ordenar opciones + justificar la primera (H2 del corrector). | Mide criterio, no ejecución. |
| **Simulación conversacional** (nuevo) | 04.2 Escucha, 04.5 Negociación, 03.5 Conversación difícil, 01.4 Cliente | Una IA hace de cliente, compañero o colaborador con un guion fijo y objetivos ocultos (p. ej. el cliente solo se calma si se le pregunta por su caso). El candidato conversa 6–10 turnos por texto o voz. Se corrige la transcripción. | Escenarios equivalentes y guion cerrado para que todos tengan la misma prueba. |
| **Bandeja de entrada** | 02.2, 01.5, 02.1 | 8–10 mensajes que llegan durante el reto, alguno a mitad (cambio de requisitos). | Más tiempo de diseño. |
| **Caso con giro** | 05.1 Adaptabilidad, 01.5 | A mitad del reto cambia un dato; se mide cómo replantea. | — |
| **CAR estructurado** (situación, acción, resultado) | 06.1, 06.3, 06.5, 05.2 | Pregunta sobre una experiencia pasada con repreguntas fijas. | Es autorreporte: **pesa menos** y nunca va solo; necesita otra evidencia. |
| **Trabajo real del puesto** | Hard skills | El entregable que haría en su primera semana. | — |

Lo que **no** hacemos: tests de personalidad, inferir emociones por cámara o voz (prohibido en el trabajo por el Reglamento de IA), puntuar la fluidez, el acento, el estilo o la longitud.

## 5. Paquetes por perfil (para sugerir skills en la oferta, doc 01)

Del diccionario §3.4, con el pilar indicado:

| Perfil | Soft | Transferibles |
| --- | --- | --- |
| Prácticas / junior | 04.1 Comunicación · 04.4 Colaboración | 05.2 Aprendizaje · 02.3 Responsabilidad · 05.1 Adaptabilidad · 01.1 Analítico |
| Especialista | 04.4 Colaboración | 01.1 · 05.5 · 02.1 · 02.2 · 05.6 |
| Project / product manager | 04.3 Influencia · 04.5 Negociación · 04.1 | 02.2 · 01.5 · 02.1 |
| Mando de equipo | 03.2 · 03.3 · 03.5 · 03.4 | 02.1 · 05.3 |
| Dirección | 03.1 · 04.3 · 06.2 | 01.2 · 01.3 · 01.5 · 05.3 |
| Comercial / cliente | 04.1 · 04.5 · 04.6 · 06.3 | 01.4 · 02.1 |

A estos se suman 2–4 hard skills del área. El pack se propone marcado; la empresa quita o añade (máx. 8).

## 6. Hard skills: estructura

- Cada hard skill pertenece a un **área** y una **especialidad** (doc 01) y tiene niveles 1–5 con anclajes, como el diccionario de IA.
- **Herramientas como contexto, no como skill** (principio del diccionario de IA): no se certifica «Excel», se certifica «Análisis de datos en hoja de cálculo», y la herramienta usada queda como etiqueta. Igual con Power BI, Figma, SAP… La empresa puede filtrar por herramienta, pero la nota es de la competencia.
- **Idiomas**: bloque propio con nivel MCER (A2–C1) por destreza (escrita, comprensión, oral). Para no prometer de más: «nivel demostrado en el reto», no «certificado oficial».
- Formatos por área: Finanzas (hoja con errores que detectar, conciliación), Marketing (plan con presupuesto y métricas), Jurídico (revisión de una cláusula), Operaciones (diagnóstico de un proceso con datos), RR. HH. (análisis de un caso de selección), Tecnología (código, doc 02 fase 2).

## 7. Cómo se calcula la nota de una competencia

Hoy: la mejor nota del reto y la media de las 6 mejores en el perfil. Propuesta, alineada con las reglas del diccionario (§3.3):

1. **Al menos dos evidencias independientes** para mostrarla como «verificada» (cada reto tiene 3 ejercicios: se cumple con terminar el reto).
2. **Nota de competencia** = media ponderada de sus ejercicios por fiabilidad del formato (trabajo real y simulación 1,0 · juicio situacional 0,8 · CAR 0,5).
3. **Confianza** visible para la empresa: Alta (≥ 2 formatos distintos, integridad estándar o superior, o revisión humana) · Media · Baja.
4. **NE ≠ 1**: si no hay evidencia, la competencia no aparece; nunca cuenta como un 0 en el encaje (hoy una skill sin nota cuenta como no cumplida, lo que es correcto para el encaje, pero no debe mostrarse como «débil» en la ficha).
5. **Caducidad a 12 meses** (ya propuesto en `04_estrategia.md`).
6. **Por pilar, no media global**: en la ficha, tres bloques (Soft · Transferibles · Hard) en vez de una media de las 6 mejores.

**Liderazgo y potencial** (diccionario §4): el liderazgo se enseña como el conjunto de sus competencias (03.x, 04.3, 05.3), no como una nota. **Nunca** se etiqueta a nadie como «alto o bajo potencial».

## 8. Cambios técnicos

| Cambio | Detalle |
| --- | --- |
| Catálogo | Campo `competencias: ["04.2", …]` por ejercicio (no por reto) y `pilar`. Pasar `common_excel` y `common_english` a `category: "hard"`. |
| Taxonomía | Las 32 competencias + 24 de IA en `taxonomy_terms` (doc 07), con código, definición, anclajes y alias. Un único origen para `19-rrhh.js` y `personas.js`. |
| Notas | Tabla `competency_scores` (perfil, competencia, nota, confianza, n.º evidencias, válida hasta). Se recalcula al guardar cada evaluación. |
| Encaje | `60·S` usa la nota de competencia y su confianza (confianza baja cuenta la mitad). |
| Interfaz | Ficha del candidato en tres bloques con banda y confianza; en el pool, filtro por pilar. |

## 9. Decisiones para el equipo

- [ ] ¿Diccionario v2.0 como vocabulario canónico, con los nombres antiguos como alias?
- [ ] ¿Ola 1 de retos nuevos tal como está en §3?
- [ ] ¿Probamos la simulación conversacional con «Cliente enfadado» y «Escucha activa»?
- [ ] ¿«Verificada» solo con dos evidencias?
