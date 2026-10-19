/**
 * Requisitos de skill de una oferta: imprescindible o valorable, con banda mínima.
 *
 * Antes la oferta tenía una lista de skills y un único nivel para todas
 * (básico ≥30, intermedio ≥50, avanzado ≥75). Ahora cada skill lleva su peso y
 * su mínimo, en bandas (Aceptable ≥40, Bueno ≥60, Muy bueno ≥80), que es lo que
 * la empresa ve y lo que se puede defender (docs/plan_post_reunion, skills).
 *
 * Las ofertas antiguas no tienen requisitos: se derivan de la lista de skills y
 * del nivel único, todas imprescindibles, para que se sigan comparando igual.
 *
 * Espejo en el navegador: assets/js/app/20-requisitos.js (tests/requisitos.test.js
 * comprueba que los dos calculan el mismo encaje).
 */

const PESOS = ["imprescindible", "valorable"];
const MINIMOS = { aceptable: 40, bueno: 60, muy_bueno: 80 };
const MAX_SKILLS = 8;
const MAX_IMPRESCINDIBLES = 4;
const NIVEL_A_MINIMO = { basico: "aceptable", intermedio: "bueno", avanzado: "muy_bueno" };
const MINIMO_A_NIVEL = { aceptable: "basico", bueno: "intermedio", muy_bueno: "avanzado" };

const clave = (s) => String(s || "").trim().toLowerCase();

/**
 * Valida la lista que envía la empresa. Devuelve { requisitos } o { error }.
 * Un peso o un mínimo desconocidos no rompen nada: se usa el valor por defecto.
 */
function limpiarRequisitos(v) {
  if (!Array.isArray(v)) return { requisitos: [] };
  const vistos = new Set();
  const requisitos = [];
  for (const r of v) {
    if (!r || typeof r.skill !== "string") continue;
    const skill = r.skill.trim().slice(0, 60);
    if (!skill || vistos.has(clave(skill))) continue;
    vistos.add(clave(skill));
    requisitos.push({
      skill,
      peso: PESOS.includes(r.peso) ? r.peso : "valorable",
      minimo: Object.prototype.hasOwnProperty.call(MINIMOS, r.minimo) ? r.minimo : "aceptable"
    });
  }
  if (requisitos.length > MAX_SKILLS) return { error: `Como máximo ${MAX_SKILLS} skills por oferta` };
  if (requisitos.filter((r) => r.peso === "imprescindible").length > MAX_IMPRESCINDIBLES) {
    return { error: `Como máximo ${MAX_IMPRESCINDIBLES} skills imprescindibles` };
  }
  return { requisitos };
}

/** Nivel único equivalente (para las tarjetas y el código que aún lo lee). */
function nivelDerivado(requisitos) {
  const base = requisitos.filter((r) => r.peso === "imprescindible");
  const lista = base.length ? base : requisitos;
  let max = "aceptable";
  for (const r of lista) if (MINIMOS[r.minimo] > MINIMOS[max]) max = r.minimo;
  return MINIMO_A_NIVEL[max];
}

/** Requisitos de una oferta tal como la devuelve list-jobs (o una antigua). */
function requisitosDeOferta(job) {
  const propios = limpiarRequisitos(job && job.skillRequirements).requisitos || [];
  if (propios.length) return propios;
  const minimo = NIVEL_A_MINIMO[job && job.requiredLevel] || "aceptable";
  return ((job && job.requiredSkills) || [])
    .filter((s) => typeof s === "string" && s.trim())
    .slice(0, MAX_SKILLS)
    .map((skill) => ({ skill, peso: "imprescindible", minimo }));
}

/** cumple · por_debajo · pendiente (sin prueba no es un suspenso). */
function estadoSkill(nota, minimo) {
  if (typeof nota !== "number" || !Number.isFinite(nota)) return "pendiente";
  return nota >= MINIMOS[minimo] ? "cumple" : "por_debajo";
}

/**
 * Encaje de un candidato con los requisitos.
 * `notas`: { nombreSkill: nota 0–100 } solo con skills demostradas.
 * `condicionesOk`: false si alguna condición choca, true/null si no.
 * Grupos para ordenar la lista de la empresa:
 *   1 cumple todas las imprescindibles y las condiciones
 *   2 cumple las imprescindibles, con alguna condición por hablar
 *   3 le falta alguna imprescindible por demostrar (ninguna por debajo)
 *   4 alguna imprescindible por debajo del mínimo
 */
function encajeRequisitos(requisitos, notas, condicionesOk) {
  const porClave = {};
  for (const [k, v] of Object.entries(notas || {})) porClave[clave(k)] = v;
  const estados = requisitos.map((r) => {
    const nota = porClave[clave(r.skill)];
    return { skill: r.skill, peso: r.peso, minimo: r.minimo, nota: typeof nota === "number" ? nota : null, estado: estadoSkill(nota, r.minimo) };
  });
  const de = (peso) => estados.filter((e) => e.peso === peso);
  const imp = de("imprescindible"), val = de("valorable");
  const cuenta = (l) => ({ cumple: l.filter((e) => e.estado === "cumple").length, total: l.length });
  let grupo;
  if (imp.some((e) => e.estado === "por_debajo")) grupo = 4;
  else if (imp.some((e) => e.estado === "pendiente")) grupo = 3;
  else grupo = condicionesOk === false ? 2 : 1;
  // Sin imprescindibles, el grupo lo decide si demuestra alguna valorable.
  if (!imp.length && !val.some((e) => e.estado === "cumple")) grupo = 3;
  return { estados, imprescindibles: cuenta(imp), valorables: cuenta(val), grupo };
}

module.exports = {
  PESOS, MINIMOS, MAX_SKILLS, MAX_IMPRESCINDIBLES, NIVEL_A_MINIMO,
  limpiarRequisitos, nivelDerivado, requisitosDeOferta, estadoSkill, encajeRequisitos
};
