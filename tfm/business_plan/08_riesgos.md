# 8. Riesgos y contingencias

Todo plan de negocio contiene una lista de riesgos, y casi siempre es el apartado que se lee por encima. Aquí se ha optado por desarrollarlos en detalle, explicando en cada caso qué probabilidad tiene de materializarse, qué ocurriría realmente si lo hiciera y qué medidas concretas están previstas o ya adoptadas. Los riesgos se agrupan en cuatro familias —mercado, tecnología, finanzas y regulación— y el apartado se cierra con el orden de prioridad real de trabajo. El criterio de ordenación es lo que puede comprometer el proyecto **antes del punto de equilibrio previsto para mayo de 2028**.

---

## 8.1 Riesgos de mercado

**El problema del huevo y la gallina es el riesgo más grave de todos**, y conviene empezar por él sin rodeos. Es de probabilidad alta y de impacto crítico, y es inherente a cualquier mercado de dos lados: las empresas no entran si no encuentran candidatos suficientes, y los candidatos abandonan si no perciben oportunidades reales. El fallo se retroalimenta, porque cada lado que se marcha desincentiva al otro. La respuesta está incorporada al diseño de la salida al mercado descrita en el apartado 5: llenar primero y de forma deliberadamente desequilibrada el lado de la oferta, cuyo coste de captación es prácticamente nulo, y solo después salir a vender. A ello se suma una decisión de precio: entrar con un desbloqueo de €49 en lugar de con un contrato anual de varios miles de euros reduce enormemente el volumen mínimo de candidatos necesario para que la propuesta resulte creíble. Vender un contrato grande exige un conjunto de perfiles grande; vender una operación pequeña, no.

**Que un competidor consolidado replique la combinación de inteligencia artificial y conjunto de perfiles** es un riesgo de probabilidad media e impacto alto. LinkedIn, TestGorilla o cualquier actor con recursos puede incorporar evaluación automatizada a su producto en un plazo razonable, y si lo hace el discurso diferencial pierde parte de su fuerza. La defensa no está en ninguna de las piezas por separado, porque todas son replicables, sino en su combinación: el anonimato obliga a renunciar a mostrar los perfiles que esas plataformas precisamente venden, el cobro por resultado canibaliza su modelo de licencias, y la credencial anclada criptográficamente exige competencias de criptografía y cumplimiento normativo que no forman parte de su especialidad. Cada una por separado es imitable en un trimestre; las cuatro a la vez implican reconstruir el producto y el modelo de ingresos.

**La baja calidad del conjunto de perfiles** es un riesgo de probabilidad media e impacto alto que actúa de forma silenciosa. Si una empresa paga por desbloquear un contacto y descubre que el candidato no está a la altura de la puntuación que mostraba, no solo pierde ese dinero: deja de confiar en el mecanismo completo y no vuelve. Es un daño reputacional difícil de revertir porque afecta a la credibilidad del producto en su núcleo. Las medidas son tres y ya están implementadas: rúbricas con indicadores observables en lugar de valoraciones genéricas, detección de intentos de manipulación en la evaluación, y la regla de no exponer perfiles que no tengan retos efectivamente resueltos.

**La lentitud de adopción en la pyme española** tiene probabilidad media e impacto alto sobre las proyecciones. El objetivo de veinticuatro empresas clientes en 2026 es modesto en términos absolutos, pero depende de que un segmento con ciclos de decisión imprevisibles adopte una forma de contratar distinta de la que conoce. La mitigación consiste en concentrar el esfuerzo en el segmento tecnológico, que es el más receptivo a la evaluación por competencias, y en no abrir un segundo mercado geográfico hasta disponer de un método de venta contrastado en el primero.

**El rechazo al cribado ciego** por parte de responsables de selección acostumbrados a consultar el perfil social del candidato antes de cualquier conversación es un riesgo de probabilidad baja e impacto medio. La respuesta es sencilla y forma parte del propio diseño: el anonimato dura **hasta el desbloqueo**, no indefinidamente. Una vez la empresa paga, accede a la identidad completa. No se le pide que renuncie a información, sino que ordene el proceso de otra manera, evaluando primero la competencia y conociendo después a la persona.

**Señal de alarma para este bloque.** Un coste de adquisición medido por encima de €400 por empresa, o una tasa de abandono superior al 8 % mensual sostenida durante un trimestre, indicarían que alguno de estos riesgos se ha materializado y obligarían a revisar la estrategia comercial antes de seguir invirtiendo.

---

## 8.2 Riesgos técnicos: inteligencia artificial y blockchain

**La ausencia de una referencia humana con la que contrastar el Skill Score** es el principal riesgo técnico del proyecto, con probabilidad alta e impacto alto. Ocurre lo siguiente: una empresa discute una puntuación concreta, o un candidato reclama, y no existe forma de acreditar que la valoración es correcta más allá de lo que dice la rúbrica. Es además el punto donde el reglamento europeo de inteligencia artificial exige demostrar niveles adecuados de exactitud. La mitigación tiene dos partes. La primera es de comunicación y ya se aplica: no se presenta el resultado como una certificación oficial, sino como una evaluación trazable. La segunda es de producto: el instrumento para medir el acuerdo con criterio profesional está construido —conjunto de casos de referencia, métricas y comando de ejecución— y solo requiere las correcciones humanas para producir la cifra. La revisión de ejercicios por parte de las empresas descrita en el §3.7 puede convertirse, además, en una fuente natural de ese material.

**La variabilidad entre ejecuciones**, del orden de ocho a doce puntos en respuestas equivalentes, tiene probabilidad media e impacto medio. Genera desconfianza cuando dos candidatos con trabajos similares obtienen notas distintas. Se mitiga fijando la temperatura del modelo en cero —lo que garantiza que un mismo texto produzca siempre la misma nota—, sustituyendo los indicadores subjetivos de las rúbricas por anclas observables, y previendo la evaluación por triplicado con nota mediana en la zona próxima a un umbral de decisión.

**El sesgo del modelo, y en particular el efecto de longitud**, es un riesgo de probabilidad media e impacto alto porque su consecuencia extrema es una reclamación por discriminación. Se aborda desde tres frentes: el anonimato estructural, que elimina los atributos personales del proceso de valoración; la cláusula de equidad incorporada a las instrucciones del evaluador; y el compromiso de medir el impacto diferencial en cuanto exista muestra suficiente, tal como recogerá la evaluación de impacto en protección de datos.

**La dependencia de un único proveedor de inteligencia artificial** tiene probabilidad media e impacto alto: una subida de tarifas o una interrupción del servicio afectarían directamente al producto. La arquitectura mitiga este riesgo por diseño, porque la inteligencia del sistema no reside en el modelo sino en las rúbricas: las instrucciones son portables a otro proveedor y el código ya contempla un mecanismo de reserva ante la indisponibilidad de un modelo concreto. El coste de cambiar de proveedor es de días, no de meses.

**Los intentos de manipulación a escala** tienen probabilidad baja e impacto alto. La defensa está implementada en dos capas —separación de canales e instrucción explícita de registrar cualquier intento— y se comprueba con tres variantes distintas de ataque en el banco de pruebas. Conviene precisar que se trata de una demostración de que el control existe y funciona sobre casos conocidos, no de una tasa medida sobre tráfico real.

**El compromiso de la clave del emisor** es un riesgo de probabilidad baja pero de impacto crítico, y es el único punto del diseño criptográfico donde un fallo destruiría la propuesta completa: quien tuviera la clave podría anclar credenciales de evaluaciones que nunca existieron. La mitigación actual es que la cartera empleada pertenece exclusivamente a una red de pruebas y carece de valor económico. En producción correspondería custodiar la clave en un módulo de seguridad hardware, rotarla de forma periódica y trasladar la autoridad de emisión a un esquema de firma múltiple, para lo cual el contrato ya incorpora la función necesaria.

**La distancia entre una red de pruebas y una red principal** es un riesgo de percepción, con probabilidad media e impacto medio. La forma de gestionarlo es la transparencia: se declara de forma expresa que se trata de una red de pruebas que puede reiniciarse, que lo demostrado es el mecanismo y que el mismo contrato se desplegaría sin modificaciones en una red de producción. Sostener lo contrario sería un error mucho más costoso que reconocer la limitación.

**La indisponibilidad de la infraestructura en un momento crítico** —el nodo de acceso a la red, la base de datos o el alojamiento— tiene probabilidad media e impacto alto sobre cualquier demostración en directo. Las medidas son de sentido común: mantener siempre una credencial ya anclada con su transacción confirmada, disponer del verificador en local, y conservar un respaldo en almacenamiento del navegador para la demostración del producto.

**El riesgo que no se maquilla.** El motor de evaluación es bueno y económico —€0,0165 por evaluación medidos— pero **todavía no está calibrado contra criterio humano**. Lo que sí existe ya es el instrumento completo para hacerlo. Es el siguiente hito de producto, y presentarlo como pendiente es más sólido que presentarlo como resuelto.

---

## 8.3 Riesgos financieros

**Que no llegue la ronda inicial de €180.000** es un riesgo de probabilidad media e impacto crítico sobre el plan, aunque conviene precisar el alcance de esa criticidad. Sin esa financiación no se sostiene el recorrido hasta el punto de equilibrio de 2028, porque no se pueden asumir ni la estructura de personal ni el coste de adquisición de las primeras cuentas. Lo que sí sobrevive sin ella es el producto ya construido y el trabajo técnico realizado: la demostración funciona, el contrato está desplegado y el motor evalúa. Es una distinción relevante, porque separa la viabilidad del plan de negocio de la validez de lo desarrollado.

**Que no se conceda el préstamo participativo de €50.000** tiene probabilidad media e impacto alto. Su efecto concreto es estrechar el valle de tesorería de 2028, que ya de por sí es ajustado. Con la ronda inicial únicamente, el margen de operación a la tasa de consumo de caja de 2026 sigue siendo de aproximadamente treinta y cinco meses, lo que mantiene el plan en pie aunque sin holgura para imprevistos.

**Que el gasto de personal se adelante** respecto a lo previsto es un riesgo de probabilidad media e impacto alto, y es un error clásico: contratar al ritmo del segundo año durante el primero. El modelo contempla €4.800 mensuales de masa salarial en 2026 y €12.200 en 2027; adelantar ese salto consumiría el margen de operación antes de que los ingresos lo justifiquen. La mitigación es puramente de disciplina financiera y no depende de terceros.

**Los impagos y las incidencias con la pasarela de pago** tienen probabilidad baja e impacto bajo, sencillamente porque el modelo de cobro los minimiza: se factura por tarjeta con cobro casi inmediato y un periodo medio de cobro de dos días, sin crédito comercial. La única medida necesaria es suspender cuentas ante devoluciones sistemáticas.

**Que el coste de la inteligencia artificial se multiplique por diez** tiene probabilidad baja e impacto medio. El margen bruto del 93,5 % soporta un coste por evaluación de hasta aproximadamente €0,20 sin comprometer el modelo, lo que supone un factor de doce sobre el coste medido actual. Si aun así se superara ese umbral, quedan dos palancas: limitar el volumen de retos gratuitos y emplear modelos más pequeños y económicos para los ejercicios de menor complejidad.

**El valle de tesorería de abril de 2028**, con un mínimo proyectado de €38.003, merece mención propia aunque no sea un riesgo en sentido estricto sino una restricción operativa. El modelo **nunca proyecta tesorería negativa**, pero el margen en ese punto es estrecho y cualquier retraso en los ingresos lo comprometería. La consecuencia práctica es una regla de gestión: durante el primer trimestre de 2028 no se abren nuevas líneas de gasto ni se realizan inversiones discrecionales.

---

## 8.4 Riesgos regulatorios

**El retraso o el coste del expediente de conformidad del reglamento de inteligencia artificial** es el riesgo regulatorio más probable, con impacto alto. Su consecuencia sería la imposibilidad de comercializar el producto como sistema de evaluación de candidatos en la Unión Europea hasta completar el trámite. La mitigación es de posicionamiento de producto: comercializar la herramienta como **apoyo a la decisión** con intervención humana efectiva, sin automatizar en ningún caso el rechazo de un candidato. Esa configuración, que además es la que el producto implementa realmente, reduce sustancialmente la carga de conformidad exigible.

**Que una autoridad interprete la huella criptográfica como dato personal** tiene probabilidad baja e impacto alto, ya que obligaría a replantear el uso de una cadena pública. La defensa es el propio diseño: la huella, aislada, no permite reconstruir nada, y al borrar el documento queda definitivamente huérfana. Es la solución reconocida en la práctica para conciliar registros distribuidos con el derecho de supresión, y se reforzará con un dictamen jurídico específico antes de comercializar.

**Las transferencias internacionales de datos** derivadas del uso de un proveedor de inteligencia artificial fuera del Espacio Económico Europeo tienen probabilidad media e impacto medio. Se abordan mediante cláusulas contractuales tipo y, sobre todo, minimizando el contenido enviado: al modelo viajan el enunciado del reto y la respuesta, nunca datos identificativos del candidato.

**Iniciar los cobros antes de completar la constitución societaria y la evaluación de impacto** es un riesgo de probabilidad media e impacto crítico, con consecuencias tanto sancionadoras como reputacionales. La medida es inequívoca: la plataforma pública permanece en versión preliminar hasta que se cierre por completo la secuencia del §7.5.

**Que alguien plantee que la credencial constituye un instrumento financiero** tiene probabilidad baja e impacto bajo. No existe token, no hay oferta al público, no hay mercado secundario y no se genera rendimiento alguno. La mitigación consiste simplemente en tener documentado ese análisis, que ya figura en el §7.4.

---

## 8.5 Prioridades y plan de contingencia

Con recursos limitados, enumerar riesgos no sirve de nada si no se establece en qué orden se trabajan. Esta es la prioridad real del equipo, ordenada por lo que más comprometería el proyecto y no por el orden en que aparecen los apartados anteriores.

**En primer lugar, el mercado vacío.** Es el riesgo que puede detener el proyecto antes que ningún otro, porque sin empresas clientes no hay ingresos y sin ingresos no hay recorrido. La contingencia es operativa y medible: sostener un ritmo de diez demostraciones semanales de prospección directa, no invertir en publicidad hasta que ese canal esté calibrado, y medir desbloqueos efectivos en lugar de visitas a la web. Las visitas son un indicador cómodo y engañoso; los desbloqueos son el único dato que indica si alguien está dispuesto a pagar.

**En segundo lugar, la defensa de la evaluación automatizada.** Si una empresa o un candidato cuestionan una puntuación, la respuesta debe ser documental e inmediata: el registro completo de la evaluación, con criterios, razonamiento y modelo empleado, más el aviso previo al candidato de que la corrección es automatizada. Y una regla que no se rompe: no afirmar cifras de exactitud frente a criterio humano mientras no exista la medición correspondiente.

**En tercer lugar, la disponibilidad de la demostración técnica.** La contingencia es tener siempre preparada una credencial ya anclada con su transacción confirmada, el verificador accesible sin depender de servicios externos y capturas de respaldo. Nunca depender de emitir en directo si no hay alternativa preparada.

**En cuarto lugar, la tesorería.** Si la ronda de financiación se retrasa o se reduce, el plan de repliegue consiste en mantener la estructura de dos socios sin incorporar contrataciones en 2027 y prolongar el régimen austero de 2026. El producto ya construido no requiere inversión adicional para seguir funcionando, lo que hace este repliegue viable.

**En quinto lugar, la seguridad de claves y datos.** Los secretos residen exclusivamente en variables de entorno y en el gestor de secretos del proveedor de alojamiento, nunca en el control de versiones, y la funcionalidad de eliminación de cuenta está implementada y operativa.

**Riesgo residual aceptado.** El proyecto demuestra un recorrido vertical completo y real —evaluación con inteligencia artificial, persistencia de datos y sello criptográfico— sobre una red de pruebas. No es un sistema en producción a gran escala ni un sistema de alto riesgo ya registrado ante las autoridades europeas. Presentarlo con esa precisión es más sólido que exagerar su grado de madurez, y permite que la discusión se centre en lo que efectivamente se ha construido.

---

*Los límites técnicos identificados durante el desarrollo se integran aquí como riesgos de producto, no como defectos ocultos.*
