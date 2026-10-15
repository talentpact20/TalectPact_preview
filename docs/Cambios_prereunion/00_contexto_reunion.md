# Contexto de la reunión con la asesora

## Para qué es esta fase

TalentPact ya pasó por la defensa TFM. Ahora el foco es **alinearlo con lo que pide una persona de RRHH / asesoramiento de talento** cuando una empresa contrata: condiciones laborales, skills demostradas, soft skills / liderazgo, y confianza en la prueba — sin tests de personalidad.

## Cómo hablamos (criterio)

1. **Conversación**, no presentación: preguntas, objeciones, “¿esto os serviría?”.
2. Si hace falta enseñar producto, se abre la web y se señala una pantalla (ofertas, preferencias, pool, un reto soft). No hay orden fijo de guion.
3. Frase de posicionamiento (si sale el tema): *ordenamos evidencia; la entrevista la hacéis vosotros*.
4. Lo que no hacemos: test de virtudes genérico, “disponibilidad total” como virtue signal, ni sustituir la entrevista con IA.

## Checklist «punto 1» (estado a 15/10)

| Id | Tema | Estado |
| --- | --- | --- |
| 1A | Ofertas reales en Supabase | Tabla `jobs` creada. Las ofertas que hay son del seed de ejemplo: **falta decidir** si se quitan (regla de no mostrar contenido de demostración) |
| 1B | Preferencias del candidato en BD (`empleo`) | Hecho en código. Falta ejecutar el SQL del pool en Supabase |
| 1C | Pool de empresa con chips de condiciones (ficha RRHH) | Hecho en código. Falta el despliegue |
| 1D | Personas y equipo delante (no solo técnico) | Hecho en código. Solo hay 7 retos de Personas: ver `04_estrategia.md`, §8 |
| 1E | Guion de demo de 3 min | **Descartado** para esta fase |
| Corto plazo | RRHH 2–4 semanas y personas | Hecho en código, revisado y corregido el 15/10 (ver `05_errores_y_mejoras.md`) |
| Postulaciones | «Aplicar» guarda de verdad y la empresa lo ve | Hecho en código el 15/10 |

## Antes de la reunión (bloqueante)

1. En Supabase: `tfm/tech/supabase_schema_pool_fix.sql` (si falta), `tfm/tech/supabase_schema_rrhh_corto.sql` (preguntas, avisos, pipeline) y `tfm/tech/supabase_schema_dilemmas.sql` (dilemas de oferta + respuestas).
2. Aprobar el commit y desplegar los arreglos del 15/10.
3. Decidir sobre las ofertas de ejemplo.
4. Opcional: activar Google en Supabase Auth.

Después: el candidato guarda sus preferencias → la empresa ve el pool y «Ver candidatos».

## Piezas a validar (antes de código)

1. **Taxonomía de aptitudes + estructura de la oferta** (skills clasificadas, 3 preguntas, 1–3 dilemas):  
   → [`08_taxonomia_aptitudes_y_oferta.md`](08_taxonomia_aptitudes_y_oferta.md)
2. **Encaje con el modelo de empresa** (capa de ejes / informe; los dilemas son el MVP):  
   → [`06_encaje_modelo_empresa.md`](06_encaje_modelo_empresa.md)

## Preguntas para la asesora

Se usan para escuchar, no para presentar. Salen de `04`, `06` y `08`.

**Sobre cómo clasificamos las aptitudes**
- ¿Os sirve ver cuatro bloques — **cognitivas, interpersonales, autogestión emocional, ejecución** — y aparte las **técnicas**?
- ¿Falta alguna aptitud que siempre miráis al contratar? ¿Sobran nombres?

**Sobre cómo es la persona y si encaja con *vosotros***
- Cuando contratáis, ¿qué os gustaría saber del **contexto** en el que rinde alguien (autonomía, ritmo, equipo, cliente) que hoy no os da un CV ni una entrevista?
- Si el candidato **declara** sus preferencias de trabajo y además **demuestra** su conducta en un reto, ¿cuál de las dos os creeríais más? ¿Os sirven las dos juntas?
- Si en cada oferta pudierais poner **1–3 dilemas reales** de vuestro día a día y el candidato los resolviera, ¿eso sustituiría parte de la primera criba o solo enriquecería la entrevista?
- ¿Preferís dilemas escritos por vosotros, o plantillas por tipo de empresa?

**Sobre la confianza en la nota**
- ¿Qué os haría desconfiar de una nota de 85: el número de intentos, la antigüedad, que la corrija una IA?
- ¿Preferís una cifra única o una nota por bloque (Personas, Cognitivo, Técnico)?
- ¿Revisaríais una muestra de correcciones para calibrar la IA?

**Sobre el proceso y el pago**
- ¿Pagaríais por contacto (49 €), por suscripción o por contratación?
- La trazabilidad que pide el Reglamento de IA (motivo de descarte, revisión humana, transparencia), ¿es para vosotros un problema o un argumento de compra?
- ¿Qué tendría que pasar para que publicarais una oferta real aquí la semana que viene?
