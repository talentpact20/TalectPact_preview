#!/usr/bin/env node
/**
 * Fase 0 del antitrampas (docs/plan_post_reunion/08_seguridad_antitrampas.md, §1).
 *
 * Antes, el enunciado, los datos y las SOLUCIONES de los 103 retos viajaban en
 * assets/js/app/07-retos-comunes.js: cualquiera los leía sin empezar el reto.
 * Este script (de un solo uso) mueve el contenido al servidor:
 *   · netlify/functions/lib/catalogo-retos.json pasa a ser la ÚNICA fuente del
 *     contenido (enunciado, datos, soluciones, tiempo);
 *   · en el navegador quedan solo los metadatos (título, tipo, tiempo, briefing).
 * El contenido llega al empezar un intento (función retos-intento), sin soluciones.
 *
 * Uso: node tools/separar_contenido_retos.js   (ya ejecutado el 19/10/2026)
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const RAIZ = path.join(__dirname, "..");
const CLIENTE = path.join(RAIZ, "assets/js/app/07-retos-comunes.js");
const SERVIDOR = path.join(RAIZ, "netlify/functions/lib/catalogo-retos.json");
const CONTENIDO = ["scenario", "data"];

function leerRetos(src) {
  const nada = new Proxy(function () {}, {
    get: (_t, k) => (k === Symbol.toPrimitive ? () => "" : nada),
    apply: () => nada,
    construct: () => nada
  });
  const ctx = vm.createContext({ window: nada, document: nada, localStorage: nada, navigator: nada, console, setTimeout: () => 0 });
  vm.runInContext(src + "\n;globalThis.__retos = COMMON_EXERCISES;", ctx, { filename: "07-retos-comunes.js" });
  return JSON.parse(JSON.stringify(ctx.__retos));
}

function separar() {
  const src = fs.readFileSync(CLIENTE, "utf8");
  const retos = leerRetos(src);
  if (retos.every((r) => r.exercises.every((e) => !("scenario" in e)))) {
    throw new Error("El cliente ya no tiene contenido: el script ya se ejecutó.");
  }
  const servidor = retos.map((r) => ({
    id: r.id, skill: r.skill, category: r.category, title: r.title,
    exercises: r.exercises.map((e) => ({
      id: e.id, title: e.title, type: e.type, timeLimit: e.timeLimit || null, difficulty: e.difficulty || null,
      scenario: e.scenario, data: e.data || {}
    }))
  }));
  const cliente = retos.map((r) => Object.assign({}, r, {
    exercises: r.exercises.map((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !CONTENIDO.includes(k))))
  }));
  const ini = src.indexOf("const COMMON_EXERCISES=[");
  const fin = src.indexOf("\n];\n", ini);
  if (ini < 0 || fin < 0) throw new Error("No se encuentra COMMON_EXERCISES");
  const literal = "// Solo metadatos: el enunciado, los datos y las soluciones están en el servidor\n" +
    "// (netlify/functions/lib/catalogo-retos.json) y llegan al empezar un intento.\n" +
    "const COMMON_EXERCISES=[\n" + cliente.map((r) => "  " + JSON.stringify(r)).join(",\n") + "\n];\n";
  fs.writeFileSync(CLIENTE, src.slice(0, ini) + literal + src.slice(fin + 4));
  fs.writeFileSync(SERVIDOR, JSON.stringify(servidor) + "\n");
  return { retos: servidor.length, ejercicios: servidor.reduce((n, r) => n + r.exercises.length, 0) };
}

if (require.main === module) console.log(separar());
module.exports = { leerRetos, CLIENTE, SERVIDOR };
