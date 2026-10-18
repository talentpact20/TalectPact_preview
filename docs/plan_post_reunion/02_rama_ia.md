# 02 · La rama de IA

Tarea de la reunión: «Tema IA: ¿cómo enfocarlo? Sí, con actividades; únicamente rama especial». Documento dedicado solo a la IA, como se pidió.
Fuentes: `TalentPact_Diccionario_Exclusivo_AI_Hard_Skills.docx` (v4.0: 24 competencias, 6 dimensiones, 5 niveles) y la competencia 05.6 «Criterio digital y uso responsable de IA» del diccionario de soft skills.

> Nota de interpretación: en la grabación aparece «modelo de negocio de ser experto en Digital Impact». Lo leemos como **ser la referencia en talento de IA verificado** (y enlazarlo con los Eventos Impact). Si se refería a otra cosa, se ajusta la sección 6.

---

## 1. Las dos maneras de enfocarlo, y cuál recomendamos

| | A · IA como rama especial | B · IA dentro de todo |
| --- | --- | --- |
| Qué es | Un catálogo aparte, solo para perfiles que construyen IA (ingenieros, científicos de datos, MLOps, seguridad de IA). | Cada reto de cualquier área incluye el uso de IA como parte del trabajo (un contable que revisa lo que le da un asistente). |
| A quién sirve | Empresas tecnológicas y equipos de IA. Talento escaso y caro. | Todas las empresas: desde 2025 el Reglamento de IA (art. 4) obliga a asegurar la **alfabetización en IA** del personal que usa estos sistemas. |
| Riesgo | Público pequeño; exige ejercicios técnicos muy buenos. | Diluir el mensaje: «todo es IA». |

**Recomendación: las dos, con nombres distintos y sin mezclarlas.**

1. **Rama IA** (lo que se decidió en la reunión): un área propia con las 24 hard skills del diccionario. Es la «rama especial».
2. **«IA en el trabajo»**: una sola competencia transversal (05.6 del diccionario de soft skills) con 3 retos propios, disponible para todos. No es la rama: es la puerta de entrada y el producto para empresas que necesitan acreditar la alfabetización de su plantilla.

## 2. Estructura de la rama IA

Seis dimensiones y 24 competencias del diccionario v4.0. En la plataforma se presentan como **6 itinerarios por perfil** (lo que entiende una empresa al publicar) y no como 24 casillas:

| Itinerario (perfil) | Competencias (IDs del diccionario) |
| --- | --- |
| Ingeniería de IA / ML | 01.01, 01.03, 02.01, 02.02, 02.04, 05.01, 05.02, 04.01 |
| IA generativa / LLM | 02.03, 03.01, 03.02, 03.03, 03.04, 04.01, 05.02, 06.01 |
| Investigación | 01.02, 02.02, 02.03, 02.04, 04.01, 04.02, 04.03, 04.04 |
| Plataforma e infraestructura de IA | 03.02, 05.01, 05.02, 05.03, 05.04, 05.05, 06.01 |
| Seguridad de IA | 03.04, 04.01, 06.01, 06.02, 06.03, 05.02 |
| IA aplicada en empresa | 01.03, 03.01, 03.02, 03.03, 03.05, 04.01, 05.01, 06.03 |

La empresa elige el itinerario y quita o añade hasta quedarse con **4–8 competencias** (lo dice el propio diccionario). El candidato ve su progreso por itinerario.

**Escala**: la del diccionario (1 Fundamentos · 2 Aplicación · 3 Autonomía profesional · 4 Especialización avanzada · 5 Referencia técnica) y **NE = no evaluable**. En la interfaz se muestra el nivel, no un número de 0 a 100: para hard skills técnicas el nivel es más honesto. Internamente seguimos guardando la puntuación por criterio.

## 3. Lanzamiento por olas

| Ola | Competencias | Cuándo |
| --- | --- | --- |
| **1** (10) | 01.01 Python · 01.03 Datos · 02.01 ML · 02.03 Transformers/LLM · 03.02 APIs LLM · 03.03 RAG · 03.04 Agentes · 04.01 Evaluación · 05.02 MLOps/LLMOps · 06.01 Seguridad de IA | Primero. Cubre los itinerarios «IA generativa» y «IA aplicada», que son los que más piden las empresas medianas. |
| 2 (6) | 02.02 Deep learning · 04.03 Fine-tuning · 04.02 Experimentación · 05.01 Ingeniería de software · 05.04 Inferencia y costes · 06.03 Privacidad | Cuando la ola 1 tenga gold set calibrado. |
| 3 (8) | 04.04 RL · 05.05 GPU/distribuidos · 01.02 Matemáticas · resto | Solo bajo demanda de una empresa concreta (reto a medida). |

## 4. Actividades: cómo se evalúa una hard skill de IA

El diccionario es claro: se puntúa por **artefactos** (código, configuración, informe cuantitativo), no por cómo escribe la persona. Por eso la rama IA necesita formatos que hoy no tenemos. Los planteamos en tres fases, de lo que se puede hacer ya con el corrector actual a lo que requiere infraestructura:

### Fase 1 · Sin ejecutar código (se puede hacer ya)

| Formato | Ejemplo | Qué demuestra |
| --- | --- | --- |
| **Diagnóstico de un artefacto roto** | Se entrega un fragmento de pipeline con *leakage* entre train y test y unas métricas sospechosamente altas. «¿Qué está mal y cómo lo arreglas?» | 01.03, 02.01, 04.01 |
| **Revisión de código** | 40 líneas de una integración con un LLM sin timeouts, con la clave en el código y sin validar la salida. «Marca los problemas por gravedad y reescribe lo crítico.» | 03.02, 06.01 |
| **Diseño con restricciones** | «Diseña un RAG para 20.000 documentos con permisos por departamento. Presupuesto, latencia p95 < 2 s.» Entrega: diagrama en texto + decisiones + cómo lo evalúas. | 03.03, 05.03, 05.04 |
| **Lectura de resultados** | Tabla de un A/B de dos modelos con intervalos. «¿Lanzas el B? ¿Qué falta?» | 04.01, 04.02 |
| **Clasificación con justificación** | 8 incidentes de un agente en producción: clasificar por causa (herramienta, bucle, permisos, prompt) y justificar el más grave. | 03.04, 06.02 |

El corrector v2.1 sirve tal cual, con dos cambios: **indicadores técnicos escritos por un experto** (no sacados de la guía) y **lista de errores que penalizan** (propuesta B4 del corrector: por ejemplo, «propone ajustar hiperparámetros sobre el test» limita el criterio).

### Fase 2 · Con ejecución (requiere un entorno aislado)

| Formato | Ejemplo | Cómo se corrige |
| --- | --- | --- |
| **Repositorio incompleto** | Un repo con tests que fallan: completar la función de partición sin *leakage*. | **Tests automáticos** (nota objetiva) + corrector IA solo para la calidad del código y la explicación. |
| **Notebook guiado** | Entrenar un baseline sobre datos sintéticos y superar una métrica umbral sin tocar el test. | Métrica sobre un conjunto oculto que el candidato nunca ve. |
| **Prompt con banco de casos** | Escribir una plantilla de extracción; se ejecuta contra 30 documentos ocultos. | Precisión medida de verdad. |

Infraestructura: ejecutar código de un desconocido exige un **sandbox** fuera de Netlify (servicio gestionado de ejecución aislada o contenedores efímeros propios), con límites de CPU, memoria, tiempo y sin red. Coste estimado: céntimos por ejecución. Es el mayor salto técnico de la rama y por eso va en fase 2.

### Fase 3 · Defensa en directo (la parte más difícil de falsear)

Tras entregar, **dos preguntas generadas sobre su propia entrega**, con 3 minutos y respuesta por voz o texto sin pegar: «¿Por qué elegiste chunks de 512 tokens y no de 256?». Quien no hizo el trabajo no sabe defenderlo. Es también la principal medida antitrampas (doc 08) y es lo que convierte una nota en **certificación**.

### Ejemplo completo de ficha (formato que usaremos para cada competencia)

| Campo | 03.03 · RAG y recuperación de información |
| --- | --- |
| Reto | «Buscador interno con permisos» |
| Escenario | Una aseguradora quiere un asistente que responda sobre 3.000 pólizas y 400 circulares internas. Cada empleado solo puede ver los documentos de su departamento. |
| Entregables | 1) Diseño de indexación y recuperación. 2) Cómo garantizas los permisos. 3) Cómo mides que recupera bien (no solo que responde bonito). 4) Dos riesgos y su mitigación. |
| Tiempo | 35 min |
| Indicadores (experto) | Separa evaluación de recuperación (recall@k) y de respuesta · filtra por permisos **antes** de recuperar, no después · define chunking con criterio · cita fuentes · menciona actualización de documentos |
| Errores que penalizan | Filtrar permisos tras generar la respuesta (tope 40 en el criterio de seguridad) · evaluar solo con «parece correcto» |
| Anclajes | 1: recuperación básica sin evaluar · 3: optimiza y mide grounding con métricas · 5: RAG seguro y robusto a cambios documentales |
| Integridad | Nivel «Supervisado» (doc 08) + defensa de 2 preguntas |
| Corrección | IA con rúbrica técnica + revisión de experto en el 100 % de las certificaciones |

## 5. «IA en el trabajo» (para todos los perfiles)

Competencia 05.6 del diccionario de soft skills. Tres retos, 10–15 minutos cada uno:

1. **Revisar lo que dice la IA**: se entrega un informe generado por un asistente con 3 errores de datos y un dato confidencial de cliente. Indicadores: detecta los errores, no reenvía el dato, explica cómo lo verificaría.
2. **Encargar bien**: escribir la instrucción para que un asistente prepare una tarea de su área y decir cómo comprobará el resultado.
3. **¿Se puede o no se puede?**: 8 usos de IA en una empresa (subir nóminas a un chatbot gratuito, resumir un contrato propio, decidir un despido con un modelo…) para clasificar en «sí», «sí con controles» o «no», con justificación del caso más dudoso.

Formato innovador que proponemos probar aquí: **reto con IA permitida**. El candidato tiene un asistente dentro del ejercicio; todo lo que le pide queda registrado. No se evalúa si usa IA, sino **cómo**: si contrasta, si corrige, si protege datos. Convierte el problema de las trampas con ChatGPT en la propia medida.

## 6. Modelo de negocio: ser la referencia en talento de IA verificado

### Por qué tiene sentido

- El talento de IA es el más escaso y el más caro de contratar; un error de contratación cuesta mucho más que el precio de la plataforma.
- El CV no sirve: todo el mundo pone «IA» en el perfil desde 2023. Lo que falta es **evidencia técnica**.
- LinkedIn retiró sus tests de skills; los tests de código genéricos no miden RAG, agentes o evaluación de modelos.
- Toda empresa que usa IA tiene una obligación de alfabetización del personal: hay un mercado B2B que **no es contratar**, sino **acreditar a la plantilla**.

### Líneas de ingreso propuestas

| Línea | Quién paga | Precio propuesto | Por qué ese precio |
| --- | --- | --- | --- |
| **Ruta IA gratuita** | Nadie | 0 € | Un reto por dimensión con nota orientativa. Atrae talento al pool (el lado que no paga hay que llenarlo). |
| **Certificación IA por itinerario** | Candidato | **39 €** por itinerario (4–8 competencias) | Incluye defensa en directo, revisión de un experto humano y SkillPass anclado en blockchain. Coste: unos 15–20 min de experto (≈ 10–12 €) + IA (< 0,50 €). Referencia: certificaciones de proveedores cloud cuestan 100–300 €; nosotros no somos un fabricante, así que debemos estar muy por debajo. |
| **Desbloqueo de perfil IA** | Empresa | **89 €** por contacto (frente a 49 € general) | Perfil escaso y certificado por experto; sigue siendo una fracción de una agencia (15–25 % del salario). |
| **Diagnóstico IA de plantilla** | Empresa | **15 € por empleado** (mínimo 20) o **490 €** hasta 40 personas | Los 3 retos de «IA en el trabajo» + informe agregado por departamento. Sirve como evidencia de alfabetización en IA. Producto recurrente (anual). |
| **Reto técnico a medida** | Empresa | **499 €** por vacante (frente a 299 € general) | Lo diseña un experto con el stack real de la empresa. |
| **Evento Impact IA** | Empresas patrocinadoras | Por evento (ver doc 05 del plan Impact) | Lista corta de perfiles certificados el día del evento. |

### Red de expertos (la pieza que hace creíble todo)

- 5–10 profesionales de IA en activo que revisan certificaciones y escriben indicadores. Pago por revisión (≈ 10–12 € por certificación), sin coste fijo.
- Cada revisión queda registrada con el experto (seudonimizado) y la versión de la rúbrica: es lo que exige el diccionario («revisión humana de decisiones relevantes») y el Reglamento de IA.
- Las correcciones de los expertos son además el **gold set** con el que se calibra el corrector automático (doc 05).

## 7. Qué hay que construir, por orden

1. Área «Tecnología → Inteligencia artificial» en la taxonomía (doc 01) y los 6 itinerarios en la oferta.
2. 10 retos de fase 1 (uno por competencia de la ola 1), con ficha completa como la del §4, revisados por un experto.
3. Los 3 retos de «IA en el trabajo».
4. Rúbrica técnica en el servidor (`RUBRICAS.tecnico_ia`: corrección técnica 35 · justificación 25 · riesgos y límites 20 · comunicación técnica 20) y lista de errores que penalizan por reto.
5. Defensa en directo (2 preguntas sobre la propia entrega), primero en texto.
6. Fase 2: sandbox de ejecución y tests ocultos.

## 8. Decisiones para el equipo

- [ ] ¿Precio diferenciado de desbloqueo para perfiles IA (89 €)?
- [ ] ¿Lanzamos el «Diagnóstico IA de plantilla» como producto B2B separado?
- [ ] ¿Quién forma la primera red de expertos? (Contactos del máster y de los Eventos Impact.)
- [ ] ¿Probamos el formato «reto con IA permitida»?
