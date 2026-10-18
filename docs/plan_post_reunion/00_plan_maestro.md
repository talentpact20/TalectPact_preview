# 00 · Plan maestro tras la reunión

Documento completo de cómo enfocar todas las tareas acordadas en la reunión («Tareas a hacer TalentPact»). Cada tarea tiene su documento con el detalle; aquí está la visión de conjunto, el orden y las decisiones pendientes.

Fecha: 18/10/2026. Fuentes: notas de la reunión, `TALENTPACT PROPUESTE DE SECTORES & FUNCIONES.docx`, `TalentPact_Diccionario_Competencias.docx` (v2.0), `TalentPact_Diccionario_Exclusivo_AI_Hard_Skills.docx` (v4.0), el código actual y la bóveda `Talentpact/`.

---

## 1. Las tareas y dónde está cada una

| # | Tarea de la reunión | Documento | Idea principal |
| --- | --- | --- | --- |
| * | Revisar modelo financiero | [04 · Modelo de negocio y precios](04_modelo_de_negocio_y_precios.md) | B2B sigue siendo el motor; candidato con Plus a 6,99 €/mes o 49 €/año; pagar nunca cambia una nota. |
| 1 | Áreas de creación de empleo: tratarlo como LinkedIn; vocabulario | [01 · Sectores, áreas y vocabulario](01_sectores_areas_y_vocabulario.md) | Separar sector (empresa) y área funcional (puesto); «el primer nivel se ve, el segundo se busca»; oferta en 3 pasos con sugerencias. |
| 2 | Tema IA: con actividades; rama especial | [02 · Rama IA](02_rama_ia.md) | Rama propia con 24 hard skills en 6 itinerarios + «IA en el trabajo» para todos; ser la referencia en talento de IA verificado. |
| 3 | Tema blockchain: cómo hacerlo de pago | [03 · Blockchain de pago](03_blockchain_de_pago.md) | Verificar siempre gratis; el **sello público** cuesta 4,99 €; sellado por lotes diario; interfaz plegada para el candidato; apartado de verificación para la empresa. |
| 4 | Corrector: todo tipo de mejoras | [05 · Corrector completo](05_corrector_completo.md) | Arquitectura v3 en 10 etapas y camino de la v2.1 a la v3 en 10 pasos sin romper nada. |
| 5 | Acabar de enfocar hard y soft skills | [06 · Hard y soft skills](06_hard_y_soft_skills.md) | El diccionario como vocabulario canónico; 32 competencias repartidas en los tres pilares; 8 cubiertas, 10 parciales, 14 por hacer. |
| 6 | Base de datos y servidores | [07 · Base de datos y servidores](07_base_de_datos_y_servidores.md) | Grafo de skills en PostgreSQL, región UE, copias y PITR, retención, y cómo entregar la información a la empresa (PDF, CSV, API, ATS). |
| 7 | Seguridad avanzada: maneras de hacer trampa | [08 · Seguridad antitrampas](08_seguridad_antitrampas.md) | **Fallo grave**: los enunciados y las soluciones están en el JS público. Intento de un solo uso con reloj de servidor y variantes; móvil y segunda persona; defensa de 2 preguntas; 4 niveles de integridad. |
| 8 | Definir ejercicio por ejercicio | [09 · Ejercicio por ejercicio](09_ejercicio_por_ejercicio.md) y [09b · Inventario](09b_inventario_ejercicios.md) | Ficha única; los 42 ejercicios de soft skills definidos uno a uno; 6 retos nuevos; inventario de los 309. |
| 9 | Accesibilidad para empresa; ¿sesión gratis?; confianza | [10 · Confianza y acceso de empresas](10_confianza_y_acceso_empresas.md) | Prueba de 30 días sin tarjeta, «haz el reto tú» con su equipo, garantía de respuesta, centro de confianza. Nunca datos inventados. |
| 10 | Sectores y áreas funcionales para acabar la plataforma visualmente | [01](01_sectores_areas_y_vocabulario.md), §3, §5 y §6 | 12 sectores y 7 áreas visibles; ampliados por búsqueda. |

## 2. El concepto, después de la reunión

> TalentPact es donde se **demuestra** lo que se sabe hacer, con evidencia que se puede comprobar. La empresa ve primero cómo es la persona con otros y cómo piensa, luego el oficio; decide ella. El candidato no paga por estar ni por subir: paga, si quiere, por practicar más y por llevarse una prueba pública de lo que ha demostrado.

Cuatro piezas que se refuerzan entre sí:

1. **Vocabulario único** (docs 01 y 06): un diccionario con códigos, alias y estándar europeo. Sin él, ni la oferta sugiere bien, ni el encaje compara bien, ni la exportación a un ATS funciona.
2. **Ejercicios con ficha** (doc 09) que alimentan un **corrector medible** (doc 05). Sin gold set no podemos decir que la nota vale.
3. **Integridad proporcionada** (doc 08): que la nota sea de quien la firma, sin vigilar de más.
4. **Confianza comprobable** (docs 03 y 10): verificación gratuita, sello público de pago, calibración con el equipo de la empresa.

La rama IA (doc 02) es la primera vertical que usa las cuatro piezas a fondo, y la que mejor justifica el precio.

## 3. Lo que hemos descubierto al revisar el código

| Hallazgo | Gravedad | Doc |
| --- | --- | --- |
| Enunciados **y soluciones** de las clasificaciones en `07-retos-comunes.js`, descargado por cualquiera. Se puede sacar un 100 en una clasificación sin pensar. | **Alta** | 08 §1 |
| El cronómetro y el intento son del navegador: abrir, mirar y volver es posible. | Alta | 08 §2 |
| El campo «Sector» de la oferta contiene áreas funcionales en inglés (IT, Ops, Sales…). | Media | 01 §1 |
| 14 de las 32 competencias del diccionario no tienen ningún reto (escucha, responsabilidad, adaptabilidad, resiliencia…). | Media | 06 §2 |
| Guías de ejercicios que dan la respuesta (Creatividad, Estimación). | Media | 09 §2 |
| El SkillPass no tiene revocación ni caducidad, y se sella en una red de pruebas, una transacción por credencial. | Media | 03 §1 |
| Nombres de skills duplicados por mayúsculas en `19-rrhh.js`. | Baja | 01 §4 |

## 4. Orden de trabajo propuesto

Por dependencias: lo que desbloquea a lo demás va primero.

| Fase | Semanas | Qué | Por qué en este orden |
| --- | --- | --- | --- |
| **0 · Arreglar** | 1 | Contenido y soluciones fuera del JS público; intento de servidor con reloj (doc 08, pasos 1–2). | Es un fallo que invalida notas; todo lo demás se apoya en el intento de servidor. |
| **1 · Vocabulario** | 2 | `taxonomy_terms` con sectores, áreas, 32 + 24 competencias y alias; migrar `jobs.sector` a área; nueva oferta en 3 pasos con sugerencias (docs 01, 06, 07). | Base de la interfaz «tipo LinkedIn», del encaje y de la rama IA. |
| **2 · Medir** | 2 | Gold set con la asesora y banco v2 (doc 05, pasos 1–2); fichas de los 42 ejercicios revisadas (doc 09). | Sin medir no se puede vender la nota. |
| **3 · Catálogo** | 3 | 6 retos nuevos de la ola 1 (escucha, responsabilidad, adaptabilidad, resiliencia, integridad, IA en el trabajo); variantes de los 14 retos soft (docs 06, 08, 09). | Cubre lo que piden las empresas y hace inútil «mirar y volver». |
| **4 · Confianza** | 2 | Prueba de 30 días, «haz el reto tú», garantía de respuesta, centro de confianza; verificación con 5 estados y VC firmada (docs 10 y 03). | Primeras empresas reales. |
| **5 · Ingresos** | 2 | Plus del candidato, sello de pago por lotes, informe PDF y CSV (docs 04, 03, 07). | Monetizar cuando ya hay algo que vale la pena pagar. |
| **6 · Rama IA** | 4 | 10 retos de la ola 1 de IA, red de expertos, certificación, diagnóstico de plantilla (doc 02). | Necesita las fases 1–3 hechas. |
| **7 · Escalar** | continuo | Dos pasadas del corrector, simulación conversacional, niveles Supervisado y Alto, API/ATS, sandbox de código. | |

Cada fase: tests en verde (`npm test`), cifras canónicas al día si cambian, changelog en `docs/Cambios_prereunion/01_changelog.md`, y commit solo con vuestra aprobación.

## 5. Decisiones que necesito de vosotros

Las más importantes, en el orden en que bloquean trabajo:

1. **¿Empiezo por la fase 0** (sacar enunciados y soluciones del navegador e intento de servidor)? Recomendado: sí, ya.
2. **¿Diccionario v2.0 como vocabulario canónico** y nombres antiguos como alias? (doc 06)
3. **¿12 sectores y 7 áreas visibles** como en la versión resumida? (doc 01)
4. **¿Un intento oficial por reto cada 30 días** y modo práctica aparte? (docs 04 y 08)
5. **Precios**: Plus 6,99 €/mes o 49 €/año; sello 4,99 €; certificación IA 39 €; perfil IA 89 €. (docs 02, 03, 04)
6. **Prueba gratuita**: 30 días con 2 desbloqueos y calibración con su equipo. (doc 10)
7. **¿Quién hace el gold set?** Propuesta: la asesora y uno de vosotros, por separado. (doc 05)
8. **¿Pago del candidato con Stripe?** Hoy el servidor solo deja pagar a empresas. (doc 03)

El resto de decisiones están al final de cada documento.

## 6. Lo que este plan no cambia

- La integridad nunca descarta sola; la cámara nunca infiere emociones.
- Nada de contenido inventado: ni en la web, ni en la prueba gratuita, ni en el centro de confianza.
- El candidato es anónimo hasta que acepta el contacto.
- Lo que decide algo (enunciado, nota, importe) sale del servidor.
- Las cifras canónicas no se tocan hasta que aprobéis los precios.
