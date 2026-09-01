# Objetivos y metodología

Este documento es, a la vez, un **plan de negocio** y una **demostración empírica**. No se limita a describir una fintech sobre el papel: construye y despliega el recorrido completo *evaluación con IA → persistencia de la evidencia → sello criptográfico en blockchain*, de modo que cada afirmación de negocio pueda contrastarse con un producto que funciona. Esta sección fija qué se pretende demostrar, con qué evidencia y con qué límites.

## Objetivo general

Diseñar un plan de negocio viable para **TalentPact**, un marketplace europeo de talento anónimo con evaluación por inteligencia artificial y credencial verificable (**SkillPass**), y **contrastarlo** con un prototipo funcional desplegado: evaluación real sobre respuestas abiertas, datos alojados en la Unión Europea y anclaje de integridad en una red pública.

## Objetivos específicos

1. Identificar el problema de contratación basado en CV (fricción, sesgo, información no verificable) y formular una propuesta de valor *fintech*.
2. Estimar el mercado (TAM/SAM/SOM) y situar a TalentPact frente a las categorías de *sourcing* y *assessment*.
3. Articular un modelo de ingresos *pay-per-result* y un plan financiero a 36 meses auditable.
4. Validar la demanda con investigación primaria (encuestas, entrevistas y análisis de tracción) y explicitar sus límites.
5. Profundizar y demostrar el **motor de corrección con IA** (un único agente para 102 retos vía Dynamic Prompting + Chain of Thought): coste real, capacidad de discriminar calidad, resistencia a *prompt injection* y límites metodológicos.
6. Implementar y documentar el flujo **evaluar → guardar → sellar → verificar**, con el SkillPass como ancla keccak256 en un contrato mínimo, reconciliando blockchain con el RGPD (hash *on-chain* / dato *off-chain*).
7. Mapear las obligaciones de AI Act, RGPD y LSSI, y delimitar por qué MiCA y PSD2 quedan fuera del alcance del diseño actual.

## Pregunta e hipótesis de trabajo

**Pregunta.** ¿Puede una plataforma de *skills-based hiring* convertir el resultado de una evaluación por IA en una **prueba de integridad portable**, verificable por un tercero sin necesidad de una cuenta, y sin publicar datos personales en una cadena pública?

**Hipótesis.** Sí, siempre que (a) la evaluación quede trazada *off-chain*, (b) *on-chain* solo se ancle el *hash* del documento, y (c) el verificador pueda recomponer ese hash y compararlo con el registro. El prototipo desplegado en Ethereum Sepolia funciona como prueba de concepto de ese mecanismo; no pretende constituir un criptoactivo ni un sistema de alto riesgo ya certificado.

## Metodología

La investigación combina cinco fuentes de evidencia. Ninguna es suficiente por sí sola: el valor está en que se corrigen mutuamente, cubriendo tanto la dimensión de negocio como la dimensión técnica del proyecto.

La **revisión documental** aporta el marco de mercado, competencia y normativa. De ella salen el dimensionamiento (InfoJobs–Esade 2025, Mordor Intelligence 2026, Future Market Insights), el mapa competitivo y las obligaciones regulatorias (AI Act, RGPD, MiCA). Su límite es evidente y se asume de forma explícita: cifras como el porcentaje de currículos con información exagerada proceden de estudios de terceros y se citan como **contexto**, nunca como medición propia del proyecto.

Las **encuestas y el análisis de la landing** constituyen la primera capa de investigación primaria. Alrededor de treinta cuestionarios completados permiten leer el interés de los candidatos, la disposición de las empresas a sustituir la primera entrevista por una evaluación objetiva y la preferencia mayoritaria por el anonimato en las fases iniciales. Es una muestra **no probabilística**, difundida en el entorno cercano del equipo y a través de la web del proyecto: sirve para orientar decisiones de producto, no para inferir comportamientos del conjunto del mercado español. El detalle y los sesgos se desarrollan en el §2.4.

Las **entrevistas de criterio experto** añaden profundidad cualitativa donde la encuesta solo da una fotografía. Se conversó con empresas del sector y con profesionales de recursos humanos —incluido un *headhunter* de una consultora de selección de referencia— para contrastar si la solución resulta creíble para quien contrata a diario. El material resultante es cualitativo y las citas se atribuyen por rol profesional, nunca por nombre, por acuerdo de confidencialidad.

El **modelo financiero** es la pieza cuantitativa del plan: un libro de cálculo a 36 meses (enero 2026 – diciembre 2028) con cuenta de resultados, tesorería, balance y economía unitaria. Se presenta el escenario **base**; el propio modelo admite variantes más conservadora y más agresiva que no se reproducen aquí para no diluir el análisis. El archivo de cálculo acompaña al documento como anexo digital auditable.

La **construcción del prototipo** cierra el círculo: un motor de evaluación en producción sobre la API de Claude, persistencia en Supabase con residencia de datos en la UE, el contrato `SkillPassRegistry` desplegado en Ethereum Sepolia y un verificador público accesible sin cuenta. Sus límites también se declaran: una red de pruebas no es una red principal, el gas tiene coste cero y todavía no existen cobros reales procesados.

## Criterios de validación del trabajo

El proyecto se considera logrado si se cumplen tres condiciones verificables de forma independiente. La primera, que el motor de evaluación quede documentado con rigor —arquitectura, prueba de concepto, métricas medidas y límites reconocidos— de manera que un lector técnico pueda reproducir el razonamiento. La segunda, que cualquier tercero sea capaz de comprobar la autenticidad de un SkillPass emitido por el prototipo sin depender de la palabra del emisor. Y la tercera, que el plan de negocio sea internamente coherente con ese producto: que los precios, los costes y las proyecciones se apoyen en lo que el sistema hace realmente y no en una versión idealizada de él.

La necesidad de capital que aparece en el plan financiero pertenece al ejercicio de planificación empresarial y describe el recorrido hasta el punto de equilibrio; es un supuesto del modelo, no una condición para la validez técnica de lo construido.
