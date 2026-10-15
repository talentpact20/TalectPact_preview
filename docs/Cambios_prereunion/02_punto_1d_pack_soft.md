# Punto 1D — Cómo segmentar (criterio acordado con Ivan)

## Qué pide de verdad la empresa / asesora

No “más retos”. Quiere **conocer cómo es el candidato en el trabajo**:

- ¿tiene liderazgo?
- ¿trabaja bien en equipo?
- ¿gestiona el tiempo?
- (y en general) comunicación, decisiones bajo presión, ética

Hoy el producto mezcla eso con lo técnico en un listado de “soft skills” demasiado amplio (también mete analítica, lógica, Excel…). Para RRHH, **lo técnico no es lo primero**.

## El error del plan anterior (“elegir 4”)

Era un escaparate corto. Útil para una frase, pero **no responde** a “dad más importancia a cómo es la persona”. Hace falta **resegmentar**, no recortar el catálogo.

## Segmentación propuesta (2 capas + 1 bloque técnico)

### 1. Personas y equipo *(prioridad para la empresa)*

Simulaciones de conducta. Son las que la asesora nombra.

| Bloque | Retos que ya existen (ejemplos) |
| --- | --- |
| Liderazgo | `common_leadership` (conversación difícil, decisión impopular…) |
| Trabajo en equipo | `common_teamwork` (delegación, feedback, decisión grupal) |
| Gestión del tiempo | `common_time` |
| Comunicación | `common_communication` (emails, conflicto por escrito) |
| Decisiones y criterio | `common_decisions` (dilema ético, priorización bajo presión) |

Opcional después: Negociación, Atención al cliente (también son “cómo se comporta”).

### 2. Cognitivo y criterio *(sigue siendo transversal, pero no es “cómo es con gente”)*

Pensamiento analítico, razonamiento lógico, estrategia, creatividad, Excel…

Útiles, pero **no sustituyen** liderazgo/equipo/tiempo en una conversación de RRHH.

### 3. Técnico / sector

IT, Data, Marketing, Finanzas… Lo que hoy es `category: 'sector'`.

## Qué debería ver la empresa (producto)

En pool / ficha anónima, **antes o al mismo nivel** que Python/SQL:

1. Condiciones laborales (ya 1C)  
2. Bloque **Personas y equipo** con notas si las hay (Liderazgo 78 · Equipo 71 · Tiempo 65)  
3. Luego skills técnicas / sector  

Si no ha hecho ninguno de personas: chip honesto «Sin simulaciones de personas aún» (no inventar score).

## Qué debería ver el candidato

- En retos: filtros **Personas y equipo** | Cognitivo | Técnico (en vez de solo Soft / Sector).  
- Copy: “Así demuestras cómo trabajas con gente — no es un test de personalidad.”

## Criterio de “1D cerrado”

Se puede decir a la asesora, sin guion:

> “Lo primero que veis no es el stack técnico: es liderazgo, equipo y tiempo, medidos en situaciones. Lo técnico viene después. No es personalidad declarada: es conducta en un reto.”

…y la pantalla lo ordena así.

## Estado (15/10)

- **Criterio de producto:** acordado en conversación (14/10).
- **Código:** hecho (`19-rrhh.js`, `lib/personas.js`). Filtros Personas, Cognitivo y Técnico en retos; chips de Personas y filtro «Con evidencia de personas» en el pool; bloque Personas en la ficha; más peso en el encaje cuando la oferta pide skills de personas.
- **Hueco detectado:** el catálogo tiene **7 retos de Personas** frente a 89 de sector. Para que «Personas delante» tenga contenido detrás, hay que llegar a 15–20 (ver `04_estrategia.md`, §8).
- **No hacer:** test de personalidad, ocultar lo técnico ni limitar el catálogo a 4 retos.
- **Siguiente paso relacionado:** el perfil de trabajo inicial (`04_estrategia.md`, §1) separa lo que el candidato declara (contexto preferido, sin nota) de lo que demuestra (retos de Personas, con nota).
- **Evolución (15/10):** la segmentación Personas / Cognitivo / Técnico se **refina** en cuatro bloques de aptitudes + técnicas, y la oferta gana dilemas de empresa. Criterio completo en [`08_taxonomia_aptitudes_y_oferta.md`](08_taxonomia_aptitudes_y_oferta.md). Lo ya hecho en código sigue válido; el doc 08 es el mapa al que migrar.
