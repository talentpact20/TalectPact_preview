/**
 * El contenido de los retos vive solo en el servidor (Fase 0 del antitrampas).
 *
 * Antes, enunciados, datos y soluciones viajaban en assets/js/app/07-retos-comunes.js:
 * cualquiera podía leer un reto, o la respuesta correcta de una clasificación,
 * sin empezarlo. Estos tests impiden que vuelva a pasar y que web y servidor
 * se desincronicen.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");

const { leerRetos, CLIENTE, SERVIDOR } = require("../tools/separar_contenido_retos.js");

const cliente = leerRetos(fs.readFileSync(CLIENTE, "utf8"));
const servidor = JSON.parse(fs.readFileSync(SERVIDOR, "utf8"));

test("la web no lleva ni enunciados, ni datos, ni soluciones de los retos", () => {
  for (const r of cliente) {
    for (const e of r.exercises) {
      assert.ok(!("scenario" in e) && !("data" in e), `${r.id}.${e.id} lleva contenido en el navegador`);
    }
  }
  assert.doesNotMatch(fs.readFileSync(CLIENTE, "utf8"), /"correct"|correct:/, "hay soluciones en el navegador");
});

test("cada reto y ejercicio de la web existe en el servidor con el mismo título, tipo y tiempo", () => {
  const porId = new Map(servidor.map((r) => [r.id, r]));
  assert.equal(servidor.length, cliente.length);
  for (const r of cliente) {
    const s = porId.get(r.id);
    assert.ok(s, r.id);
    assert.equal(s.skill, r.skill);
    assert.deepEqual(s.exercises.map((e) => [e.id, e.title, e.type, e.timeLimit || null]),
      r.exercises.map((e) => [e.id, e.title, e.type, e.timeLimit || null]), r.id);
  }
});

test("el servidor tiene el contenido completo y las soluciones de las clasificaciones", () => {
  assert.ok(servidor.every((r) => r.id && r.skill && r.exercises.length && r.exercises.every((e) => e.scenario && e.data)));
  const decisiones = servidor.flatMap((r) => r.exercises.filter((e) => e.type === "decision"));
  assert.ok(decisiones.length > 0);
  assert.ok(decisiones.every((e) => e.data.options.length && e.data.options.every((o) => e.data.keys.includes(o.correct))));
});
