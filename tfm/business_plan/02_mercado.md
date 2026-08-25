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
2. **IA madura y asequible.** Evaluar respuestas abiertas con feedback a escala es viable hoy: el motor de TalentPact corrige a **~€0,02 por evaluación** (medido en producción con Claude). Hace tres años esto era económicamente inviable.
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

## 2.4 Validación de la demanda (tracción real)

La hipótesis no es teórica: se ha validado con mercado real en tres frentes.

**Validación del problema (encuestas y entrevistas):**
- +30 encuestas completadas; **+90 % de candidatos interesados** en el proyecto.
- **65 % de las empresas** encuestadas dispuestas a sustituir la primera entrevista por la evaluación de TalentPact.
- **7 de cada 10 candidatos** prefieren mantener el anonimato en las fases iniciales.
- 80 % de los reclutadores admite que el CV no refleja la capacidad técnica del candidato.

**Criterio experto:**
- Contacto con +3 empresas del sector y +5 profesionales de RRHH, incluido un **headhunter de Hays** y perfiles de RRHH con +10 años.
- Conclusión de experto: *"Estamos pasando de la economía de las acreditaciones a la economía de las evidencias"* y *"el anonimato es la clave para desbloquear talento que hoy ignoramos"*.

**Tracción de mercado:**
- MVP funcional público en talentpact.io.
- Tráfico cualificado de **6 países en la primera semana** y **+500 visitas** a la web, validando el interés y la escalabilidad del modelo.

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

*Fuentes: SHRM 2024, Glassdoor/Adecco, ResumeLab 2024, Leadership IQ, InfoJobs-Esade 2025, Mordor Intelligence 2026, Future Market Insights. Datos de validación y tracción: investigación primaria del equipo (2026). Las estimaciones de SAM se marcan como propias y se refinarán con datos por país.*
