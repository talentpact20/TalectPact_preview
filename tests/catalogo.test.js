/**
 * El catálogo del servidor es una copia generada de los retos del cliente.
 * Si alguien edita assets/js/app/07-retos-comunes.js y no regenera la copia,
 * el corrector usaría enunciados viejos: este test lo impide.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");

const { construirCatalogo, ORIGEN, DESTINO } = require("../tools/generar_catalogo_servidor.js");

test("catalogo-retos.json está al día con 07-retos-comunes.js (npm run catalogo)", () => {
  const esperado = construirCatalogo(fs.readFileSync(ORIGEN, "utf8"));
  const actual = JSON.parse(fs.readFileSync(DESTINO, "utf8"));
  assert.deepEqual(actual, esperado);
  // Cada reto sabe qué skill mide; las clasificaciones llevan su solución,
  // porque se corrigen en el servidor.
  assert.ok(actual.every((r) => r.id && r.skill && r.exercises.length));
  const decisiones = actual.flatMap((r) => r.exercises.filter((e) => e.type === "decision"));
  assert.ok(decisiones.length > 0);
  assert.ok(decisiones.every((e) => e.data.options.length && e.data.options.every((o) => e.data.keys.includes(o.correct))));
});
