# 1. Concepto de negocio

> **TalentPact** es un marketplace europeo de talento **100 % anónimo** donde los candidatos demuestran sus habilidades con retos prácticos **corregidos en tiempo real por inteligencia artificial**, y el resultado se convierte en un **CV inmutable y verificable en blockchain** que el propio candidato posee. Las empresas acceden a un pool de perfiles pre-validados y pagan **solo por resultado** (€49 por contacto desbloqueado).

---

## 1.1 El problema del mercado laboral

Contratar está roto, y lo está por los dos lados del mercado. El proceso de selección sigue anclado en un artefacto del siglo XX —el currículum— que ni predice el desempeño ni resiste la verificación:

| Evidencia | Fuente |
|---|---|
| **42 días** de media dura un proceso de contratación | SHRM 2024 |
| **€4.700** de coste medio por contratación en España | Glassdoor / Adecco |
| **78 %** de los CVs contienen información falsa o exagerada | ResumeLab 2024 |
| **89 %** de los fracasos de contratación se deben a falta de *soft skills*, no técnicas | Leadership IQ |

El dolor es **bilateral**:

- **La empresa** recibe 200+ CVs por oferta que no puede cribar, paga €700+/mes por herramientas de sourcing sin garantías, hace cinco entrevistas para descubrir que el candidato no sabe hacer el trabajo y, cuando se equivoca, repite el proceso perdiendo semanas y miles de euros.
- **El candidato** ve su CV descartado en 7 segundos por su edad, su nombre o su origen; es rechazado por no tener "3 años de experiencia mínima" y no se le da la oportunidad de **demostrar** lo que sabe hacer.

La raíz del problema es doble: **(1) el CV no es verificable** —cualquiera puede exagerarlo— y **(2) el filtro humano introduce sesgo** —edad, género, nombre, foto— antes de evaluar la competencia real.

## 1.2 La solución: TalentPact

TalentPact sustituye el CV por **evidencia verificada** mediante un marketplace de dos lados que funciona en tres pasos:

1. **El candidato demuestra.** Elige entre 102 retos prácticos en 25 áreas (técnicas y cognitivas). La IA evalúa su respuesta en menos de 10 segundos y le devuelve un *Skill Score* (0-100) con feedback detallado y auditable. Todo **100 % anónimo**.
2. **El perfil se verifica.** Cada reto superado desbloquea una habilidad con puntuación objetiva. El perfil muestra **capacidades demostradas, no promesas**.
3. **La empresa filtra y paga por resultado.** Filtra el pool anónimo por sector, skills y nivel, y paga **€49 solo cuando decide desbloquear el contacto** de un candidato que le interesa (*pay-per-result*).

Sobre esta base, TalentPact añade la capa que lo convierte en una propuesta **fintech**: la habilidad validada por IA se sella como una **prueba de integridad** (hash del documento anclado en blockchain; detalle en §6.4).

## 1.3 La innovación central en tres capas

TalentPact no es una única innovación, sino tres capas que se refuerzan entre sí:

| Capa | Qué aporta | Estado |
|---|---|---|
| **① Evaluación con IA** | Motor que corrige 102 tipos de reto con una sola arquitectura (Dynamic Prompting + Chain of Thought), trazable y a **~€0,0165 por evaluación** medidos (calibración contra tribunal humano aún pendiente, §6.2) | ✅ Construido y funcionando (PoC + producto en vivo) |
| **② Persistencia y perfil verificado** | Base de datos que consolida el histórico de evaluaciones en un perfil de habilidades auditable | ✅ Construido (Supabase Auth + tablas en UE) |
| **③ Credencial anclada en blockchain** | La habilidad validada se convierte en un JSON tipo Verifiable Credential cuyo *hash* se ancla on-chain: un tercero comprueba **integridad** (si el documento se altera, el sello no cuadra) | ✅ Demo real en Ethereum Sepolia (contrato `SkillPassRegistry` + verificador público) |

**La tesis fintech del proyecto:** igual que las fintech convirtieron el dinero y los activos en objetos digitales programables y verificables, TalentPact convierte la **habilidad profesional en un activo digital verificable y propiedad del individuo**. Pasamos de la *economía de las acreditaciones* (títulos que hay que creerse) a la *economía de las evidencias* (competencias comprobadas y certificadas criptográficamente).

> **Nota de diseño (privacidad + inmutabilidad):** on-chain solo se ancla el *hash* de la credencial; los datos personales viven off-chain en la base de datos europea. Esto reconcilia la inmutabilidad de blockchain con el derecho al olvido del RGPD (se detalla en el apartado 7).

## 1.4 Propuesta de valor única

**Para el candidato:**
- Demuestra lo que sabe sin que su CV, su edad o su nombre lo descarten de antemano.
- Obtiene un **CV verificable y portable** que le pertenece y que puede presentar a cualquier empresa dentro o fuera de TalentPact.
- Acceso gratuito hasta 5 retos/semana.

**Para la empresa:**
- Reduce el *time-to-hire* de semanas a **minutos de cribado**, filtrando por habilidades reales verificadas.
- **Paga solo por resultado** (€49/contacto): elimina el coste hundido de las licencias caras sin garantías.
- Evaluación **anónima, explicable y trazable** (alineada con el AI Act; el registro como sistema de alto riesgo sigue pendiente, §7).
- Reduce el fraude de CV *como PDF editable*: cada skill va respaldada por un sello de integridad que un tercero verifica (§6.4).

**Diferenciación en una frase:** TalentPact es el **único** actor que combina *sourcing* + *evaluación por IA* + *anonimato* + *pay-per-result* + *credencial verificable en blockchain*. Los competidores hacen una de estas cosas; ninguno las une.

## 1.5 Misión, visión y encaje en el máster

- **Misión:** que a nadie se le juzgue por un papel, sino por lo que sabe hacer de verdad.
- **Visión:** convertirse en el estándar europeo de **credenciales de habilidades verificables**, el "pasaporte de talento" que el profesional posee y lleva consigo entre empleos y plataformas.
- **Encaje fintech/blockchain:** TalentPact aplica al mercado laboral lo que el máster enseña —pruebas de integridad, registros con emisor identificable, y (como visión) valor programable—. La credencial de skill es un **documento verificable**, no un token; el *pay-per-result* es la innovación de cobro; la verificación sin cuenta TalentPact es el *Web3* que sí está construido. La identidad soberana completa (clave del candidato, EUDI Wallet) es hoja de ruta, no el demo (§6.4).

---

*Documento del TFM · Máster en Fintech, Mercados Financieros y Blockchain · Xavier Griñó · Ivan Sánchez.*
