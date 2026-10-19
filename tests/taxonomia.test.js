/**
 * Vocabulario único (áreas funcionales, sectores y nombres de skills).
 * Área = el puesto; sector = la empresa. Las ofertas antiguas guardaban un
 * área en inglés en el campo «sector»: se traduce sin tocar lo guardado.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const tax = require("../netlify/functions/lib/taxonomia.js");
const { skillsDelCatalogo } = require("../netlify/functions/lib/catalogo.js");
const { validarOferta, SECTORES: LEGADO } = require("../netlify/functions/lib/handlers/save-job.js");
const { aOferta } = require("../netlify/functions/lib/handlers/list-jobs.js");
const { generar, DESTINO } = require("../tools/generar_taxonomia.js");

test("el navegador usa exactamente la taxonomía del servidor", () => {
  assert.equal(fs.readFileSync(DESTINO, "utf8"), generar(), "ejecuta: node tools/generar_taxonomia.js");
});

test("7 áreas y 12 sectores visibles, como en la propuesta de sectores y funciones", () => {
  assert.deepEqual(tax.T.areas.map((a) => a.nombre), [
    "Asesoría jurídica, riesgos y cumplimiento", "Finanzas", "Marketing, ventas y comunicación",
    "Operaciones", "Recursos humanos", "Sostenibilidad", "Tecnología"
  ]);
  assert.equal(tax.SECTORES.length, 12);
  // Los 22 sectores ampliados cuelgan de alguno visible, sin repetirse.
  const ampliados = tax.T.sectores.flatMap((s) => s.ampliados);
  assert.equal(ampliados.length, 22);
  assert.equal(new Set(ampliados).size, 22);
  for (const a of tax.T.areas) assert.ok(a.especialidades.length >= 3, a.id);
});

test("el vocabulario solo nombra skills que existen y no repite nombres visibles", () => {
  const cat = new Set(skillsDelCatalogo());
  for (const s of Object.keys(tax.T.areaDeSkill)) assert.ok(cat.has(s), "areaDeSkill: " + s);
  for (const s of Object.keys(tax.T.nombreSkill)) assert.ok(cat.has(s), "nombreSkill: " + s);
  for (const a of Object.values(tax.T.areaDeSkill)) assert.ok(tax.esArea(a), a);
  const visibles = [...cat].map(tax.nombreSkill);
  assert.equal(new Set(visibles.map((n) => n.toLowerCase())).size, visibles.length, "dos skills con el mismo nombre visible");
  assert.ok(!visibles.some((n) => /&| Pro$| Dev$/.test(n)), "quedan nombres en jerga: " + visibles.filter((n) => /&| Pro$| Dev$/.test(n)));
});

test("una oferta guarda área y especialidad, y el sector antiguo equivalente", () => {
  const base = { title: "Técnico de selección", description: "Cribado de candidaturas y entrevistas con los equipos.", requiredSkills: ["Recruiting"], modalidad: "remoto" };
  const { fila } = validarOferta(Object.assign({}, base, { area: "rrhh", especialidad: "selección y atracción de talento" }));
  assert.equal(fila.area, "rrhh");
  assert.equal(fila.especialidad, "Selección y atracción de talento");   // nombre canónico
  assert.equal(fila.sector, "RRHH");
  // Especialidad de otra área: no se guarda.
  assert.equal(validarOferta(Object.assign({}, base, { area: "finanzas", especialidad: "Ciberseguridad" })).fila.especialidad, null);
  // Llamada antigua con sector: se traduce a área.
  const vieja = validarOferta(Object.assign({}, base, { sector: "Data" })).fila;
  assert.deepEqual([vieja.area, vieja.sector], ["tecnologia", "Data"]);
  assert.match(validarOferta(Object.assign({}, base, { area: "astrologia" })).error, /Área/);
  for (const a of tax.AREAS) assert.ok(LEGADO.includes(tax.legadoDeArea(a)), a);
});

test("las ofertas ya publicadas muestran su área aunque falte la columna", () => {
  assert.equal(aOferta({ id: "1", title: "x", sector: "Sales" }).area, "marketing");
  assert.equal(aOferta({ id: "2", title: "y", sector: "IT", area: "sostenibilidad" }).area, "sostenibilidad");
  assert.equal(aOferta({ id: "3", title: "z", sector: "Languages" }).area, null);
});
