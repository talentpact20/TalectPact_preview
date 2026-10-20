#!/usr/bin/env node
/**
 * Añade (o actualiza) los retos de la rama IA a partir de tools/retos_ia.json:
 *  · netlify/functions/lib/catalogo-retos.json  → contenido completo (servidor)
 *  · assets/js/app/07-retos-comunes.js           → solo metadatos (navegador)
 *  · netlify/functions/lib/taxonomia.json        → rama IA, itinerarios y competencias
 * y regenera 01b-taxonomia.js. Idempotente: se puede volver a ejecutar tras
 * editar retos_ia.json. Uso: node tools/agregar_retos_ia.js
 *
 * Fuente: docs/plan_post_reunion/02_rama_ia.md (ola 1 + «IA en el trabajo»).
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const RAIZ = path.join(__dirname, "..");
const RETOS = JSON.parse(fs.readFileSync(path.join(__dirname, "retos_ia.json"), "utf8"));
const CATALOGO = path.join(RAIZ, "netlify/functions/lib/catalogo-retos.json");
const CLIENTE = path.join(RAIZ, "assets/js/app/07-retos-comunes.js");
const TAXONOMIA = path.join(RAIZ, "netlify/functions/lib/taxonomia.json");

const minutos = (r) => Math.round(r.exercises.reduce((s, e) => s + e.timeLimit, 0) / 60);

// ── Servidor: contenido completo ────────────────────────────────────────────
const catalogo = JSON.parse(fs.readFileSync(CATALOGO, "utf8")).filter((r) => !RETOS.some((x) => x.id === r.id));
for (const r of RETOS) {
  catalogo.push({
    id: r.id,
    skill: r.skill,
    category: "ia",
    title: r.title,
    exercises: r.exercises.map((e) => Object.assign(
      { id: e.id, title: e.title, type: e.type, timeLimit: e.timeLimit, difficulty: e.difficulty, scenario: e.scenario, data: e.data },
      e.rubrica ? { rubrica: e.rubrica } : {}
    ))
  });
}
fs.writeFileSync(CATALOGO, JSON.stringify(catalogo));

// ── Navegador: solo metadatos ───────────────────────────────────────────────
let cliente = fs.readFileSync(CLIENTE, "utf8");
const lineas = cliente.split("\n").filter((l) => !RETOS.some((r) => l.startsWith(`  {"id":"${r.id}",`)));
const cierre = lineas.lastIndexOf("];");
const meta = RETOS.map((r) => "  " + JSON.stringify({
  id: r.id,
  category: "ia",
  rama: "ia",
  grupo: r.grupo,
  searchTerms: r.searchTerms,
  title: r.title,
  desc: r.desc,
  skill: r.skill,
  tags: ["Inteligencia artificial", minutos(r) + " min", r.grupo === "ia_tecnica" ? "Rúbrica técnica" : "Para cualquier puesto"],
  exercises: r.exercises.map((e, i) => ({
    id: e.id, briefing: e.briefing, timeLimit: e.timeLimit, difficulty: e.difficulty,
    num: String(i + 1).padStart(2, "0"), title: e.title, sub: e.sub, skills: e.skills, type: e.type
  }))
}) + ",");
// La línea anterior al cierre puede no llevar coma.
if (!/,\s*$/.test(lineas[cierre - 1])) lineas[cierre - 1] = lineas[cierre - 1].replace(/\s*$/, ",");
lineas.splice(cierre, 0, ...meta);
lineas[cierre + meta.length - 1] = lineas[cierre + meta.length - 1].replace(/,$/, "");
fs.writeFileSync(CLIENTE, lineas.join("\n"));

// ── Taxonomía: rama IA ──────────────────────────────────────────────────────
const T = JSON.parse(fs.readFileSync(TAXONOMIA, "utf8"));
T.ia = {
  nota: "Rama especial de IA (docs/plan_post_reunion/02_rama_ia.md). Competencias con el id del diccionario de IA v4.0; solo las que tienen nombre en el plan.",
  grupos: [
    { id: "ia_tecnica", nombre: "Rama técnica de IA", corto: "Rama técnica", desc: "Para quien construye IA: datos, modelos, LLM, RAG, agentes, evaluación, operación y seguridad." },
    { id: "ia_trabajo", nombre: "IA en el trabajo", corto: "IA en el trabajo", desc: "Para cualquier puesto: usar la IA con criterio, verificar lo que produce y proteger los datos." }
  ],
  competencias: {
    "01.01": "Python para IA", "01.03": "Datos para machine learning", "02.01": "Machine learning",
    "02.02": "Deep learning", "02.03": "Transformers y LLM", "03.02": "APIs de LLM", "03.03": "RAG y recuperación",
    "03.04": "Agentes", "04.01": "Evaluación de modelos", "04.02": "Experimentación", "04.03": "Fine-tuning",
    "05.01": "Ingeniería de software para IA", "05.02": "MLOps y LLMOps", "05.04": "Inferencia y costes",
    "06.01": "Seguridad de IA", "06.03": "Privacidad"
  },
  itinerarios: [
    { id: "ingenieria_ml", nombre: "Ingeniería de IA / ML", competencias: ["01.01", "01.03", "02.01", "02.02", "02.04", "05.01", "05.02", "04.01"] },
    { id: "generativa", nombre: "IA generativa / LLM", competencias: ["02.03", "03.01", "03.02", "03.03", "03.04", "04.01", "05.02", "06.01"] },
    { id: "investigacion", nombre: "Investigación", competencias: ["01.02", "02.02", "02.03", "02.04", "04.01", "04.02", "04.03", "04.04"] },
    { id: "plataforma", nombre: "Plataforma e infraestructura", competencias: ["03.02", "05.01", "05.02", "05.03", "05.04", "05.05", "06.01"] },
    { id: "seguridad", nombre: "Seguridad de IA", competencias: ["03.04", "04.01", "06.01", "06.02", "06.03", "05.02"] },
    { id: "aplicada", nombre: "IA aplicada en empresa", competencias: ["01.03", "03.01", "03.02", "03.03", "03.05", "04.01", "05.01", "06.03"] }
  ],
  skills: Object.fromEntries(RETOS.map((r) => [r.skill, { grupo: r.grupo, competencia: r.competencia }]))
};
for (const r of RETOS) {
  if (r.grupo === "ia_tecnica") {
    T.areaDeSkill[r.skill] = "tecnologia";
    T.areaConcretaDeSkill[r.skill] = "Ingeniería e I+D";
  } else {
    // «IA en el trabajo» es la competencia 05.6 del diccionario de soft skills.
    T.competenciasDeSkill[r.skill] = [r.competencia];
  }
}
fs.writeFileSync(TAXONOMIA, JSON.stringify(T, null, 2) + "\n");
execFileSync(process.execPath, [path.join(__dirname, "generar_taxonomia.js")], { stdio: "inherit" });

console.log(`Retos de IA: ${RETOS.length} (${RETOS.reduce((n, r) => n + r.exercises.length, 0)} ejercicios). Catálogo: ${catalogo.length} retos.`);
