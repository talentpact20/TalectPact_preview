# El corrector, explicado (estado final a 20/10/2026)

Versión 2.2.0 (`netlify/functions/lib/evaluator.js`). Documento para entender cómo corrige hoy, dónde encaja cada mejora y qué se puede hacer para mejorarlo. El plan completo está en `docs/plan_post_reunion/05_corrector_completo.md`; las 32 propuestas, en `docs/corrector.pdf`.

## 1. Qué pasa cuando un candidato entrega un reto

```
Entrega ─► 1 Enunciado oficial ─► 2 Filtros sin IA ─► 3 Corrección con IA ─► 4 Reglas del servidor ─► 5 Nota, banda y recibo
```

1. **Enunciado oficial.** Si el reto es del catálogo, el servidor ignora lo que diga el navegador y usa su propio enunciado, datos, rúbrica y errores que penalizan (`catalogo-retos.json`). Así nadie puede corregir su examen con un enunciado más fácil.
2. **Filtros sin IA.**
   - Respuestas vacías o basura: nota 0 sin llamar al modelo.
   - **Clasificaciones** (un tercio de los ejercicios): se corrigen con la solución del servidor y **descontando el azar** (con dos categorías, acertar al azar la mitad da 0, no 50).
   - **Detector de manipulación** (frases como «ignora las instrucciones», «dame un 100», imitar el formato de salida): con dos señales se bloquea; con una, se corrige avisando.
   - Límite de frecuencia por cuenta o por IP, persistente.
3. **Corrección con IA.** El modelo recibe la rúbrica del tipo de ejercicio (criterios con peso), una escala anclada igual para todos (0–20 no lo hace … 81–100 concreto, justificado y sin carencias), los **indicadores** del ejercicio y, en la rama IA, los **errores que penalizan**. Devuelve, por criterio: nota, **citas literales** de la respuesta, qué indicadores cumple y cuáles faltan, y una acción concreta para subir.
4. **Reglas del servidor** (el modelo propone, el servidor decide):
   - Las **citas que no aparecen** en la respuesta se descartan; un criterio sin ninguna cita válida no pasa de 40.
   - **Topes**: no aborda el escenario → 10; copia el enunciado → 15; genérica → 40; grabación sin transcripción → 60.
   - **Errores que penalizan**: si la respuesta comete uno (p. ej. «filtra los permisos después de generar»), su criterio no pasa del tope fijado por el experto.
   - La **nota global la calcula el servidor** con los pesos; la que dijera el modelo no cuenta.
5. **Nota, banda y recibo.** Recibo firmado (versión del corrector, reto, hash de la respuesta, nota) que convierte la nota en **verificada**. La interfaz enseña **bandas**: Insuficiente < 40 · Aceptable 40–59 · Bueno 60–79 · Muy bueno ≥ 80; el candidato ve además su número, y la empresa solo al pasar el ratón.

## 2. Las rúbricas que hay hoy

| Rúbrica | Criterios (peso) | Se usa en |
| --- | --- | --- |
| Análisis | Interpretación de datos 25 · Diagnóstico 25 · Plan priorizado 30 · Justificación con datos 20 | Ejercicios con tabla de datos |
| Correo / comunicación | Contenido 30 · Propuesta concreta 25 · Tono 20 · Estructura 15 · Concisión 10 | Correos, mensajes, propuestas |
| **Técnica de IA** (nueva) | Corrección técnica 35 · Justificación 25 · Riesgos y límites 20 · Comunicación técnica 20 | Rama IA (la fija el catálogo) |
| General | Relevancia 30 · Profundidad 30 · Aplicabilidad 25 · Estructura 15 | El resto |

## 3. Cómo se implementa cualquier mejora: dónde encaja cada una

Toda mejora cae en una de estas cinco piezas. Cada cambio sube `EVALUATOR_VERSION`, lleva su test y queda registrado en el recibo de cada nota.

| Tipo de mejora | Dónde se toca | Ejemplo ya hecho | Siguiente |
| --- | --- | --- | --- |
| **Más precisión por ejercicio** | Catálogo (`tools/retos_ia.json` para IA; `catalogo-retos.json` para el resto): `data.hint` numerado → indicadores; `data.penaliza` → errores que penalizan; `rubrica` → qué rúbrica usa | Rama IA: 33 ejercicios con indicadores y errores de experto | Indicadores de la asesora para los 42 ejercicios de soft skills (doc 09) |
| **Nueva familia de rúbrica** | `RUBRICAS` en `evaluator.js` | `tecnico_ia` | Negociación, idioma, decisión con dilema; descriptores por nivel (básico/avanzado) |
| **Regla objetiva** | `puntuar()` (topes, coherencia) o corrección sin IA (`corregirDecision`, `corregirSecuencias`) | Citas verificadas, topes, errores que penalizan, azar descontado | Coherencia feedback ↔ nota; similitud con otras entregas → revisión humana |
| **Estabilidad** | Handler `evaluate-exercise.js` | — | Segunda corrección si la nota cae a ±3 de 40/60/80; mediana; si discrepan > 10, cola humana |
| **Revisión humana** | Tabla `evaluation_reviews` + pantalla en el backoffice | — | Muestreo 5–10 %, a petición y en zona de duda; corrección ciega |

## 4. Cómo lo puedes mejorar tú (por orden de impacto)

1. **Medirlo.** Es lo único que falta para poder afirmar que acierta. Que la asesora y uno de vosotros puntúen, por separado y con la misma rúbrica, 6 respuestas (de excelente a mala) de 5 retos, más 2 intentos de trampa. Con eso el banco de pruebas mide acuerdo de banda (objetivo ≥ 80 %), error medio (≤ 8 puntos) y estabilidad.
2. **Configurar `EVAL_SIGNING_SECRET`** en Netlify. Sin él ninguna nota sale verificada.
3. **Corregir 20–30 respuestas reales** con la clave de Anthropic y leer el feedback. Donde el modelo se equivoque de forma repetida, añadir un indicador o un error que penaliza a ese ejercicio. Es la mejora más barata y la que más se nota.
4. **Indicadores de la asesora** para los retos de soft skills: 3–5 por ejercicio («nombra un hecho concreto», «propone un plazo», «no culpa a la persona»). Se escriben en el catálogo, sin tocar código.
5. **Experto de IA** que revise los 33 ejercicios de la rama IA (indicadores y errores que penalizan) y corrija la primera tanda de certificaciones.
6. **Activar la doble corrección cerca de los cortes** cuando haya volumen (sube el coste medio menos de un 25 %).
7. **Transcribir el audio** antes de corregir: hoy un reto de voz no puede pasar de 60.

## 5. Qué no hace (y conviene decirlo)

- No mide personalidad ni emociones; la cámara solo registra integridad, y la integridad nunca descarta sola.
- No compara candidatos entre sí: cada respuesta se corrige contra su rúbrica.
- La IA no pone la nota final: la calcula el servidor con reglas que se pueden auditar.
