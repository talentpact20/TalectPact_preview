/**
 * Cuatro bandas de nota (docs/plan_post_reunion/skills_en_la_plataforma.md):
 * Insuficiente < 40 · Aceptable 40–59 · Bueno 60–79 · Muy bueno ≥ 80.
 *
 * Lo que sale hacia la empresa o hacia terceros (SkillPass, verificación) es la
 * banda, no el número exacto. Espejo en el navegador: tpBanda en
 * assets/js/app/18-interfaz.js (tests/bandas.test.js comprueba que coinciden).
 */
const BANDAS = [
  { id: "insuficiente", txt: "Insuficiente", min: 0 },
  { id: "aceptable", txt: "Aceptable", min: 40 },
  { id: "bueno", txt: "Bueno", min: 60 },
  { id: "muy_bueno", txt: "Muy bueno", min: 80 }
];

function banda(nota) {
  const n = Math.max(0, Math.min(100, Math.round(Number(nota) || 0)));
  let i = 0;
  BANDAS.forEach((b, k) => { if (n >= b.min) i = k; });
  return Object.assign({ nota: n, nivel: i + 1 }, BANDAS[i]);
}

module.exports = { BANDAS, banda };
