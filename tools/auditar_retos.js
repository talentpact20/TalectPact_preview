#!/usr/bin/env node
/**
 * Auditoría de calidad de los ejercicios del catálogo del servidor.
 * Uso: node tools/auditar_retos.js [--json] [--reto <id>]
 *
 * Revisa cada ejercicio con reglas objetivas (las mismas que comprueba
 * tests/catalogo-calidad.test.js) y lista lo que falla, reto a reto:
 *  · escenario demasiado corto para corregir con concreción;
 *  · correos sin guía numerada (de ahí salen los indicadores del corrector);
 *  · análisis sin tabla, sin pregunta o con pocos conceptos esperados;
 *  · clasificaciones con pocas opciones, categorías descompensadas o símbolos;
 *  · emojis o símbolos decorativos en lo que ve el candidato;
 *  · títulos en inglés o a medias;
 *  · tiempos fuera de rango.
 */
const path = require("path");
const catalogo = require(path.join(__dirname, "..", "netlify/functions/lib/catalogo-retos.json"));

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
const INGLES = /\b(Debug|Design|Best|Practice|Tech|Debt|Cold|Call|Bot|Pitch|Deck|Review|Feedback Loop|Roadmap|Growth|Hacking|Funnel|Pipeline|Churn|Onboarding|Storytelling|Brief|Sprint|Backlog|Board|Meeting|Dashboard|Report|Workshop|Check|Mock|Up|Case|Study|Challenge|Quick|Win|Deep|Dive|Elevator|Speech|Speaking|Writing|Reading|Listening|Small|Talk)\b/;

// Igual que indicadores() del corrector: «1)» en línea o «1.» al principio de línea.
function numerados(hint) {
  const { indicadores } = require(path.join(__dirname, "..", "netlify/functions/lib/evaluator.js"));
  return indicadores({ data: { hint } }).length;
}

function auditarEjercicio(r, e) {
  const p = [];
  const d = e.data || {};
  const visible = [e.title, e.scenario, d.q, d.hint, d.to, d.subject, ...(d.cats || []), ...((d.options || []).map((o) => o.text)), ...((d.table || []).flatMap((t) => [t.n, t.a, t.b, t.c, t.d]))].join(" ");
  if (EMOJI.test(visible)) p.push("emojis o símbolos decorativos");
  if (INGLES.test(e.title)) p.push("título en inglés");
  if (String(e.scenario || "").length < 140) p.push("escenario corto (" + String(e.scenario || "").length + " car.)");
  if (!(e.timeLimit >= 120 && e.timeLimit <= 2400)) p.push("tiempo fuera de rango");
  if (e.type === "email" && numerados(d.hint) < 3) p.push("guía con menos de 3 puntos numerados");
  if (e.type === "analysis") {
    if (!Array.isArray(d.table) || d.table.length < 3) p.push("análisis sin tabla suficiente");
    if (!d.q) p.push("análisis sin pregunta");
    if (!Array.isArray(d.kw) || d.kw.length < 6) p.push("pocos conceptos esperados (kw)");
  }
  if (e.type === "decision") {
    const ops = d.options || [];
    if (ops.length < 6) p.push("clasificación con menos de 6 opciones");
    const por = {};
    ops.forEach((o) => { por[o.correct] = (por[o.correct] || 0) + 1; });
    if ((d.keys || []).some((k) => (por[k] || 0) < 2)) p.push("categoría con menos de 2 opciones");
    if ((d.cats || []).some((c) => /^[^\p{L}]/u.test(c))) p.push("categorías que empiezan por símbolo");
  }
  return p;
}

function auditar() {
  return catalogo.map((r) => ({
    id: r.id, skill: r.skill, category: r.category,
    ejercicios: r.exercises.map((e) => ({ id: e.id, title: e.title, type: e.type, problemas: auditarEjercicio(r, e) }))
  }));
}

if (require.main === module) {
  const soloReto = process.argv.includes("--reto") ? process.argv[process.argv.indexOf("--reto") + 1] : null;
  const res = auditar().filter((r) => !soloReto || r.id === soloReto);
  if (process.argv.includes("--json")) { console.log(JSON.stringify(res, null, 2)); process.exit(0); }
  const cuenta = {};
  let conProblemas = 0, total = 0;
  for (const r of res) for (const e of r.ejercicios) {
    total++;
    if (e.problemas.length) conProblemas++;
    e.problemas.forEach((p) => { const k = p.replace(/\s*\(.*\)$/, ""); cuenta[k] = (cuenta[k] || 0) + 1; });
  }
  console.log(`Ejercicios: ${total} · con algún problema: ${conProblemas}`);
  for (const [k, n] of Object.entries(cuenta).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${k}`);
  if (soloReto) for (const r of res) for (const e of r.ejercicios) console.log(`${r.id}.${e.id} ${e.title}: ${e.problemas.join("; ") || "ok"}`);
}

module.exports = { auditar, auditarEjercicio };
