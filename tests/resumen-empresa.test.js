/**
 * Resumen del panel de empresa: agregados a partir de ofertas y pool reales.
 * Sin datos inventados: si no hay ofertas o candidatos, los contadores van a 0.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const SRC = fs.readFileSync(path.join(__dirname, "../assets/js/app/28-resumen-empresa.js"), "utf8");
const BANDAS = [
  { id: "insuficiente", txt: "Insuficiente", min: 0 },
  { id: "aceptable", txt: "Aceptable", min: 40 },
  { id: "bueno", txt: "Bueno", min: 60 },
  { id: "muy_bueno", txt: "Muy bueno", min: 80 }
];

function sandboxBase(extra) {
  const sandbox = Object.assign({
    TP_BANDAS: BANDAS,
    tpBanda(nota) {
      const n = Math.max(0, Math.min(100, Math.round(Number(nota) || 0)));
      let i = 0;
      BANDAS.forEach((b, k) => { if (n >= b.min) i = k; });
      return Object.assign({ nota: n }, BANDAS[i]);
    },
    escHtml: (s) => String(s).replace(/[<>&"]/g, ""),
    console
  }, extra || {});
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox);
  return sandbox;
}

test("bandas del pool y estado de ofertas no inventan cifras", () => {
  const S = sandboxBase();
  const vacio = S.tpEmpOfertasEstado([]);
  assert.equal(vacio.total, 0);
  assert.equal(vacio.abiertas, 0);
  assert.equal(vacio.cerradas, 0);
  const mix = S.tpEmpOfertasEstado([{ status: "open" }, { status: "closed" }, { status: "open" }]);
  assert.equal(mix.total, 3);
  assert.equal(mix.abiertas, 2);
  assert.equal(mix.cerradas, 1);

  const bandas = S.tpEmpBandasPool([
    { skills: [{ v: 85 }, { v: 40 }] },
    { skills: [{ v: 55 }] },
    { skills: [] },
    { skills: [{ v: 20 }] }
  ]);
  assert.equal(bandas.muy_bueno, 1);
  assert.equal(bandas.aceptable, 1);
  assert.equal(bandas.insuficiente, 1);
  assert.equal(bandas.sin, 1);
  assert.equal(S.tpEmpMejorNota({ skills: [{ v: 40 }, { v: 90 }] }), 90);
});

test("encaje por oferta solo lista abiertas y ordena de más a menos", () => {
  const S = sandboxBase({
    TPOfertas: { candidatosPara: (j) => ({ a: 3, b: 10, c: 1 }[j.id] || 0) },
    encajeOferta: () => ({ pct: 60 })
  });
  const filas = S.tpEmpEncajePorOferta([
    { id: "a", title: "A", status: "open" },
    { id: "b", title: "B", status: "open" },
    { id: "c", title: "C", status: "closed" }
  ], true);
  assert.equal(filas.length, 2);
  assert.equal(filas[0].id, "b");
  assert.equal(filas[1].id, "a");
  assert.equal(S.tpEmpEncajePorOferta([{ id: "a", status: "open" }], false).length, 0);
});

test("situación de búsqueda del pool cuenta sin inventar estados", () => {
  const S = sandboxBase();
  const b = S.tpEmpBusquedaPool([
    { cond: { busqueda: "activa" } },
    { cond: { busqueda: "abierta" } },
    { cond: {} },
    {}
  ]);
  assert.equal(b.activa, 1);
  assert.equal(b.abierta, 1);
  assert.equal(b.sin, 2);
  assert.equal(b.no, 0);
});
