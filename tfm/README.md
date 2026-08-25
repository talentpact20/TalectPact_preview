# TFM — TalentPact: Business Plan de una Fintech

**Máster en Fintech, Mercados Financieros y Blockchain**
**Autores:** Xavier Griñó · Ivan Sánchez
**Defensa:** septiembre 2026 (tribunal)

Este directorio contiene todo el trabajo del Trabajo Fin de Máster: el **business plan** completo y la **spec técnica** del demo funcional que lo respalda.

---

## 1. Idea en una frase

> **TalentPact** es un marketplace europeo de talento **100 % anónimo** donde los candidatos demuestran sus habilidades con retos prácticos **corregidos en tiempo real por IA**, y el resultado se convierte en un **CV inmutable y verificable en blockchain** que el candidato posee y puede presentar a cualquier empresa. Las empresas acceden a perfiles pre-validados bajo un modelo **pay-per-result** (€49 por contacto desbloqueado).

## 2. La innovación (triple capa)

| Capa | Qué es | Estado |
|---|---|---|
| **① Corrección con IA** | Motor de evaluación (Dynamic Prompting + Chain of Thought) que puntúa 102 tipos de reto sin código específico | ✅ **Construido y funcionando** (Claude, función serverless) |
| **② Persistencia real** | Base de datos (Supabase/Postgres UE) que guarda perfiles, evaluaciones y credenciales | ✅ **Construido y en uso** (Supabase Auth + tablas, con `localStorage` como respaldo local) |
| **③ CV inmutable en blockchain** | Credencial verificable: se ancla el *hash* del CV en una blockchain, dato personal off-chain (RGPD) | ✅ **Demo real en Ethereum Sepolia** (contrato desplegado, anclaje y verificador públicos) |

**Innovación financiera secundaria (solo en el plan, no se construye):** pagos pay-per-result con escrow/stablecoin (MiCA/PSD2) y visión de reputación profesional portable.

## 3. Decisiones tomadas

- **Base del TFM:** TalentPact (se reutiliza todo el trabajo previo de `entrega_final/` y `poc_entrega2/`).
- **Ángulo blockchain (hero):** **CV inmutable / credencial verificable** construido sobre las evaluaciones IA.
- **Nivel del demo:** **Nivel 1 — todo real** (persistencia real + anclaje real en testnet + verificador funcional, para un candidato demo).
- **Persistencia:** **Supabase** (Postgres + RLS, región UE, tier gratuito).
- **Blockchain:** testnet **Ethereum Sepolia** (el faucet de Polygon Amoy pedía crypto de mainnet). Anclaje de hash + credencial verificable. Ver `tech/SPEC_TECNICA_DEMO.md` y `tech/build/deployment-sepolia.json`.
- **Patrón RGPD:** datos personales off-chain; solo el hash on-chain (reconcilia inmutabilidad con derecho al olvido).
- **Autores del TFM:** Xavier Griñó e Ivan Sánchez (no se presenta el equipo de 4 del deck inversor).
- **Cifras:** gana el Excel (`assets/TalentPact_modelo_financiero.xlsx`) frente al deck cuando divergen.

## 3.1 Estado del demo técnico (agosto 2026)

| Pieza | Dónde vive | Estado |
|---|---|---|
| Contrato `SkillPassRegistry` | `tech/contracts/SkillPassRegistry.sol` | ✅ Escrito y compilando (solc 0.8.36, sin avisos) |
| Script de despliegue | `tech/scripts/deploy-contract.js` (`npm run deploy:contract`) | ✅ Listo — sustituye al paso manual con Remix |
| Diagnóstico de configuración | `tech/scripts/doctor.js` (`npm run doctor`) | ✅ Listo |
| Emisión de credencial | `netlify/functions/issue-credential.js` | ✅ Con cuentas reales (Supabase Auth) |
| Anclaje on-chain | `netlify/functions/anchor-credential.js` | ✅ Anclaje real en Sepolia |
| Verificación | `netlify/functions/verify-credential.js` + `verify.html` | ✅ Página pública + panel empresa |
| Botón en el portal de candidato | `index.html` → SkillPass visual | ✅ Construido |
| Contrato en Sepolia | `0x85418F3d978e691C0f784bA63E4cB2826478f73A` | ✅ Desplegado (ago 2026) |

Todo lo pendiente está detallado paso a paso en `tech/SETUP_CHECKLIST.md`.

## 4. Estructura de entregables que pide el enunciado

| # | Apartado del enunciado | Documento | Estado |
|---|---|---|---|
| 1 | Concepto de negocio | `business_plan/01_concepto.md` | ✅ |
| 2 | Estudio de mercado | `business_plan/02_mercado.md` | ✅ |
| 3 | Modelo de negocio | `business_plan/03_modelo_negocio.md` | ✅ |
| 4 | Plan financiero | `business_plan/04_plan_financiero.md` | ✅ |
| 5 | Estrategia de marketing y ventas | `business_plan/05_marketing_ventas.md` | ✅ |
| 6 | Tecnología y producto (+ blockchain) | `business_plan/06_tecnologia_producto.md` | ✅ |
| 7 | Regulación y compliance | `business_plan/07_regulacion_compliance.md` | ✅ |
| 8 | Riesgos y contingencias | `business_plan/08_riesgos.md` | ✅ |
| — | Resumen ejecutivo | `business_plan/00_resumen_ejecutivo.md` | ✅ |
| — | Demo técnico funcional | `tech/SPEC_TECNICA_DEMO.md` | ✅ (Sepolia) |
| — | Documento único | `tfm/TalentPact_TFM_Business_Plan.pdf` | ✅ |
| — | Deck de defensa | `business_plan/09_deck.md` | ⬜ |

## 5. Plan por fases (hasta principios de septiembre)

| Fase | Fechas aprox. | Contenido |
|---|---|---|
| **F0 — Setup** | 17–19 ago | Estructura, índice, spec técnica del demo |
| **F1 — Concepto + Mercado** | 20–24 ago | Apartados 1 y 2 |
| **F2 — Modelo + Producto + Demo** | 25–28 ago | Apartados 3 y 6 + construir persistencia y blockchain |
| **F3 — Finanzas + Marketing** | ago 2026 | Apartados 4 y 5 ← *redactados* |
| **F4 — Compliance + Riesgos** | ago 2026 | Apartados 7 y 8 ← *redactados* |
| **F5 — Integración + Deck + Defensa** | sep 2026 | Un solo documento + deck + Q&A |

## 6. Decisiones de redacción (cerradas)

- Sin plantilla de la universidad → business plan profesional en Markdown (luego se junta a un documento).
- **Firma:** Xavier Griñó e Ivan Sánchez.
- **Cifras:** Excel base case. El deck se usa como relato; si un número no cuadra (NI 2028, caja, “500 empresas en 12 meses”), no entra.

---

## 7. Material reutilizable

**Ya en el repo:**
- `entrega_final/INFORME_TECNICO_FINAL.md` — arquitectura, métricas reales de IA, compliance, roadmap.
- `poc_entrega2/` — PoC del Agente Evaluador (Python) + resultados.
- `index.html` — producto web funcional (candidato/empresa/superadmin).
- `netlify/functions/evaluate-exercise.js` — motor de corrección IA en producción.

**Fuentes aportadas (ahora en el repo o usadas para redactar):**
- `tfm/assets/TalentPact_modelo_financiero.xlsx` — P&L, cashflow, balance, break-even (mayo 2028), KPIs SaaS, €180 k + €50 k ENISA. **Fuente de verdad numérica.**
- Investor deck v2 (pptx, Descargas) — use of funds y relato; el equipo de 4 **no** se usa en el TFM.
- MVP `talentpact-mvp-final.pdf` — validación y mercado (ya volcado en apartados 1–2).

> Los 8 apartados del enunciado están redactados en `business_plan/`. Falta **juntarlos** en un solo documento y el deck de defensa.
