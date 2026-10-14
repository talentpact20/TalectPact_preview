# Contexto de la reunión con la asesora

## Para qué es esta fase

TalentPact ya pasó por la defensa TFM. Ahora el foco es **alinearlo con lo que pide una persona de RRHH / asesoramiento de talento** cuando una empresa contrata: condiciones laborales, skills demostradas, soft skills / liderazgo, y confianza en la prueba — sin tests de personalidad.

## Cómo hablamos (criterio)

1. **Conversación**, no presentación: preguntas, objeciones, “¿esto os serviría?”.
2. Si hace falta enseñar producto, se abre la web y se señala una pantalla (ofertas, preferencias, pool, un reto soft). No hay orden fijo de guion.
3. Frase de posicionamiento (si sale el tema): *ordenamos evidencia; la entrevista la hacéis vosotros*.
4. Lo que no hacemos: test de virtudes genérico, “disponibilidad total” como virtue signal, ni sustituir la entrevista con IA.

## Checklist “punto 1” (estado para la asesora)

| Id | Tema | Estado |
| --- | --- | --- |
| 1A | Ofertas reales en Supabase | Hecho (seed `jobs`) |
| 1B | Preferencias del candidato en BD (`empleo`) | Pendiente de que el SQL de pool esté aplicado + Guardar |
| 1C | Pool empresa con chips de condiciones (ficha RRHH) | Hecho en código (falta deploy) |
| 1D | Personas y equipo delante (no solo técnico) | **Hecho en código** |
| 1E | Guion de demo 3 min | **Descartado** para esta fase (no lo presentamos) |
| Corto plazo | RRHH 2–4 sem + personas | **Hecho en código** — ver `03_…` |

## SQL pendiente en Supabase

1. Si falta el pool: `tfm/tech/supabase_schema_pool_fix.sql`  
2. Obligatorio para lo nuevo: `tfm/tech/supabase_schema_rrhh_corto.sql`  
   (preguntas de vacante, avisos, pipeline)

Después: deploy → candidato Guardar preferencias → empresa Pool / Ver candidatos.
