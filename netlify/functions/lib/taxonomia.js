/**
 * Vocabulario único: áreas funcionales (del puesto), sectores (de la empresa),
 * especialidades y nombres visibles de las skills. Datos en taxonomia.json;
 * el navegador recibe una copia generada (tools/generar_taxonomia.js).
 *
 * Las ofertas antiguas guardan un «sector» que en realidad era un área en
 * inglés (IT, Data, Sales…). Aquí se traduce, sin tocar los datos guardados.
 */
const T = require("./taxonomia.json");

const AREAS = T.areas.map((a) => a.id);
const SECTORES = T.sectores.map((s) => s.id);
const porId = new Map(T.areas.map((a) => [a.id, a]));

const area = (id) => porId.get(id) || null;
const esArea = (id) => porId.has(id);
const esSector = (id) => SECTORES.includes(id);

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

/** Especialidad válida para el área, o null. */
function especialidadDe(areaId, texto) {
  const a = area(areaId);
  if (!a || typeof texto !== "string") return null;
  return a.especialidades.find((e) => e.toLowerCase() === texto.trim().toLowerCase()) || null;
}

const nombreSkill = (s) => T.nombreSkill[s] || s;
const areaDeSkill = (s) => T.areaDeSkill[s] || null;

module.exports = { T, AREAS, SECTORES, area, esArea, esSector, areaDeOferta, legadoDeArea, especialidadDe, nombreSkill, areaDeSkill };
