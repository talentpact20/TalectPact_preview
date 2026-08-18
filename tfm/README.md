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
| **③ CV inmutable en blockchain** | Credencial verificable: se ancla el *hash* del CV en una blockchain, dato personal off-chain (RGPD) | 🔨 **Código completo, pendiente de desplegar** (contrato, funciones, UI y verificador listos; falta la wallet de testnet — ver `tech/SETUP_CHECKLIST.md`) |

**Innovación financiera secundaria (solo en el plan, no se construye):** pagos pay-per-result con escrow/stablecoin (MiCA/PSD2) y visión de reputación profesional portable.

## 3. Decisiones tomadas

- **Base del TFM:** TalentPact (se reutiliza todo el trabajo previo de `entrega_final/` y `poc_entrega2/`).
- **Ángulo blockchain (hero):** **CV inmutable / credencial verificable** construido sobre las evaluaciones IA.
- **Nivel del demo:** **Nivel 1 — todo real** (persistencia real + anclaje real en testnet + verificador funcional, para un candidato demo).
- **Persistencia:** **Supabase** (Postgres + RLS, región UE, tier gratuito).
- **Blockchain:** testnet gratuita (propuesta: **Polygon Amoy**), anclaje de hash + Verifiable Credential. Ver `tech/SPEC_TECNICA_DEMO.md`.
- **Patrón RGPD:** datos personales off-chain; solo el hash on-chain (reconcilia inmutabilidad con derecho al olvido).

## 3.1 Estado del demo técnico (agosto 2026)

| Pieza | Dónde vive | Estado |
|---|---|---|
| Contrato `SkillPassRegistry` | `tech/contracts/SkillPassRegistry.sol` | ✅ Escrito y compilando (solc 0.8.36, sin avisos) |
| Script de despliegue | `tech/scripts/deploy-contract.js` (`npm run deploy:contract`) | ✅ Listo — sustituye al paso manual con Remix |
| Diagnóstico de configuración | `tech/scripts/doctor.js` (`npm run doctor`) | ✅ Listo |
| Emisión de credencial | `netlify/functions/issue-credential.js` | ✅ Con cuentas reales (Supabase Auth) y reutilización si el CV no cambió |
| Anclaje on-chain | `netlify/functions/anchor-credential.js` | ✅ Escrito — sin probar hasta desplegar el contrato |
| Verificación | `netlify/functions/verify-credential.js` + `verify.html` | ✅ Escrito — sin probar hasta desplegar el contrato |
| Botón en el portal de candidato | `index.html` → tarjeta "Tu SkillPass verificable" | ✅ Construido |
| **Contrato desplegado en Amoy** | — | ⬜ **Bloqueante**: requiere wallet de testnet + gas del faucet |

Todo lo pendiente está detallado paso a paso en `tech/SETUP_CHECKLIST.md`.

## 4. Estructura de entregables que pide el enunciado

| # | Apartado del enunciado | Documento | Estado |
|---|---|---|---|
| 1 | Concepto de negocio | `business_plan/01_concepto.md` | ✅ Borrador |
| 2 | Estudio de mercado | `business_plan/02_mercado.md` | ✅ Borrador |
| 3 | Modelo de negocio | `business_plan/03_modelo_negocio.md` | ✅ Borrador |
| 4 | Plan financiero | `business_plan/04_plan_financiero.md` | ⬜ |
| 5 | Estrategia de marketing y ventas | `business_plan/05_marketing_ventas.md` | ⬜ |
| 6 | Tecnología y producto (+ blockchain) | `business_plan/06_tecnologia_producto.md` | ✅ Borrador |
| 7 | Regulación y compliance | `business_plan/07_regulacion_compliance.md` | ⬜ |
| 8 | Riesgos y contingencias | `business_plan/08_riesgos.md` | ⬜ |
| — | Demo técnico funcional | `tech/SPEC_TECNICA_DEMO.md` | 🔨 |
| — | Deck de defensa | `business_plan/09_deck.md` | ⬜ |

## 5. Plan por fases (hasta principios de septiembre)

| Fase | Fechas aprox. | Contenido |
|---|---|---|
| **F0 — Setup** | 17–19 ago | Estructura, índice, spec técnica del demo ← *en curso* |
| **F1 — Concepto + Mercado** | 20–24 ago | Apartados 1 y 2 |
| **F2 — Modelo + Producto + Demo** | 25–28 ago | Apartados 3 y 6 + construir persistencia y blockchain |
| **F3 — Finanzas + Marketing** | 29 ago–1 sep | Apartados 4 y 5 |
| **F4 — Compliance + Riesgos + Integración** | 2–4 sep | Apartados 7 y 8 + compilar documento |
| **F5 — Deck + Defensa** | 5–10 sep | Deck + ensayo + Q&A |

## 6. Pendiente de aportar / decidir por el equipo

- El máster **no exige plantilla ni formato concreto** (confirmado) → usamos estructura de business plan estándar profesional.
- **Firma del TFM y equipo:** las entregas previas van a nombre de Xavier + Ivan, pero la empresa/deck tiene 4 co-founders (Oscar, Carlos, Ivan, Xavier). Decidir cómo se presenta.
- **Reconciliar cifras** entre el modelo financiero (xlsx, fuente de verdad) y el deck v2 (pequeñas divergencias). Ver `ASSETS_EXISTENTES.md` §12.

---

## 7. Material reutilizable

**Ya en el repo:**
- `entrega_final/INFORME_TECNICO_FINAL.md` — arquitectura, métricas reales de IA, compliance, roadmap.
- `poc_entrega2/` — PoC del Agente Evaluador (Python) + resultados.
- `index.html` — producto web funcional (candidato/empresa/superadmin).
- `netlify/functions/evaluate-exercise.js` — motor de corrección IA en producción.

**Aportado por el equipo (sintetizado en `ASSETS_EXISTENTES.md`):**
- **MVP deck** — problema, solución, mercado (España + global), competencia, validación y tracción reales.
- **Modelo financiero (xlsx, 36 meses)** — P&L, cashflow, balance, break-even (mayo 2028), KPIs SaaS, financiación €180K + €50K ENISA.
- **Investor deck v2** — 12 slides nivel inversor, incluye equipo (4 co-founders), why now, use of funds y the ask.

> **Cobertura real del TFM: ~70-80 % ya existe.** El trabajo nuevo es: (1) compilar en formato business plan, (2) **añadir la capa blockchain (CV inmutable)**, (3) construir el demo real (persistencia + blockchain), (4) reconciliar/ampliar financials con el coste blockchain.
