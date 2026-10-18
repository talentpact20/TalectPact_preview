# 04 · Modelo de negocio y precios

Tareas de la reunión: «Revisar modelo financiero», precios para candidatos («no los hemos puesto; ponte en un modelo y dime cuánto»), y tomar LinkedIn como referencia de modelo de negocio, sin copiarlo.

---

## 1. Lo que dice hoy el plan (cifras canónicas)

`tfm/cifras_canonicas.json` y el capítulo 3 del plan de negocio: **49 €** por contacto, **Pro 199 €/mes**, **Enterprise 499 €/mes**, **reto a medida 299 €/vacante** y **5 € por reto extra** para el candidato (supuesto: 3 % de candidatos pagan). Margen bruto ≈ 93,5 %; coste de IA medido ≈ 0,0165 € por corrección.

Lo que **no** está definido: qué es exactamente gratis para el candidato, qué es un «reto extra» y qué recibe quien paga. Este documento lo concreta. Si se aprueba, hay que actualizar `cifras_canonicas.json`, el Excel del modelo financiero y los documentos que vigila `tests/coherencia-docs.test.js`.

## 2. LinkedIn como referencia

| Línea de LinkedIn | Cómo gana dinero | Lección para TalentPact |
| --- | --- | --- |
| **Talent Solutions** (históricamente su mayor línea) | Licencias de Recruiter por reclutador y año, anuncios de empleo promocionados. | El que paga es **quien contrata**. Nosotros igual: el B2B es el motor. |
| **Premium** (la que más crece) | Suscripción del miembro: ver quién te ha visto, mensajes directos, información sobre las ofertas, herramientas con IA. | El candidato paga por **información y ayuda**, nunca por existir. |
| **Marketing Solutions** | Publicidad segmentada. | No aplica: anuncios dentro de una evaluación restarían seriedad. Descartado. |
| **Learning** | Cursos. | Encaje natural con el «plan de práctica» tras cada reto, a medio plazo. |
| **Talent Insights** | Datos agregados del mercado laboral. | A futuro: informes agregados y anónimos de skills demostradas (doc 07). |

Datos de contexto: LinkedIn facturó 4.710 M$ en el trimestre julio–septiembre de 2025, y su taxonomía de skills ronda las 41.000. Lo importante no es el tamaño, sino tres reglas que vamos a aplicar:

1. **Estar es gratis.** Cobrar por aparecer vacía el lado de la oferta y deja a las empresas sin pool.
2. **Nunca se vende posición.** En LinkedIn pagar no te sube en un resultado de búsqueda de un reclutador; en TalentPact, **pagar nunca cambia una nota, un ranking ni el encaje**. Si se vendiera, la nota dejaría de valer para la empresa, que es quien paga de verdad.
3. **El que tiene el presupuesto de contratación paga lo grande**; el candidato paga poco y por cosas que le ayudan a mejorar.

## 3. Precios para candidatos (propuesta)

### 3.1 Tres niveles

| | **Gratis** | **Plus** | Sueltos |
| --- | --- | --- | --- |
| Precio | 0 € | **6,99 €/mes** o **49 €/año** (≈ 4,08 €/mes) | Ver §3.2 |
| Perfil, pool anónimo, postularse a ofertas | Sí | Sí | |
| Catálogo de retos completo | Sí | Sí | |
| Intentos que cuentan para el pool | 1 por reto cada 30 días (política de reintentos propuesta en `04_estrategia.md`) | **Igual** (no se compra credibilidad) | |
| Feedback por criterio | Sí | Sí | |
| **Modo práctica**: variantes del reto que no cuentan para el pool, con corrección completa | 1 al mes | Ilimitado | |
| Plan de práctica personalizado y comparación con el intento anterior | Resumen | Completo | |
| Estadísticas del pool: en cuántas búsquedas apareces, sectores que te han visto (sin nombres de empresa) | No | Sí | |
| SkillPass firmado y verificable | Sí | Sí | |
| Sello público en blockchain (doc 03) | 4,99 € | Incluido | 4,99 € |
| Informe PDF descargable de sus retos | No | Sí | |
| Revisión humana de una nota | Si hay error del corrector, siempre gratis | 1 al trimestre sin motivo | 9,99 € |

### 3.2 Pagos sueltos

| Producto | Precio | Nota |
| --- | --- | --- |
| Sello público de un SkillPass | 4,99 € (2,99 € al resellar) | Doc 03 |
| Revisión humana a petición | 9,99 € | Gratis si la revisión cambia la nota más de 10 puntos (el error fue nuestro). |
| Certificación IA por itinerario | 39 € | Doc 02 |
| Pack de práctica (5 variantes) | 4,99 € | Sustituye al «5 € por reto extra» del plan: el reto oficial nunca se cobra; se cobra la práctica. |

### 3.3 Por qué estos importes

- **Público**: junior, en reconversión, perfiles infrarrepresentados. Poca capacidad de pago y mucha sensibilidad al precio. La referencia mental es una suscripción de música o vídeo (7–12 €/mes), no la de LinkedIn Premium.
- **6,99 €/mes** está por debajo de esa referencia; **49 €/año** empuja al pago anual (menos bajas) y coincide con el precio de un desbloqueo de empresa: fácil de recordar.
- **Coste**: un usuario Plus muy activo hace 30 correcciones al mes ≈ 0,50 € de IA. Margen > 90 %.
- **Lo que no hacemos**: cobrar por hacer retos oficiales, por aparecer en el pool o por subir en un listado.

### 3.4 Cuánto aporta (orden de magnitud)

Con 10.000 candidatos activos y una conversión típica de *freemium* del 2–4 %: 200–400 suscriptores × 49 €/año ≈ **10.000–20.000 € al año**, más sueltos. Es un complemento, no el motor: el plan debe seguir apoyándose en el B2B. Lo que sí da el Plus es **compromiso** (el candidato vuelve a practicar) y eso mejora el pool que compra la empresa.

## 4. Precios para empresas

Se mantienen las palancas del plan y se añaden las de la rama IA, los eventos y la prueba gratuita (doc 10):

| Producto | Precio | Cambio |
| --- | --- | --- |
| Desbloqueo de contacto | 49 € | Igual. Con **garantía de respuesta**: si el candidato no responde en 7 días, el crédito se devuelve. |
| Desbloqueo de perfil IA certificado | 89 € | Nuevo (doc 02). |
| Plan Pro | 199 €/mes | Igual: 5 contactos/mes, ofertas ilimitadas. Añade verificación por lotes. |
| Plan Enterprise | 499 €/mes | Igual. Añade API, exportación a ATS y SSO (doc 07). |
| Reto a medida | 299 € / vacante (IA: 499 €) | Igual + variante IA. |
| Diagnóstico IA de plantilla | 15 €/empleado (mín. 20) | Nuevo (doc 02). |
| Prueba gratuita | 0 € durante 30 días | Nueva (doc 10): 1 oferta, pool completo, **2 desbloqueos gratis**, calibración con su equipo. |
| Eventos Impact | Por evento | Ya en el plan Impact (doc 05 de `docs/conversacion/`). |

## 5. Revisión del modelo financiero (qué tocar)

1. **B2C**: sustituir «3 % paga 5 € por reto extra» por «3 % Plus a 49 €/año + sueltos». El ingreso B2C por usuario de pago sube; la cifra global apenas cambia el resultado (el B2C pesa poco).
2. **Prueba gratuita**: añadir el coste de 2 desbloqueos gratis por empresa en prueba (coste real ≈ 0 €: no hay coste variable en un desbloqueo) y una tasa de conversión de prueba a pago. Supuesto prudente: 20–25 %.
3. **Garantía de respuesta**: reservar un 5–10 % de desbloqueos devueltos.
4. **Coste de expertos humanos** (revisiones y certificaciones IA): nueva línea de coste variable, ≈ 10–12 € por certificación y ≈ 5 € por revisión.
5. **Sello blockchain**: coste fijo de unos céntimos al día (lote diario), ingreso por sello.
6. **Diagnóstico IA de plantilla**: línea B2B nueva; mejor como escenario aparte (optimista) hasta validarlo con 2–3 empresas.

Hasta que el equipo lo apruebe, **no se cambia ninguna cifra canónica**.

## 6. Decisiones para el equipo

- [ ] ¿Plus a 6,99 €/mes y 49 €/año?
- [ ] ¿Sustituir «5 € por reto extra» por packs de práctica?
- [ ] ¿Garantía de respuesta de 7 días en los desbloqueos?
- [ ] ¿Prueba gratuita de 30 días con 2 desbloqueos?
- [ ] Regla escrita en la web: «Pagar nunca cambia tu nota ni tu posición». (Recomendado: sí, en la página de precios.)

Fuentes: Microsoft, resultados del primer trimestre fiscal 2026 (vía [Staffing Industry Analysts](https://www.staffingindustry.com/news/global-daily-news/linkedin-revenue-rises-9-with-growth-in-marketing-solutions)); [LinkedIn Engineering, taxonomía del Skills Graph](https://engineering.linkedin.com/blog/2023/Building-maintaining-the-skills-taxonomy-that-powers-LinkedIns-Skills-Graph); [LinkedIn, Skill Assessments ya no disponibles](https://www.linkedin.com/help/learning/answer/a1690529).
