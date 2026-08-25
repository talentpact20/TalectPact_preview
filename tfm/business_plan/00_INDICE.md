# Business Plan — TalentPact · Índice maestro

Documento compilado (para leer o imprimir a PDF): `../TalentPact_TFM_Business_Plan.html`.

Cada sección se redacta en su propio fichero; el HTML se regenera con `python3 build_doc.py`.

---

## Portada
- Título, autores, máster, fecha, logo.

## Resumen ejecutivo (1-2 págs) → `00_resumen_ejecutivo.md`
- Problema, solución, innovación (IA + CV blockchain), mercado, modelo de ingresos, tracción/PoC, cifras financieras clave, ask de financiación.

## 1. Concepto de negocio → `01_concepto.md`
- 1.1 El problema del mercado laboral (fricción, sesgo, coste, fraude de CV).
- 1.2 La solución TalentPact (anonimato + IA + credencial verificable).
- 1.3 Propuesta de valor única (por qué ahora, por qué nosotros).
- 1.4 Misión, visión y encaje fintech/blockchain.

## 2. Estudio de mercado → `02_mercado.md`
- 2.1 Tamaño de mercado: TAM / SAM / SOM (HR-tech + assessment + credenciales).
- 2.2 Tendencias (skills-based hiring, IA, verifiable credentials, AI Act).
- 2.3 Análisis de competencia (LinkedIn, TestGorilla, HackerRank, Codility, Vervoe…).
- 2.4 Validación de demanda (encuestas / entrevistas / señales de mercado).
- 2.5 Segmentación y buyer personas.

## 3. Modelo de negocio → `03_modelo_negocio.md`
- 3.1 Business Model Canvas.
- 3.2 Propuesta de valor por segmento (candidato / empresa).
- 3.3 Fuentes de ingreso (planes + pay-per-result €49 + retos a medida).
- 3.4 Estructura de costes.
- 3.5 Canales de distribución.
- 3.6 Unit economics (LTV, CAC, márgenes).

## 4. Plan financiero → `04_plan_financiero.md`
- 4.1 Supuestos base.
- 4.2 Presupuesto inicial (CapEx / OpEx).
- 4.3 Proyección de ingresos 3-5 años.
- 4.4 Cuenta de resultados (P&L) proyectada.
- 4.5 Flujo de caja.
- 4.6 Punto de equilibrio (break-even).
- 4.7 Escenarios de financiación (bootstrap / pre-seed / seed) y uso de fondos.

## 5. Estrategia de marketing y ventas → `05_marketing_ventas.md`
- 5.1 Go-to-market.
- 5.2 Embudo de adquisición (candidatos y empresas — two-sided marketplace).
- 5.3 Canales y CAC por canal.
- 5.4 Estrategia de ventas B2B (Pro/Enterprise).
- 5.5 Retención y crecimiento (efectos de red).

## 6. Tecnología y producto → `06_tecnologia_producto.md`
- 6.1 Arquitectura del sistema (producto + IA + persistencia + blockchain).
- 6.2 El motor de IA (Dynamic Prompting + CoT) — resultados reales de la PoC.
- 6.3 Persistencia y datos (Supabase).
- 6.4 **Innovación blockchain: el CV inmutable y verificable** (credencial, anclaje de hash, verificador).
- 6.5 Innovación financiera (pagos pay-per-result / escrow — visión).
- 6.6 Roadmap de producto.

## 7. Regulación y compliance → `07_regulacion_compliance.md`
- 7.1 EU AI Act (sistema de alto riesgo).
- 7.2 RGPD / LOPDGDD (+ reconciliación con blockchain: hash on-chain / dato off-chain).
- 7.3 LSSI.
- 7.4 Pagos: PCI DSS + (si aplica escrow) MiCA / PSD2.
- 7.5 Hoja de ruta de cumplimiento pre-lanzamiento.

## 8. Riesgos y contingencias → `08_riesgos.md`
- 8.1 Riesgos de mercado.
- 8.2 Riesgos técnicos (IA, blockchain).
- 8.3 Riesgos financieros.
- 8.4 Riesgos regulatorios.
- 8.5 Matriz de riesgos y plan de mitigación.

## 9. Anexos
- Resultados de la PoC, capturas del demo, transacción on-chain de ejemplo, referencias.
