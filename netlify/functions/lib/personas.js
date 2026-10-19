/**
 * Dos bloques de habilidades (producto):
 *   hard — la parte técnica (por sector profesional y área)
 *   soft — las 6 dimensiones del diccionario de competencias (lib/taxonomia.json)
 *
 * Una skill es soft si tiene dimensión; si no, es técnica. Los idiomas y las
 * herramientas son técnicas aunque su reto esté entre los comunes.
 *
 * Misma lógica en servidor (pool) y espejada en assets/js/app/19-rrhh.js.
 * Compat: «Personas» ≈ soft; «sector» ≈ hard.
 */
const { T, dimensionDeSkill } = require("./taxonomia");

const LABELS = {
  hard: "Hard skills",
  soft: "Soft skills"
};

function familiaDe(skill) {
  const n = String(skill || "").trim();
  if (!n) return null;
  return dimensionDeSkill(n) ? "soft" : "hard";
}

/** Bloque de cada skill clasificada como soft (para tests y código antiguo). */
const SKILL_FAMILIA = Object.keys(T.competenciasDeSkill).reduce((acc, k) => {
  acc[k] = "soft";
  return acc;
}, {});

const esPersona = (skill) => familiaDe(skill) === "soft";
const esHard = (skill) => familiaDe(skill) === "hard";

const PERSONAS = Object.keys(SKILL_FAMILIA).reduce((acc, k) => {
  acc[k] = true;
  return acc;
}, {});

const FAMILIAS_PERSONA = { soft: true };

/** Soft skills del pool, ordenadas por nota. */
function extraerPersonas(skills) {
  return (skills || [])
    .filter((s) => s && esPersona(s.n))
    .sort((a, b) => (b.v || 0) - (a.v || 0))
    .slice(0, 5)
    .map((s) => ({ n: s.n, v: s.v, verified: !!s.verified }));
}

module.exports = {
  SKILL_FAMILIA,
  FAMILIAS_PERSONA,
  LABELS,
  PERSONAS,
  familiaDe,
  esPersona,
  esHard,
  extraerPersonas
};
