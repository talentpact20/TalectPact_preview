# Corto plazo (2–4 semanas): RRHH + “cómo es el candidato”

Une el **apartado 2** (lo que más duele a RRHH) con la idea de dar más peso a **liderazgo, equipo, tiempo y comunicación** (antes que lo técnico).  
No es más IA: es alineación comercial y de pantallas.

## Lectura en una frase

Una empresa necesita, en este orden:

1. ¿Puede trabajar en **nuestras condiciones**?  
2. ¿Cómo se comporta con **personas y el trabajo** (liderazgo, equipo, tiempo…)?  
3. ¿Demuestra las **skills del puesto** (técnicas si hace falta)?  
4. ¿**Confío** en la prueba?  
5. ¿Dónde está en **mi proceso**?  
6. ¿Cómo **contacto**?

TalentPact ya cubre mucho de 3–4; flaqueaba en 1 (BD), en hacer visible 2, y en 5–6.

---

## Tabla unificada (necesidad → qué construir → personas)

| Necesidad empresa | Qué construir | Cómo entra “Personas y equipo” |
| --- | --- | --- |
| ¿Puede trabajar como nosotros? | Preferencias/condiciones **fiables en BD** (`empleo`, pool chips) — UI ya hay; fuente de verdad en curso (1B/1C) | Condiciones = filtro logístico. Personas = filtro de conducta. Van juntos en la ficha. |
| ¿Cómo es / encaja con nosotros? | **(A)** Segmentar y mostrar primero Liderazgo · Equipo · Tiempo · Comunicación · Decisiones en pool/ficha. **(B)** 2–3 **preguntas/escenarios de la vacante** al publicar (cultura *de esta* empresa) | (A) = evidencia genérica de conducta. (B) = encaje cultural propio. No son test de personalidad. |
| ¿Confío en la nota? | Mostrar **integridad** (pestañas, etc.) sin auto-descartar | Aplica igual a retos de personas y técnicos: la nota soft solo vale si la prueba es creíble. |
| ¿Quién sigue en proceso? | Mini-pipeline por oferta: Aplicado → Retos → Preseleccionado → Entrevista → Contratado/Descartado (+ motivo) | En “Retos”, la empresa puede exigir o priorizar el bloque Personas antes de pasar a entrevista. |
| ¿Cómo contacto? | Aviso al candidato cuando le desbloquean (el FAQ lo promete y falla) | El soft no sirve si el contacto se rompe: cierra el ciclo humano. |

---

## Orden de construcción recomendado (combinado)

| # | Entrega | Semana orientativa | Estado |
| --- | --- | --- | --- |
| 0 | SQL pool + preferencias en BD + chips condiciones (1B/1C) | Ya | Código OK; SQL pool a confirmar en Supabase |
| 1 | **Personas delante**: segmentación + chips + filtro + copy | Semana 1 | **Hecho en código** (`19-rrhh.js`) |
| 2 | Integridad visible en ficha (sin auto-descarte) | Semana 1–2 | **Hecho en código** |
| 3 | 2–3 preguntas/escenarios al publicar oferta | Semana 2 | **Hecho en código** (+ SQL `culture_questions`) |
| 4 | Aviso in-app al desbloquear contacto | Semana 2–3 | **Hecho en código** (email real pendiente) |
| 5 | Mini-pipeline por oferta | Semana 3–4 | **Hecho en código** (+ SQL `applications`) |
| 6 | Encaje con más peso a Personas si la oferta las pide | Semana 4 | **Hecho (básico)** |

El **guion 1E** no entra: la reunión con la asesora es conversación, no presentación.

---

## Qué decirle a la asesora (sin pitch)

> “Separaremos dos cosas: si puede trabajar en vuestras condiciones, y cómo se comporta (liderazgo, equipo, tiempo) en simulaciones — no en un test de personalidad. Después, si queréis, cada vacante puede llevar 2–3 preguntas vuestras. La nota lleva integridad a la vista; el proceso y el aviso de contacto cierran el circuito de selección.”

---

## Relación con documentos

- Detalle segmentación soft: `02_punto_1d_pack_soft.md`  
- Ideas tácticas (orden UI, filtro, pesos): conversación 2026-10-14  
- Changelog: `01_changelog.md`
