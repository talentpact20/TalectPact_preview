# 4. Plan financiero

Fuente de verdad: modelo financiero TalentPact, escenario **base**, horizonte **36 meses** (ene 2026 – dic 2028), actualizado el 17/04/2026 (`tfm/assets/TalentPact_modelo_financiero.xlsx`). Las cifras del *investor deck* se usan como narrativa; cuando hay divergencia (resultado neto 2028, caja de cierre), **gana el Excel**.

El equipo del TFM son **dos socios**: Xavier Griñó e Ivan Sánchez. El modelo conserva una masa salarial de cuatro líneas lean (€1.200/mes en 2026) para no rehacer las proyecciones: dos corresponden a los socios y las otras dos a las **primeras contrataciones** (producto/desarrollo y growth) previstas al escalar.

---

## 4.1 Supuestos base

| Supuesto | Valor | Comentario |
|---|---|---|
| Escenario | Base (factor de crecimiento = 1) | El Excel permite 0,8 conservador / 1,3 agresivo; aquí se presenta solo el base |
| Geografía | España → UE en año 3 | Coherente con el SAM del apartado 2 |
| Precio Individual | €49 / contacto | Palanca principal (*pay-per-result*) |
| Plan Pro / Enterprise | €199 / €499 al mes | Mix: 25 % Pro, 8 % Enterprise |
| Retos a medida | €299 / vacante | 5 % de las empresas |
| B2C extra | €5 / reto | A partir de ago-2026; ~3 % de candidatos pagan |
| Contactos / empresa Individual | 1,2 al mes | Hipótesis de uso |
| Churn mensual B2B | 5 % (2026) → 4 % (2027) → 3,5 % (2028) | Mejora con producto y lock-in del SkillPass |
| Stripe | 2 % sobre ingreso bruto | Pasarela; no hay token ni custodia cripto |
| Coste IA | €0,02 / ejercicio (~€0,06 / reto) | **Supuesto conservador.** Lo medido es menor: $0,0180 ≈ €0,0165/ejercicio (~€0,05/reto). Se mantiene el 0,02 para que el modelo vaya por detrás de la realidad, no por delante (§6.2.4) |
| Impuesto | 15 % sobre EBITDA positivo | Tipo reducido de empresa de nueva creación |
| DSO / DPO | 2 / 30 días | Cobro casi al contado (tarjeta); proveedores a 30 |

Crecimiento de **nuevas empresas**: arranque lento (1 alta/mes los primeros meses) y aceleración a partir de abril. Candidatos: efecto de red, con altas de dos dígitos porcentuales al inicio que se normalizan.

---

## 4.2 Presupuesto inicial (CapEx / OpEx)

**CapEx** (equipos): €5.000 (ene-2026), €8.000 (ene-2027), €15.000 (ene-2028). Total **€28.000** en tres años. El producto es software: no hay inversión industrial.

**OpEx estructural (SG&A), año 1:**

| Partida | Importe anual 2026 | Notas |
|---|---|---|
| Salarios | €57.600 | €4.800/mes (equipo lean) |
| Marketing y CAC | €12.271 | LinkedIn Sales Navigator + adquisición B2B |
| Administración (legal, contabilidad, SaaS, hosting) | €7.890 | Picos de constitución SL al inicio |
| Seguros | €400 | |
| **Total SG&A** | **€77.761** | Ver nota sobre los €400 más abajo |

> **Nota de auditoría interna.** Los componentes de arriba suman **€78.161**, mientras que el total declarado es **€77.761**. La diferencia son exactamente los **€400 de Seguros**, que el modelo lista como partida pero **no incluye en el total de SG&A** (el total sale de Marketing €12.271 + Administración €7.890 + Salarios €57.600). El mismo desfase de €400/año se repite en 2027 y 2028, y arrastra el EBITDA al alza en esa cantidad. Se documenta en lugar de corregirlo en silencio: es **€1.200 en tres años**, un 0,9 % del EBITDA positivo de 2028, y no cambia ninguna conclusión —break-even, *runway* ni necesidad de capital—. Lo que sí cambiaría es la credibilidad si lo encontrara el tribunal antes que nosotros.

**COGS** (variable): API Claude + comisión Stripe. En 2026 apenas **€1.063** — el margen bruto no es el problema.

**Financiación de arranque:** €180.000 pre-seed (mes 1, equity/SAFE) + €50.000 préstamo **ENISA** no dilutivo (junio 2026). Capital total **€230.000**.

Uso previsto del pre-seed (€180 k):

| % | Importe | Destino |
|---|---|---|
| 40 % | €72 k | Producto y tech (desarrollo, API Claude, infra) |
| 30 % | €54 k | Sales & marketing B2B (CAC de las primeras cuentas) |
| 15 % | €27 k | Operaciones y legal (SL, RGPD, AI Act) |
| 10 % | €18 k | Compensación lean de socios |
| 5 % | €9 k | Buffer |

El ENISA cubre el segundo semestre de 2026 y alarga el *runway* sin diluir.

---

## 4.3 Proyección de ingresos (3 años)

| | **2026** | **2027** | **2028** |
|---|---:|---:|---:|
| Empresas (dic) | 24 | 129 | 284 |
| Candidatos (dic) | 746 | 3.607 | 8.746 |
| Ingreso bruto | €16.636 | €110.970 | €367.575 |
| Ingreso neto (tras Stripe) | €16.303 | €108.750 | €360.224 |
| ARR (dic × 12) | €41.973 | €224.878 | €496.530 |
| ARPU blended B2B | ~€146 / mes | ~€145 / mes | ~€146 / mes |

Lectura: 2026 es validación (pocas empresas, CAC de aprendizaje). 2027 es rampa. 2028 ya es un SaaS de medio millón de ARR con **284 clientes** — una fracción mínima del SAM español, por eso el techo no es el mercado.

El *ask* del deck (€25 k MRR y 500 empresas a 12 meses) es **aspiracional**. El plan que se defiende aquí es el del Excel: ~€3,5 k MRR a dic-2026 y ~€18,7 k MRR a dic-2027. Es más creíble ante un tribunal.

---

## 4.4 Cuenta de resultados (P&L)

| Partida | **2026** | **2027** | **2028** |
|---|---:|---:|---:|
| Ingreso neto | 16.303 | 108.750 | 360.224 |
| COGS | (1.063) | (7.262) | (22.428) |
| **Gross profit** | **15.240** | **101.488** | **337.796** |
| Gross margin | 93,5 % | 93,3 % | 93,8 % |
| Marketing y CAC | (12.271) | (35.644) | (76.789) |
| Administración | (7.890) | (5.840) | (5.840) |
| Seguros | (400) | (400) | (400) |
| Salarios | (57.600) | (146.400) | (210.000) |
| **SG&A** | **(77.761)** | **(187.884)** | **(292.629)** |
| **EBITDA** | **(62.521)** | **(86.396)** | **45.167** |
| Intereses ENISA | (1.750) | (3.000) | (2.818) |
| Impuestos | — | (22) | (8.171) |
| **Resultado neto** | **(64.271)** | **(89.417)** | **34.178** |

El negocio es un **software de margen ~93,5 %**. Las pérdidas de 2026-2027 no vienen del coste de servir, sino de construir equipo y adquirir las primeras empresas. En 2028 el EBITDA ya es positivo (**+€45 k**, margen 12,5 %).

*(La línea de Seguros aparece en el desglose pero queda fuera del total de SG&A del modelo: ver la nota de auditoría del §4.2. Corregido, el EBITDA de 2028 sería €44.767 en lugar de €45.167.)*

Evolución de salarios (bruto mensual, fin de año):

| Perfil | 2026 | 2027 | 2028 |
|---|---:|---:|---:|
| Cada socio / línea fundadora | 1.200 | 2.000 | 3.000 |
| Desarrollador (alta 2027) | — | 2.500 | 3.000 |
| Marketing (alta 2027) | — | 1.700 | 2.500 |
| **Masa salarial / mes** | **4.800** | **12.200** | **17.500** |

---

## 4.5 Flujo de caja

| | **2026** | **2027** | **2028** |
|---|---:|---:|---:|
| Cash flow operativo (≈ resultado neto) | (64.271) | (89.417) | 34.178 |
| CapEx | (5.000) | (8.000) | (15.000) |
| Equity pre-seed | 180.000 | — | — |
| ENISA (disposición / amortización) | 50.000 | — | (inicio de principal) |
| **Caja a 31 dic** | **160.729** | **63.312** | **73.458** |

- Cobro casi inmediato (DSO 2 días): no hay un problema de *working capital*.
- Valle de caja: **€38.003 en abril 2028**, justo antes del break-even. Nunca se proyecta caja negativa.
- Amortización ENISA: carencia de intereses + capital hasta mayo 2028; desde junio 2028 cuota ~€1.521/mes (interés ~6 % sobre €50 k). Deuda viva a dic-2028: **€40.968**.

---

## 4.6 Punto de equilibrio

| Indicador | Valor |
|---|---|
| Primer mes con EBITDA ≥ 0 | **mayo 2028** (mes 29) |
| Primer mes con resultado neto ≥ 0 | **mayo 2028** |
| Revenue neto/mes para BE operativo (SG&A dic-2027) | ~€18.200 |
| Empresas B2B necesarias (ARPU ~€145) | **~125** |
| Pérdida acumulada hasta el BE | **−€153.688** (2026+2027) |
| Capital para no quedarse seco | **€230 k** (180 + 50) |

Con solo el pre-seed (€180 k) y el *net burn* de 2026 (~€5.210/mes), el *runway* es **~35 meses**. Con ENISA sube a **~44 meses**. A cierre de 2026, con €161 k en caja y el burn de 2027, quedan **~22 meses**: suficiente para llegar a mayo 2028.

---

## 4.7 Financiación y uso de fondos

**Escenario que se defiende (el del modelo):**

1. **Pre-seed €180 k** en mes 1, formato SAFE, para construir producto, cumplir (SL, RGPD, AI Act) y comprar las primeras cuentas B2B.
2. **ENISA €50 k** no dilutivo en mes 6: puente de caja y señal institucional.
3. **Seed** (fuera del horizonte detallado): cuando el *runway* y las métricas lo justifiquen. El deck sitúa una seed en 2027; el Excel **no la necesita** para llegar a break-even si se cumple el base case.

**Por qué no bootstrap puro:** el CAC B2B existe (€238 el primer año) y hay que pagar compliance de alto riesgo (AI Act). Sin los €230 k, el valle de 2028 no se cruza.

**Qué no se financia con cripto:** no hay token, ICO ni *utility coin*. El SkillPass ancla un hash; no es un criptoactivo ofrecido al público (apartado 7).

### Unit economics (recordatorio; detalle en §3.6)

LTV/CAC **11–17×**, *payback* **< 2 meses**, *gross margin* **93,3–93,8 %**. El plan financiero aguanta porque cada empresa nueva se paga sola muy rápido; el riesgo es de **volumen**, no de margen.

---

*Cifras redondeadas al euro. Detalle mensual en `tfm/assets/TalentPact_modelo_financiero.xlsx` (hojas Análisis, P&L, Cashflow, Balance, KPI Dashboard).*
