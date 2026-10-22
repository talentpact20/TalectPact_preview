#!/usr/bin/env node
/**
 * check-schema — qué tablas y columnas del código faltan aún en Supabase.
 *
 *   npm run check:schema
 *
 * Usa la URL y la clave `anon` del front (públicas). No escribe nada.
 * Con RLS, un SELECT puede devolver 0 filas; lo que importa es el error:
 *   · «relation … does not exist» / schema cache → falta la tabla
 *   · «column … does not exist»                   → falta la columna
 *   · 200 / 406 / 0 filas                         → la pieza existe
 *
 * Orden de los SQL: docs/Cambios_prereunion/12_produccion_urgente.md
 */
const fs = require("node:fs");
const path = require("node:path");

const RAIZ = path.join(__dirname, "..", "..", "..");

/** Piezas que el código de hoy asume. Cada una apunta al SQL que la crea. */
const PIEZAS = [
  { id: "jobs", sql: "supabase_schema_jobs.sql", tipo: "tabla", tabla: "jobs" },
  { id: "unlocks", sql: "supabase_schema_pool_fix.sql", tipo: "tabla", tabla: "unlocks" },
  { id: "contact_access", sql: "supabase_schema_pool_fix.sql", tipo: "tabla", tabla: "contact_access" },
  { id: "notifications", sql: "supabase_schema_rrhh_corto.sql", tipo: "tabla", tabla: "notifications" },
  { id: "profiles.empleo", sql: "supabase_schema_pool_fix.sql", tipo: "columna", tabla: "profiles", col: "empleo" },
  { id: "profiles.pool_visible", sql: "supabase_schema_pool_fix.sql", tipo: "columna", tabla: "profiles", col: "pool_visible" },
  { id: "profiles.allow_contact", sql: "supabase_schema_pool_fix.sql", tipo: "columna", tabla: "profiles", col: "allow_contact" },
  { id: "profiles.cv", sql: "supabase_schema_cv.sql", tipo: "columna", tabla: "profiles", col: "cv" },
  { id: "jobs.culture_questions", sql: "supabase_schema_rrhh_corto.sql", tipo: "columna", tabla: "jobs", col: "culture_questions" },
  { id: "jobs.dilemmas", sql: "supabase_schema_dilemmas.sql", tipo: "columna", tabla: "jobs", col: "dilemmas" },
  { id: "jobs.screening", sql: "supabase_schema_cribado.sql", tipo: "columna", tabla: "jobs", col: "screening" },
  { id: "jobs.skill_requirements", sql: "supabase_schema_requisitos.sql", tipo: "columna", tabla: "jobs", col: "skill_requirements" },
  { id: "jobs.area", sql: "supabase_schema_areas.sql", tipo: "columna", tabla: "jobs", col: "area" },
  { id: "jobs.especialidad", sql: "supabase_schema_areas.sql", tipo: "columna", tabla: "jobs", col: "especialidad" },
  { id: "applications.screening_answers", sql: "supabase_schema_cribado.sql", tipo: "columna", tabla: "applications", col: "screening_answers" },
  { id: "applications.dilemma_answers", sql: "supabase_schema_dilemmas.sql", tipo: "columna", tabla: "applications", col: "dilemma_answers" },
  { id: "companies.verificacion", sql: "supabase_schema_verificacion.sql", tipo: "columna", tabla: "companies", col: "verificacion" },
  { id: "evaluations.integrity", sql: "supabase_schema_integrity.sql", tipo: "columna", tabla: "evaluations", col: "integrity" },
  { id: "rate_events", sql: "supabase_schema_seguridad.sql", tipo: "tabla", tabla: "rate_events" },
  { id: "attempts", sql: "supabase_schema_intentos.sql", tipo: "tabla", tabla: "attempts" },
  { id: "attempt_requests", sql: "supabase_schema_intentos.sql", tipo: "tabla", tabla: "attempt_requests" },
  { id: "seal_payments", sql: "supabase_schema_sello.sql", tipo: "tabla", tabla: "seal_payments" },
  { id: "anchor_batches", sql: "supabase_schema_vc.sql", tipo: "tabla", tabla: "anchor_batches" }
];

function configPublica() {
  const html = fs.readFileSync(path.join(RAIZ, "assets", "js", "app", "04-estado-y-nube.js"), "utf8");
  const url = (html.match(/const TP_SUPABASE_URL\s*=\s*'([^']+)'/) || [])[1];
  const anon = (html.match(/const TP_SUPABASE_ANON\s*=\s*'([^']+)'/) || [])[1];
  return { url: (process.env.SUPABASE_URL || url || "").replace(/\/$/, ""), anon };
}

async function pedir(url, anon, tabla, col) {
  const select = col || "id";
  const res = await fetch(`${url}/rest/v1/${tabla}?select=${select}&limit=0`, {
    headers: { apikey: anon, authorization: `Bearer ${anon}` }
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch (_e) { data = text; }
  const msg = String((data && (data.message || data.error || data.hint)) || text || "").slice(0, 240);
  return { status: res.status, msg };
}

function clasificar(r, pieza) {
  const m = r.msg.toLowerCase();
  if (/does not exist|schema cache|could not find/i.test(m)) {
    if (pieza.tipo === "columna" && (new RegExp("column.*" + pieza.col, "i").test(m) || m.includes(pieza.col))) {
      return "falta";
    }
    if (pieza.tipo === "tabla" || /relation|table/i.test(m)) return "falta";
    if (pieza.tipo === "columna") return "falta";
  }
  if (r.status === 200 || r.status === 206 || r.status === 416) return "ok";
  // 401/403 con RLS o sin filas: la pieza existe.
  if (r.status === 401 || r.status === 403 || r.status === 406) return "ok";
  return "duda";
}

(async () => {
  const { url, anon } = configPublica();
  console.log("\n  TalentPact — qué falta en el esquema de Supabase\n");
  if (!url || !anon) {
    console.error("  No he podido leer TP_SUPABASE_URL / TP_SUPABASE_ANON.\n");
    process.exitCode = 1;
    return;
  }
  console.log(`  Proyecto: ${url}\n`);

  const porSql = new Map();
  let faltan = 0, dudas = 0, ok = 0;
  for (const p of PIEZAS) {
    const r = await pedir(url, anon, p.tabla, p.col);
    const est = clasificar(r, p);
    const marca = est === "ok" ? "ok" : est === "falta" ? "FALTA" : "?";
    if (est === "ok") ok++;
    else if (est === "falta") { faltan++; porSql.set(p.sql, (porSql.get(p.sql) || []).concat(p.id)); }
    else { dudas++; console.log(`  ?  ${p.id.padEnd(32)} ${r.status} ${r.msg.slice(0, 80)}`); continue; }
    console.log(`  ${marca.padEnd(5)} ${p.id}`);
  }

  console.log("");
  if (!faltan && !dudas) {
    console.log("  Todas las piezas del código están en el proyecto.\n");
    return;
  }
  if (faltan) {
    console.log("  SQL a ejecutar (en este orden, cada uno entero en SQL Editor → Run):\n");
    const orden = [
      "supabase_schema_pool_fix.sql",
      "supabase_schema_rrhh_corto.sql",
      "supabase_schema_dilemmas.sql",
      "supabase_schema_requisitos.sql",
      "supabase_schema_verificacion.sql",
      "supabase_schema_areas.sql",
      "supabase_schema_cribado.sql",
      "supabase_schema_cv.sql",
      "supabase_schema_integrity.sql",
      "supabase_schema_seguridad.sql",
      "supabase_schema_intentos.sql",
      "supabase_schema_sello.sql",
      "supabase_schema_vc.sql",
      "supabase_limpiar_ofertas_demo.sql"
    ];
    for (const sql of orden) {
      const ids = porSql.get(sql);
      if (!ids) continue;
      console.log(`    · tfm/tech/${sql}`);
      console.log(`        → ${ids.join(", ")}`);
    }
    console.log("\n  Guía: docs/Cambios_prereunion/12_produccion_urgente.md\n");
  }
  if (dudas) console.log(`  ${dudas} pieza(s) sin clasificar (revisar a mano).\n`);
  process.exitCode = faltan ? 2 : dudas ? 1 : 0;
})().catch((e) => { console.error(e); process.exitCode = 1; });
