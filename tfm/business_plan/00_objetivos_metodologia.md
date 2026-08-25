# Objetivos y metodología

Este trabajo es un **plan de negocio** —el entregable que pide el enunciado del máster— y, a la vez, una **demostración empírica**: no se limita a describir una fintech, sino que construye el *vertical slice* IA → persistencia → sello en blockchain. Esta sección fija qué se pretende demostrar y con qué evidencia, para que el resto del documento no se lea como un *pitch*.

## Objetivo general

Diseñar un plan de negocio viable para **TalentPact**, un marketplace europeo de talento anónimo con evaluación por inteligencia artificial y credencial verificable (**SkillPass**), y **contrastarlo** con un prototipo funcional desplegado (evaluación real, datos en la UE y anclaje de integridad en testnet).

## Objetivos específicos

1. Identificar el problema de contratación basado en CV (fricción, sesgo, fraude de información) y formular una propuesta de valor *fintech*.
2. Estimar el mercado (TAM/SAM/SOM) y situar a TalentPact frente a *sourcing* y *assessment*.
3. Articular un modelo de ingresos *pay-per-result* y un plan financiero a 36 meses auditable.
4. Validar la demanda con investigación primaria (encuestas, entrevistas, tracción del MVP) y explicitar sus límites.
5. Implementar y documentar el flujo **evaluar → guardar → sellar → verificar**, reconciliando blockchain con el RGPD (hash on-chain / dato off-chain).
6. Mapear obligaciones de AI Act, RGPD, LSSI y el no-alcance de MiCA/PSD2 en el diseño actual.

## Pregunta e hipótesis de trabajo

**Pregunta.** ¿Puede una plataforma de *skills-based hiring* convertir el resultado de una evaluación por IA en una **prueba de integridad portable**, verificable por un tercero sin cuenta, sin publicar datos personales en una cadena pública?

**Hipótesis.** Sí, si (a) la evaluación queda trazada off-chain, (b) on-chain solo se ancla el *hash* del documento, y (c) el verificador recompone el hash y lo compara con el registro. El prototipo en Ethereum Sepolia es la prueba de concepto; no pretende ser un criptoactivo ni un sistema de alto riesgo ya certificado.

## Metodología

Se combinan cinco fuentes. Ninguna, por sí sola, basta; juntas cubren el enunciado (negocio) y el ángulo del máster (IA + blockchain).

| Fuente | Qué aporta | Límite |
|---|---|---|
| **Revisión documental** | Mercado (InfoJobs–Esade 2025, Mordor 2026, FMI), competencia, normas (AI Act, RGPD, MiCA) | Cifras de “78 % de CVs falsos” (ResumeLab) y similares son **secundarias**: se citan como contexto, no como medición propia |
| **Encuestas y landing (MVP, 2026)** | n ≈ 30 cuestionarios; interés de candidatos (~90 %), disposición de empresas a sustituir la 1.ª entrevista (65 %), preferencia de anonimato (7/10) | Muestra **no probabilística**, difundida en círculo cercano y landing: no se infiere a España. Detalle en §2.4 |
| **Entrevistas de criterio experto** | ≥3 empresas; ≥5 profesionales de RRHH, incluido un *headhunter* de Hays | Cualitativo; las citas se atribuyen por rol, no por nombre |
| **Modelo financiero** | Excel base, 36 meses (17/04/2026): P&L, caja, balance, unit economics | Escenario **base**; no se presentan aquí los modos 0,8/1,3 del propio libro. El `.xlsx` es el anexo digital |
| **Construcción del demo** | Claude en producción, Supabase (UE), contrato `SkillPassRegistry` en Sepolia, `verify.html` | Testnet ≠ mainnet; el gas es €0; no hay pagos Stripe reales |

**Criterio de éxito del TFM (no del plan de *fundraising*):** que un tercero pueda comprobar un SkillPass emitido por el prototipo, y que el plan de negocio sea internamente coherente con ese producto. El *ask* de €180 k es del plan financiero, no una petición al tribunal.

## Estructura del documento

Los apartados **1–8** siguen el enunciado (concepto, mercado, modelo, finanzas, marketing, tecnología, regulación, riesgos). El **resumen ejecutivo** abre; las **conclusiones** cierran. Los anexos recogen evidencia on-chain, capturas de la PoC de IA, el extracto del modelo financiero y la bibliografía.
