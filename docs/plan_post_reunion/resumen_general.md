# Resumen general del plan tras la reunión

Versión corta de los documentos 00–10: lo general de cada concepto, en una o dos páginas como máximo. El detalle está en cada documento.

## 00 · Plan maestro

### En una frase
TalentPact es donde se **demuestra** lo que se sabe hacer, con evidencia comprobable. La empresa decide; el candidato no paga por estar ni por subir.

### Lo que hemos encontrado en el código

| Hallazgo | Gravedad |
| --- | --- |
| Enunciados **y soluciones** de las clasificaciones en el JS público (`07-retos-comunes.js`) | Alta |
| Cronómetro e intento en el navegador: se puede abrir, mirar y volver | Alta |
| El campo «Sector» de la oferta contiene áreas en inglés (IT, Ops, Sales…) | Media |
| 14 de las 32 competencias del diccionario sin ningún reto | Media |
| Guías de ejercicios que dan la respuesta | Media |
| SkillPass sin revocación ni caducidad, en red de pruebas | Media |

### Orden de trabajo
0 Arreglar (1 sem.) → 1 Vocabulario (2) → 2 Medir (2) → 3 Catálogo (3) → 4 Confianza (2) → 5 Ingresos (2) → 6 Rama IA (4) → 7 Escalar (continuo).

### Decisiones clave
- [ ] ¿Empezamos por la fase 0 (sacar enunciados y soluciones del navegador)?
- [ ] ¿Diccionario v2.0 como vocabulario oficial?
- [ ] ¿12 sectores y 7 áreas visibles?
- [ ] ¿Un intento oficial por reto cada 30 días + modo práctica?
- [ ] ¿Precios propuestos (Plus, sello, certificación IA, perfil IA)?
- [ ] ¿Prueba gratuita de 30 días para empresas?
- [ ] ¿Quién hace el gold set del corrector?
- [ ] ¿Dejamos pagar al candidato con Stripe?

## 01 · Sectores, áreas funcionales y vocabulario

### El problema
El campo «Sector» de la oferta mezcla áreas funcionales en inglés, y al crear una oferta salen todas las opciones y todas las skills a la vez.

### La idea (como LinkedIn, sin copiarlo)
- **Sector** = a qué se dedica la empresa. Se pone **una vez** en su perfil.
- **Área funcional** = qué hace la persona en el puesto. Se pone en cada oferta.
- **El primer nivel se ve, el segundo se busca**: 12 sectores y 7 áreas visibles; la lista ampliada (22 + 21) solo aparece al buscar.

| 7 áreas visibles | Ejemplos de lo que cuelga |
| --- | --- |
| Asesoría jurídica, riesgos y cumplimiento | RGPD, contratos, derecho laboral |
| Finanzas | Contabilidad, fiscalidad, tesorería |
| Marketing, ventas y comunicación | SEO, ventas B2B, atención al cliente |
| Operaciones | Logística, compras, proyectos |
| Recursos humanos | Selección, formación |
| Sostenibilidad | Medio ambiente, ESG |
| Tecnología | Desarrollo, datos, diseño, **IA** |

### Crear una oferta en 3 pasos
1. **El puesto**: título con autocompletado; el área y el nivel se sugieren solos.
2. **Qué tiene que demostrar**: 6 skills sugeridas ya marcadas; quitar es un clic; máximo 8.
3. **Condiciones, preguntas y dilemas**: plegado por defecto.

### Vocabulario
Todo en español, un nombre oficial y varios alias («RRHH», «People» → Recursos humanos), códigos del estándar europeo ESCO para hablar con ATS y administraciones. Idiomas como bloque propio.

### Decidir
- [ ] ¿12 o 14 sectores visibles?
- [ ] ¿Máximo de 8 skills por oferta?

## 02 · La rama de IA

### Cómo enfocarlo
Dos cosas distintas, sin mezclarlas:
- **Rama IA** (la rama especial): para quien construye IA. 24 hard skills del diccionario en **6 itinerarios**: Ingeniería IA/ML · IA generativa/LLM · Investigación · Plataforma · Seguridad de IA · IA aplicada en empresa.
- **«IA en el trabajo»**: 3 retos cortos para cualquier perfil (revisar lo que dice la IA, encargar bien, qué se puede y qué no). El Reglamento de IA obliga a las empresas a acreditar la **alfabetización en IA** de su plantilla.

### Actividades, en tres fases
| Fase | Formato | Ejemplo |
| --- | --- | --- |
| 1 · Ya | Sin ejecutar código | Detectar *leakage* en un pipeline, revisar una integración insegura, diseñar un RAG con permisos |
| 2 | Con ejecución en entorno aislado | Repositorio con tests que fallan; métrica sobre datos ocultos |
| 3 | Defensa en directo | 2 preguntas sobre su propia entrega: quien no lo hizo no sabe defenderlo |

Primera ola: 10 competencias (Python, datos, ML, LLM, APIs, RAG, agentes, evaluación, MLOps, seguridad).

### Modelo de negocio: la referencia en talento de IA verificado
| Línea | Precio propuesto |
| --- | --- |
| Ruta IA de prueba (candidato) | Gratis |
| Certificación por itinerario, con revisión de experto y sello | 39 € |
| Desbloqueo de perfil IA certificado (empresa) | 89 € |
| Diagnóstico IA de plantilla | 15 €/empleado |
| Reto técnico a medida | 499 € |

Una **red de 5–10 expertos** de IA, pagados por revisión, da credibilidad y calibra el corrector.

### Decidir
- [ ] ¿Precio diferenciado para perfiles IA?
- [ ] ¿Lanzamos el diagnóstico de plantilla?

## 03 · Blockchain de pago

### El principio
**Verificar es siempre gratis; se cobra el sello público.** Si se cobrara por verificar, nadie se fiaría del SkillPass gratuito.

| | Firmado (gratis) | Sellado (de pago) |
| --- | --- | --- |
| Qué es | Credencial firmada por TalentPact | + huella publicada en una blockchain pública |
| Quién verifica | Cualquiera, en talentpact.es | Cualquiera, **incluso sin TalentPact** |
| Precio | 0 € | **4,99 €** o incluido en Plus |

### Cómo funciona
- Formato estándar europeo de credenciales verificables, firmado por el servidor; caduca a 12 meses y se puede revocar.
- **Sellado por lotes**: una sola transacción al día para todos los SkillPass (árbol de Merkle) en una red de capa 2. Coste: céntimos al día.
- Sin datos personales en la cadena; al borrar la cuenta se borra la «sal» y la huella deja de apuntar a nadie (RGPD).

### Interfaz
- **Candidato**: una línea pequeña («Firmado · Sello público: no · Añadir sello») y los detalles técnicos plegados.
- **Empresa**: apartado «Verificar credencial» con cinco resultados posibles: válida · caducada · revocada · alterada · no encontrada. Pro y Enterprise, por lotes y por API.

### Decidir
- [ ] ¿4,99 € por sello o solo dentro de Plus?
- [ ] ¿Qué red de capa 2 usamos en producción?

## 04 · Modelo de negocio y precios

### Lo que tomamos de LinkedIn
1. **Estar es gratis**: cobrar por aparecer vacía el pool.
2. **Nunca se vende posición**: pagar no cambia una nota, un ranking ni el encaje.
3. **Paga lo grande quien contrata**; el candidato paga poco y por cosas que le ayudan a mejorar.

### Candidato
| Gratis | Plus | Sueltos |
| --- | --- | --- |
| Perfil, pool, postular, catálogo completo, feedback, SkillPass firmado | **6,99 €/mes o 49 €/año**: práctica ilimitada, plan de práctica, estadísticas del pool, informe PDF, sellos incluidos | Sello 4,99 € · revisión humana 9,99 € · pack de práctica 4,99 € · certificación IA 39 € |

Orden de magnitud: 10.000 candidatos × 2–4 % de pago ≈ 10.000–20.000 €/año. Es un complemento; el motor es el B2B.

### Empresa
Se mantienen 49 € por contacto, Pro 199 €/mes, Enterprise 499 €/mes y reto a medida 299 €. Se añaden: perfil IA (89 €), diagnóstico de plantilla, **prueba gratuita de 30 días** y **garantía de respuesta** (si el candidato no responde en 7 días, se devuelve el crédito).

### Qué cambia en el modelo financiero
Sustituir «5 € por reto extra» por Plus y packs; añadir coste de expertos (≈10–12 € por certificación), conversión de prueba a pago (20–25 %) y desbloqueos devueltos (5–10 %). No se toca ninguna cifra oficial hasta aprobarlo.

### Decidir
- [ ] ¿Plus a 6,99 €/mes y 49 €/año?
- [ ] ¿Garantía de respuesta de 7 días?

## 05 · Un corrector completo

### Dónde estamos (v2.1)
Rúbrica con pesos fijada en el servidor, escala anclada, **evidencia literal comprobada**, topes, clasificaciones sin IA y recibo firmado. Falta: saber cuánto acierta, estabilidad, audio, revisión humana real.

### Cómo será (v3), en pocas palabras
1. **Preparación**: rúbrica por familia y nivel, indicadores escritos por expertos, errores que penalizan, ejemplos ancla.
2. **Comprobaciones sin IA**: copia del enunciado, respuestas copiadas entre candidatos, clasificaciones.
3. **Dos pasadas**: primero la evidencia (citas verificadas), después la nota solo sobre esa evidencia.
4. **Doble corrección** cerca de los cortes; si difieren más de 10 puntos, revisión humana.
5. **Presentación**: banda para la empresa (Insuficiente · Aceptable · Bueno · Muy bueno), «por qué esta nota» para el candidato.
6. **Revisión humana** con cola, plazo de 72 h y corrección ciega.

### Cómo sabremos que es bueno
| Métrica | Objetivo |
| --- | --- |
| Acuerdo de banda con correctores humanos | ≥ 80 % |
| Error medio | ≤ 8 puntos |
| Misma respuesta dos veces | diferencia ≤ 5 |
| Coste por corrección | ≤ 0,04 € |

Gold set: 5 retos × 6 respuestas, puntuadas por la asesora y uno del equipo por separado. Pruebas de sesgo con nombres, ortografía y longitud distintos.

### Decidir
- [ ] ¿Bandas hacia la empresa?
- [ ] ¿Quién hace el gold set?

## 06 · Hard y soft skills

### Los tres pilares, con el diccionario
| Pilar | Qué agrupa |
| --- | --- |
| **Soft skills** | Liderazgo de personas · influencia y relaciones · autoliderazgo e integridad |
| **Transferibles** | Estrategia y criterio · ejecución · transformación e innovación |
| **Hard skills** | Por área funcional + rama IA + idiomas; herramientas (Excel, Power BI) como etiqueta, no como skill |

### Cobertura de hoy
De las 32 competencias del diccionario: **8 cubiertas, 10 parciales, 14 sin reto**. Primeras a crear: escucha activa, responsabilidad, adaptabilidad, resiliencia, integridad e IA en el trabajo.

### Formatos nuevos (no todo es un correo)
- **Simulación conversacional**: una IA hace de cliente o compañero con guion fijo; se corrige la conversación.
- **Bandeja de entrada** y **caso con giro** (cambia un dato a mitad).
- **Experiencia pasada estructurada**: pesa menos y nunca va sola.
- Nunca: tests de personalidad ni emociones por cámara.

### Cómo se calcula
Una competencia es «verificada» con **dos evidencias**; se muestra con **confianza** (alta, media, baja); caduca a 12 meses; la ficha va en tres bloques por pilar. Nunca se etiqueta a nadie como «alto potencial».

### Decidir
- [ ] ¿Diccionario como vocabulario oficial y nombres antiguos como alias?
- [ ] ¿Probamos la simulación conversacional?

## 07 · Base de datos, servidores y entrega a empresas

### Un grafo de skills, como LinkedIn
No guardamos «un CV»: guardamos personas, retos, evaluaciones, evidencias y competencias conectadas. Tablas nuevas clave: vocabulario único, catálogo con versiones, intentos de servidor, nota por competencia, revisiones humanas, auditoría.

### Dónde y cómo se guarda
- Supabase en **región de la UE**, plan con copias diarias y recuperación a un momento concreto.
- Email y teléfono del candidato **cifrados**; audios en almacenamiento privado; nunca se guarda vídeo.
- Dos entornos: producción y pruebas.
- Retención: respuestas 12 meses, señales de integridad 6 meses, cuenta borrada en 30 días.

### Cómo recibe la información la empresa
| Necesidad | Solución | Plan |
| --- | --- | --- |
| Enseñarlo a su equipo | Informe PDF del candidato | Todos |
| Comparar candidatos | Exportación CSV/Excel | Pro |
| Meterlo en su ATS | API y avisos automáticos | Enterprise |
| Cumplimiento legal | Paquete de documentación | Enterprise |

Solo de candidatos desbloqueados; cada exportación queda registrada y el candidato ve quién descargó su informe.

### Decidir
- [ ] ¿Pasamos a un plan con copias antes de la primera empresa real?

## 08 · Seguridad avanzada: antitrampas

### Primero, un fallo
Los enunciados y las soluciones de las clasificaciones están en el código público de la web. Hay que servirlos desde el servidor al empezar.

### La medida central: el intento de un solo uso
- Al pulsar «Empezar», el **servidor** crea el intento y el reloj. Cerrar y volver no lo para ni lo reinicia.
- Cada intento recibe una **variante** distinta (cifras, nombres, datos). Mirar el reto y volver preparado no sirve.
- Un intento oficial cada 30 días; los ejercicios 2 y 3 no llegan hasta entregar el anterior.

### Las trampas pedidas en la reunión
| Trampa | Respuesta |
| --- | --- |
| Copiar y pegar | Ya bloqueado; además, detectar texto que aparece sin teclear |
| Otra persona en la sala hace fotos con el móvil | Variantes + marca de agua por intento (la foto no sirve y se sabe de quién es) + **detección del móvil y de una 2.ª persona** en cámara, analizada en el navegador |
| Consultar ChatGPT en el móvil y copiar a mano | Patrón de escritura + **defensa**: 2 preguntas sobre su propia respuesta |
| Abrir, mirar, cerrar y volver con notas | Reloj de servidor + variante distinta en el siguiente intento |
| Que lo haga otra persona | Identidad con consentimiento (nivel alto) y caso en vivo en los Eventos Impact |

### Cuatro niveles, según lo que esté en juego
**Práctica** (nada) · **Estándar** (por defecto) · **Supervisado** (+ cámara, pantalla completa, defensa) · **Alto** (+ móvil como 2.ª cámara, escaneo de sala; eventos).

La integridad **nunca descarta sola**: riesgo alto = revisión humana, y el candidato siempre puede explicarse.

### Decidir
- [ ] ¿Fase 0 ya?
- [ ] ¿Defensa en todos los retos oficiales o solo en Supervisado?

## 09 · Definir ejercicio por ejercicio

### La ficha de cada ejercicio
Competencia del diccionario · pilar y área · nivel · formato y tiempo · escenario con parámetros · **3–5 indicadores** · errores que penalizan · ejemplo ancla · nivel de integridad · quién lo revisó.

### Lo que hemos hecho
- Los **42 ejercicios de soft skills** definidos uno a uno, con indicadores y variantes (documento 09).
- **Inventario de los 309** ejercicios, con su área propuesta (anexo 09b).

### Problemas encontrados
- Guías que dan la respuesta (Creatividad, Estimación): la consigna debe decir qué se valora, no qué escribir.
- Secuencias numéricas conocidas (Fibonacci): se encuentran en internet; mejor retirarlas.
- Títulos en inglés.

### Retos nuevos (ola 1)
Escucha activa · Responsabilidad · Adaptabilidad · Resiliencia · Integridad · IA en el trabajo.

### Ritmo
2–3 retos por semana, revisados por la asesora (soft) o un experto (área).

### Decidir
- [ ] ¿Validamos los indicadores con la asesora?
- [ ] ¿Quitamos las pistas de las guías?

## 10 · Confianza y acceso para empresas

### La regla
Nada de demos con datos inventados: rompería justo la confianza que queremos ganar. La empresa **prueba con su caso real**.

### Propuestas
| Propuesta | Qué es |
| --- | --- |
| **Prueba de 30 días sin tarjeta** | 1 oferta, pool completo, 2 desbloqueos gratis |
| **«Haz el reto tú»** | 1–3 personas de su equipo hacen el reto: ven la nota y la evidencia, y sirve de referencia para su puesto |
| **Garantía de respuesta** | Si el candidato no contesta en 7 días, se devuelve el crédito |
| **Sesión guiada de 30 min** | Sobre su propia vacante, no una demo |
| **Centro de confianza** | Página con cómo se corrige, antitrampas, calidad medida y documentación legal |
| **Pool antes de registrarse** | Cifras reales agregadas por área (mínimo 20 por celda) |

Otras vías: primera oferta gratis para pymes, piloto con devolución para grandes, programa de primeras 10 empresas, asociaciones y escuelas de negocio, Eventos Impact.

### Decidir
- [ ] ¿Prueba de 30 días o primera oferta gratis para siempre?
- [ ] ¿Incluimos «haz el reto tú» en la prueba?
