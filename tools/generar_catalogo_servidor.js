#!/usr/bin/env node
/**
 * Genera netlify/functions/lib/catalogo-retos.json a partir de
 * assets/js/app/07-retos-comunes.js, que sigue siendo la única fuente de verdad.
 *
 * Por qué: el corrector recibía el enunciado desde el navegador. Con el
 * challengeId de un reto real y un enunciado trivial se obtenía una nota
 * "verificada" de esa skill. Con esta copia, el servidor corrige con SU
 * enunciado y sabe qué skill mide cada reto.
 *
 * Uso: node tools/generar_catalogo_servidor.js   (o npm run catalogo)
 * tests/catalogo.test.js falla si el JSON no coincide con el fichero de retos.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const RAIZ = path.join(__dirname, "..");
const ORIGEN = path.join(RAIZ, "assets/js/app/07-retos-comunes.js");
const DESTINO = path.join(RAIZ, "netlify/functions/lib/catalogo-retos.json");

/** Ejecuta el script clásico en un entorno aislado y devuelve COMMON_EXERCISES. */
function leerRetos(src) {
  // El fichero también define funciones de interfaz; aquí no se ejecutan, pero
  // cualquier acceso a window/document en el nivel superior debe ser inocuo.
  const nada = new Proxy(function () {}, {
    get: (_t, k) => (k === Symbol.toPrimitive ? () => "" : nada),
    apply: () => nada,
    construct: () => nada
  });
  const ctx = vm.createContext({ window: nada, document: nada, localStorage: nada, navigator: nada, console, setTimeout: () => 0 });
  vm.runInContext(src + "\n;globalThis.__retos = COMMON_EXERCISES;", ctx, { filename: "07-retos-comunes.js" });
  return ctx.__retos;
}

/** Solo lo que necesita la rúbrica del servidor (sin soluciones ni textos de interfaz). */
function datosRubrica(d) {
  const o = d && typeof d === "object" ? d : {};
  const r = {};
  if (Array.isArray(o.table)) r.table = o.table.map((f) => ({ n: f && f.n, a: f && f.a }));
  if (Array.isArray(o.kw)) r.kw = o.kw.slice();
  for (const k of ["to", "subject", "hint", "context"]) if (typeof o[k] === "string") r[k] = o[k];
  return r;
}

function construirCatalogo(src) {
  const retos = leerRetos(src);
  // Pasar por JSON deja objetos normales (los del entorno aislado tienen otro prototipo).
  return JSON.parse(JSON.stringify(retos.map((c) => ({
    id: c.id,
    skill: c.skill,
    category: c.category,
    title: c.title,
    exercises: (c.exercises || []).map((e) => ({
      id: e.id,
      title: e.title,
      scenario: e.scenario,
      type: e.type,
      data: datosRubrica(e.data)
    }))
  }))));
}

function generar() {
  const catalogo = construirCatalogo(fs.readFileSync(ORIGEN, "utf8"));
  fs.writeFileSync(DESTINO, JSON.stringify(catalogo) + "\n");
  return catalogo;
}

if (require.main === module) {
  const c = generar();
  const n = c.reduce((t, r) => t + r.exercises.length, 0);
  console.log(`catalogo-retos.json: ${c.length} retos, ${n} ejercicios`);
}

module.exports = { construirCatalogo, ORIGEN, DESTINO };
