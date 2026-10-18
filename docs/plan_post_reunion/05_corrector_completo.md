# 05 · Un corrector completo

Tarea de la reunión: «Corrector: cómo implementar todo tipo de mejoras, y cómo mejorarlo». Este documento parte del corrector que ya está en código (v2.1, `netlify/functions/lib/evaluator.js`) y del documento `docs/corrector.pdf` (32 propuestas, A1–I4). No lo repite: lo **ordena en una arquitectura final** y explica **cómo llegar a ella paso a paso sin romper lo que hay**.

---

## 1. Dónde estamos (v2.1)

Ya funciona: rúbrica con pesos por tipo (análisis, correo, resto) fijada en el servidor · escala anclada 0–20 / 21–40 / 41–60 / 61–80 / 81–100 · indicadores sacados de la guía del ejercicio · **evidencia literal obligatoria** comprobada por el servidor (sin cita válida, un criterio no pasa de 40) · nota calculada por el servidor · topes por banderas (no aborda 10, copia 15, genérica 40, audio sin transcribir 60) · clasificaciones sin IA descontando el azar · detección de manipulación por señales · recibo firmado (HMAC) por corrección · versión `2.1.0` en cada recibo.

Lo que falta para que sea «completo»:

1. **No sabemos cuánto acierta**: no hay notas humanas del catálogo real (el banco del TFM mide el modo crudo del POC).
2. **Una sola pasada** del modelo: busca evidencia y puntúa a la vez; sesgo hacia la primera impresión.
3. **Una sola corrección**: una respuesta en 59 o en 61 cambia de banda por azar.
4. **El audio no se transcribe**.
5. **Los retos de oferta** (`EX_DB`) y los dilemas de empresa no tienen rúbrica de servidor.
6. **No hay revisión humana real** (el botón abre un correo).
7. **No hay panel de salud** (coste, citas descartadas, dispersión).

## 2. Arquitectura objetivo (v3)

```
 Entrega del candidato
   │
 0 Preparación ───────── reto + versión, rúbrica por tipo y nivel, indicadores de experto,
   │                     ejemplos ancla, errores que penalizan            (catálogo del servidor)
 1 Normalización ─────── transcripción de audio, idioma, recorte, nonce anti-inyección
   │
 2 Comprobaciones sin IA  vacío · copia del enunciado · clasificaciones · similitud con
   │                     otras entregas del mismo reto · señales de manipulación
 3 Pasada 1: evidencia ── el modelo cita, por indicador, qué fragmentos lo cumplen o no
   │                     → el servidor descarta las citas que no existen
 4 Pasada 2: puntuación ─ por criterio, con descriptores por nivel, SOLO sobre la evidencia
   │                     verificada; salida con esquema obligatorio
 5 Reglas del servidor ── pesos · topes · errores de fondo · coherencia · nota global
   │
 6 Estabilidad ───────── ¿cerca de un corte o criterio sin evidencia? → segunda corrección
   │                     → mediana; discrepancia > 10 → cola humana
 7 Presentación ──────── banda, nivel 1–5, percentil del reto, «por qué esta nota»
   │
 8 Feedback ──────────── lista de comprobación, comparación con su intento anterior,
   │                     plan de práctica
 9 Revisión humana ───── muestreo 5–10 %, a petición, zona de duda, riesgo de integridad
   │
10 Registro ──────────── versión de reto, rúbrica, prompt (hash), modelo, tokens, citas,
                         decisiones humanas → recibo firmado y recorrección posible
```

## 3. Cada pieza, en detalle

### 3.0 Preparación: la rúbrica deja de ser de tres tipos

| Hoy | v3 |
| --- | --- |
| 3 rúbricas (análisis, correo, resto) | Una rúbrica **por familia de reto**: análisis, comunicación, decisión con dilema, diseño/plan, negociación, técnica de IA, idioma. Registro en `RUBRICAS` con `id`, `version`, criterios, pesos y **descriptores por nivel** (B2). |
| Misma exigencia para básico y avanzado | **Rúbrica según el nivel del reto** (B3): el descriptor de 61–80 en un reto junior no es el de un reto sénior. |
| Indicadores sacados de la guía | **Indicadores de experto** (B1), 3–5 por ejercicio, escritos y revisados por la asesora (soft) o un experto (técnicos). Doc 09 tiene la lista para los 42 ejercicios de soft skills. |
| — | **Errores de fondo** (B4): lista por reto de fallos que limitan un criterio (p. ej. «culpa a la persona» en feedback → tope 40 en tono). |
| — | **Ejemplos ancla** (C2): una respuesta floja y una buena por familia, con su nota, en el prompt. |

Todo esto vive en el catálogo del servidor (`catalogo-retos.json` → tabla `challenge_versions`, doc 07). Cada cambio crea una versión nueva; las notas antiguas guardan con qué versión se pusieron.

### 3.1 Normalización

- **Audio** (H1): transcribir antes de corregir (servicio de transcripción en el servidor; la grabación se borra tras transcribir salvo consentimiento). Se corrige el texto; la fluidez oral, solo en retos de idioma y con criterio propio.
- Idioma: si la respuesta no está en el idioma pedido, bandera (no tope automático en retos que no sean de idioma).

### 3.2 Comprobaciones sin IA (baratas y objetivas)

- Copia del enunciado: similitud de n-gramas con el escenario > 60 % → tope 15 sin llamar al modelo.
- **Respuestas copiadas entre candidatos** (D3): huella de la respuesta (embeddings o *shingles*) comparada con las del mismo reto. Similitud alta → **no baja la nota**, marca para revisión humana (doc 08).
- Clasificaciones: ya sin IA. Añadir **justificación** (H2): una frase de «por qué esta es tu prioridad n.º 1», corregida con IA.

### 3.3 Corrección en dos pasadas (C1)

- **Pasada 1, evidencia**: por cada indicador, el modelo devuelve `cumple | parcial | no` y las citas literales. El servidor verifica las citas (ya existe `citaLiteral`). Puede hacerse con un modelo más barato.
- **Pasada 2, puntuación**: recibe solo la evidencia verificada y los descriptores por nivel; devuelve nota por criterio y feedback. Así el modelo no puede premiar algo que no está escrito.
- **Salida con formato garantizado** (C4): usar herramientas/esquema JSON obligatorio en la llamada, en vez de pedir JSON en el texto. Elimina los fallos de parseo.

### 3.4 Reglas del servidor (ampliación de `puntuar`)

- Pesos y topes como hoy.
- Errores de fondo (B4) como topes por criterio.
- **Coherencia** (C5): si el feedback dice «no aborda X» y el criterio de X tiene 75, se recorrige ese criterio; si el modelo marca «genérica» pero hay 6 citas válidas concretas, se ignora la bandera y se registra.

### 3.5 Estabilidad: doble corrección donde importa (C3)

- Segunda corrección automática si la nota cae a ±3 puntos de un corte de banda (40, 60, 80) o si algún criterio quedó topado por falta de evidencia.
- Se toma la **mediana**; si las dos difieren más de 10 puntos, va a la cola humana y el candidato ve «en revisión».
- Coste: afecta a un 15–25 % de las entregas; sube el coste medio menos de un 25 %.

### 3.6 Presentación: tres lecturas de la misma nota

| Para quién | Qué ve |
| --- | --- |
| Empresa | **Banda** (Insuficiente < 40 · Aceptable 40–59 · Bueno 60–79 · Muy bueno ≥ 80) (G1), el número al pasar el ratón, y el **contexto** (G3): percentil dentro del reto y nivel del reto. |
| Candidato | Banda + nota + «**por qué esta nota**» (G2): los dos criterios que más suben y los dos que más bajan, con su cita. |
| Diccionario de competencias | **Nivel 1–5 o NE** (propuesta inicial a calibrar: 0–30 → 1, 31–50 → 2, 51–70 → 3, 71–85 → 4, 86–100 → 5; el 5 solo con revisión humana). |

### 3.7 Feedback que enseña

- **Lista de comprobación** (F1): los indicadores con cumple/parcial/falta, más útil que un párrafo.
- **Comparación** con su intento anterior (F2): qué criterios han subido.
- **Plan de práctica** (F3): un ejercicio concreto sugerido para el criterio más flojo.

### 3.8 Revisión humana de verdad (E1)

Cola `evaluation_reviews` con estados `pendiente → en revisión → resuelta`, plazo de 72 h, motivo (`muestreo | petición | zona de duda | integridad | discrepancia`) y resultado (`confirma | ajusta | anula`). La persona revisora ve la respuesta **sin nombre** (corrección ciega). Toda decisión humana alimenta el gold set.

### 3.9 Registro, versiones y recorrección (I3)

Cada corrección guarda: id y versión del reto, versión de rúbrica, hash del prompt, modelo, tokens de entrada/salida, citas, banderas, notas de cada pasada, decisión humana. Al publicar una rúbrica nueva, un script recorrige una muestra y compara antes de activarla.

## 4. Calibración: cómo sabremos que es bueno

1. **Gold set del catálogo** (A1): 5 retos × 6 respuestas (de excelente a mala) + 2 intentos de manipulación. Dos personas (la asesora y uno del equipo) las puntúan por separado con la misma rúbrica.
2. **Banco v2** (A2): `npm run bench` corre el corrector real (v2/v3, no el modo crudo) sobre el gold set y mide:

| Métrica | Objetivo para dar por bueno |
| --- | --- |
| Acuerdo de banda con humanos | ≥ 80 % |
| Error medio absoluto frente a la media humana | ≤ 8 puntos |
| Estabilidad (misma respuesta dos veces) | diferencia ≤ 5 en el 90 % |
| Citas descartadas | ≤ 10 % |
| Manipulaciones detectadas | 100 % |
| Coste medio por corrección | ≤ 0,04 € |

3. **Pruebas de sesgo** (A3): la misma respuesta con distinto nombre o género implícito, con faltas de ortografía leves, más larga o más corta, en español de distintos países. Diferencias > 5 puntos son un fallo a corregir.
4. **Calibración con cada empresa** (Eventos Impact y Enterprise): la empresa corrige 10 respuestas; si su criterio difiere, se ajustan **sus cortes** (qué banda le vale para su puesto), nunca la nota del candidato.

## 5. Cómo adaptar el corrector actual, paso a paso

Cada paso deja el corrector funcionando y con tests; el `EVALUATOR_VERSION` sube en cada uno.

| Paso | Cambio en el código | Versión |
| --- | --- | --- |
| 1 | Definir `EVAL_SIGNING_SECRET` en Netlify (lo hace el usuario) y corregir 20–30 respuestas reales para revisar a mano. | 2.1.0 |
| 2 | Banco v2: `tfm/tech/eval` llama a `evaluator.js` en modo v2; gold set en `tfm/tech/eval/gold_catalogo.json`. | 2.1.1 |
| 3 | Salida con esquema obligatorio (C4) y **descriptores por nivel** en `RUBRICAS` (B2). | 2.2.0 |
| 4 | Indicadores de experto y errores de fondo para los 14 retos de soft skills (doc 09) en el catálogo del servidor. | 2.3.0 |
| 5 | Doble corrección cerca de los cortes (C3) + cola `evaluation_reviews` + pantalla del revisor (E1). | 2.4.0 |
| 6 | Bandas, percentil y «por qué esta nota» en la interfaz (G1–G3). | 2.4.x |
| 7 | Transcripción de audio (H1); retos de oferta y dilemas al catálogo del servidor (H4). | 2.5.0 |
| 8 | Dos pasadas (C1), ejemplos ancla (C2) y caché del prompt (I1). | 3.0.0 |
| 9 | Panel de salud del corrector en el backoffice (I2) y repregunta adaptativa / defensa (H3). | 3.1.0 |
| 10 | Probar un modelo más reciente con el banco v2 (I4); solo se cambia si no empeora ninguna métrica del §4. | — |

Sobre el modelo: las cifras del TFM están medidas con `claude-sonnet-4-6`. Hoy hay modelos más recientes (familia Claude 5: Sonnet 5.5, Haiku 5.5). Propuesta: Haiku para la pasada 1 (evidencia, barata) y Sonnet para la pasada 2, **siempre que el banco v2 lo avale**. Si cambia el coste por corrección, cambia una cifra canónica.

## 6. Panel de salud (backoffice)

Una pantalla con datos reales de `evaluations` (nada inventado; vacío si no hay datos): correcciones por día, coste medio y total, latencia p95, % de citas descartadas, % de topes por bandera, % de doble corrección y de discrepancias, cola humana pendiente y vencida, distribución de bandas por reto (un reto donde todos sacan «Muy bueno» está mal calibrado).

## 7. Decisiones para el equipo

- [ ] ¿Bandas hacia la empresa con el número al pasar el ratón?
- [ ] ¿Quién hace el gold set? (Propuesta: la asesora y uno del equipo, por separado.)
- [ ] ¿Doble corrección en ±3 de los cortes?
- [ ] ¿Revisión humana gratis si cambia la nota más de 10 puntos? (Doc 04.)
- [ ] ¿Escala 1–5 visible para hard skills técnicas y bandas para el resto?
