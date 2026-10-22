# Producción urgente (punto 1)

Objetivo: que **talentpact.es** tenga las tablas, columnas y secretos que el código ya usa. Sin esto, CV, cribado, intentos, límites y SkillPass v2 fallan en silencio o a medias.

Comprobar qué falta:

```bash
npm run check:schema
npm run check:rls
```

Esquema aplicado el 22/10 vía plugin: `npm run check:schema` → todo ok. Queda Netlify/Auth (sección B y C).

---

## A. SQL que faltan ahora (Supabase → SQL Editor → Run)

Cada fichero se puede **repetir**. Ejecutar **enteros**, en este orden:

| # | Fichero | Activa |
| --- | --- | --- |
| 1 | `tfm/tech/supabase_schema_requisitos.sql` | `jobs.skill_requirements` |
| 2 | `tfm/tech/supabase_schema_verificacion.sql` | `companies.verificacion` |
| 3 | `tfm/tech/supabase_schema_areas.sql` | `jobs.area`, `jobs.especialidad` |
| 4 | `tfm/tech/supabase_schema_integrity.sql` | `evaluations.integrity` |
| 5 | `tfm/tech/supabase_schema_seguridad.sql` | `rate_events` |
| 6 | `tfm/tech/supabase_schema_intentos.sql` | `attempts`, `attempt_requests` |
| 7 | `tfm/tech/supabase_schema_sello.sql` | `seal_payments` |
| 8 | `tfm/tech/supabase_schema_vc.sql` | `anchor_batches` |
| 9 | `tfm/tech/supabase_limpiar_ofertas_demo.sql` | Borra empresas/ofertas de ejemplo |

Al terminar: `npm run check:schema` (todo `ok`) y `npm run check:rls`.

### Ya aplicados (no hace falta repetir, salvo duda)

`pool_fix`, `rrhh_corto`, `dilemmas`, `cribado`, `cv` (columna; confirma en Storage que el bucket `cvs` existe y es **privado**).

---

## B. Variables en Netlify (Site settings → Environment variables)

Sin tocar cuentas nuevas: solo comprobar o crear estos secretos si faltan.

| Variable | Cómo | Si falta |
| --- | --- | --- |
| `SUPABASE_URL` | Ya debería estar | Las funciones no hablan con la BD |
| `SUPABASE_SERVICE_KEY` | Service role de Supabase (no la anon) | Igual |
| `ANTHROPIC_API_KEY` | Consola Anthropic | Corrector y parse-job-doc |
| `EVAL_SIGNING_SECRET` | `openssl rand -hex 32` | **Ninguna nota sale verificada** |
| `SITE_URL` | `https://talentpact.es` | CORS cerrado mal |
| `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` | Stripe (test o live) | Desbloqueos de pago |
| `VC_SIGNING_KEY` | `npm run vc:clave` | SkillPass sin firma W3C |
| `SKILLPASS_V2_CONTRACT_ADDRESS` (+ RPC / cadena) | Tras `npm run deploy:contract:v2` | Sello por lotes en cola |

Tras cambiar variables: **redeploy** del sitio en Netlify.

---

## C. Auth (Supabase → Authentication)

No es SQL, pero es del mismo “punto 1” de producción:

1. **Exigir confirmar el email** (desactivar autoconfirm): Authentication → Providers → Email.
2. **Activar Google** (cuando tengas Client ID/secreto): Providers → Google; Redirect URLs con `https://talentpact.es/` y el callback de Supabase. Comprobar: `npm run check:google -- https://talentpact.es`.

---

## D. Qué hace el usuario / qué no hace el agente

- El agente **no** pega SQL en tu proyecto ni crea claves en Netlify (regla del repo).
- Tú ejecutas A → B → (C cuando puedas) y vuelves a lanzar `npm run check:schema`.
- Cuando esté verde, marcamos las casillas en `Talentpact/Trabajo/Pendientes.md`.
