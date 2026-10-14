/**
 * Segmentación "Personas y equipo" frente a cognitivo / técnico.
 * Misma lista en servidor (pool) y, espejada, en assets/js/app/19-rrhh.js.
 */
const PERSONAS = {
  "Liderazgo": true,
  "Trabajo en Equipo": true,
  "Gestión del Tiempo": true,
  "Comunicación Escrita": true,
  "Toma de Decisiones": true,
  "Negociación": true,
  "Atención al Cliente": true
};

const COGNITIVO = {
  "Pensamiento Analítico": true,
  "Razonamiento Lógico": true,
  "Resolución de Problemas": true,
  "Creatividad": true,
  "Creatividad e Innovación": true,
  "Excel y Datos": true,
  "Pensamiento Estratégico": true,
  "Inglés (Speaking)": true
};

function esPersona(skill) {
  return !!PERSONAS[String(skill || "")];
}

function esCognitivo(skill) {
  return !!COGNITIVO[String(skill || "")];
}

/** De las skills del pool (array {n,v,…}), saca las de personas ordenadas por nota. */
function extraerPersonas(skills) {
  return (skills || [])
    .filter((s) => s && esPersona(s.n))
    .sort((a, b) => (b.v || 0) - (a.v || 0))
    .slice(0, 5)
    .map((s) => ({ n: s.n, v: s.v, verified: !!s.verified }));
}

module.exports = { PERSONAS, COGNITIVO, esPersona, esCognitivo, extraerPersonas };
