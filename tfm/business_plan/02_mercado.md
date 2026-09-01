# 2. Estudio de mercado

## 2.1 Tamaño de mercado (TAM / SAM / SOM)

El mercado de adquisición de talento es enorme, está en crecimiento sostenido y atraviesa una transición estructural hacia el *skills-based hiring* y la IA.

### TAM — Mercado global

| Indicador | Valor | Fuente |
|---|---|---|
| Mercado global de *recruiting* | **$690 B (2026)** → $989 B (2031), CAGR 7,47 % | Mordor Intelligence 2026 |
| *Talent-acquisition tech* (software) | **$169 B (2025)** | Future Market Insights |
| Cuota del sector IT en recruiting global | 29 % | Mordor 2026 |
| Agencias que ya usan IA para *screening* | 70 %+ | Mordor 2026 |
| EMEA sobre ingresos globales de *staffing* | 40 % | Mordor 2026 |

Tomamos como **TAM operativo** el segmento de *talent-acquisition technology*: **$169 B**, que es donde compite TalentPact (software de sourcing + evaluación), no el mercado de servicios de staffing.

### SAM — Mercado abordable (Europa/España)

Aplicando la cuota EMEA (~40 %) al software de talent-acquisition y acotando al subsegmento realista de TalentPact —**evaluación de habilidades + sourcing para pymes y empresas tech**— estimamos un **SAM europeo del orden de €8-12 B** *(estimación propia a partir de Mordor + FMI; se refinará con datos por país)*.

El punto de entrada es **España**, un mercado grande y con una ineficiencia evidente (datos InfoJobs-Esade 2025):

| Dato España 2025 | Valor |
|---|---|
| Vacantes publicadas | **2,46 M** (récord, +1 % vs 2024) |
| Candidatos activos | **4,25 M** (+5 %, récord) |
| Candidatos por vacante | **56** (era 52 en 2024) |
| Inscripciones en ofertas | 136 M (+7 %) |
| Paro juvenil <25 años | 24,9 % (2× media UE) |

### SOM — Mercado obtenible (3 años)

El SOM se construye *bottom-up* y es **coherente con el modelo financiero** (no una proyección optimista desacoplada): captar cientos de empresas B2B en España en 36 meses.

| Año | Empresas cliente (dic) | Candidatos (dic) | Ingreso neto | ARR (dic) |
|---|---|---|---|---|
| 2026 | 24 | 746 | €16.303 | €41.973 |
| 2027 | 129 | 3.607 | €108.750 | €224.878 |
| 2028 | 284 | 8.746 | €360.224 | €496.530 |

Con **284 empresas y ~8.700 candidatos a finales de 2028**, TalentPact captura una fracción mínima (<0,01 %) del SAM: hay recorrido de sobra para escalar. La restricción no es el tamaño del mercado, sino la ejecución.

## 2.2 Tendencias que habilitan el proyecto ("Why now")

Tres fuerzas convergen justo ahora y hacen de 2026 el momento:

1. **Saturación del mercado (demanda de filtro).** 56 candidatos por vacante en España: las empresas están colapsadas de CVs y necesitan un filtro por habilidades reales con urgencia.
2. **IA madura y asequible.** Evaluar respuestas abiertas con feedback a escala es viable hoy: el motor de TalentPact corrige a **~€0,0165 por evaluación** ($0,0180 medidos con Claude). Hace tres años esto era económicamente inviable.
3. **Presión regulatoria (EU AI Act, vigente).** El AI Act clasifica la contratación asistida por IA como *alto riesgo* y exige procesos **auditables, explicables y no discriminatorios**. Un sistema anónimo con scoring trazable no solo cumple: convierte el cumplimiento en ventaja competitiva.

A estas tres se suma una cuarta tendencia que fundamenta la capa blockchain:

4. **Auge de las credenciales verificables (*Verifiable Credentials* / identidad soberana).** El mercado se mueve hacia certificaciones digitales que el individuo posee y puede verificar sin intermediarios (impulso de estándares W3C, la eIDAS 2.0 europea y la *EU Digital Identity Wallet*). TalentPact aplica esta tendencia al talento: la skill validada como credencial portable y a prueba de fraude.

## 2.3 Análisis de la competencia

El mercado de la tecnología de contratación está hoy dividido en dos categorías que apenas se hablan entre sí. Por un lado están las plataformas de **sourcing**, cuya función es localizar personas: acumulan perfiles, permiten buscarlos por criterios declarativos y venden el acceso a esa base de datos. Por otro están las plataformas de **evaluación**, que administran pruebas técnicas a candidatos que la empresa ya ha localizado por otros medios. Encontrar y medir son, en la práctica, dos compras distintas, con dos contratos distintos y dos proveedores distintos. Esa separación es precisamente la ineficiencia sobre la que se construye TalentPact.

**El bloque de sourcing** lo domina LinkedIn Recruiter, que es a la vez el referente y el problema. Su fortaleza es incontestable —el mayor censo profesional del mundo— y su debilidad es estructural: lo que ofrece son currículos digitales, es decir, información declarada por el propio candidato y no verificada por nadie. La herramienta ayuda a encontrar a alguien, pero no dice absolutamente nada sobre si esa persona sabe hacer el trabajo. A eso se suma un modelo comercial de licencia por puesto y por mes, en un rango que va de los ciento setenta a los novecientos dólares mensuales, que la empresa paga con independencia de que el proceso termine en contratación o en nada. Para una pyme de veinte personas que abre tres vacantes al año, la ecuación es sencillamente mala.

**El bloque de evaluación** está más fragmentado y es más especializado, pero comparte tres limitaciones. HackerRank y Codility son las referencias en pruebas técnicas de programación: funcionan bien en su terreno, con precios de partida en torno a los cien dólares mensuales, pero están acotadas al perfil de desarrollador y facturan aparte los volúmenes altos —tests adicionales en el primer caso, un número limitado de invitaciones mensuales en el segundo— dentro de contratos de permanencia anual. TestGorilla amplía el catálogo hacia competencias no técnicas con un precio de entrada más bajo, a costa de trabajar con tests genéricos y estandarizados que no se adaptan a la vacante concreta. CodeSignal se sitúa en el extremo corporativo, con contratos que superan los seis mil dólares anuales y una política de precios opaca que exige negociación comercial previa: es una solución pensada para grandes departamentos de recursos humanos, no para el segmento que TalentPact aborda primero.

Las tres limitaciones que comparten son relevantes. La primera es que **evalúan a quien la empresa ya ha encontrado**: no aportan candidatos, con lo que el cuello de botella del *sourcing* permanece intacto. La segunda es que **ninguna ofrece anonimato real**: el evaluador ve el nombre, el historial y con frecuencia el perfil social del candidato antes o durante la prueba, de modo que el sesgo entra en la decisión por la puerta de atrás justo cuando se pretendía medir competencia. Y la tercera es que **el resultado no es portable**: la puntuación vive dentro de la plataforma que la generó, pertenece a la empresa que pagó la prueba y no puede ser reutilizada ni verificada por un tercero. Un candidato que supera una prueba técnica exigente no se lleva nada de ese esfuerzo al siguiente proceso, y debe empezar de cero.

TalentPact se sitúa deliberadamente **entre ambas categorías**. Aporta un conjunto de perfiles ya evaluados, de modo que resuelve el problema de encontrar; entrega la evaluación hecha, con desglose por criterios, de modo que resuelve el problema de medir; y lo hace bajo un esquema de cobro por resultado que sustituye la licencia fija por un coste ligado al valor obtenido. A eso añade dos elementos que hoy no ofrece ningún competidor: el anonimato en la fase de cribado y una credencial cuya autenticidad puede comprobar cualquiera desde fuera de la plataforma.

De ahí se derivan cuatro ventajas competitivas que conviene evaluar con realismo, distinguiendo las que protegen de verdad de las que solo diferencian el discurso.

La primera es el **modelo de precio**. Cobrar por resultado en lugar de por licencia traslada el riesgo de la prueba del cliente al proveedor y elimina la principal objeción de la pyme, que es comprometerse con una cuota antes de saber si el producto le sirve. Es una ventaja comercial muy potente en la fase de captación, aunque hay que reconocer que es también la más fácil de imitar: cualquier competidor puede cambiar su política de precios en un trimestre si detecta que pierde cuentas por ese motivo.

La segunda es el **anonimato estructural**, que resulta más difícil de copiar de lo que parece. No consiste en ocultar un campo en la interfaz, sino en rediseñar el flujo completo para que la decisión inicial se tome sin información personal, lo que obliga a disponer de una señal de calidad alternativa —la evaluación— que ocupe el lugar del currículo. Un competidor de *sourcing* que quisiera replicarlo tendría que renunciar a mostrar el activo que precisamente vende. Además, el anonimato funciona simultáneamente como propuesta de valor comercial y como mecanismo de mitigación de sesgo alineado con las exigencias regulatorias europeas.

La tercera es el **efecto de red de un mercado de dos lados**. Cada candidato adicional mejora la calidad del conjunto disponible para las empresas, y cada empresa activa aumenta el incentivo del talento para evaluarse. Es la ventaja que más protege a largo plazo y, al mismo tiempo, la más frágil al principio: mientras el volumen sea pequeño, el efecto de red juega en contra y hay que compensarlo con captación deliberadamente desequilibrada, tal como se detalla en el apartado 5.

La cuarta es la **credencial verificable**. Es el diferenciador técnicamente más profundo, porque no depende de una funcionalidad sino de un protocolo: la evidencia sale de la plataforma y sigue siendo comprobable fuera de ella. Genera un efecto de permanencia positivo —el candidato acumula un historial verificado que no quiere abandonar— sin encerrarlo, ya que la credencial le pertenece y puede llevársela. Ningún competidor ofrece hoy nada equivalente, y construirlo exige competencias de criptografía y cumplimiento normativo que no forman parte del perfil habitual de estas empresas.

Conviene, en cualquier caso, una lectura prudente. Los competidores citados están consolidados, disponen de recursos muy superiores, de fuerza comercial establecida y de bases de clientes que llevan años acumulando. TalentPact no compite hoy en igualdad de condiciones y su ventaja no reside en tener más medios, sino en ocupar un espacio que las estructuras actuales de esos actores hacen incómodo de habitar.

## 2.4 Validación de la demanda (investigación primaria)

La demanda no se da por supuesta. El equipo la contrastó durante la fase de investigación del proyecto, antes y durante el desarrollo del producto, con el objetivo de responder a una pregunta muy concreta: ¿el mercado necesita realmente esto, o se trata de una solución elegante para un problema que nadie percibe como urgente? El trabajo de campo se organizó en **tres frentes complementarios**, cada uno diseñado para cubrir un ángulo que los otros dos no alcanzaban.

El primer frente fue la **validación del problema**. Antes de preguntar si la solución gustaba, había que comprobar que el dolor existía y que las personas afectadas lo reconocían como tal. Para ello se combinó la difusión de un cuestionario estructurado en el entorno profesional cercano del equipo y a través de la web del proyecto con un análisis de la fricción del proceso de selección tal y como lo describen quienes lo sufren en ambos lados. La pregunta a responder era si se trata de una necesidad percibida o de una carencia que solo se ve desde fuera.

El segundo frente fue el **criterio experto**. Una encuesta mide intención declarada, pero no captura el juicio de quien conoce las restricciones operativas reales de un departamento de selección. Por eso se mantuvieron conversaciones con empresas del sector y con profesionales de recursos humanos y de la búsqueda directiva, con el objetivo de someter la propuesta a alguien capaz de detectar por qué no funcionaría. La pregunta era si la solución resulta creíble para quien contrata a diario y conoce sus limitaciones.

El tercer frente fue la **medición de tracción**. Las opiniones son baratas; el comportamiento observable lo es menos. Se publicó un prototipo accesible, se difundió a través de una cuenta profesional y se analizó el tráfico resultante y su procedencia geográfica. La pregunta era si el mercado reacciona ante el planteamiento sin necesidad de una inversión publicitaria significativa detrás.

Los tres frentes se tratan como **investigación exploratoria** y no como inferencia estadística sobre la población española. El microdato en bruto de los formularios no se reproduce en este documento, y las magnitudes que siguen deben leerse con esa cautela.

### Resultados de encuestas

| Indicador | Resultado | Lectura |
|---|---|---|
| Cuestionarios completados | **n ≈ 30** | Muestra pequeña |
| Candidatos interesados en el proyecto | **~90 %** | Fuerte *willingness* a probar retos |
| Empresas dispuestas a **sustituir la primera entrevista** por la evaluación TalentPact | **65 %** | Señal de *willingness to switch* en el lado que paga |
| Candidatos que prefieren **anonimato** en las fases iniciales | **7 de cada 10** | Encaja con el diseño de perfil ciego |
| Reclutadores que admiten que el CV **no refleja** la capacidad técnica | **80 %** | Confirma el diagnóstico del problema (declarativo) |

Citas recogidas durante el proyecto (roles, no nombres):

> «Hemos confirmado que el CV genera un cuello de botella crítico: las empresas pierden semanas en entrevistas fallidas por no tener una validación técnica previa.» — *perfil de autónomo*

> «El sesgo de origen bloquea a candidatos brillantes: hay una predisposición total del talento a realizar retos prácticos a cambio de visibilidad real.» — *perfil junior*

### Criterio experto

| Alcance | Resultado |
|---|---|
| Empresas del sector contactadas | **≥ 3** |
| Profesionales de RRHH / selección | **≥ 5** (incluye perfiles con más de 10 años y un *headhunter* de **Hays**) |

> «Estamos pasando de la economía de las acreditaciones (títulos) a la economía de las evidencias (retos técnicos comprobados).» — *profesional de RRHH, +10 años*

> «Eliminar el nombre y la edad del primer impacto visual nos permite centrarnos en diversidad real. El anonimato es la clave para desbloquear talento que hoy ignoramos.» — *headhunter, Hays*

Los expertos consultados coincidieron en que un resultado verificado **reduce el tiempo de cribado técnico**, que es donde se concentra el coste oculto del proceso. Las conversaciones aportaron además voz de los dos lados del mercado —responsables técnicos de empresas pequeñas que describen semanas de revisión de currículos sin llegar a contratar, y perfiles junior que no encuentran forma de demostrar lo que saben— en la misma línea. Se utilizan como **ilustración cualitativa** del problema, no como muestra representativa.

### Tracción del prototipo

- Prototipo público accesible desde la web del proyecto (producto de referencia **talentpact.es**).
- Tráfico cualificado procedente de **6 países en la primera semana**.
- **Más de 500 visitas** a la web en ese arranque.
- Actividad en redes profesionales como canal de difusión orgánica, sin campaña de pago.

Estos datos validan **interés y alcance geográfico inicial** del planteamiento «retos técnicos más anonimato». No validan la conversión a un pago efectivo ni la retención de clientes empresa a lo largo del tiempo, que son cuestiones distintas y que solo puede resolver un piloto comercial real.

### Límites

1. Con **n ≈ 30** y un reclutamiento realizado en el entorno cercano y a través de la propia web, existe un sesgo de autoselección evidente: quien responde a un cuestionario sobre una idea que le han hecho llegar tiende a mostrarse favorable. El ~90 % de interés está, por tanto, **inflado** respecto a lo que arrojaría un muestreo aleatorio.
2. Las preguntas exactas y los cruces por edad, sector o disposición a pagar **no están tabulados** en este documento.
3. El 80 % de reclutadores que admiten la insuficiencia del CV es un resultado de *esta* ronda exploratoria, no la conclusión de un meta-análisis.
4. Seis países y quinientas visitas miden **atención**, no disposición a pagar. Son magnitudes de interés, no de mercado.

**Conclusión del §2.4.** Existe señal suficiente para justificar el desarrollo y una primera fase comercial acotada: el problema se reconoce con claridad por ambos lados, el anonimato se valora de forma consistente y una mayoría de las empresas consultadas se plantearía sustituir la primera entrevista por una evaluación objetiva previa. Lo que todavía no existe es evidencia de encaje producto-mercado con clientes de pago, y este documento no la presenta como si la hubiera.

## 2.5 Segmentación y buyer personas

La segmentación de TalentPact tiene una particularidad que condiciona todo lo demás: quien usa el producto de forma intensiva y quien lo paga no son la misma persona. Es la característica estructural de cualquier mercado de dos lados, y obliga a construir dos estrategias de captación con lógicas, costes y mensajes distintos.

**El lado de la demanda está formado por las empresas, que son quienes pagan.** El segmento prioritario en la fase inicial son las **startups y pymes tecnológicas de entre cinco y cincuenta empleados**. Contratan perfiles cualificados de forma recurrente, pero no disponen de un departamento de recursos humanos con estructura propia ni de presupuesto para licencias anuales de herramientas corporativas. La decisión de compra suele recaer en el responsable técnico o en la dirección general, lo que acorta enormemente el ciclo de venta: no hay comité de compras ni proceso de homologación de proveedores. Es además el segmento que peor sufre el problema, porque una contratación equivocada en un equipo de quince personas tiene un impacto proporcionalmente devastador. Por todo ello es el punto de entrada natural.

El segundo segmento son los **departamentos de recursos humanos de empresas medianas** con volumen de contratación sostenido. Aquí el ciclo de venta es más largo y aparecen requisitos de cumplimiento, integración y soporte que el segmento anterior no plantea, pero el valor por cuenta es sensiblemente mayor y la relación es más estable en el tiempo. Es el destinatario natural de los planes de suscripción, que sustituyen el pago por operación cuando el uso se vuelve habitual, y el segmento en el que la trazabilidad del proceso de evaluación se convierte en un argumento decisivo frente al departamento jurídico.

El tercero son las **agencias de selección y los profesionales de la búsqueda directiva**, que representan un caso de uso distinto: no contratan para sí mismos, sino que revenden capacidad de cribado a sus propios clientes. Para ellos el valor está en disponer de un pre-filtrado verificado que reduce el tiempo dedicado a cada proceso y les permite presentar candidatos con evidencia objetiva detrás. Es un segmento con potencial de volumen alto y con capacidad de actuar como canal de distribución indirecto, aunque exige una madurez de producto que no se alcanza el primer año.

**El lado de la oferta lo componen los candidatos, que no pagan pero sin los cuales no hay producto.** El perfil central es el **talento junior o en proceso de reconversión profesional**: personas penalizadas por un currículo que no refleja lo que saben hacer, bien porque acumulan poca experiencia formal, bien porque proceden de otro sector. Para este colectivo, la posibilidad de demostrar competencia mediante un ejercicio práctico no es una comodidad, sino la única vía realista de entrar en procesos que hoy los descartan en el primer filtro. Es también el segmento con mayor disposición a invertir tiempo en resolver retos, porque el retorno esperado es alto.

Un segundo grupo lo forman los **perfiles infrarrepresentados**, que se benefician de forma directa del cribado ciego. La eliminación del nombre, la edad, la fotografía y el origen en la fase inicial de selección no es solo un argumento de equidad: es un incentivo de participación concreto y medible, y explica por qué el anonimato aparece de forma tan consistente como preferencia en la investigación primaria.

El tercer grupo son los **profesionales técnicos ya consolidados**, que se acercan por una razón distinta a las anteriores. No necesitan demostrar que saben, pero sí valoran disponer de una credencial verificable y portable de sus competencias, especialmente en un contexto donde la señal de calidad en el mercado laboral es cada vez más ruidosa. Aportan además calidad al conjunto de perfiles disponibles, lo que resulta decisivo para que la propuesta sea atractiva del lado de la empresa.

La consecuencia estratégica de esta segmentación es clara y se desarrolla en el apartado 5: la captación del lado de la oferta debe ser masiva y de coste marginal muy bajo, apoyada en contenido, comunidad y recomendación; la del lado de la demanda es selectiva, comercialmente intensiva y es donde se concentra el coste de adquisición.

---

*Fuentes secundarias: SHRM 2024, Glassdoor/Adecco, ResumeLab 2024, Leadership IQ, InfoJobs-Esade 2025, Mordor Intelligence 2026, Future Market Insights, Vendr/Capterra y precios públicos de competencia (2026). Investigación primaria: encuestas, entrevistas de criterio experto y analítica del prototipo realizadas por el equipo durante el proyecto. SAM: estimación propia.*
