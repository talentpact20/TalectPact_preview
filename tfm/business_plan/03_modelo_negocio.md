# 3. Modelo de negocio

## 3.1 Business Model Canvas

| Bloque | Contenido |
|---|---|
| **Segmentos de clientes** | **B2B (pagan):** startups/pymes tech, departamentos de RRHH con contratación recurrente, agencias/headhunters. **B2C (usuarios):** talento junior o en reconversión, perfiles infrarrepresentados, profesionales tech. |
| **Propuesta de valor** | Contratar por habilidades reales verificadas, sin sesgo y pagando solo por resultado. Para el candidato: demostrar lo que sabe y obtener un CV verificable que le pertenece. |
| **Canales** | Web (talentpact.io), ventas B2B *outbound* (LinkedIn Sales Navigator), marketing de contenidos/SEO, comunidad de candidatos, boca-oreja por efecto de red. |
| **Relación con clientes** | *Self-service* para candidatos; *sales-assisted* + éxito de cliente para Pro/Enterprise; soporte con chatbot IA. |
| **Fuentes de ingreso** | 5 palancas: €49/contacto (pay-per-result), Pro €199/mes, Enterprise €499/mes, retos a medida €299/vacante, Premium candidato €5/reto extra. |
| **Recursos clave** | El motor de evaluación IA, el catálogo de 102 retos + rúbricas, la base de datos de talento verificado, la infraestructura de credenciales blockchain, el equipo. |
| **Actividades clave** | Desarrollo y calibración del motor IA, curación del catálogo de retos, adquisición B2B, emisión y anclaje de credenciales, compliance (AI Act/RGPD). |
| **Socios clave** | Anthropic (API Claude), Supabase (datos UE), Netlify (app + funciones), Stripe (pagos, visión comercial), red blockchain (demo en Ethereum Sepolia; producción prevista en L2), asesoría legal (AI Act/RGPD). |
| **Estructura de costes** | COGS (API IA ~€0,02/eval + Stripe 2 % + gas blockchain), SG&A (salarios, marketing/CAC, infra, legal/compliance). |

## 3.2 Propuesta de valor por segmento

**Candidato (lado oferta):** oportunidad de demostrar habilidades sin barreras de CV; anonimato que elimina el sesgo; CV verificable y portable en blockchain; gratis hasta 5 retos/semana. *El candidato aporta la oferta de talento que hace valioso el marketplace.*

**Empresa (lado demanda):** cribado en minutos por skills verificadas; pago solo por resultado; cumplimiento del EU AI Act por diseño; cero fraude de CV. *La empresa es quien monetiza el marketplace.*

## 3.3 Fuentes de ingreso (5 palancas)

| Palanca | Precio | Tipo | Rol |
|---|---|---|---|
| **Desbloqueo de contacto** | **€49/contacto** | Pay-per-result (transaccional) | Palanca principal. Sin compromiso; la empresa paga solo cuando quiere el contacto. |
| **Plan Pro** | €199/mes | Suscripción B2B | 5 contactos incluidos + ofertas ilimitadas. RRHH recurrente. |
| **Plan Enterprise** | €499/mes | Suscripción B2B | Contactos ilimitados + soporte dedicado. Grandes equipos. |
| **Retos a medida** | €299/vacante | Servicio B2B | Ejercicios diseñados para una oferta concreta. High-value. |
| **Candidato Premium** | €5/reto extra | B2C | Monetiza *power users* a partir del 6º reto semanal sin bloquear a la mayoría. |

**Mix de clientes asumido (modelo base):** 25 % Pro, 5 % retos a medida, 8 % Enterprise, resto transaccional; 3 % de candidatos pagan B2C. **ARPU blended ≈ €145/empresa/mes.**

## 3.4 Estructura de costes

**COGS (coste variable, escala con el uso):**
- API de IA (Claude): **€0,02/evaluación**, ~€0,06/reto (3 ejercicios). Medido en producción.
- Comisión de pago (Stripe): **2 %** sobre ingreso bruto.
- Coste de anclaje en blockchain: marginal en L2 (céntimos por credencial; en testnet, €0).

**SG&A (coste fijo/estructural):**
- Salarios (principal partida): €4.800/mes año 1 (dos socios + dos primeras contrataciones presupuestadas, lean) → €12.200 (año 2) → €17.500 (año 3).
- Marketing y CAC: creciente con la adquisición B2B.
- Infraestructura (Supabase + Vercel), licencias SaaS, legal/compliance (RGPD + AI Act).

**Gross Margin ≈ 93-94 %** de forma sostenida: el negocio es un SaaS/marketplace de software puro, con COGS mínimo. El motor de evaluación es económicamente sostenible incluso a gran escala (~€140/mes de API a 10.000 evaluaciones/mes).

## 3.5 Canales de distribución

- **Adquisición B2B (demanda):** *outbound* en LinkedIn (Sales Navigator), demos a startups/pymes tech, contenido y casos de uso. Es el canal que se monetiza y donde se concentra el CAC.
- **Adquisición B2C (oferta):** SEO/contenido, comunidad, redes, boca-oreja. Coste bajo: los candidatos vienen atraídos por la promesa de "demuestra lo que vales".
- **Efecto de red:** cada nuevo candidato mejora el pool para las empresas y viceversa, reduciendo el CAC con el tiempo y creando coste de cambio.

## 3.6 Unit economics

Métricas del modelo financiero base (36 meses):

| Métrica | 2026 | 2027 | 2028 |
|---|---|---|---|
| **CAC B2B** (€/nueva empresa) | €238 | €195 | €256 |
| **LTV B2B** | €2.725 | €3.389 | €3.904 |
| **Ratio LTV/CAC** (sano >3x) | **11,5x** | **17,3x** | **15,2x** |
| **Payback CAC** (meses) | 1,7 | 1,4 | 1,9 |
| **Churn mensual empresas** | 5 % | 4 % | 3,5 % |
| **ARPU blended** (€/empresa/mes) | €146 | €145 | €146 |
| **Gross Margin** | 93,5 % | 93,3 % | 93,8 % |

**Lectura:** el ratio **LTV/CAC de 11-17x** (frente al umbral sano de 3x y excelente de 5x) y el *payback* inferior a 2 meses indican un modelo de adquisición muy eficiente. El reto no es la economía unitaria —que es excelente— sino **alcanzar volumen** de empresas B2B, que es donde se juega el break-even (ver apartado 4).

---

*Cifras: modelo financiero TalentPact (base case, 36 meses). Ver `tfm/assets/TalentPact_modelo_financiero.xlsx` y el apartado 4.*
