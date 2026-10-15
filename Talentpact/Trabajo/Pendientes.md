# Pendientes

## Decide el equipo
- [ ] **Ofertas de ejemplo en producción**: el seed de Iván (NortePay, Orbit Labs, ClaroData, Verde Brand) choca con la regla de no mostrar contenido de demostración. ¿Se quitan, se marcan o se mantienen para la reunión?

- [ ] Decisiones de `04_estrategia.md`: perfil de trabajo inicial, plazo entre reintentos, nota por bloques, pool solo para empresas verificadas. Ver [[Estrategia]].

## Supabase (usuario)
- [ ] **Activar Google** en Authentication → Providers (hoy Google y LinkedIn están desactivados; ver `docs/Cambios_prereunion/01_changelog.md`, 15/10). Añadir `https://talentpact.es/` a Redirect URLs.
- [ ] Decidir si se exige confirmar el email al registrarse (hoy `mailer_autoconfirm` está activo: cualquiera puede registrarse con un correo ajeno).
- [ ] Ejecutar `supabase_schema_pool_fix.sql` si falta.
- [ ] Ejecutar `supabase_schema_rrhh_corto.sql` (preguntas de vacante, avisos, pipeline).
- [ ] Ejecutar `supabase_schema_dilemmas.sql` (dilemas en oferta + respuestas al postularse).
- [ ] Rol admin en `app_metadata` y `EVAL_SIGNING_SECRET` en Netlify.

## Código (Claude)
- [x] **Seguridad (XSS)**: en `08-ofertas-y-ejercicios.js` (renderJobs) el nombre de empresa y las skills se insertan sin escapar en la portada.
- [x] Rediseñar tarjeta de oferta (empresa arriba, máx. 4 skills + «+N», sector en español, sin colores a mano en `TP_MONO_TINTS`).
- [x] Pipeline: el selector de etapa depende del botón de contacto; los que no aceptan contacto se quedan sin etapa. Usar `data-ref` en la tarjeta.
- [x] Sustituir `window.prompt` del motivo de descarte por un diálogo propio.
- [x] (parcial: 84→33) Pasar a clases los ~137 `style="…"` que generan los scripts.
- [x] Privacidad: ante un fallo pasajero, el pool, el contacto y el pago repetían la consulta sin los filtros de consentimiento (`pool_visible`, `allow_contact`). Corregido con `faltaEnEsquema()`.
- [x] Revisión del código de Iván (15/10): errores tapados como «migración pendiente», doble clic en Aplicar y en Publicar, encaje del 30 % sin skills, preguntas de vacante fuera de la ficha, tabla del pool desbordando el panel.
- [x] Taxonomía de aptitudes (4 familias + técnicas) + dilemas en oferta/postulación (15/10). Falta SQL en Supabase.
- [ ] Engordar catálogo: escucha, resiliencia, proactividad, pensamiento lateral, etc. (huecos del doc 08).
- [ ] Encaje: las condiciones desconocidas (candidato sin preferencias) cuentan como encaje completo (30 puntos). ¿Contarlas como neutras?
- [ ] Email real del aviso de desbloqueo (hoy solo bandeja in-app).
