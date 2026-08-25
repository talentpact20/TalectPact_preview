# 7. Regulación y compliance

TalentPact opera en el cruce de **empleo, datos personales, inteligencia artificial y (en el demo) blockchain**. No es un banco ni emite un token: aun así, el marco europeo le aplica con fuerza porque **puntuar a una persona para un trabajo es una actividad de alto riesgo**. La tesis del proyecto es *compliance by design*: el mismo diseño que vende (anonimato, trazabilidad, hash on-chain) es el que cumple.

Este apartado cubre lo que ya se puede defender con el producto actual y lo que queda de hoja de ruta **antes de cobrar el primer €49 real**.

---

## 7.1 EU AI Act (Reglamento UE 2024/1689)

El Anexo III clasifica como **sistema de IA de alto riesgo** los usados en **empleo, gestión de trabajadores y acceso al autoempleo** (selección y evaluación de candidatos). El Skill Score **informa** una decisión humana de cribado: encaja en ese anexo.

| Obligación | Cómo lo cubre TalentPact | Estado |
|---|---|---|
| Supervisión humana (Art. 14) | El score no contrata ni rechaza solo; la empresa desbloquea y decide | ✅ Diseño del producto |
| Transparencia / Art. 50 | Hay que avisar al candidato de que la evaluación es asistida por IA | 🟡 Texto legal + UI (pendiente de cierre formal) |
| Trazabilidad / logs (Art. 12) | Cada evaluación guarda score, criterios, CoT, modelo, tokens y coste | ✅ `evaluations` + audit trail |
| Calidad de datos y sesgo | Perfil anónimo; cláusula de equidad en el *system prompt*; objetivo DIR > 0,80 | 🟡 Anonimato sí; *fairness* empírica pendiente de muestra |
| Exactitud y robustez | PoC: discriminación de calidad y 100 % de detección de *prompt injection* | 🟡 Falta *ground truth* con tribunal humano |
| Registro UE (Art. 49) | Alta en base de datos de sistemas de alto riesgo | ⬜ Antes de comercializar en UE |
| Evaluación de conformidad | Documentación técnica + posible organismo notificado | ⬜ Hoja de ruta pre-lanzamiento |

**Posición de producto:** el AI Act no es un coste hundido, es un argumento de venta frente a un Excel de notas opaco o un *scraper* de LinkedIn.

Límite honesto (también en el informe técnico): **aún no hay κ de Cohen contra evaluadores humanos**. Hasta entonces no se puede afirmar “evaluación certificada”; se afirma “evaluación trazable, anónima y resistente a manipulación”, que es lo que el demo prueba.

---

## 7.2 RGPD / LOPDGDD y blockchain

**Roles.** TalentPact (la SL a constituir) es **responsable del tratamiento** de candidatos y de usuarios empresa. Encargados: Supabase (hosting UE), Anthropic (evaluación; hay que firmar DPA y minimizar el prompt), Netlify (hosting de la app).

**Base jurídica.** Ejecución de contrato (cuenta) + consentimiento granulado para evaluación IA, publicación anónima en el pool y emisión del SkillPass.

**Principios aplicados en el producto:**

- **Minimización y anonimato estructural:** el evaluador humano de la empresa no ve nombre, foto, edad ni género hasta el desbloqueo de pago.
- **Pseudonimización:** `user_id` / UUID; el alias público no es el email.
- **Residencia:** Postgres en región UE (Supabase).
- **Retención:** máximo 24 meses para evaluaciones (alineado con el informe técnico); el CoT puede contener fragmentos de la respuesta → se trata como **dato personal**, no como log técnico eterno.
- **Derechos:** acceso, rectificación, portabilidad (exportar JSON del SkillPass), supresión (función de borrar cuenta).

### El conflicto inmutabilidad vs. olvido — y la solución

On-chain **solo viaja el hash** (32 bytes) del documento + metadatos de anclaje (emisor, timestamp). **No hay nombre, email ni scores en claro en la cadena.**

Consecuencias:

1. Un hash no permite reconstruir el CV → no es, por sí solo, un dato que identifique.
2. Si el candidato ejerce el **derecho de supresión**, se borra el JSON y el perfil en Supabase. El hash queda huérfano: no hay documento que casar. La prueba deja de ser usable.
3. Por eso el demo en **Ethereum Sepolia** es compatible con el discurso RGPD; el mismo patrón se mantendría en una L2 de producción.

No se usa una *wallet* del candidato en el demo: TalentPact firma como emisor. Eso simplifica UX y evita custodiar claves de usuarios (otro riesgo PSD2/MiCA que no se abre).

---

## 7.3 LSSI y obligaciones de la web

Como servicio de la sociedad de la información (Ley 34/2002):

- Aviso legal, identidad del prestador (SL, CIF, domicilio en Barcelona cuando exista).
- Política de privacidad y de cookies (consentimiento si hay analítica no esencial).
- Condiciones de uso distintas para candidato y empresa (el €49 es un contrato B2B).
- Canal de contacto (ya hay `hola@talentpact.com` / email del equipo).

Hasta constituir la sociedad, la web es **demo académica / beta**; no se debe presentar como servicio comercial cerrado. Eso hay que dejarlo explícito en producción pública (el pie de página ya habla de *preview*).

---

## 7.4 Pagos: PCI, PSD2, MiCA — qué aplica y qué no

| Norma | ¿Aplica al plan actual? | Por qué |
|---|---|---|
| **PCI DSS** | Indirectamente | Los cobros irán por **Stripe** (o equivalente). TalentPact no almacena PAN. Cumple el SAQ-A de Stripe. |
| **PSD2 / entidad de pago** | **No** (hoy) | No se reciben fondos de terceros para transferirlos; no hay *escrow* propio ni IBAN de clientes. |
| **MiCA** | **No** (hoy) | No se emite ni se ofrece un criptoactivo al público. El SkillPass no es un token negociable ni un *utility* vendido. El gas de testnet lo paga la wallet emisora de demo, sin valor real. |
| **Custodia de cripto** | **No** | El candidato no deposita ETH ni claves en TalentPact. |

**Visión (apartado 6.5), no el demo:** un *escrow* con stablecoin para el pay-per-result sí rozaría PSD2/MiCA. Por eso **no se construye ahora**. Si algún día se hiciera, el camino sería: EMI/entidad de pago colaboradora o un *crypto-asset service provider* autorizado; no “un contrato en Sepolia y ya”.

Impuestos: IVA en B2B UE según reglas de servicios electrónicos; el modelo simplifica el IVA en caja a efectos de proyección (hoja Cashflow, informativo).

---

## 7.5 Hoja de ruta de cumplimiento pre-lanzamiento

Orden práctico, de más bloqueante a menos:

1. **Constituir SL** y nombramiento de DPO interno o externo (recomendable por el volumen de datos de empleo).
2. **DPIA** (evaluación de impacto) del flujo candidato → IA → pool → SkillPass.
3. Contratos: DPA con Supabase, Anthropic, Netlify, Stripe; cláusulas al candidato y a la empresa.
4. Aviso Art. 50 AI Act en el momento del reto (“esta prueba la corrige un sistema de IA”).
5. Registro del sistema de alto riesgo y expediente de conformidad (documentación técnica del modelo, rúbricas, límites).
6. Calibración con evaluadores humanos (cierra el hueco de *accuracy* del informe técnico).
7. Revisión legal del patrón hash on-chain (dictamen corto; el diseño ya es el estándar “ancla de integridad”).
8. Solo entonces: **cobrar €49** y dejar de ser preview.

Coste previsto en el Excel: partida *Legal* (pico de constitución en 2026) + *Compliance y Seguridad* (€100/mes desde 2027). Es deliberadamente magro: el grueso del cumplimiento **ya está en el diseño del producto**, no en un ejército de abogados.

---

*Base: Reglamento UE 2024/1689, RGPD 2016/679, LOPDGDD, LSSI 34/2002. El detalle técnico del anclaje está en el apartado 6 y en `tfm/tech/SPEC_TECNICA_DEMO.md`.*
