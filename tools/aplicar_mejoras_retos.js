#!/usr/bin/env node
/**
 * Aplica la mejora de los retos, ejercicio por ejercicio.
 * Uso: node tools/aplicar_mejoras_retos.js
 *
 * 1. Limpieza de todo el catálogo: sin ✓ / ✕ / ⚠︎ en categorías, tablas y
 *    textos (el proyecto no usa símbolos decorativos).
 * 2. Retos reescritos: cada fichero de tools/mejoras_retos/*.json es una lista
 *    de retos con sus tres ejercicios completos. Sustituyen a los del catálogo
 *    del servidor (contenido y soluciones) y a sus metadatos del navegador
 *    (título, tipo, tiempo, nivel, briefing), que tienen que coincidir.
 *
 * Idempotente. Después: node tools/auditar_retos.js y npm test.
 */
const fs = require("fs");
const path = require("path");

const RAIZ = path.join(__dirname, "..");
const CATALOGO = path.join(RAIZ, "netlify/functions/lib/catalogo-retos.json");
const CLIENTE = path.join(RAIZ, "assets/js/app/07-retos-comunes.js");
const DIR = path.join(__dirname, "mejoras_retos");

const SIMBOLO = /^[\s✓✔✕✖⚠︎️ℹ]+/u;
const ESTADO = { "✓": "Bien", "⚠︎": "Revisar", "⚠": "Revisar", "✕": "Mal" };

function limpiarTexto(t) {
  if (typeof t !== "string") return t;
  return t.replace(SIMBOLO, "").replace(/\s*[✓✔✕✖]\s*$/u, "").replace(/[⚠]︎?️?\s*/gu, "").replace(/ℹ️?\s*/gu, "")
    .replace(/(^|\s)[✓✕]\s+/gu, "$1").trim();
}

function limpiarEjercicio(e) {
  const d = e.data || {};
  if (Array.isArray(d.cats)) d.cats = d.cats.map((c) => {
    const x = limpiarTexto(c).replace(/^TRUE$/i, "Verdadero").replace(/^FALSE$/i, "Falso");
    return x.charAt(0).toUpperCase() + x.slice(1);
  });
  if (Array.isArray(d.table)) d.table.forEach((f) => {
    if (ESTADO[String(f.d || "").trim()]) f.d = ESTADO[String(f.d).trim()];
    ["n", "a", "b", "c", "d"].forEach((k) => { if (typeof f[k] === "string") f[k] = limpiarTexto(f[k]) || f[k]; });
  });
  if (Array.isArray(d.options)) d.options.forEach((o) => { o.text = limpiarTexto(o.text); });
  if (Array.isArray(d.headers)) d.headers = d.headers.map((h) => (h === "Check" || h === "Status" ? "Estado" : h));
  e.scenario = String(e.scenario || "").replace(/[✓✕]\s?/gu, "").replace(/⚠︎?️?\s?/gu, "");
  return e;
}

// ── Mejoras por reto ────────────────────────────────────────────────────────
const mejoras = new Map();
if (fs.existsSync(DIR)) {
  for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith(".json")).sort()) {
    for (const r of JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"))) {
      if (mejoras.has(r.id)) throw new Error(`Reto repetido en las mejoras: ${r.id}`);
      if (!Array.isArray(r.exercises) || r.exercises.length !== 3) throw new Error(`${r.id}: hacen falta 3 ejercicios`);
      mejoras.set(r.id, r);
    }
  }
}

const SERVIDOR_EJ = ["id", "title", "type", "timeLimit", "difficulty", "scenario", "data", "rubrica"];
const CLIENTE_EJ = ["id", "briefing", "timeLimit", "difficulty", "num", "title", "sub", "skills", "type"];
const solo = (o, ks) => Object.fromEntries(ks.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]));

const catalogo = JSON.parse(fs.readFileSync(CATALOGO, "utf8")).map((r) => {
  const m = mejoras.get(r.id);
  if (m) {
    r.title = m.title || r.title;
    r.exercises = m.exercises.map((e) => solo(e, SERVIDOR_EJ));
  }
  r.exercises.forEach(limpiarEjercicio);
  return r;
});
const faltan = [...mejoras.keys()].filter((id) => !catalogo.some((r) => r.id === id));
if (faltan.length) throw new Error("Mejoras de retos que no existen: " + faltan.join(", "));
fs.writeFileSync(CATALOGO, JSON.stringify(catalogo));

// ── Navegador: metadatos ────────────────────────────────────────────────────
const lineas = fs.readFileSync(CLIENTE, "utf8").split("\n").map((l) => {
  const m = /^  (\{"id":"([^"]+)".*\})(,?)$/.exec(l);
  if (!m) return l;
  const meta = JSON.parse(m[1]);
  const mej = mejoras.get(meta.id);
  if (mej) {
    if (mej.title) meta.title = mej.title;
    if (mej.desc) meta.desc = mej.desc;
    if (mej.searchTerms) meta.searchTerms = mej.searchTerms;
    meta.exercises = mej.exercises.map((e, i) => solo(Object.assign({ num: String(i + 1).padStart(2, "0") }, e), CLIENTE_EJ));
    const min = Math.round(mej.exercises.reduce((s, e) => s + e.timeLimit, 0) / 60);
    if (Array.isArray(meta.tags)) meta.tags = meta.tags.map((t) => (/^\d+ min$/.test(t) ? min + " min" : t));
  }
  // Iconos: la interfaz pinta monogramas; el emoji del dato sobraba.
  delete meta.icon;
  return "  " + JSON.stringify(meta) + m[3];
});
fs.writeFileSync(CLIENTE, lineas.join("\n"));
console.log(`Catálogo limpio · ${mejoras.size} retos reescritos.`);
