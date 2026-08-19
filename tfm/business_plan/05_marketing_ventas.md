# 5. Estrategia de marketing y ventas

TalentPact es un **marketplace de dos caras**. El error clásico es gastar en candidatos cuando quien paga es la empresa, o al revés: vender B2B con un pool vacío. La estrategia es **desequilibrar a propósito al inicio** (llenar oferta de talento barata) y **monetizar la demanda** (empresas) con un CAC que el modelo ya demuestra que se recupera en menos de dos meses.

---

## 5.1 Go-to-market

**Playa de desembarco:** startups y pymes tech en **España** (5–50 empleados) que contratan perfiles cualificados sin un equipo de RRHH grande ni presupuesto para LinkedIn Recruiter. Es el segmento que en la validación dijo que sustituiría la primera entrevista (65 % de empresas encuestadas).

**Secuencia:**

| Fase | Objetivo | Cómo |
|---|---|---|
| 0. Demo / TFM (ahora) | Probar el relato IA → persistencia → SkillPass | Producto público + credencial on-chain real (testnet) |
| 1. Oferta (candidatos) | 746 usuarios a dic-2026 | Gratis, SEO, comunidad, boca-oreja. Coste marginal ~€0 |
| 2. Demanda (empresas) | 24 clientes de pago a dic-2026 | Outbound LinkedIn + demos. Aquí se gasta el CAC |
| 3. Rampa 2027 | 129 empresas / 3.607 candidatos | Referidos, casos de uso, plan Pro |
| 4. UE (2028) | 284 empresas | Replicar el playbook; ARR ~€0,5 M |

No se abre un segundo país hasta que España tenga un *playbook* de ventas repetible (ciclo corto, CAC conocido, churn bajando).

**Posicionamiento:** no competimos con LinkedIn en *feed* ni con HackerRank en *tests* sueltos. Competimos en **“contratar por evidencia verificable, pagando solo si hay match”**. El SkillPass es el argumento que LinkedIn no puede copiar en un trimestre.

---

## 5.2 Embudo de dos lados

```
CANDIDATOS                         EMPRESAS
visita web  →  registro anónimo    visita / outbound → demo
     ↓                                   ↓
reto evaluado por IA               filtro del pool
     ↓                                   ↓
SkillPass (sello)                  desbloqueo €49  →  cliente
     ↓                                   ↓
más candidatos = pool mejor        más ofertas = más candidatos
```

**Embudo candidato (gratis, volumen):**

1. Captación: contenido (“demuestra lo que sabes”), SEO, universidades y comunidades de reconversión.
2. Activación: primer reto en la misma sesión. Si no hay evaluación en el día 1, el usuario no vuelve.
3. Retención: 5 retos/semana gratis; el 6.º a €5 no es el negocio, es un freno a abusos.
4. Resultado: perfil + SkillPass portable (el motivo para no irse a otra plataforma).

**Embudo empresa (de pago):**

1. Captación: LinkedIn Sales Navigator (€79/mes en el modelo) + inbound de contenidos.
2. Activación: demo de 20 min y un SkillPass real verificado en 30 segundos (el verificador público).
3. Conversión: primer desbloqueo a €49 (fricción mínima frente a un contrato anual de €6 k).
4. Expansión: Pro €199 (5 contactos) → Enterprise €499. El *land-and-expand* es el camino al ARPU de ~€145.
5. Retención: el pool mejora con el tiempo; el historial de candidatos verificados no se lleva el cliente a TestGorilla.

Hipótesis de conversión usadas en el Excel: ~1,2 contactos/mes por empresa en plan Individual; churn 5 % → 3,5 %. No se modela un embudo de 500 empresas en 12 meses (cifra del deck): **no es coherente con el base case**.

---

## 5.3 Canales y CAC

| Canal | Lado | Coste en modelo | Rol |
|---|---|---|---|
| LinkedIn Sales Navigator + outbound | B2B | €79/mes + tiempo de socio | Canal de ingresos. Dueño: Xavier (growth) |
| Contenido / SEO / web | Ambos | Bajo (producto + tiempo) | Demanda cualificada y candidatos |
| Comunidad y universidades | B2C | Casi €0 | Llenar el pool |
| Referidos empresa→empresa | B2B | Comisiones implícitas (churn↓) | Año 2–3 |
| Paid ads | B2B, selectivo | Dentro de “CAC / Marketing Acquisition” | Solo cuando el outbound esté calibrado |

**CAC B2B** (marketing total ÷ nuevas empresas), del modelo:

| | 2026 | 2027 | 2028 |
|---|---:|---:|---:|
| CAC | €238 | €195 | €256 |
| LTV | €2.725 | €3.389 | €3.904 |
| LTV / CAC | 11,5× | 17,3× | 15,2× |
| Payback | 1,7 meses | 1,4 meses | 1,9 meses |

2028 el CAC sube un poco (más competencia, más spend): sigue siendo excelente. Presupuesto de marketing y CAC: **€12 k / €36 k / €77 k** en 2026–2028.

Regla operativa: **no se escala paid** hasta que el *payback* medido (no el modelado) sea < 3 meses en un cohort de ≥15 empresas.

---

## 5.4 Ventas B2B (Pro / Enterprise)

| Segmento | Motion | Mensaje | Objeción típica |
|---|---|---|---|
| Individual / pyme | *Self-serve* + WhatsApp | “Paga €49 cuando quieras el contacto” | “¿Y si el pool está vacío?” → mostrar candidatos reales del sector |
| Pro (€199) | Demo + onboarding | “Cinco contactos y ofertas ilimitadas” | “Ya pago LinkedIn” → coste hundido vs. resultado |
| Enterprise (€499) | Venta asistida | Pool + retos a medida + AI Act | Legal/compras → dossier de compliance (apartado 7) |
| Retos a medida (€299) | Servicio | Ejercicios de *su* vacante | Precio → vs. una entrevista fallida (€4.700 de coste medio de hire) |

Ciclo de venta objetivo: **días, no trimestres**. El €49 es una puerta de entrada deliberada: el cierre “grande” es el upgrade a Pro cuando el equipo de RRHH usa la herramienta cada semana.

Argumento de defensa comercial (y de TFM) que no tiene el competidor: **pegar un JSON o un hash y ver el sello on-chain**. Eso convierte una demo de software en una demo de *confianza*.

Equipo de ventas en el plan: en 2026 venden los **dos socios**. En 2027 entra la línea de Marketing (€1.700/mes) del modelo. No hay SDR army.

---

## 5.5 Retención y crecimiento (efectos de red)

Tres palancas de retención, una de ellas específica del TFM:

1. **Efecto de red clásico.** Más candidatos → mejor matching → más empresas → más ofertas → más candidatos. El churn B2B baja de 5 % a 3,5 % precisamente por eso.
2. **SkillPass (lock-in positivo).** El candidato acumula evidencias verificables. Irse a otra plataforma es tirar un historial que **otras empresas ya pueden comprobar** en `verify.html`. Eso no es un muro sucio: es propiedad del usuario que, aun así, se ancla al emisor.
3. **Cumplimiento.** Una empresa que ha integrado un proceso *AI Act-ready* no cambia de tool en dos semanas.

Crecimiento inorgánico (fuera de este plan): partners de formación, ETT/headhunters (Hays ya dio *feedback* cualitativo), y a medio plazo interoperar la credencial con la **EU Digital Identity Wallet** (visión, no año 1).

**Métricas que se miran cada mes:** nuevas empresas, CAC, churn, contactos/empresa, candidatos activos que completan ≥1 reto, SkillPass emitidos. Si los SkillPass no se emiten, el diferenciador fintech no existe en el mercado aunque el código esté listo.

---

*Canales y precios alineados con el apartado 3 y con el modelo financiero. Cifras de CAC/LTV: hoja Análisis del Excel.*
