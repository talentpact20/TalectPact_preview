# 7. Regulación y compliance

TalentPact opera en el cruce de **empleo, datos personales, inteligencia artificial y (en el demo) blockchain**. No es un banco ni emite un token: aun así, el marco europeo le aplica con fuerza porque **puntuar a una persona para un trabajo es una actividad de alto riesgo**. La tesis del proyecto es *compliance by design*: el mismo diseño que vende (anonimato, trazabilidad, hash on-chain) es el que cumple.

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

El cumplimiento normativo no se resuelve con un único trámite, sino con una secuencia de actuaciones que se condicionan entre sí. El orden que sigue está construido de mayor a menor efecto bloqueante: cada paso desbloquea el siguiente, y saltarse uno intermedio obliga habitualmente a rehacer el trabajo posterior.

**1. Constitución de la sociedad y designación del responsable de protección de datos.** Es el primer paso porque, sin personalidad jurídica, no hay ningún sujeto que pueda firmar contratos de encargo de tratamiento, asumir la condición de responsable frente a la autoridad de control ni emitir facturas. La designación de un delegado de protección de datos —interno o externo— es recomendable dada la naturaleza de los datos tratados: información sobre capacidades profesionales de personas en búsqueda de empleo, que se emplea para tomar decisiones que afectan a su acceso al trabajo. Aunque el volumen inicial no active necesariamente la obligación legal de designarlo, el criterio prudente en un tratamiento de este perfil es contar con la figura desde el principio.

**2. Evaluación de impacto relativa a la protección de datos.** Es obligatoria porque concurren dos circunstancias que la desencadenan: se realiza una evaluación sistemática de aspectos personales mediante tratamiento automatizado, y de ella se derivan efectos significativos sobre las personas afectadas. El análisis debe recorrer el circuito completo —registro del candidato, evaluación automatizada, publicación anónima en el conjunto de perfiles, emisión de la credencial y anclaje de la huella— identificando en cada etapa qué datos se tratan, con qué base jurídica, durante cuánto tiempo y con qué riesgos asociados. El resultado no es un documento para archivar: condiciona decisiones concretas de producto, como los plazos de conservación del razonamiento almacenado o los mecanismos de intervención humana en la decisión.

**3. Contratos con proveedores y condiciones para los usuarios.** Hay que formalizar acuerdos de encargo de tratamiento con cada proveedor que procesa datos por cuenta de la empresa: el proveedor de base de datos, el proveedor del modelo de lenguaje, el de alojamiento y el de pagos. Merece atención particular el acuerdo con el proveedor de inteligencia artificial, por dos motivos: es el que recibe el contenido de las respuestas de los candidatos, y es el que puede implicar transferencias fuera del Espacio Económico Europeo, lo que exige cláusulas contractuales tipo y un análisis de las garantías del país de destino. En paralelo hay que redactar condiciones diferenciadas para candidatos y para empresas, ya que la relación jurídica es distinta en cada caso.

**4. Información sobre el uso de inteligencia artificial.** El reglamento europeo exige informar a la persona de que está interactuando con un sistema de inteligencia artificial. En este caso la obligación se cumple en el momento del reto, con un aviso claro de que la prueba será corregida por un sistema automatizado, qué criterios se aplicarán y qué consecuencias tendrá el resultado. Es un requisito de bajo coste técnico y alto impacto reputacional si se omite.

**5. Registro del sistema de alto riesgo y expediente de conformidad.** Es el paso más costoso en tiempo y en documentación. Comprende la elaboración del expediente técnico —descripción del sistema, arquitectura, rúbricas de evaluación, métricas de rendimiento, límites conocidos y medidas de supervisión humana— y la inscripción en la base de datos europea de sistemas de alto riesgo antes de la comercialización. Buena parte de este material ya está redactado en el apartado 6 de este documento, lo que reduce sensiblemente el esfuerzo restante.

**6. Calibración con evaluadores humanos.** Este paso cierra el hueco metodológico identificado en el §6.2.5 y es una condición material del expediente anterior: el reglamento exige demostrar niveles adecuados de exactitud, y la exactitud de un sistema de puntuación solo puede acreditarse comparándola con criterio profesional. Es también el paso que permite pasar de afirmar que la evaluación es trazable a poder afirmar que es exacta, que son cosas distintas.

**7. Dictamen jurídico sobre el anclaje de huellas.** Un informe breve que confirme que el patrón empleado —huella en cadena, dato personal fuera de ella— es compatible con el derecho de supresión. El diseño ya se corresponde con la solución estándar reconocida para conciliar registros distribuidos y protección de datos, de modo que se trata de una confirmación externa más que de un análisis abierto, pero conviene disponer de ella por escrito antes de comercializar.

**8. Inicio de la actividad comercial.** Solo cuando los siete puntos anteriores estén cerrados procede activar los cobros y retirar la condición de versión preliminar de la plataforma pública. Hasta ese momento, la web debe presentarse de forma inequívoca como demostración y no como servicio comercial disponible.

**Coste y criterio.** El modelo financiero recoge estas actuaciones en dos partidas: un pico de gasto legal en el ejercicio de constitución y una partida recurrente de cumplimiento y seguridad de aproximadamente €100 mensuales a partir del segundo año. Puede parecer una dotación escasa para un sistema clasificado como de alto riesgo, y conviene explicar por qué no lo es: el grueso del cumplimiento **ya está incorporado al diseño del producto**. El anonimato estructural, el registro completo de cada evaluación, la residencia europea de los datos y la decisión de no publicar información personal en la cadena no son medidas que haya que añadir después pagando asesoramiento, sino decisiones de arquitectura tomadas desde el principio. Lo que queda por contratar es la formalización documental de algo que el sistema ya hace, y eso es sustancialmente más barato que corregir un producto concebido sin estas consideraciones.

---

*Base: Reglamento UE 2024/1689, RGPD 2016/679, LOPDGDD, LSSI 34/2002. El detalle técnico del anclaje está en el apartado 6 y en `tfm/tech/SPEC_TECNICA_DEMO.md`.*
