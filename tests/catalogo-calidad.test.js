/**
 * Calidad del contenido de los retos (tools/auditar_retos.js).
 * Ningún ejercicio puede volver a tener escenario de relleno, símbolos
 * decorativos, guía sin puntos (de ahí salen los indicadores del corrector),
 * análisis sin tabla o clasificaciones pobres o descompensadas.
 */
const test = require("node:test");
const assert = require("node:assert/strict");

const { auditar } = require("../tools/auditar_retos.js");
const catalogo = require("../netlify/functions/lib/catalogo-retos.json");

test("todos los ejercicios del catálogo pasan la auditoría de calidad", () => {
  const malos = [];
  for (const r of auditar()) for (const e of r.ejercicios) if (e.problemas.length) malos.push(`${r.id}.${e.id}: ${e.problemas.join("; ")}`);
  assert.deepEqual(malos, []);
});

test("no queda ningún reto de plantilla genérica", () => {
  const plantilla = /Nivel Básico|Caso Práctico|Reto Avanzado|Concepto A|Opción estratégica A|Valor 1/;
  const malos = catalogo.flatMap((r) => r.exercises.filter((e) => plantilla.test(e.title + JSON.stringify(e.data) + e.scenario)).map((e) => r.id + "." + e.id));
  assert.deepEqual(malos, []);
});

test("las clasificaciones tienen ids únicos y ninguna solución en el enunciado", () => {
  for (const r of catalogo) for (const e of r.exercises.filter((x) => x.type === "decision")) {
    const ids = e.data.options.map((o) => o.id);
    assert.equal(new Set(ids).size, ids.length, `${r.id}.${e.id} repite ids`);
    assert.equal(e.data.cats.length, e.data.keys.length, `${r.id}.${e.id}: categorías y claves no cuadran`);
  }
  // En el código que se enseña no puede ir marcado dónde está el error.
  const pistas = catalogo.flatMap((r) => r.exercises.filter((e) => /\/\/\s*Bug\s*\d|#\s*Bug\s*\d/i.test(e.scenario)).map((e) => r.id + "." + e.id));
  assert.deepEqual(pistas, []);
});
