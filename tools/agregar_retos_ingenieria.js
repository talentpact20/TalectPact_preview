#!/usr/bin/env node
/**
 * Añade (o actualiza) los retos de la rama Ingeniería a partir de
 * tools/retos_ingenieria.json:
 *  · netlify/functions/lib/catalogo-retos.json  → contenido completo (servidor)
 *  · assets/js/app/07-retos-comunes.js           → solo metadatos (navegador)
 *  · netlify/functions/lib/taxonomia.json        → rama Ingeniería + especialidades
 * y regenera 01b-taxonomia.js. Idempotente.
 *
 * Uso: node tools/agregar_retos_ingenieria.js
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const RAIZ = path.join(__dirname, "..");
const RETOS = JSON.parse(fs.readFileSync(path.join(__dirname, "retos_ingenieria.json"), "utf8"));
const CATALOGO = path.join(RAIZ, "netlify/functions/lib/catalogo-retos.json");
const CLIENTE = path.join(RAIZ, "assets/js/app/07-retos-comunes.js");
const TAXONOMIA = path.join(RAIZ, "netlify/functions/lib/taxonomia.json");

const ESPECIALIDADES_ING = [
  "Ingeniería de software",
  "Ingeniería de sistemas",
  "Ingeniería industrial y de procesos",
  "Ingeniería mecánica",
  "Ingeniería civil y de caminos",
  "Ingeniería eléctrica"
];

const minutos = (r) => Math.round(r.exercises.reduce((s, e) => s + e.timeLimit, 0) / 60);

const catalogo = JSON.parse(fs.readFileSync(CATALOGO, "utf8")).filter((r) => !RETOS.some((x) => x.id === r.id));
for (const r of RETOS) {
  catalogo.push({
    id: r.id,
    skill: r.skill,
    category: "ingenieria",
    title: r.title,
    exercises: r.exercises.map((e) => Object.assign(
      { id: e.id, title: e.title, type: e.type, timeLimit: e.timeLimit, difficulty: e.difficulty, scenario: e.scenario, data: e.data },
      e.rubrica ? { rubrica: e.rubrica } : {}
    ))
  });
}
fs.writeFileSync(CATALOGO, JSON.stringify(catalogo));

let cliente = fs.readFileSync(CLIENTE, "utf8");
const lineas = cliente.split("\n").filter((l) => !RETOS.some((r) => l.startsWith(`  {"id":"${r.id}",`)));
const cierre = lineas.lastIndexOf("];");
const meta = RETOS.map((r) => "  " + JSON.stringify({
  id: r.id,
  category: "ingenieria",
  rama: "ingenieria",
  grupo: r.grupo,
  searchTerms: r.searchTerms,
  title: r.title,
  desc: r.desc,
  skill: r.skill,
  tags: ["Ingeniería", minutos(r) + " min", "Rúbrica técnica"],
  exercises: r.exercises.map((e, i) => ({
    id: e.id, briefing: e.briefing, timeLimit: e.timeLimit, difficulty: e.difficulty,
    num: String(i + 1).padStart(2, "0"), title: e.title, sub: e.sub, skills: e.skills, type: e.type
  }))
}) + ",");
if (!/,\s*$/.test(lineas[cierre - 1])) lineas[cierre - 1] = lineas[cierre - 1].replace(/\s*$/, ",");
lineas.splice(cierre, 0, ...meta);
lineas[cierre + meta.length - 1] = lineas[cierre + meta.length - 1].replace(/,$/, "");
fs.writeFileSync(CLIENTE, lineas.join("\n"));

const T = JSON.parse(fs.readFileSync(TAXONOMIA, "utf8"));
const tec = T.areas.find((a) => a.id === "tecnologia");
if (tec) {
  const base = tec.especialidades.filter((e) => !ESPECIALIDADES_ING.includes(e));
  const idx = base.indexOf("Ingeniería e I+D");
  const insertAt = idx >= 0 ? idx + 1 : base.length;
  tec.especialidades = [...base.slice(0, insertAt), ...ESPECIALIDADES_ING, ...base.slice(insertAt)];
}

T.ingenieria = {
  nota: "Rama Ingeniería (ola 1, 22/10): seis pistas con un reto cada una. Rúbrica técnica y errores que penalizan, mismo patrón que la rama IA.",
  grupos: [
    { id: "ing_software", nombre: "Ingeniería de software", corto: "Software", desc: "APIs, calidad, deuda técnica y prácticas de entrega continua." },
    { id: "ing_sistemas", nombre: "Ingeniería de sistemas", corto: "Sistemas", desc: "Disponibilidad, latencia, incidentes y trade-offs de arquitectura." },
    { id: "ing_industrial", nombre: "Ingeniería industrial y de procesos", corto: "Industrial", desc: "Flujo, cuellos de botella, Lean e indicadores honestos." },
    { id: "ing_mecanica", nombre: "Ingeniería mecánica", corto: "Mecánica", desc: "Fallos, vibración, tolerancias y causa raíz." },
    { id: "ing_civil", nombre: "Ingeniería civil y de caminos", corto: "Civil", desc: "Obra, seguridad, control de calidad y decisiones bajo plazo." },
    { id: "ing_electrica", nombre: "Ingeniería eléctrica", corto: "Eléctrica", desc: "Protecciones, instalaciones y prácticas seguras en baja tensión." }
  ],
  competencias: Object.fromEntries(RETOS.map((r) => [r.competencia, r.skill])),
  skills: Object.fromEntries(RETOS.map((r) => [r.skill, { grupo: r.grupo, competencia: r.competencia }]))
};

for (const r of RETOS) {
  T.areaDeSkill[r.skill] = "tecnologia";
  T.areaConcretaDeSkill[r.skill] = ESPECIALIDADES_ING.find((e) => e === r.skill) || r.skill;
  if (T.nombreSkill) T.nombreSkill[r.skill] = r.skill;
  if (T.competenciasDeSkill) delete T.competenciasDeSkill[r.skill];
}

fs.writeFileSync(TAXONOMIA, JSON.stringify(T, null, 2) + "\n");
execFileSync(process.execPath, [path.join(__dirname, "generar_taxonomia.js")], { stdio: "inherit" });

console.log(`Retos de Ingeniería: ${RETOS.length} (${RETOS.reduce((n, r) => n + r.exercises.length, 0)} ejercicios). Catálogo: ${catalogo.length} retos.`);
