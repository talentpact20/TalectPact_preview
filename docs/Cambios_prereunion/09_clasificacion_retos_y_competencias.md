# Clasificación de retos, áreas, sectores y competencias

Propuesta de la asesora (19/10), ya aplicada en la web. Fuente única: `netlify/functions/lib/taxonomia.json`. El diccionario original está en `docs/plan_post_reunion/asesora/`.

## Qué pidió

- Usar la versión **ampliada**: 22 sectores y 21 áreas funcionales.
- Que sea **simple**: primero lo general, y lo concreto solo cuando hace falta. Nada de pantallas llenas de opciones.
- **Separar** el sector de la empresa del área del puesto.
- Ordenar las soft skills en **6 dimensiones** con competencias concretas.
- Al publicar una oferta, **sugerir competencias según el tipo de puesto**, y que la empresa pueda cambiarlas.

## Cómo ha quedado

**Área del puesto (qué hace la persona).** Hay 9 áreas generales. Al elegir una, aparece «Área concreta» solo si tiene varias. Entre todas suman las 21 de la versión ampliada.

| Área general | Áreas concretas |
| --- | --- |
| Asesoría jurídica, riesgos y cumplimiento normativo | La misma |
| Dirección, estrategia y consultoría | Dirección general y consejo de administración · Estrategia y desarrollo corporativo · Consultoría |
| Finanzas | La misma |
| Marketing, ventas y comunicación | La misma · Atención al cliente y experiencia de cliente |
| Operaciones | La misma · Administración y servicios generales · Compras y cadena de suministro · Producción y mantenimiento · Calidad y medio ambiente · Gestión de proyectos y programas |
| Recursos humanos | La misma |
| Sanidad, educación e investigación | Sanidad y atención sociosanitaria · Educación, formación e investigación |
| Sostenibilidad | La misma |
| Tecnología | La misma · Ingeniería e I+D · Diseño y producto · Transformación y digitalización |

Son las 7 áreas de la versión resumida más dos generales nuevas. Hacían falta porque Consultoría, Dirección general, Sanidad y Educación no encajaban bien en ninguna de las 7. **Pendiente de validar con la asesora.**

**Sector de la empresa (a qué se dedica).** Son los 12 sectores de la versión resumida. Si el elegido se divide en varios, aparece «Concretamente», con los 22 de la ampliada. Ejemplo: Servicios financieros → «en general» o «Fintech y medios de pago». Se pide en el perfil de la empresa y en «Completa los datos de tu empresa».

**Retos: dos bloques (cambio del 19/10 por la noche).** Se quitan los tres pilares. Ya no hay «Transferibles»: todo lo transversal es soft.

| Bloque | Primer nivel | Segundo nivel |
| --- | --- | --- |
| **Hard skills** (la parte técnica) | 10 sectores: las 9 áreas generales y «Idiomas» | Las 21 áreas concretas (cada reto técnico está en una) |
| **Soft skills** | Las 6 dimensiones del diccionario | Sus enfoques: las 32 competencias |

En el panel del candidato hay dos tarjetas grandes, Hard skills y Soft skills. Debajo salen las tarjetas de sus sectores o dimensiones, cada una con su número de retos. Al abrir una aparecen sus áreas o enfoques. Al elegir un enfoque se muestra su definición. Una línea encima de los retos dice dónde estás, por ejemplo: «Soft skills › Colaboración e influencia › Negociación · 1 reto». El buscador busca en todos los retos. En la portada, la columna de retos tiene los mismos niveles, en botones pequeños.

**Qué competencias evalúa cada reto actual:**

| Reto | Competencias |
| --- | --- |
| Pensamiento analítico, Razonamiento lógico | 01.1 Pensamiento analítico y crítico |
| Pensamiento estratégico | 01.2 Pensamiento estratégico |
| Toma de decisiones | 01.3 Toma de decisiones y juicio · 01.5 Gestión de la complejidad y ambigüedad |
| Gestión del tiempo | 02.2 Planificación y priorización |
| Liderazgo | 03.1 Inspiración y movilización · 03.3 Delegación · 03.5 Gestión del desempeño |
| Comunicación escrita | 04.1 Comunicación clara y adaptativa |
| Atención al cliente | 04.2 Escucha activa y empatía · 04.6 Relaciones y confianza · 01.4 Orientación al cliente |
| Trabajo en equipo | 04.4 Colaboración transversal |
| Negociación | 04.5 Negociación y resolución de desacuerdos |
| Networking | 04.6 Construcción de relaciones y confianza |
| Resolución de problemas | 05.5 Resolución de problemas |
| Creatividad e innovación | 05.4 Creatividad e innovación aplicada |

Todos estos retos son soft skills, incluidos los que antes estaban en Transferibles. «Networking» pasa de hard a soft. «Excel y datos» y los idiomas son hard skills.

**Oferta: tipo de puesto.** En el paso 2 hay un selector «Tipo de puesto» con los 6 paquetes del diccionario: prácticas o junior, especialista, project o product manager, manager de equipos, dirección, y comercial o atención al cliente. Las sugerencias se separan en «Hard skills del oficio», según el área, y «Soft skills para…», según el paquete. La empresa añade o quita las que quiera. Si el paquete pide competencias que aún no tienen reto, se dice, y se propone preguntarlas en los dilemas.

## Lo que deja ver: huecos del catálogo

De las 32 competencias, solo 16 tienen reto hoy. La dimensión 06 (autoliderazgo, integridad, resiliencia) no tiene ninguno. La 02 y la 03 tienen uno cada una. Los paquetes de manager y dirección se quedan cortos. Siguiente paso: escribir retos para las que faltan, usando el «reto sugerido» de cada ficha del diccionario.

## Compatibilidad

- No hace falta SQL. Las ofertas guardan el área general en `jobs.area` y la concreta en `jobs.especialidad`. Las empresas guardan su sector concreto en `companies.sector`, y los 12 identificadores antiguos siguen valiendo.
- Las especialidades del 19/10 (por ejemplo, «Selección y atracción de talento») ya no se ofrecen. Si alguna oferta guardada tiene una, se sigue mostrando tal cual.
