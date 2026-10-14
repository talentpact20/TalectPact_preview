# Changelog prereunión

Orden: más reciente abajo. Cada entrada: fecha, qué, por qué (para la asesora / producto), ficheros.

---

## 2026-10-14 — Seed de ofertas demo (1A)

**Qué.** SQL para tabla `jobs` + empresas demo + ~8 ofertas.

**Ficheros.** `tfm/tech/supabase_seed_ofertas_demo.sql`

---

## 2026-10-14 — Migración pool: `empleo` + `unlocks` (1B)

**Qué.** Columnas de preferencias y tablas `unlocks` / `contact_access`.

**Ficheros.** `tfm/tech/supabase_schema_pool_fix.sql`

---

## 2026-10-14 — Pool: chips de condiciones (1C)

**Qué.** Condiciones completas en pool + `horas` en API.

**Ficheros.** `get-talent-pool.js`, `14-empleo.js`, tests pool. Tests → 118.

---

## 2026-10-14 — Criterio reunión sin guion + carpeta prereunión

**Qué.** 1E descartado; docs en `docs/Cambios_prereunion/`.

---

## 2026-10-14 — Criterio 1D: Personas delante

**Qué.** Segmentar Personas y equipo → Cognitivo → Técnico (no “elegir 4”).

**Docs.** `02_punto_1d_pack_soft.md`, `03_corto_plazo_rrhh_y_personas.md`

---

## 2026-10-14 — Implementación corto plazo RRHH + Personas

**Qué.** Todo lo de la tabla (apartado 2) unido a Personas delante:

| Necesidad | Entrega |
| --- | --- |
| Condiciones fiables | Ya 1B/1C (+ SQL pool) |
| Cómo es / cultura | Segmentación Personas + chips en pool/ficha; 2–3 preguntas al publicar oferta |
| Confío en la nota | Integridad visible en pool/ficha (sin auto-descarte) |
| Quién sigue | Mini-pipeline por oferta (`applications`) |
| Cómo contacto | Aviso in-app al desbloquear (`notifications` + `inbox`) |

**Ficheros principales**
- `tfm/tech/supabase_schema_rrhh_corto.sql` ← **ejecutar en Supabase**
- `netlify/functions/lib/personas.js`, `notify.js`
- Handlers: `inbox`, `applications`; cambios en `get-talent-pool`, `save-job`, `list-jobs`, webhook/confirm
- `assets/js/app/19-rrhh.js` + filtros en `index.html` + CSS
- Tests: `tests/rrhh.test.js` → **124 casos / 15 ficheros**

**Acción usuario**
1. Run `supabase_schema_pool_fix.sql` (si falta).
2. Run `supabase_schema_rrhh_corto.sql`.
3. Deploy código (commit/push cuando se apruebe).
4. Probar: filtros Personas, publicar oferta con preguntas, pool con columna Personas, etapa en “Ver candidatos”, desbloqueo → aviso en bandeja candidato.

---

## Pendiente / siguiente

- Deploy a Netlify.
- Email real del aviso (hoy es bandeja in-app; Resend/SMTP después).
- Encaje ponderado fino opcional (ya hay boost si la oferta pide skills de Personas).
