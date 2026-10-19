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

test("áreas y sectores en dos niveles, con la versión ampliada de la asesora", () => {
  // 9 áreas generales (las 7 de la versión resumida + dos que no cabían en ellas).
  assert.deepEqual(tax.T.areas.map((a) => a.nombre), [
    "Asesoría jurídica, riesgos y cumplimiento normativo", "Dirección, estrategia y consultoría", "Finanzas",
    "Marketing, ventas y comunicación", "Operaciones", "Recursos humanos", "Sanidad, educación e investigación",
    "Sostenibilidad", "Tecnología"
  ]);
  // Las 21 áreas de la versión ampliada cuelgan de una general, sin repetirse.
  const concretas = tax.T.areas.flatMap((a) => a.especialidades);
  assert.equal(concretas.length, 21);
  assert.equal(new Set(concretas).size, 21);
  for (const n of ["Consultoría", "Dirección general y consejo de administración", "Sanidad y atención sociosanitaria",
    "Educación, formación e investigación", "Calidad y medio ambiente", "Transformación y digitalización"]) {
    assert.ok(concretas.includes(n), n);
  }
  // 12 sectores generales y 22 concretos; el primero de cada uno repite el id del general.
  assert.equal(tax.T.sectores.length, 12);
  assert.equal(tax.SECTORES.length, 22);
  assert.equal(new Set(tax.SECTORES).size, 22);
  for (const s of tax.T.sectores) {
    assert.equal(s.ampliados[0].id, s.id, s.id);
    assert.ok(tax.esSector(s.id) && tax.grupoDeSector(s.id) === s.id, s.id);
  }
  assert.equal(tax.grupoDeSector("fintech_pagos"), "servicios_financieros");
  assert.equal(tax.esSector("astrologia"), false);
});

test("soft skills: 6 dimensiones y 32 enfoques del diccionario; hard: cada reto en un área concreta", () => {
  assert.equal(tax.DIMENSIONES.length, 6);
  assert.deepEqual(tax.DIMENSIONES.map((d) => d.competencias.length), [5, 5, 5, 6, 6, 5]);
  const ids = tax.DIMENSIONES.flatMap((d) => d.competencias.map((c) => c.id));
  assert.equal(new Set(ids).size, 32);
  for (const d of tax.DIMENSIONES) {
    for (const c of d.competencias) assert.ok(c.definicion.length > 20 && c.id.startsWith(d.num + "."), c.id);
  }
  // Cada reto clasificado apunta a competencias que existen, y es un reto del catálogo.
  const cat = new Set(skillsDelCatalogo());
  for (const [skill, comp] of Object.entries(tax.T.competenciasDeSkill)) {
    assert.ok(cat.has(skill), "competenciasDeSkill: " + skill);
    for (const c of comp) assert.ok(ids.includes(c), skill + " → " + c);
  }
  // Cada reto del catálogo está en un solo bloque: soft (con enfoques) o hard (con área concreta), salvo los idiomas.
  for (const skill of cat) {
    const soft = skill in tax.T.competenciasDeSkill, area = tax.areaConcretaDeSkill(skill);
    assert.ok(!(soft && area), "en los dos bloques: " + skill);
    if (area) assert.ok(tax.area(tax.areaDeSkill(skill)).especialidades.includes(area), skill + " → " + area);
    if (!soft && !area) assert.match(skill, /Inglés|English|Francés|Alemán/, "sin clasificar: " + skill);
  }
  assert.equal(tax.dimensionDeSkill("Liderazgo").id, "d03");
  assert.equal(tax.dimensionDeSkill("Escucha activa y empatía").id, "d04");   // por nombre de competencia
  assert.equal(tax.dimensionDeSkill("React"), null);
  // Paquetes por tipo de puesto: competencias válidas y al menos una con reto.
  assert.equal(tax.T.perfilesPuesto.length, 6);
  for (const p of tax.T.perfilesPuesto) {
    for (const c of p.competencias) assert.ok(ids.includes(c), p.id + " → " + c);
    assert.ok(tax.skillsDePerfil(p.id).length >= 1, p.id);
  }
  assert.deepEqual(tax.skillsDePerfil("comercial"), ["Atención al Cliente", "Comunicación Escrita", "Negociación", "Social Skills"]);
});

test("el navegador clasifica igual que el servidor", () => {
  const vm = require("node:vm");
  const ctx = {};
  vm.runInNewContext(generar(), ctx);
  for (const s of skillsDelCatalogo().concat(["Escucha activa y empatía", "Inventada"])) {
    const d = tax.dimensionDeSkill(s);
    assert.equal(ctx.tpDimensionDeSkill(s)?.id ?? null, d ? d.id : null, s);
  }
  for (const p of tax.T.perfilesPuesto) assert.deepEqual([...ctx.tpSkillsDePerfil(p.id)], tax.skillsDePerfil(p.id), p.id);
  assert.equal(ctx.tpSectorGrupo("energia_infraestructuras"), "sostenibilidad_clima");
  assert.equal(ctx.tpSectorNombre("fintech_pagos"), "Fintech y medios de pago");
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

test("una oferta guarda área general y concreta, y el sector antiguo equivalente", () => {
  const base = { title: "Técnico de selección", description: "Cribado de candidaturas y entrevistas con los equipos.", requiredSkills: ["Recruiting"], modalidad: "remoto" };
  const { fila } = validarOferta(Object.assign({}, base, { area: "operaciones", especialidad: "compras y cadena de suministro" }));
  assert.equal(fila.area, "operaciones");
  assert.equal(fila.especialidad, "Compras y cadena de suministro");   // nombre canónico
  assert.equal(fila.sector, "Ops");
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
