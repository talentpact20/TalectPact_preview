# Resumen ejecutivo

**TalentPact** es un marketplace europeo de talento **100 % anónimo**. El candidato demuestra habilidades con retos prácticos **corregidos por IA**; la empresa filtra un pool pre-validado y paga **solo por resultado** (€49 por contacto). Las dos aportaciones del máster son el **evaluador** (un agente, Dynamic Prompting + CoT, **€0,0165/ejercicio medido**, con 84 tests y un banco de métricas reproducible) y el **SkillPass** (keccak256 anclado on-chain; un tercero verifica el documento sin fiarse de un PDF).

**El problema.** Contratar dura ~42 días y cuesta ~€4.700 en España; una fracción alta de CVs no es verificable (fuentes secundarias: SHRM 2024, Glassdoor/Adecco, ResumeLab 2024). El filtro sigue siendo un papel.

**Validación propia (investigación del proyecto, 2026).** n ≈ 30 encuestas: ~90 % de candidatos interesados; **65 %** de empresas de la muestra dispuestas a sustituir la primera entrevista; **7/10** candidatos quieren anonimato al inicio. Criterio experto (≥5 profesionales, Hays). Tracción: 6 países y ~500 visitas en la primera semana. Muestra exploratoria, no probabilística (detalle en §2.4).

**La solución construida.** (1) Evaluación con Claude ($0,0180 ≈ €0,0165 por ejercicio), (2) persistencia en Supabase (UE), (3) sello on-chain en Ethereum Sepolia y verificador público. Producto: **talentpact.es**.

**Modelo.** Cinco palancas (€49, Pro €199, Enterprise €499, retos a medida €299, extra B2C €5). Margen bruto **~93,5 %**. LTV/CAC **11–17×**.

**Finanzas (base, Excel 17/04/2026).** Pre-seed **€180 k** + ENISA **€50 k**. 24 → 129 → 284 empresas (2026–2028). Ingreso neto €16 k / €109 k / €360 k. Break-even **mayo 2028**; neto 2028 **+€34 k**. Extracto del modelo en anexo C.

**Equipo.** Xavier Griñó e Ivan Sánchez. Universitat de Barcelona. Máster en Fintech, Mercados Financieros y Blockchain. Septiembre 2026.

**Alcance.** El SkillPass no es un criptoactivo (MiCA no aplica). El evaluador no está calibrado contra un tribunal humano: se mide acuerdo con la banda de la rúbrica, no κ de Cohen inter-evaluador. El €180 k es del plan de negocio, no una petición al tribunal. Se defiende un plan coherente, una PoC de corrección y un sello **ya verificable**.
