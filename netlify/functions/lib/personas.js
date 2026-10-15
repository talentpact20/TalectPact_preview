/**
 * Taxonomía de aptitudes (doc 08) + compat con «Personas / Cognitivo».
 * Misma lógica en servidor (pool) y espejada en assets/js/app/19-rrhh.js.
 *
 * Familias:
 *   cognitivas | interpersonales | autogestion | ejecucion | (sector = técnico)
 *
 * «Personas» (filtro pool / evidencia conductual) =
 *   interpersonales + autogestion + ejecucion
 */

const SKILL_FAMILIA = {
  // Cognitivas
  "Pensamiento Analítico": "cognitivas",
  "Razonamiento Lógico": "cognitivas",
  "Resolución de Problemas": "cognitivas",
  "Creatividad": "cognitivas",
  "Creatividad e Innovación": "cognitivas",
  "Pensamiento Estratégico": "cognitivas",
  "Pensamiento crítico": "cognitivas",
  "Pensamiento Crítico": "cognitivas",
  "Agilidad de aprendizaje": "cognitivas",
  "Agilidad de Aprendizaje": "cognitivas",
  "Pensamiento lateral": "cognitivas",
  "Pensamiento Lateral": "cognitivas",
  // Interpersonales
  "Comunicación Escrita": "interpersonales",
  "Negociación": "interpersonales",
  "Atención al Cliente": "interpersonales",
  "Trabajo en Equipo": "interpersonales",
  "Escucha": "interpersonales",
  // Autogestión emocional
  "Toma de Decisiones": "autogestion",
  "Inteligencia emocional": "autogestion",
  "Inteligencia Emocional": "autogestion",
  "Resiliencia": "autogestion",
  "Gestión de la incertidumbre": "autogestion",
  "Gestión de la Incertidumbre": "autogestion",
  // Ejecución
  "Liderazgo": "ejecucion",
  "Gestión del Tiempo": "ejecucion",
  "Proactividad": "ejecucion",
  "Iniciativa": "ejecucion",
  "Responsabilidad personal": "ejecucion",
  "Responsabilidad Personal": "ejecucion"
};

/** Inglés / Excel: herramientas → se tratan como técnico, no como aptitud. */
const HERRAMIENTAS = {
  "Excel y Datos": true,
  "Inglés (Speaking)": true
};

const FAMILIAS_PERSONA = { interpersonales: true, autogestion: true, ejecucion: true };

const LABELS = {
  cognitivas: "Cognitivas",
  interpersonales: "Interpersonales",
  autogestion: "Autogestión emocional",
  ejecucion: "Ejecución",
  sector: "Técnicas"
};

function familiaDe(skill) {
  const n = String(skill || "");
  if (HERRAMIENTAS[n]) return "sector";
  return SKILL_FAMILIA[n] || null;
}

function esPersona(skill) {
  const f = familiaDe(skill);
  return !!(f && FAMILIAS_PERSONA[f]);
}

function esCognitivo(skill) {
  return familiaDe(skill) === "cognitivas";
}

/** Compat: mapas booleanos que ya usaban los tests / código antiguo. */
const PERSONAS = Object.keys(SKILL_FAMILIA).reduce((acc, k) => {
  if (FAMILIAS_PERSONA[SKILL_FAMILIA[k]]) acc[k] = true;
  return acc;
}, {});

const COGNITIVO = Object.keys(SKILL_FAMILIA).reduce((acc, k) => {
  if (SKILL_FAMILIA[k] === "cognitivas") acc[k] = true;
  return acc;
}, {});

/** De las skills del pool (array {n,v,…}), saca las de personas ordenadas por nota. */
function extraerPersonas(skills) {
  return (skills || [])
    .filter((s) => s && esPersona(s.n))
    .sort((a, b) => (b.v || 0) - (a.v || 0))
    .slice(0, 5)
    .map((s) => ({ n: s.n, v: s.v, verified: !!s.verified }));
}

module.exports = {
  SKILL_FAMILIA,
  HERRAMIENTAS,
  FAMILIAS_PERSONA,
  LABELS,
  PERSONAS,
  COGNITIVO,
  familiaDe,
  esPersona,
  esCognitivo,
  extraerPersonas
};
