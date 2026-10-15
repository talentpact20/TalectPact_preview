/**
 * Tres pilares de habilidades (producto):
 *   hard | soft | transferibles
 *
 * Misma lógica en servidor (pool) y espejada en assets/js/app/19-rrhh.js.
 *
 * Compat: «Personas» ≈ soft; «Cognitivo» ≈ transferibles; «sector» ≈ hard.
 */

const SKILL_FAMILIA = {
  // Soft — cómo se relaciona y se regula
  "Comunicación Escrita": "soft",
  "Negociación": "soft",
  "Atención al Cliente": "soft",
  "Trabajo en Equipo": "soft",
  "Escucha": "soft",
  "Toma de Decisiones": "soft",
  "Inteligencia emocional": "soft",
  "Inteligencia Emocional": "soft",
  "Resiliencia": "soft",
  "Gestión de la incertidumbre": "soft",
  "Gestión de la Incertidumbre": "soft",
  "Liderazgo": "soft",

  // Transferibles — valen en cualquier puesto / sector
  "Pensamiento Analítico": "transferibles",
  "Razonamiento Lógico": "transferibles",
  "Resolución de Problemas": "transferibles",
  "Creatividad": "transferibles",
  "Creatividad e Innovación": "transferibles",
  "Pensamiento Estratégico": "transferibles",
  "Pensamiento crítico": "transferibles",
  "Pensamiento Crítico": "transferibles",
  "Agilidad de aprendizaje": "transferibles",
  "Agilidad de Aprendizaje": "transferibles",
  "Pensamiento lateral": "transferibles",
  "Pensamiento Lateral": "transferibles",
  "Gestión del Tiempo": "transferibles",
  "Proactividad": "transferibles",
  "Iniciativa": "transferibles",
  "Responsabilidad personal": "transferibles",
  "Responsabilidad Personal": "transferibles"
};

/** Herramientas → hard (técnicas). */
const HERRAMIENTAS = {
  "Excel y Datos": true,
  "Inglés (Speaking)": true
};

const LABELS = {
  hard: "Hard skills",
  soft: "Soft skills",
  transferibles: "Transferibles"
};

function familiaDe(skill) {
  const n = String(skill || "");
  if (HERRAMIENTAS[n]) return "hard";
  return SKILL_FAMILIA[n] || null;
}

function esPersona(skill) {
  return familiaDe(skill) === "soft";
}

function esCognitivo(skill) {
  return familiaDe(skill) === "transferibles";
}

function esHard(skill) {
  return familiaDe(skill) === "hard";
}

function esTransferible(skill) {
  return familiaDe(skill) === "transferibles";
}

/** Compat: mapas booleanos que ya usaban tests / código antiguo. */
const PERSONAS = Object.keys(SKILL_FAMILIA).reduce((acc, k) => {
  if (SKILL_FAMILIA[k] === "soft") acc[k] = true;
  return acc;
}, {});

const COGNITIVO = Object.keys(SKILL_FAMILIA).reduce((acc, k) => {
  if (SKILL_FAMILIA[k] === "transferibles") acc[k] = true;
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
  HERRAMIENTAS,
  FAMILIAS_PERSONA,
  LABELS,
  PERSONAS,
  COGNITIVO,
  familiaDe,
  esPersona,
  esCognitivo,
  esHard,
  esTransferible,
  extraerPersonas
};
