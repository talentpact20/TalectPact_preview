/**
 * Vocabulario único: áreas funcionales (del puesto), sectores (de la empresa),
 * dimensiones y competencias transversales, y nombres visibles de las skills.
 * Datos en taxonomia.json; el navegador recibe una copia generada
 * (tools/generar_taxonomia.js).
 *
 * Retos en dos bloques: hard skills → sector profesional (área general) → área
 * concreta; soft skills → dimensión → enfoque (competencia). En las ofertas,
 * área general → concreta es el puesto y sector general → concreto la empresa.
 *
 * Las ofertas antiguas guardan un «sector» que en realidad era un área en
 * inglés (IT, Data, Sales…). Aquí se traduce, sin tocar los datos guardados.
 */
const T = require("./taxonomia.json");

const AREAS = T.areas.map((a) => a.id);
const porId = new Map(T.areas.map((a) => [a.id, a]));

/** Sectores concretos (22). Los ids de los 12 generales también lo son. */
const SECTORES = T.sectores.flatMap((s) => s.ampliados.map((x) => x.id));
const grupoPorSector = new Map(T.sectores.flatMap((s) => s.ampliados.map((x) => [x.id, s.id])));

const area = (id) => porId.get(id) || null;
const esArea = (id) => porId.has(id);
const esSector = (id) => grupoPorSector.has(id);
const grupoDeSector = (id) => grupoPorSector.get(id) || null;

/** Área de una oferta: la suya, o la deducida del sector antiguo. */
function areaDeOferta(job) {
  if (job && esArea(job.area)) return job.area;
  const leg = job && job.sector;
  return Object.prototype.hasOwnProperty.call(T.legadoAArea, leg) ? T.legadoAArea[leg] : null;
}

/** Valor antiguo de `jobs.sector` para un área (el código previo lo sigue leyendo). */
function legadoDeArea(id) {
  const a = area(id);
  return a ? a.legado : null;
}

/** Área concreta válida para el área general, o null. */
function especialidadDe(areaId, texto) {
  const a = area(areaId);
  if (!a || typeof texto !== "string") return null;
  return a.especialidades.find((e) => e.toLowerCase() === texto.trim().toLowerCase()) || null;
}

const nombreSkill = (s) => T.nombreSkill[s] || s;
const areaDeSkill = (s) => T.areaDeSkill[s] || null;
const areaConcretaDeSkill = (s) => T.areaConcretaDeSkill[s] || null;

// ── Competencias transversales (diccionario de la asesora) ─────────────────
const DIMENSIONES = T.dimensiones;
const dimPorCompetencia = new Map(DIMENSIONES.flatMap((d) => d.competencias.map((c) => [c.id, d])));
const dimPorNombre = new Map(DIMENSIONES.flatMap((d) => d.competencias.map((c) => [c.nombre.toLowerCase(), d])));

/** Competencias (ids «04.1»…) que evalúa el reto de una skill. */
const competenciasDeSkill = (s) => T.competenciasDeSkill[s] || [];

/** Dimensión de una skill: la de su primera competencia, o la de la competencia con ese nombre. */
function dimensionDeSkill(s) {
  const ids = competenciasDeSkill(s);
  if (ids.length) return dimPorCompetencia.get(ids[0]) || null;
  return dimPorNombre.get(String(s || "").trim().toLowerCase()) || null;
}

/** Skills con reto que cubren alguna competencia del tipo de puesto, en el orden del paquete. */
function skillsDePerfil(perfilId) {
  const p = T.perfilesPuesto.find((x) => x.id === perfilId);
  if (!p) return [];
  const fuera = [];
  for (const c of p.competencias) {
    for (const [skill, ids] of Object.entries(T.competenciasDeSkill)) {
      if (ids.includes(c) && !fuera.includes(skill)) fuera.push(skill);
    }
  }
  return fuera;
}

module.exports = {
  T, AREAS, SECTORES, DIMENSIONES, area, esArea, esSector, grupoDeSector, areaDeOferta, legadoDeArea,
  especialidadDe, nombreSkill, areaDeSkill, areaConcretaDeSkill, competenciasDeSkill, dimensionDeSkill, skillsDePerfil
};
