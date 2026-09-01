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
| **1. Evaluación con IA** | Motor que corrige 102 tipos de reto con una sola arquitectura (Dynamic Prompting + Chain of Thought), trazable y a **~€0,0165 por evaluación** medidos (calibración contra evaluadores humanos aún pendiente, §6.2) | Construido y en funcionamiento (PoC y producto en vivo) |
| **2. Persistencia y perfil verificado** | Base de datos que consolida el histórico de evaluaciones en un perfil de habilidades auditable | Construido (Supabase Auth y tablas en la UE) |
| **3. Credencial anclada en blockchain** | La habilidad validada se convierte en un JSON tipo Verifiable Credential cuyo *hash* se ancla on-chain: un tercero comprueba **integridad** (si el documento se altera, el sello no cuadra) | Demo real en Ethereum Sepolia (contrato `SkillPassRegistry` y verificador público) |

**La tesis fintech del proyecto:** igual que las fintech convirtieron el dinero y los activos en objetos digitales programables y verificables, TalentPact convierte la **habilidad profesional en un activo digital verificable y propiedad del individuo**. Pasamos de la *economía de las acreditaciones* (títulos que hay que creerse) a la *economía de las evidencias* (competencias comprobadas y certificadas criptográficamente).

> **Nota de diseño (privacidad + inmutabilidad):** on-chain solo se ancla el *hash* de la credencial; los datos personales viven off-chain en la base de datos europea. Esto reconcilia la inmutabilidad de blockchain con el derecho al olvido del RGPD (se detalla en el apartado 7).

## 1.4 Propuesta de valor, misión y visión

La propuesta de TalentPact no se explica por una funcionalidad concreta, sino por el cambio de objeto que introduce en el proceso de selección: donde antes había un relato personal escrito por el propio candidato, ahora hay una evidencia producida en condiciones controladas y comprobable por terceros. Ese desplazamiento afecta a los dos lados del mercado de forma distinta, y conviene detallarlo por separado.

**Lo que recibe el candidato.** Lo primero y más importante es una **oportunidad real de demostrar lo que sabe hacer** antes de que nadie mire su edad, su nombre, su fotografía o el prestigio de la empresa en la que trabajó. El perfil llega a la empresa despersonalizado: lo que se ve es el resultado de un ejercicio práctico y el desglose de por qué obtuvo ese resultado. Para quien viene de una reconversión profesional, para quien tiene poca experiencia formal o para quien ha sido descartado sistemáticamente por criterios que nada tienen que ver con su competencia, esto no es un matiz: es la diferencia entre entrar en un proceso o no existir en él.

Lo segundo es la **retroalimentación**. Cada reto corregido devuelve un desglose por criterios y una justificación escrita de la puntuación. El candidato no recibe un veredicto opaco, sino un diagnóstico que le indica dónde está sólido y dónde debe mejorar. En un mercado donde la práctica habitual es el silencio administrativo tras la candidatura, devolver información útil es en sí mismo una propuesta de valor.

Lo tercero es la **propiedad de la evidencia**. Las habilidades demostradas se consolidan en una credencial verificable que pertenece al candidato y que puede presentar dentro o fuera de la plataforma. No es un certificado que haya que creerse porque lo firme una marca: es un documento cuya integridad cualquier tercero puede comprobar por su cuenta. Si el candidato se marcha de TalentPact, su historial de evidencias sigue siendo válido y comprobable.

Y, cerrando el ciclo, la posibilidad de **interlocución directa con la empresa**. Cuando una compañía decide avanzar con un perfil, se abre un canal de conversación en el que además puede revisar y comentar los ejercicios resueltos. El candidato deja de ser un expediente que se archiva y pasa a recibir la valoración de un profesional del sector que ya ha manifestado interés real por su trabajo.

**Lo que recibe la empresa.** El beneficio inmediato es una **reducción drástica del tiempo de cribado**. En lugar de leer decenas o cientos de currículos para inferir capacidades que no aparecen documentadas, la empresa filtra un conjunto de perfiles ya evaluados por sector, competencia y nivel demostrado. El trabajo de discriminar entre quien dice saber y quien sabe ya está hecho antes de la primera conversación.

El segundo beneficio es la **calidad de la información**. Cada habilidad del perfil está respaldada por un ejercicio concreto, un desglose por criterios y un sello de integridad que permite comprobar que ese documento no ha sido alterado después de emitirse. Un currículo en PDF puede editarse en treinta segundos; una evidencia sellada, no. La empresa deja de contratar sobre declaraciones y empieza a contratar sobre hechos comprobables.

El tercero es la **defendibilidad del proceso**. La evaluación es anónima en su fase inicial, explicable criterio a criterio y trazable de extremo a extremo, lo que encaja de forma natural con las exigencias europeas sobre uso de inteligencia artificial en contratación. Un responsable de selección puede justificar internamente por qué avanzó con un perfil y descartó otro, con un registro que respalda la decisión.

El cuarto es el **modelo de acceso sin compromiso previo**: la empresa no adquiere una licencia anual para descubrir después si le sirve, sino que asume el coste únicamente cuando obtiene el resultado que buscaba. El riesgo de la prueba deja de estar en el lado del cliente.

Por último, la relación no se agota en el contacto: la empresa puede **conversar con el candidato y revisar sus ejercicios**, aportando su propio criterio profesional sobre el trabajo entregado. Ese intercambio mejora la decisión de contratación y, al mismo tiempo, devuelve valor al talento que ha participado.

**Diferenciación.** Ninguno de estos elementos es, aisladamente, imposible de replicar. Existen plataformas que localizan perfiles, plataformas que administran pruebas técnicas y plataformas que emiten certificados digitales. Lo que no existe es un actor que combine en un mismo flujo la búsqueda de talento, la evaluación automatizada y explicable, el anonimato estructural, el pago vinculado al resultado y la credencial verificable criptográficamente. La ventaja no está en cada pieza, sino en que las piezas se refuerzan entre sí: el anonimato solo funciona si hay una evaluación fiable que ocupe el lugar del currículo, y la evaluación solo se convierte en un activo transferible si alguien puede verificarla sin confiar en el emisor.

**Misión.** Que a nadie se le juzgue por un papel, sino por lo que sabe hacer de verdad.

**Visión.** Convertirse en el estándar europeo de credenciales de habilidad verificables: un pasaporte de talento que el profesional posee, conserva entre empleos y puede presentar en cualquier plataforma o proceso, con independencia de quién lo emitió originalmente.

**Encaje fintech y blockchain.** El proyecto traslada al mercado laboral la lógica que las fintech aplicaron al dinero y a los activos financieros: convertir algo que antes solo existía como declaración en un objeto digital verificable, con emisor identificable y trazabilidad completa. La credencial de habilidad es un **documento verificable**, no un token negociable; el cobro vinculado al resultado es la innovación en el modelo de ingresos; y la verificación por parte de un tercero sin necesidad de cuenta es la pieza descentralizada que ya está construida y en funcionamiento. La identidad soberana completa —clave criptográfica en poder del candidato e integración con la cartera de identidad digital europea— pertenece a la hoja de ruta y se describe como tal en el §6.4.

---

*Xavier Griñó · Ivan Sánchez · Universitat de Barcelona.*
