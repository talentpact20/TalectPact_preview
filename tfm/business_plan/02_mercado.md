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

El mercado se divide hoy en dos categorías estancas —*sourcing* (encontrar) y *evaluación* (medir)— y ningún actor las une ni añade anonimato o verificabilidad.

| Plataforma | Tipo | Precio | Debilidad clave |
|---|---|---|---|
| LinkedIn Recruiter | Sourcing | $170-900/mes | Solo CVs, no evalúa habilidades, muy caro |
| HackerRank | Evaluación | $100/mes | Solo tech, $20/test extra, lock-in anual |
| Codility | Evaluación | $100/mes | Solo tech, demo obligatoria, 15 invites/mes |
| TestGorilla | Evaluación | $75+/mes | Tests genéricos, sin anonimato, sin pool |
| CodeSignal | Evaluación | $6K+/año | Solo enterprise, pricing opaco y cerrado |
| **TalentPact** | **Sourcing + Evaluación** | **€49/contacto** | **Único: pool + IA + anonimato + pay-per-result + credencial verificable** |

**Ventajas competitivas defendibles (*moats*):**
- **Modelo de precio disruptivo:** *pay-per-result* frente a licencias fijas caras. La empresa solo paga cuando obtiene valor.
- **Anonimato estructural:** ningún competidor ofrece cribado ciego real; es a la vez propuesta de valor y mecanismo anti-sesgo (AI Act).
- **Doble red (two-sided):** cuantos más candidatos, más atractivo para empresas, y viceversa → efecto de red y coste de cambio creciente.
- **Credencial verificable en blockchain:** diferenciador único que además genera *lock-in* positivo (el candidato acumula su historial verificado en TalentPact).

## 2.4 Validación de la demanda (investigación primaria)

La demanda no se da por supuesta: el equipo la contrastó al construir el MVP (presentación *TalentPact — Presentación MVP*, 2026, sección «Feedback recibido»; cifras reiteradas en el *Investor Deck* v2). Hubo **tres frentes**, alineados con la pregunta “¿el mercado necesita esto?”.

### Método

| Frente | Instrumento | Pregunta que responde |
|---|---|---|
| Validación del problema | Difusión en círculo cercano + encuestas en la *landing* + análisis de fricción del proceso de selección | ¿Es una necesidad percibida? |
| Criterio experto | Conversaciones con empresas y profesionales de RRHH / *headhunters* | ¿La solución es creíble para quien contrata? |
| Tracción | Cuenta profesional de LinkedIn, *posts*, tráfico y analítica de la *landing* | ¿El mercado reacciona sin campaña grande? |

No se dispone en este tomo del microdato (formulario crudo). Las magnitudes se toman de esas presentaciones y se tratan como **investigación exploratoria**, no como inferencia estadística a la población española.

### Resultados de encuestas

| Indicador | Resultado | Lectura |
|---|---|---|
| Cuestionarios completados | **n ≈ 30** | Muestra pequeña |
| Candidatos interesados en el proyecto | **~90 %** | Fuerte *willingness* a probar retos |
| Empresas dispuestas a **sustituir la primera entrevista** por la evaluación TalentPact | **65 %** | Señal de *willingness to switch* en el lado que paga |
| Candidatos que prefieren **anonimato** en las fases iniciales | **7 de cada 10** | Encaja con el diseño de perfil ciego |
| Reclutadores que admiten que el CV **no refleja** la capacidad técnica | **80 %** | Confirma el diagnóstico del problema (declarativo) |

Citas recogidas en el MVP (roles, no nombres):

> «Hemos confirmado que el CV genera un cuello de botella crítico: las empresas pierden semanas en entrevistas fallidas por no tener una validación técnica previa.» — *perfil de autónomo*

> «El sesgo de origen bloquea a candidatos brillantes: hay una predisposición total del talento a realizar retos prácticos a cambio de visibilidad real.» — *perfil junior*

### Criterio experto

| Alcance | Resultado |
|---|---|
| Empresas del sector contactadas | **≥ 3** |
| Profesionales de RRHH / selección | **≥ 5** (incluye perfiles con más de 10 años y un *headhunter* de **Hays**) |

> «Estamos pasando de la economía de las acreditaciones (títulos) a la economía de las evidencias (retos técnicos comprobados).» — *profesional de RRHH, +10 años*

> «Eliminar el nombre y la edad del primer impacto visual nos permite centrarnos en diversidad real. El anonimato es la clave para desbloquear talento que hoy ignoramos.» — *headhunter, Hays*

Los expertos coincidieron, según el MVP, en que un *score* verificado **reduce el tiempo de cribado técnico**.

El *Investor Deck* v2 añade voz de demanda y de oferta (CTO de una SaaS de ~15 empleados; desarrolladora junior en búsqueda activa) en la misma línea: semanas de CVs sin contratar / no poder demostrarse. Se usan como **ilustración**, no como muestra representativa.

### Tracción del landing / MVP

- Prototipo público (entonces `talentpact.io`; producto de referencia **talentpact.es**).
- Tráfico cualificado de **6 países en la primera semana**.
- **+500 visitas** a la web en ese arranque.
- Actividad en LinkedIn profesional (*posts* e interacciones) como canal de difusión, no como campaña de *paid*.

Eso valida **interés y alcance geográfico inicial** del relato “retos técnicos + anonimato”. No valida conversión a €49 ni retención B2B.

### Límites (imprescindibles en defensa)

1. **n ≈ 30** y reclutamiento en círculo cercano + *landing*: sesgo de autoselección; el ~90 % de interés está **inflado** respecto a un muestreo aleatorio.
2. Las preguntas exactas y los cruces (edad, sector, si pagaría) **no están tabulados** aquí.
3. “80 % de reclutadores” es un resultado de *esta* ronda exploratoria, no un meta-análisis.
4. Seis países y 500 visitas miden **atención**, no *willingness to pay*.

**Conclusión de §2.4.** Hay señal suficiente para un TFM y para un pre-seed *lean*: el problema se reconoce, el anonimato se valora, una mayoría de empresas de la muestra probaría sustituir la primera entrevista. No hay, todavía, evidencia de *product-market fit* de pago.

## 2.5 Segmentación y buyer personas

**Lado demanda (clientes de pago — empresas):**
- *Startups y pymes tech* (5-50 empleados) que contratan perfiles cualificados sin equipo de RRHH grande ni presupuesto para licencias caras. **Segmento inicial prioritario.**
- *Departamentos de RRHH* de empresas medianas con alto volumen de contratación recurrente (planes Pro/Enterprise).
- *Agencias y headhunters* que buscan pre-cribado verificado.

**Lado oferta (usuarios — candidatos):**
- *Talento junior y en reconversión* penalizado por el CV (poca experiencia formal, cambio de sector) que quiere demostrar capacidad.
- *Perfiles infrarrepresentados* que se benefician del cribado ciego (el anonimato aumenta su participación).
- *Profesionales tech* que valoran una credencial verificable y portable de sus habilidades.

---

*Fuentes secundarias: SHRM 2024, Glassdoor/Adecco, ResumeLab 2024, Leadership IQ, InfoJobs-Esade 2025, Mordor Intelligence 2026, Future Market Insights, Vendr/Capterra (precios, MVP). Investigación primaria: Presentación MVP 2026 («Feedback recibido») e Investor Deck v2. SAM: estimación propia.*
