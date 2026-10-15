# Estrategia: qué hacer después del corto plazo

Documento de trabajo para Xagri e Iván (15/10/2026). El `03_corto_plazo_rrhh_y_personas.md` cubre las pantallas que pedía RRHH, y está hecho en código. Este documento recoge las decisiones de fondo: qué sabemos del usuario, por qué nos creerían una nota, cómo conseguimos candidatos y empresas a la vez, y cómo cobramos.

Cada línea indica **qué**, **por qué**, **cómo** y **qué hay que decidir**. Al final hay una tabla de prioridades.

---

## 1. Perfil de trabajo al iniciar sesión (el «test inicial»)

### La pregunta

¿Le hacemos al usuario un test al entrar, para saber cómo trabaja y ajustar lo que le mostramos?

### Respuesta corta

**Sí, pero no un test de personalidad.** Proponemos un *perfil de trabajo* de unos 4 minutos que distingue entre lo que el candidato **declara** (sus condiciones y el contexto en el que prefiere trabajar) y lo que **demuestra** (un primer reto corto). Lo declarado ayuda a encontrar ofertas compatibles y no puntúa. Lo que puntúa es solo lo demostrado.

### Por qué no un test de personalidad

1. **Ya lo decidimos.** Con la asesora en mente acordamos que no habría «test de virtudes ni de personalidad» (ver `00_contexto_reunion.md`). Nuestra frase es *ordenamos evidencia; la entrevista la hacéis vosotros*.
2. **Se puede maquillar.** En un proceso de selección, cualquiera contesta lo que cree que la empresa quiere oír. Un cuestionario de rasgos rellenado por el propio candidato aporta poco frente a un ejercicio real del puesto, que es justo lo que nos diferencia.
3. **Regulación.** El Reglamento europeo de IA considera de **alto riesgo** los sistemas que se usan para seleccionar o evaluar candidatos (anexo III, punto 4). Inferir rasgos de personalidad añade obligaciones y riesgo de sesgo. Además, el reconocimiento de emociones en el trabajo está **prohibido** (art. 5). Nuestra cámara ya no infiere emociones, y así debe seguir.
4. **Discriminación indirecta.** Algunas preguntas de «disponibilidad» o de «estilo» funcionan como sustitutos de características protegidas, como tener personas a cargo, la edad o la salud.

### Propuesta: perfil de trabajo en 3 bloques

| Bloque | Qué es | Cómo se usa | ¿Puntúa? |
| --- | --- | --- | --- |
| **A. Condiciones** | Jornada, modalidad, ciudad y si acepta mudarse, disponibilidad, horas y salario mínimo. **Ya existe**, pero escondido en Ajustes: se mueve al primer inicio. | Filtro duro que decide el propio candidato y chips en la ficha anónima (1B/1C). | No |
| **B. Contexto preferido** | De 6 a 8 preguntas de **elección forzada entre dos situaciones de trabajo**, no entre adjetivos. Ejemplo: «tareas definidas con un criterio claro» frente a «problemas abiertos que tengo que acotar». | Etiquetas informativas («Prefiere: autonomía, ritmo estable») y, más adelante, encaje de contexto con lo que responde la empresa sobre el puesto. | No. Ninguna respuesta es mejor que otra |
| **C. Reto de arranque** | Un reto corto (unos 10 min) del bloque Personas, por ejemplo priorizar una bandeja de entrada con conflictos. | Primera nota real: el candidato entra en el pool desde el primer día. | Sí, como cualquier reto |

**Ejes del bloque B** (borrador para validar con la asesora):

- Estructura frente a ambigüedad
- Autonomía frente a acompañamiento cercano
- Ritmo estable frente a picos y urgencias
- Equipo pequeño frente a organización grande
- Trabajo de foco individual frente a coordinación constante
- Mucho contacto con cliente frente a poco

**Espejo para la empresa.** Al publicar una oferta, la empresa contesta los mismos ejes **sobre el puesto**, no sobre la persona que busca. Así obtenemos un *encaje de contexto* que se puede explicar: «El puesto tiene picos de urgencia; el candidato prefiere ritmo estable».

### Reglas para que no se convierta en un filtro injusto

- El bloque B **nunca descarta automáticamente** ni ordena el pool al principio. Empieza como información visible.
- Solo se le da peso en el encaje (por ejemplo, un 10 %) **si los datos muestran** que predice algo: entrevistas concedidas o contrataciones que salen bien.
- El candidato puede editar o ocultar el bloque B cuando quiera. Se le explica para qué sirve antes de contestar.
- Nada de preguntas sobre salud, familia, edad o vida personal. La disponibilidad se pregunta en horarios y días, nunca por sus motivos.
- Se puede saltar: un usuario que solo quiere mirar no se queda bloqueado.

### Cómo encaja en el producto actual

- Hoy, el primer inicio solo muestra una barra de «Completa tu perfil» (registro, sector, retos). El perfil de trabajo sustituiría los dos primeros pasos por los bloques A, B y C.
- Las condiciones ya se guardan en `profiles.empleo`. El bloque B necesita un campo nuevo (`contexto`, jsonb) y su espejo en `jobs`.
- Esfuerzo orientativo: 1 semana para A y C (reutilizan lo que existe) y 1 semana para B con el espejo de la empresa.

### Cómo sabremos si funciona

- Porcentaje de nuevos usuarios que acaban el perfil de trabajo (objetivo inicial: más del 60 %).
- Tiempo entre el registro y el primer reto (hoy no se mide).
- Porcentaje de candidatos que reciben al menos un desbloqueo, comparando a quienes rellenaron el bloque B con quienes no.

### Hay que decidir

- [ ] ¿Validamos los ejes del bloque B con la asesora antes de construir? **Recomendado: sí.** Es una buena pregunta para la reunión: «¿Qué os gustaría saber del contexto en el que rinde alguien?».
- [ ] ¿Reto de arranque obligatorio para aparecer en el pool, o solo recomendado?

---

## 2. Que la nota sea creíble

Si la empresa no se cree la nota, no paga 49 €. Hoy hay tres puntos débiles.

| Problema actual | Por qué importa | Propuesta |
| --- | --- | --- |
| **Reintentos ilimitados y gana la mejor nota.** El pool guarda la nota más alta de cada skill y los retos tienen contenido fijo. | Repitiendo, cualquiera aprende el ejercicio. La nota acaba midiendo práctica, no competencia. | Un plazo de espera entre intentos (por ejemplo, 30 días), mostrar a la empresa el número de intentos y, a medio plazo, varias **variantes** de cada reto. |
| **La nota global es la media de las 6 mejores skills.** | Un candidato con 1 reto a 95 supera a otro con 6 retos a 85. Premia hacer pocos retos y ordena mal el ranking y el pool. | Dejar de mostrar una cifra única. Enseñar **tres notas por bloque** (Personas, Cognitivo, Técnico) con el número de retos, o corregir la media cuando hay pocos retos (que tienda a la media general hasta tener evidencia suficiente). |
| **La corrección de la IA no se calibra.** | La IA corrige con rúbrica, pero no sabemos cuánto coincide con una persona de RRHH. | Que una persona corrija también una muestra de un 5–10 % de los retos y medir el acuerdo. Si una competencia baja de un umbral, revisión humana obligatoria. Encaja con la «revisión humana» de los eventos Impact. |

Otras dos medidas:

- **Caducidad.** Una nota de hace dos años dice poco. Propuesta: las notas pierden la marca de «reciente» a los 12 meses y el SkillPass muestra la fecha.
- **Revisión a petición del candidato.** Ya existe como correo (`tpPedirRevision`). Hay que convertirlo en un flujo con estado y plazo de respuesta, porque el Reglamento de IA y el RGPD (art. 22) piden intervención humana en las decisiones automatizadas.

**Hay que decidir:** el plazo entre intentos (recomendado: 30 días) y si quitamos la cifra única de la ficha.

---

## 3. Identidad y confianza en los dos lados

| Riesgo | Hoy | Propuesta |
| --- | --- | --- |
| Registrarse con un correo ajeno | `mailer_autoconfirm` activo: no se confirma el email. | Exigir confirmación del email. Es un cambio en Supabase. |
| Una persona con varias cuentas para «probar» retos | Nada lo impide. | Un perfil por email confirmado y, más adelante, verificación ligera (por ejemplo, el teléfono) para aparecer en el pool. |
| Empresas falsas mirando el pool | Cualquier usuario con sesión puede ver el pool anónimo, con ciudad y salario mínimo. Incluidos los candidatos. | El pool solo para **empresas verificadas** (dominio corporativo o CIF). Los candidatos solo ven su posición en el ranking. |
| El rol se guarda en `user_metadata`, que el propio usuario puede editar | Hoy no da acceso a nada sensible: el servidor comprueba siempre la propiedad de las ofertas. | Pasarlo a `app_metadata` (solo lo escribe el servidor) antes de que el rol abra permisos de verdad. |
| Alias anónimo de 4 caracteres (`Candidato #AB12`) | Solo hay 65.536 combinaciones. Con unos 300 candidatos ya es probable que dos compartan alias. | Alias de 6 caracteres o con sufijo. Es un cambio pequeño en `anonymousAlias` (servidor) y `TPRanking.miAlias` (cliente). |

---

## 4. Cumplimiento como argumento de venta

Para una empresa que contrata, usar IA en selección le traslada obligaciones a ella. Si TalentPact las resuelve, es un motivo para comprar, no solo un coste.

Lo que ya tenemos:

- Motivo obligatorio y registrado al descartar.
- Integridad visible que nunca descarta sola.
- Avisos al candidato que no revelan a la empresa.
- Anonimato hasta el pago.
- Consentimiento para ser contactado que se puede retirar.

Lo que falta:

1. **Hoja de transparencia** para el candidato: qué se evalúa, cómo corrige la IA, qué ve la empresa y cómo pedir revisión humana.
2. **Evaluación de impacto (EIPD/DPIA)** y política de conservación: cuánto tiempo guardamos respuestas, grabaciones y notas.
3. **Registro de decisiones** exportable por oferta, para que la empresa demuestre trazabilidad.
4. **Calendario.** Las obligaciones de alto riesgo del anexo III estaban previstas para agosto de 2026. Hay que comprobar si se ha aprobado el aplazamiento que propuso la Comisión y fijar nuestra fecha objetivo.

---

## 5. Conseguir candidatos y empresas a la vez

Un marketplace vacío no convence a ninguno de los dos lados. Propuesta para salir del «huevo y la gallina»:

- **Un nicho primero:** un sector y una ciudad (por ejemplo, perfiles de RRHH y administración en una ciudad concreta) antes que todo a la vez. La meta que lo mide: que cada oferta tenga al menos 5 candidatos que encajan.
- **Eventos Impact como canal de entrada** (ver `docs/conversacion/05_…`). El evento atrae candidatos y empresas el mismo día, y los retos de inscripción llenan el pool.
- **Candidatos:** acuerdos con universidades, másteres y bootcamps. El SkillPass les sirve aunque no los contraten («demuestra lo que sabes hacer»).
- **Empresas:** primera oferta con acompañamiento y primer desbloqueo sin coste o reembolsable si el candidato no responde.
- **Las ofertas de ejemplo del seed** van en contra de esta estrategia: ver un mercado inventado resta confianza. Hay que decidir si se quitan antes de la reunión.

---

## 6. Modelo de ingresos

Hoy cobramos 49 € por desbloqueo y hay un plan Pro y uno Enterprise que se gestionan hablando con nosotros.

Preguntas para la asesora (no lo cerramos sin ella):

- ¿Paga antes una empresa por **contacto** (49 €), por **suscripción** (búsquedas ilimitadas y pipeline) o por **contratación** (porcentaje del salario, como una agencia)?
- ¿Se puede vender el **paquete de cumplimiento** (registro de decisiones, transparencia, revisión humana) aparte o como argumento del plan Pro?
- ¿Tienen sentido los **retos a medida** como servicio de pago? Hoy la web promete «te escribimos en 24 h» si se piden: ¿quién cumple esa promesa y en qué plazo real?

---

## 7. Medir

Sin datos no se puede decidir nada de lo anterior. Proponemos seis métricas, visibles en el backoffice:

1. Registro → primer reto (porcentaje y tiempo).
2. Candidatos visibles en el pool con al menos 3 retos.
3. Ofertas publicadas con al menos 5 candidatos que encajan.
4. Ofertas con al menos 1 desbloqueo.
5. Desbloqueo → entrevista (preguntándolo a la empresa en el pipeline).
6. Entrevista → contratación.

---

## 8. Otras mejoras con impacto

- **Email real** de los avisos (desbloqueo, etapa, postulación). Hoy solo hay bandeja dentro de la web y el FAQ promete un aviso. Necesita un proveedor (Resend o SMTP) y su clave.
- **Feedback útil al candidato descartado**: sin el motivo de la empresa (eso se decidió así), pero con la nota por criterio y un «siguiente reto recomendado». Hace que vuelva a la plataforma.
- **Accesibilidad e inclusión**: tiempo extra a petición en los retos cronometrados, compatibilidad con lector de pantalla y retos en inglés.
- **Catálogo desequilibrado**: hay 103 retos, de los que **solo 7 son de Personas y equipo** (más 7 cognitivos y 89 de sector). El bloque que más pide RRHH, y que ahora mostramos primero, es el más pequeño. Prioridad de contenido: llevar Personas a 15–20 retos (al menos 2 o 3 por competencia: liderazgo, equipo, tiempo, comunicación, decisiones, negociación y atención al cliente) antes de añadir más retos de sector. Después, rotar variantes (ver la sección 2).

---

## Prioridades propuestas

| Prioridad | Línea | Esfuerzo | Depende de |
| --- | --- | --- | --- |
| 1 | Confirmar email, pool solo para empresas verificadas, alias más largo | Bajo | Supabase y una decisión del equipo |
| 1 | Plazo entre intentos y número de intentos visible | Bajo | Decisión del plazo |
| 1 | Perfil de trabajo: bloques A y C | 1 semana | — |
| 1 | Más retos de Personas y equipo (de 7 a 15–20) | 2–3 semanas | Contenido; validar con la asesora |
| 2 | Notas por bloque en vez de una cifra única | 1 semana | Decisión |
| 2 | Bloque B y su espejo en la empresa | 1 semana | Validar los ejes con la asesora |
| 2 | Email real de los avisos | 2–3 días | Clave del proveedor |
| 2 | Métricas en el backoffice | 3–4 días | — |
| 3 | Calibración con correctores humanos | Continuo | Personas de RRHH que corrijan |
| 3 | Hoja de transparencia, DPIA y registro exportable | 1–2 semanas | Revisión legal |
| 3 | Variantes de retos | Continuo | Contenido |

Relación con otros documentos:
- `03_corto_plazo_rrhh_y_personas.md`: lo que ya está hecho.
- `05_errores_y_mejoras.md`: errores encontrados y lo que queda abierto.
- `00_contexto_reunion.md`: preguntas para la asesora.
