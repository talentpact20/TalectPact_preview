# Cómo estructurar la plataforma

Versión estructural del plan tras la reunión: cómo se organiza TalentPact, sin detalle técnico. Los bloques `flujo`, `mapa`, `arbol`, `tarjetas` y `escalera` se dibujan como diagramas en el PDF (`python3 tools/generar_estructura_pdf.py`).

## 01 · La plataforma en una página

TalentPact es el sitio donde una persona **demuestra** lo que sabe hacer con ejercicios reales, y donde una empresa **encuentra** a quien lo ha demostrado. No hay CV: hay evidencia.

```flujo
Candidato | Hace retos de su área y de cómo trabaja con personas
TalentPact | Corrige, explica la nota y garantiza que la prueba es limpia
Empresa | Busca por lo que se ha demostrado y decide a quién conocer
```

### Quién usa la plataforma

```tarjetas
Candidato | Demuestra skills, recibe feedback, lleva su credencial a donde quiera. Anónimo hasta que acepta un contacto.
Empresa | Publica ofertas, filtra a candidatos por evidencia, contacta y lleva su proceso de selección.
Equipo TalentPact | Cuida el catálogo de retos, revisa notas dudosas y vigila que todo sea justo.
Expertos | Profesionales en activo que escriben y revisan retos de su área (sobre todo IA).
```

### Cinco reglas que ordenan todo
- **Estar es gratis.** El candidato nunca paga por aparecer ni por hacer retos oficiales.
- **Pagar nunca cambia una nota** ni la posición en un listado.
- **Primero cómo es con personas**, luego cómo piensa, luego el oficio (orden que pidió la asesora).
- **La máquina propone, las personas deciden.** Nadie queda descartado por un sistema automático.
- **Nada inventado.** Todo lo que se ve son datos reales o un estado vacío honesto.

## 02 · Mapa de la plataforma

Cuatro zonas. Cada una con pocas secciones y siempre las mismas.

```mapa
# Web pública
Inicio — qué es y para quién
Para candidatos
Para empresas — con cifras reales del pool
Precios
Confianza — cómo se corrige y se evitan trampas
Verificar una credencial
Eventos Impact
# Área del candidato
Inicio — «lo siguiente que te toca»
Retos — recomendados y catálogo
Mis resultados — nota, feedback y evolución
SkillPass — credencial y sello
Ofertas y postulaciones
Bandeja — avisos y empresas interesadas
Perfil y preferencias
# Área de la empresa
Inicio — ofertas activas y novedades
Ofertas — crear en 3 pasos
Candidatos — buscar y filtrar el pool
Proceso — lista corta y etapas
Verificar credenciales
Equipo — reclutadores de la empresa
Plan y facturación
# Equipo TalentPact
Catálogo de retos y versiones
Revisiones humanas pendientes
Integridad — pruebas en revisión
Calidad de la corrección
Empresas y verificación
Métricas reales del embudo
```

Regla de diseño: **cada pantalla responde a una pregunta** («¿qué hago ahora?», «¿cómo lo he hecho?», «¿a quién contacto?»). Lo opcional va plegado.

## 03 · Cómo se ordena la información

Igual que LinkedIn separa la empresa del puesto, TalentPact usa **dos ejes**: el sector (de la empresa) y el área funcional (del puesto). Del área cuelga todo lo demás:

```arbol
Sector — a qué se dedica la empresa (12 visibles). Se pone una vez en su perfil.
Área funcional — qué hace la persona en el puesto (7 visibles)
  Especialidad — el detalle del área; aparece al buscar (lista ampliada)
    Skills — lo que hay que demostrar, en tres pilares
      Retos — un caso real que mide una skill
        Ejercicios — tres por reto, de formatos distintos
```

| Nivel | Lo elige | Ejemplo |
| --- | --- | --- |
| Sector | La empresa, una vez | Hostelería, turismo y ocio |
| Área funcional | La empresa en cada oferta; el candidato en sus intereses | Finanzas |
| Especialidad | Se sugiere sola a partir del título | Contabilidad |
| Skills | Sugeridas por área y nivel; la empresa quita o añade (máx. 8) | Análisis de datos, Comunicación, Responsabilidad |

### Las 7 áreas funcionales

```tarjetas
Asesoría jurídica y cumplimiento | Contratos, protección de datos, derecho laboral
Finanzas | Contabilidad, fiscalidad, tesorería, inversión
Marketing, ventas y comunicación | Marketing digital, ventas, atención al cliente, contenidos
Operaciones | Logística, compras, proyectos, administración
Recursos humanos | Selección, formación, análisis de personas
Sostenibilidad | Medio ambiente, impacto, cumplimiento ESG
Tecnología | Desarrollo, datos, diseño de producto y la rama de IA
```

**Principio visual: el primer nivel se ve, el segundo se busca.** Nunca se enseñan todas las opciones a la vez. Todo en español, con un solo nombre por concepto («Recursos humanos», aunque se busque «RRHH» o «People»).

## 04 · Las skills: tres pilares

```tarjetas
Soft skills | Cómo es con las personas y consigo mismo: escucha, comunicación, negociación, liderazgo, integridad, resiliencia.
Transferibles | Cómo piensa y ejecuta en cualquier puesto: análisis, decisiones, priorización, adaptabilidad, creatividad.
Hard skills | El oficio de cada área: contabilidad, SEO, SQL, contratos… y la rama de IA.
```

Además, dos bloques aparte:
- **Idiomas**: nivel demostrado por destreza (escribir, entender, hablar).
- **Herramientas** (Excel, Power BI, Figma…): se muestran como etiqueta del ejercicio, no como skill. Lo que se certifica es saber analizar datos, no «saber Excel».

### Cómo ve la empresa a un candidato

```flujo
1 · Condiciones | Jornada, modalidad, ciudad, salario, disponibilidad
2 · Con personas | Soft skills con su banda y su confianza
3 · Cómo piensa | Transferibles
4 · El oficio | Hard skills, idiomas y herramientas
5 · Sus respuestas | Dilemas de la empresa y ejercicios
```

Cada skill se muestra con una **banda** (Insuficiente · Aceptable · Bueno · Muy bueno), cuántas pruebas la respaldan y su fecha. Una skill sin pruebas no aparece; no se muestra como débil.

### Lo que falta en el catálogo
De las 32 competencias del diccionario, hoy 8 están bien cubiertas, 10 a medias y 14 sin reto. Las primeras a crear: **escucha activa, responsabilidad, adaptabilidad, resiliencia, integridad e IA en el trabajo**.

## 05 · El catálogo de retos

### Qué es un reto

```flujo
Reto | Un caso real de un puesto que mide una skill
Ejercicio 1 | Por ejemplo, analizar unos datos
Ejercicio 2 | Decidir u ordenar con justificación
Ejercicio 3 | Redactar o conversar con alguien
```

Cada ejercicio tiene una **ficha**: qué skill mide, qué tiene que aparecer en una buena respuesta, qué fallos restan, cuánto dura y qué nivel de control lleva.

### Formatos

```tarjetas
Redacción | Un correo, un mensaje o un plan. Hoy es el 40 % del catálogo.
Clasificación | Ordenar o decidir, explicando la primera elección.
Análisis | Leer una tabla de datos y proponer acciones.
Conversación (nuevo) | Hablar con un cliente o compañero simulado por la IA.
Bandeja de entrada (nuevo) | Varios mensajes que llegan durante el reto.
Caso con giro (nuevo) | A mitad del reto cambia un dato: se ve cómo se adapta.
```

### Dos modos para el candidato

| | Oficial | Práctica |
| --- | --- | --- |
| Cuenta para el pool | Sí | No |
| Cuántas veces | Una cada 30 días | Libre (con Plus) |
| Datos del caso | Distintos en cada intento | Distintos en cada intento |
| Para qué sirve | Demostrar | Aprender y mejorar |

### Cómo se navega
Arriba, **«Recomendados para ti»** (según sus áreas y lo que piden las ofertas abiertas). Debajo, el catálogo por pilar y área. El catálogo completo siempre accesible, pero no lo primero.

## 06 · Recorrido del candidato

```flujo
1 · Registro | Email confirmado y consentimientos claros
2 · Tres preguntas | Áreas que le interesan, nivel y preferencias de empleo
3 · Primer reto | Recomendado, corto, para empezar
4 · Resultado | Nota por criterio, por qué y cómo mejorar
5 · SkillPass | Credencial verificable; sello público opcional
6 · Pool y ofertas | Aparece anónimo; se postula si quiere
7 · Contacto | Solo si acepta; ve qué empresa le ha contactado
```

### Su panel
- **Inicio**: una tarjeta con «lo siguiente que te toca» y su progreso por pilar.
- **Retos**: recomendados, en curso y catálogo.
- **Mis resultados**: cada nota con su explicación, comparada con el intento anterior.
- **SkillPass**: las skills verificadas, con un enlace para compartir; el sello aparece pequeño y plegado.
- **Ofertas y bandeja**: postulaciones, etapa de cada proceso y avisos.

## 07 · Recorrido de la empresa

```flujo
1 · Llega | Ve cifras reales del pool de su área y la página de confianza
2 · Prueba gratis | 30 días, sin tarjeta, con una oferta real
3 · Crea la oferta | En 3 pasos, con skills sugeridas
4 · Haz el reto tú | 1–3 personas de su equipo hacen el reto y ven cómo se corrige
5 · Candidatos | Filtra por evidencia; candidatos anónimos ordenados por encaje
6 · Desbloquea | Contacto si el candidato lo permite; garantía de respuesta
7 · Proceso | Lista corta, etapas, informe para su equipo
```

### Crear una oferta en 3 pasos

```flujo
Paso 1 · El puesto | Título; el área y el nivel se sugieren solos; el sector viene del perfil
Paso 2 · Qué demostrar | 6 skills sugeridas ya marcadas; quitar es un clic; máximo 8
Paso 3 · Condiciones | Condiciones, hasta 3 preguntas y hasta 3 dilemas; plegado por defecto
```

### Su panel
**Ofertas** (activas y candidatos de cada una) · **Candidatos** (buscar en todo el pool) · **Proceso** (lista corta y etapas) · **Verificar** (cualquier credencial) · **Equipo** (varios reclutadores) · **Plan**. Toda la información sale también como **informe PDF** o tabla para su programa de selección.

## 08 · La rama de IA

La IA tiene **dos sitios** en la plataforma, y no se mezclan:

```tarjetas
Rama IA (especial) | Dentro de Tecnología. Para quien construye IA. Catálogo propio con 24 skills técnicas, ordenadas en 6 itinerarios.
IA en el trabajo (para todos) | Una skill transferible con 3 retos cortos: revisar lo que dice la IA, encargarle bien una tarea, saber qué se puede compartir.
```

### Los 6 itinerarios de la rama

```tarjetas
Ingeniería de IA y ML | Datos, modelos, puesta en producción
IA generativa | Modelos de lenguaje, búsqueda en documentos, agentes
Investigación | Experimentos, entrenamiento, evaluación
Plataforma de IA | Infraestructura, costes, rendimiento
Seguridad de IA | Ataques, pruebas, protección de datos
IA aplicada en empresa | Automatizar procesos con IA de forma segura
```

### Cómo funciona para cada uno
- **Candidato**: ruta gratuita para orientarse; **certificación por itinerario** con revisión de un experto y defensa de su trabajo.
- **Empresa**: elige un itinerario al crear la oferta; puede pedir un **diagnóstico de IA de su plantilla** (cada vez más empresas tienen que acreditar que su personal sabe usar la IA).
- **Expertos**: una red de profesionales de IA que escriben y revisan los retos.

## 09 · Cómo se pone la nota

```flujo
1 · Entrega | El candidato responde dentro del tiempo
2 · Pruebas | La IA busca en la respuesta qué cumple cada punto de la ficha, citando frases reales
3 · Nota | Una nota por criterio; la nota final la calcula el sistema con pesos fijos
4 · Revisión | Si la nota está en el límite o hay dudas, la revisa una persona
```

### Qué ve cada uno

| Candidato | Empresa |
| --- | --- |
| Nota, banda y **por qué**: lo que más sube y lo que más baja, con su frase | Banda, número de pruebas y fecha |
| Qué le faltó y cómo practicarlo | Las respuestas reales, tras el desbloqueo |
| Puede pedir revisión humana | Si hubo revisión humana |

Antes de usarlo con empresas, la asesora y alguien del equipo corrigen un conjunto de respuestas a mano para comprobar que la IA coincide con ellas.

## 10 · Confianza y juego limpio

### Cuatro niveles de control, según lo que esté en juego

```escalera
Práctica | Sin control. No cuenta para el pool.
Estándar | Por defecto. Un solo intento, reloj que no se para, datos distintos para cada uno, sin copiar ni pegar.
Supervisado | Si la empresa lo pide. Cámara (sin grabar), pantalla completa y dos preguntas sobre su propia respuesta.
Alto | Eventos y certificaciones. Además, móvil como segunda cámara y comprobación de identidad con consentimiento.
```

La empresa elige el nivel en la oferta y el candidato lo sabe antes de empezar. **Nadie queda descartado por una alarma**: una persona lo revisa y el candidato puede explicarse.

### La credencial

| | Firmada | Sellada |
| --- | --- | --- |
| Qué es | La credencial de TalentPact, comprobable con un enlace | Además, una prueba pública con fecha, independiente de TalentPact |
| Precio | Gratis | 4,99 € o incluida en Plus |
| Cómo se ve | Línea discreta en el SkillPass | Igual, con «Sellada» y los detalles plegados |

Verificar una credencial es **siempre gratis** para cualquier empresa, desde su panel o desde la web pública.

### Para que la empresa confíe
Prueba gratuita con su caso real · «haz el reto tú» con su equipo · garantía de respuesta · página de confianza con el método y la calidad medida · nunca demos con datos inventados.

## 11 · Qué es gratis y qué es de pago

| | Gratis | De pago |
| --- | --- | --- |
| **Candidato** | Perfil, pool, todos los retos oficiales, feedback, postular, credencial firmada | **Plus 6,99 €/mes o 49 €/año**: práctica ilimitada, plan de mejora, estadísticas, informe, sellos. Sueltos: sello 4,99 €, revisión 9,99 €, certificación IA 39 € |
| **Empresa** | Prueba de 30 días, verificar credenciales, ver cifras del pool | **49 €** por contacto (perfil IA 89 €) · **Pro 199 €/mes** · **Enterprise 499 €/mes** · reto a medida 299 € · diagnóstico IA de plantilla |
| **Eventos Impact** | Inscripción del candidato | Patrocinio de empresas por evento |

Todas las cifras son propuestas; el modelo financiero se actualiza cuando las aprobéis.

## 12 · Orden de construcción

```flujo
1 · Arreglar | Que los retos no se puedan ver antes de empezar
2 · Ordenar | Sectores, áreas y skills con un solo vocabulario; oferta en 3 pasos
3 · Medir | Comprobar la corrección con la asesora
4 · Completar | Retos nuevos y fichas de cada ejercicio
5 · Abrir a empresas | Prueba gratis, «haz el reto tú», página de confianza
6 · Monetizar | Plus, sello, informes
7 · Rama IA | Itinerarios, expertos y certificación
```

### Decidir juntos
- [ ] ¿Las cuatro zonas y sus secciones (mapa de la plataforma)?
- [ ] ¿12 sectores y 7 áreas visibles?
- [ ] ¿Orden de la ficha del candidato: condiciones, personas, cómo piensa, oficio?
- [ ] ¿Un intento oficial cada 30 días y modo práctica aparte?
- [ ] ¿Rama IA dentro de Tecnología e «IA en el trabajo» para todos?
- [ ] ¿Precios propuestos para candidato y empresa?
- [ ] ¿Prueba gratuita de 30 días para empresas?
- [ ] ¿Empezamos por el paso 1?
