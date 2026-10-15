# TalentPact · instrucciones para Claude

Antes de nada, lee la bóveda de Obsidian `Talentpact/` empezando por `Talentpact/00 Inicio.md`: concepto, estado, pendientes y decisiones en notas cortas (más barato en contexto). Mantenla al día: tras cada cambio actualiza `Talentpact/Trabajo/Pendientes.md` y, si se decide algo, `Talentpact/Trabajo/Decisiones.md`. Solo si necesitas detalle, abre `CONVERSACION_FINAL_PARA_SEGUIR.md`: resume toda la conversación de trabajo anterior, el estado del código, lo pendiente y el concepto con el que seguimos. Los documentos de mejora completos están en `docs/conversacion/` (el 05, eventos Impact, es el más reciente y el que manda).

Fase actual (prereunión con asesora RRHH): anota cada cambio en `docs/Cambios_prereunion/` (changelog + contexto). No preparar ni ensayar el guion de demo TFM para esa reunión: es conversación, no presentación.

Reglas:

- Responde siempre en español.
- Nada de contenido de demostración (ofertas, empresas, candidatos o métricas inventadas, etiquetas "preview"): solo datos reales de Supabase o estados vacíos profesionales.
- Diseño sobrio y profesional, sin emojis. Colores y tamaños solo con tokens (`assets/css/tokens.css`, generado por `tools/generar_tokens.py`); nada de `style="…"` nuevos; comprobar siempre en claro, en oscuro y a 375 px.
- Commit y push solo cuando el usuario lo apruebe, cada vez.
- No introduzcas credenciales ni crees cuentas en Supabase, Stripe o Netlify reales.
- Si cambia el número de tests u otra cifra canónica, actualiza `tfm/cifras_canonicas.json` y los documentos que comprueba `tests/coherencia-docs.test.js`.
- Ejecuta `npm test` después de cada cambio.
- Tras cada cambio de producto en esta fase, actualiza `docs/Cambios_prereunion/01_changelog.md`.
