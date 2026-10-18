# 08 · Seguridad avanzada: todas las maneras de hacer trampa y cómo cerrarlas

Tarea de la reunión: «Seguridad avanzada: mejoras y pensar todo tipo de maneras en que se puede hacer trampa». Casos pedidos expresamente: copiar y pegar, la cámara, **otra persona en la sala que coge el móvil y hace fotos**, y **abrir el reto, verlo, cerrarlo y volver a entrar** con las respuestas preparadas.

Principios que no cambian (decisiones del 12/10): **la integridad nunca descarta sola** (produce un informe para una persona); **la cámara nunca infiere emociones** (prohibido en el trabajo por el Reglamento de IA, art. 5); el vídeo no sale del navegador; siempre hay alternativa sin cámara y ajustes razonables por discapacidad.

---

## 1. Hallazgo importante: hoy el examen está en el código de la página

Los enunciados, tablas y guías de los retos viven en `assets/js/app/03-datos-retos.js` y `07-retos-comunes.js`, que el navegador descarga al abrir la web. Cualquiera puede ver todo el catálogo con «Ver código fuente», sin empezar ningún reto ni tener cuenta. **Peor aún: en las clasificaciones viaja también la solución** (campo `correct` de cada opción, y la respuesta de las secuencias numéricas). El servidor ya corrige con su propio catálogo (`catalogo-retos.json`, que se genera *a partir* del fichero del navegador), pero **el contenido y las soluciones son públicos**: una clasificación se puede sacar con un 100 sin pensar. Además, el cronómetro y el estado del intento son del navegador.

Esto hace inútil cualquier otra medida si no se arregla primero: **el contenido del reto tiene que salir del servidor en el momento de empezar, y no antes.**

## 2. La medida central: el intento de un solo uso

Respuesta directa al caso «abro, miro, cierro y vuelvo con chuletas».

```
  Briefing (sin contenido)  ──[Empezar]──►  attempt-start (servidor)
                                              · crea el intento: abierto_en, expira_en
                                              · elige una VARIANTE para esta persona
                                              · devuelve solo el ejercicio 1
         ┌────────────────────────────────────────────┘
         ▼
  Ejercicio en curso ── autoguardado cada 10 s ──► attempt-save (latido)
         │  si cierra la pestaña, el reloj del SERVIDOR sigue corriendo
         │  si vuelve antes de expirar: mismo intento, mismo texto, tiempo restante
         │  si vuelve después: el intento se entrega con lo último guardado, o queda «no entregado»
         ▼
  attempt-submit ── corrige ── devuelve el ejercicio 2 (que no existía en el navegador)
```

Reglas:

1. **El reloj es del servidor.** Cerrar y volver no lo para ni lo reinicia.
2. **Un intento oficial por reto cada 30 días** (política de reintentos), y el siguiente intento recibe **otra variante**. Ver el reto, cerrarlo y prepararse no sirve: la próxima vez los datos, nombres y cifras serán otros.
3. **Los ejercicios 2 y 3 no se envían hasta entregar el anterior.**
4. Cada reapertura queda en el informe («Reabierto 2 veces, 3 min fuera»). Ya existe el contador `relaunches`; pasa a medirlo el servidor.
5. Si se cae la conexión o el ordenador, la persona puede pedir una **reapertura justificada** desde la pantalla de soporte: la decide una persona, no el sistema.

### Variantes

Cada reto se reescribe como **plantilla con parámetros**: cifras de la tabla, nombres, sector de la empresa, orden de las opciones, el dato que cambia a mitad. Con 4–6 parámetros salen decenas de combinaciones con la misma dificultad (se comprueba con el banco del corrector: misma banda media por variante). Cada variante lleva además un **detalle trampa único** (un nombre de empresa o una cifra inventada irrepetible): si aparece en internet o en la respuesta de otra persona, se sabe de qué intento salió.

## 3. Catálogo de trampas

Columnas: qué puede hacer alguien · qué hay hoy · qué añadimos · qué queda sin cubrir.

### 3.1 Sobre el contenido

| Trampa | Hoy | Añadimos | Riesgo restante |
| --- | --- | --- | --- |
| Leer el examen en el código fuente | Contenido en el JS público | Contenido solo desde `attempt-start` (§2) | Ninguno tras el cambio |
| Abrir, mirar, cerrar y volver preparado | Cronómetro del navegador; contador de relanzamientos | Intento de un solo uso, reloj de servidor, variante distinta en el siguiente intento | Bajo |
| Crear otra cuenta para ver el reto antes | Sin control | Variantes (lo visto no se repite) + email confirmado obligatorio + aviso de varias cuentas desde el mismo dispositivo en la misma semana | Bajo |
| Compartir capturas o fotos con otros candidatos | Marca de agua con alias y hora | Variantes + detalle trampa único por intento + marca de agua que incluye el id del intento | Bajo |
| Buscar las respuestas en internet | — | Variantes; casos con datos propios del reto (una respuesta genérica de internet no cita los datos y el corrector la limita a 40) | Bajo |

### 3.2 Durante el reto, en el ordenador

| Trampa | Hoy | Añadimos | Riesgo restante |
| --- | --- | --- | --- |
| Copiar y pegar | Bloqueado (copy, cut, paste, drop, atajos, menú contextual) y registrado | Mantener. Excepción registrada para tecnologías de apoyo (ajuste razonable) | Bajo |
| Pegar «por la puerta de atrás» (autocompletado, dictado, extensiones que escriben) | Detección de «inserción masiva» (> 40 caracteres de golpe) | Detectar **cambios del texto sin evento de teclado** (una extensión que escribe en el campo) y texto que aparece entre dos latidos sin pulsaciones suficientes | Bajo |
| **Transcribir** a mano una respuesta que tiene en otro dispositivo | — | **Patrón de escritura**: escritura continua a ritmo constante, sin pausas de pensar ni correcciones, durante muchos caracteres. Es una señal, no una prueba | Medio |
| Cambiar de pestaña o ventana | Registrado (salidas y segundos fuera) | Mantener. En nivel Supervisado, **pantalla completa obligatoria**; salir queda registrado | Bajo |
| **Segundo monitor** | — | En navegadores que lo permiten, `screen.isExtended` indica si hay más de una pantalla. Nivel Supervisado: se pide desconectarla o se registra | Medio |
| Escritorio remoto (otra persona controla el ordenador) | — | En nivel Alto se pide **compartir la pantalla completa** (`getDisplayMedia`): se comprueba que es la pantalla entera y no una ventana; se registran los cambios de foco. No se graba | Medio |
| Bots o automatización del navegador | Límite de frecuencia del corrector | Señal `navigator.webdriver`, cadencia imposible para una persona, límites por cuenta e IP | Bajo |
| Herramientas de desarrollo para leer o cambiar la página | — | Con el §2 ya no hay nada que leer; la nota la pone el servidor; el recibo está firmado | Ninguno |
| Engañar al corrector (inyección de instrucciones) | Señales ponderadas, bloqueo con peso ≥ 2, tope 60 con peso 1, delimitador de un solo uso | Mantener y medir en el banco v2 (doc 05) | Bajo |

### 3.3 En la sala: otra persona, el móvil, las fotos

Es lo más difícil, porque ocurre **fuera** del ordenador. No hay una medida perfecta; se combinan varias para que hacer trampa cueste más que no hacerla.

| Trampa | Añadimos | Cómo funciona | Riesgo restante |
| --- | --- | --- | --- |
| **Otra persona coge el móvil y fotografía la pantalla** | 1) Variantes y detalle trampa único: la foto no le sirve a nadie más y, si se filtra, se sabe de quién es. 2) **Detección del móvil en cámara**: un modelo pequeño de detección de objetos que funciona **dentro del navegador** reconoce un teléfono en la imagen y lo registra. 3) **Segunda persona en cámara**: ya se detectan varias caras donde el navegador lo permite; se generaliza con el mismo modelo pequeño. | Todo se analiza en el navegador y se descarta; al servidor solo llega «teléfono visible 00:12:40». No identifica a nadie: cuenta objetos y personas. | Medio: si la otra persona está fuera del plano de la cámara, no se ve. |
| Alguien le **dicta** las respuestas | Nivel Alto: **voz detectada** por el micrófono (solo «hay voz» sí/no, nunca qué se dice, nunca grabación). | Detector de actividad de voz en el navegador. | Medio |
| Consultar el móvil con ChatGPT y copiar a mano | 1) Patrón de escritura (§3.2). 2) Cámara: mirada prolongada fuera de pantalla **no** se usa (falsos positivos y problemas de accesibilidad). 3) **Defensa**: al entregar, dos preguntas sobre **su propia respuesta**, con 3 minutos y sin pegar («¿Por qué propones el plazo de 15 días y no de 30?»). | Quien no escribió la respuesta no sabe defenderla. Es la medida más fuerte contra la IA externa. | Bajo con defensa |
| Otra persona hace el reto por él (suplantación) | Nivel Alto: comprobación de identidad al empezar **con consentimiento expreso** y alternativa sin biometría (videollamada breve). En Eventos Impact: el **caso en vivo** del día compara su nivel real con el de los retos; una diferencia grande pasa a revisión. | | Bajo en eventos, medio online |
| **Escaneo de la sala** | Nivel Alto: al empezar, la persona gira la cámara 360° (vídeo que no se guarda; se registra que se hizo). | | Medio |
| **Móvil como segunda cámara** | Nivel Alto: se escanea un QR con el móvil, que se coloca de lado mostrando mesa, manos y pantalla. Misma regla: se analiza en el dispositivo, no se graba. | Es lo que usan los exámenes de certificación profesionales. | Bajo |
| Cámara virtual que emite un vídeo falso | Registrar el nombre del dispositivo de cámara (las cámaras virtuales se identifican: «OBS Virtual Camera», etc.) e imagen congelada (sin cambio entre muestras). | | Bajo |
| Tapar la cámara | Ya se detecta (imagen oscura). | | Bajo |

### 3.4 Entre candidatos y después

| Trampa | Añadimos |
| --- | --- |
| Dos personas se pasan respuestas en tiempo real | Similitud entre entregas del mismo reto y misma ventana de tiempo (doc 05, D3). Con variantes, las respuestas correctas también difieren. |
| Comprar respuestas hechas | Variantes + defensa + similitud con entregas antiguas. |
| Falsificar el SkillPass | Firma digital + sello público (doc 03). La empresa ve «Alterada». |
| Repetir hasta tener suerte | Política de reintentos (30 días) y la nota visible indica el n.º de intentos. |

## 4. Niveles de integridad: proporcionalidad

No todas las pruebas necesitan lo mismo. Pedir cámara y escaneo de sala para un reto de práctica sería desproporcionado (RGPD) y espantaría a los candidatos.

| Nivel | Cuándo | Medidas | Lo ve la empresa como |
| --- | --- | --- | --- |
| **Práctica** | Modo práctica (doc 04) | Ninguna. No cuenta para el pool. | No aparece |
| **Estándar** (por defecto) | Retos oficiales del pool | Intento de servidor, variantes, reloj de servidor, antipegado, pestañas, patrón de escritura, marca de agua | «Integridad estándar» |
| **Supervisado** | Ofertas que lo pidan, certificación IA | + cámara (presencia, 2.ª persona, móvil, tapada), pantalla completa, 2.º monitor, **defensa de 2 preguntas** | «Supervisado» |
| **Alto** | Eventos Impact, certificaciones de pago | + escaneo de sala, móvil como 2.ª cámara, voz, pantalla compartida, identidad con consentimiento | «Supervisión alta» |

La empresa elige el nivel mínimo al publicar la oferta. El candidato lo sabe **antes** de empezar y puede pedir ajustes (tiempo extra, lector de pantalla, sin cámara con alternativa).

## 5. Qué pasa cuando salta una alarma

1. Las señales se puntúan (ya existe `riesgo()`: bajo/medio/alto) y se guardan con la evaluación.
2. **Riesgo alto → revisión humana obligatoria** antes de que la nota llegue al pool. El candidato ve «en revisión».
3. La persona revisora ve la línea de tiempo de señales, la respuesta y la defensa. Decide: **válido** · **intento anulado** (puede repetir tras el plazo) · **fraude confirmado** (cuenta suspendida, SkillPass revocado).
4. El candidato puede **explicarse** y recurrir. Siempre.
5. Nada se decide por una sola señal.

## 6. Legal

- Cámara y micrófono: base de consentimiento, con alternativa real; información clara en `legal.html` y en el briefing.
- Detección de objetos y conteo de caras **no identifica** a nadie. La comprobación de identidad facial sí es biometría (art. 9 RGPD): solo nivel Alto, con consentimiento expreso y alternativa.
- Prohibido inferir emociones, nerviosismo o «sinceridad» (Reglamento de IA, art. 5.1.f).
- Evaluación de impacto (EIPD) antes de activar los niveles Supervisado y Alto.
- Retención de señales: 6 meses (doc 07).

## 7. Implementación, por orden

| Paso | Qué | Dónde |
| --- | --- | --- |
| 1 | Sacar el contenido de los retos del JS público; servirlo desde `attempt-start` | `03-datos-retos.js`, `07-retos-comunes.js` → servidor; `tools/generar_catalogo_servidor.js` se invierte |
| 2 | Tabla `attempts`, funciones `attempt-start`, `attempt-save`, `attempt-submit`; reloj de servidor | `netlify/functions`, doc 07 |
| 3 | Plantillas con parámetros y detalle trampa para los 14 retos de soft skills | Catálogo |
| 4 | Patrón de escritura y cambios sin teclado en `TPIntegrity` | `13-integridad.js` |
| 5 | Defensa de 2 preguntas (texto) | Corrector (H3 del doc 05) |
| 6 | Niveles de integridad en la oferta y en el briefing | Oferta + `13-integridad.js` |
| 7 | Detección de móvil y personas en cámara (modelo en el navegador, carga solo en Supervisado), pantalla completa, 2.º monitor | `13-integridad.js` |
| 8 | Cola de revisión de integridad y flujo de recurso | Backoffice |
| 9 | Nivel Alto: móvil como 2.ª cámara, escaneo de sala, voz, pantalla compartida | Para Eventos Impact |

Cada paso con tests (`tests/integridad*.test.js`) y su línea en el changelog.

## 8. Decisiones para el equipo

- [ ] ¿Prioridad máxima al paso 1 (contenido fuera del JS público)? (Recomendado: sí; es un fallo, no una mejora.)
- [ ] ¿Un intento oficial cada 30 días?
- [ ] ¿Defensa de 2 preguntas en todos los retos oficiales o solo en Supervisado?
- [ ] ¿Qué nivel exigen por defecto los Eventos Impact? (Propuesta: Alto.)
