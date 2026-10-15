# Corrector: diagnóstico y mejoras

> Versión completa y explicada, con 32 propuestas agrupadas y hoja de ruta: [`docs/corrector.pdf`](../corrector.pdf) (se regenera con `python3 tools/generar_corrector_pdf.py docs/corrector.pdf`).

Estado a 15/10/2026. El corrector es el corazón del producto: si la nota no es concreta, justificada y estable, la empresa no paga y el candidato no aprende nada.

---

## 1. Cómo estaba (v2.0)

| Problema | Por qué importa |
| --- | --- |
| **Rúbrica genérica.** Todos los retos se corregían con los mismos cuatro criterios (relevancia, profundidad, estructura, aplicabilidad), con unos pesos «orientativos» por tipo. | Un correo de liderazgo y un análisis de churn se medían igual. El feedback salía vago («profundiza más»). |
| **La nota global la ponía el modelo «a ojo».** El prompt decía «media ponderada», pero nadie comprobaba que los criterios y la nota global cuadraran. | Un 70 global con criterios de 50 era posible. Nada reproducible. |
| **Sin evidencia.** El modelo podía justificar una nota con algo que el candidato no había escrito. | Feedback que no se puede auditar: un problema serio para el Reglamento de IA. |
| **Los topes eran solo texto en el prompt** («si no aborda el escenario, máximo 10»). | El modelo podía saltárselos. |
| **Las guías de cada ejercicio se pasaban como texto suelto.** Por ejemplo: «Incluye: 1) Apertura… 2) Hechos concretos… 3) Pregunta abierta». | Eran los indicadores más concretos que teníamos y no se usaban como tales. |
| **Las clasificaciones (95 de 309 ejercicios) las corregía la IA** a partir de un JSON que traía la respuesta correcta desde el navegador. | El candidato podía cambiar la «correcta», y cada intento costaba una llamada al modelo para algo que es una cuenta exacta. |
| **El banco de pruebas del TFM no mide el corrector de la web.** Usa el modo crudo con las rúbricas del POC (Python, SQL), no los 103 retos del catálogo. | Las cifras de calidad (κ, error medio) no describen lo que ven los candidatos. |

---

## 2. Lo que ya está aplicado (v2.1)

1. **Criterios fijos con peso por tipo de ejercicio**, definidos en el servidor (`RUBRICAS` en `netlify/functions/lib/evaluator.js`):

   | Tipo | Criterios (peso) |
   | --- | --- |
   | Análisis | Interpretación de los datos (25) · Diagnóstico (25) · Plan de acción priorizado (30) · Justificación con datos (20) |
   | Correo / comunicación | Contenido y cobertura (30) · Propuesta concreta (25) · Tono y adecuación (20) · Estructura (15) · Concisión (10) |
   | Resto | Relevancia (30) · Profundidad (30) · Aplicabilidad (25) · Estructura (15) |

2. **Escala anclada**, igual para todos los criterios, para que un 70 signifique siempre lo mismo:
   - 0–20: no lo hace, o lo hace mal.
   - 21–40: lo menciona sin desarrollarlo.
   - 41–60: correcto pero poco concreto.
   - 61–80: concreto y aplicado a este escenario.
   - 81–100: concreto, justificado con datos y sin carencias relevantes.
3. **Indicadores de cada ejercicio.** La guía numerada se convierte en una lista que el modelo revisa uno a uno (qué cumple y qué falta). En los análisis se usan los conceptos esperados y la tabla de datos.
4. **Evidencia obligatoria.** Por cada criterio, el modelo cita de 1 a 3 fragmentos literales de la respuesta. El servidor **comprueba que las citas existen**: las inventadas se descartan, y un criterio sin ninguna cita válida no pasa de 40.
5. **Nota calculada por el servidor** con los pesos. La que proponga el modelo se ignora.
6. **Topes aplicados por el servidor** según las banderas del modelo:
   - no aborda el escenario → máximo 10;
   - copia el enunciado → máximo 15;
   - respuesta genérica → máximo 40;
   - grabación sin transcripción → máximo 60.
7. **Feedback concreto por criterio**: «Cita: … · Bien: … · Falta: … · Para subir: [una acción concreta]», más un resumen y un «siguiente paso».
8. **Clasificaciones corregidas sin IA**, con la solución del servidor y **descontando el azar**. Con dos categorías, acertar al azar la mitad da 0, no 50. Por ejemplo, 7 de 8 bien da 75. Ahorra una llamada al modelo en casi un tercio de los ejercicios.
9. Versión del corrector **2.1.0** en cada recibo, para saber con qué rúbrica se puso cada nota.

Compatibilidad: si el modelo devuelve el formato antiguo, se usa como antes. El modo crudo del banco de pruebas no cambia, así que las cifras del TFM siguen siendo válidas para lo que miden. Tests: `tests/corrector-v21.test.js`.

> **Aún no está validado con el modelo real** (aquí no hay clave de la API). Antes de dar por buena la v2.1 hay que corregir unas cuantas respuestas reales y revisar las notas (ver el paso 1 del plan).

---

## 3. Lo que propongo después, por orden

### Paso 1 · Medir el corrector de verdad (imprescindible)
- **Gold set del catálogo**: 5 retos (un análisis, dos correos de Personas, un reto de sector y uno de comunicación), con 6 respuestas cada uno, de excelente a mala, más 2 intentos de manipulación.
- **Notas humanas**: que la asesora de RRHH y una segunda persona puntúen esas respuestas con la misma rúbrica. Así sí se puede hablar de acuerdo con personas (κ contra humanos), algo que hoy el informe no puede afirmar.
- **Banco v2**: que `npm run bench` llame al corrector de la web (modo v2) en vez del modo crudo, y que mida el acuerdo de banda, el error medio, la estabilidad (misma respuesta dos veces) y el porcentaje de citas descartadas.

### Paso 2 · Más concreción por ejercicio
- **Indicadores escritos a mano** para los retos de Personas y equipo. Hoy salen de la guía; mejor 3–5 indicadores revisados por la asesora («nombra un hecho concreto», «propone un plazo», «no culpa a la persona»).
- **Respuestas de referencia** (una floja y una buena por tipo de ejercicio) dentro del prompt, como ejemplo calibrado. Estabiliza las notas, a cambio de unos 1.500 tokens más por corrección.
- **Clasificaciones con justificación**: tras clasificar, una frase de «por qué esta es tu prioridad nº 1», corregida con IA. Hoy solo se mide si acierta, no si entiende.

### Paso 3 · Notas que se puedan defender
- **Bandas en vez del número exacto** de cara a la empresa: Insuficiente / Aceptable / Bueno / Muy bueno. Es lo que el banco puede garantizar (el gold set ya dice que pedir el número exacto no es exigible ni a un humano).
- **Doble corrección automática** cuando la nota cae cerca de un corte de banda (por ejemplo, 58–62) o cuando un criterio queda limitado por falta de evidencia. Si las dos correcciones discrepan más de 10 puntos, pasa a revisión humana.
- **Revisión humana por muestreo** (5–10 %) y siempre que el candidato la pida. Hoy «Pedir revisión» abre un correo; hay que convertirlo en una cola con estado y plazo.
- **Política de reintentos** (ver `04_estrategia.md`, §2) y **variantes** de cada reto, para que repetir no sea aprenderse el ejercicio.

### Paso 4 · Huecos que hoy dan notas sin base
- **Audio**: transcribir antes de corregir. Hoy el modelo solo recibe «[Grabación de N segundos]» y puede dar hasta 60.
- **Retos de oferta** (`EX_DB`): pasarlos al catálogo del servidor para que también tengan rúbrica, indicadores y verificación.
- **Modelo**: probar un modelo más reciente con el banco v2 antes de cambiarlo. Las cifras del TFM están calibradas con `claude-sonnet-4-6`.

---

## 4. Coste

La v2.1 pide más salida (evidencia, indicadores y mejora por criterio): el límite de salida pasa de 1.000 a 1.800 tokens. Por otro lado, las clasificaciones ya no llaman al modelo. El coste real por corrección se ve en el backoffice (las evaluaciones guardan los tokens) y hay que revisarlo tras la primera semana.

## 5. Qué hay que decidir

- [ ] ¿Descontar el azar en las clasificaciones? (Recomendado: sí. Sin hacerlo, clasificar al azar da 50.)
- [ ] ¿Mostrar bandas a la empresa en vez del número?
- [ ] ¿Quién hace las notas humanas del gold set? (Propuesta: la asesora y uno de vosotros dos.)
