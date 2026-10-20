/**
 * Bandas de nota: mismo corte en el servidor (lib/bandas.js) y en el navegador
 * (tpBanda, 18-interfaz.js), y nunca un número fuera de 0–100.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const { banda } = require("../netlify/functions/lib/bandas.js");

test("las cuatro bandas cortan en 40, 60 y 80", () => {
  assert.equal(banda(0).id, "insuficiente");
  assert.equal(banda(39.4).id, "insuficiente");
  assert.equal(banda(40).id, "aceptable");
  assert.equal(banda(59).id, "aceptable");
  assert.equal(banda(60).id, "bueno");
  assert.equal(banda(79).id, "bueno");
  assert.equal(banda(80).id, "muy_bueno");
  assert.equal(banda(250).nota, 100);
  assert.equal(banda("x").nota, 0);
  assert.equal(banda(85).nivel, 4);
});

test("el navegador calcula la misma banda que el servidor y la empresa no ve el número escrito", () => {
  const ctx = { _tpEsc: (s) => String(s), document: { readyState: "loading", addEventListener() {} } };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../assets/js/app/18-interfaz.js"), "utf8"), ctx);
  for (const n of [0, 12, 39, 40, 41, 59, 60, 79, 80, 99, 100]) {
    assert.equal(ctx.tpBanda(n).id, banda(n).id, `nota ${n}`);
  }
  const empresa = ctx.tpBandaHtml(73, false);
  assert.match(empresa, /Bueno/);
  assert.doesNotMatch(empresa, /<b>73<\/b>/);
  assert.match(ctx.tpBandaHtml(73, true), /<b>73<\/b>/);
});
