/**
 * Estadística del banco de pruebas.
 *
 * Los valores esperados están calculados a mano (aritmética exacta) y no
 * generados por la propia implementación: si no, el test solo confirmaría que
 * el código hace lo que hace. Una κ que nadie ha verificado no es evidencia.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const M = require("../tfm/tech/eval/metrics.js");

const cerca = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) < tol, `${a} ≠ ${b} (tol ${tol})`);

test("media, desviación típica muestral y percentiles", () => {
  cerca(M.mean([2, 4, 6]), 4);
  cerca(M.sd([2, 4, 6]), 2);            // varianza muestral = 4
  cerca(M.sd([7]), 0);                   // n<2: no hay dispersión
  cerca(M.percentile([1, 2, 3, 4], 50), 2.5);
  cerca(M.percentile([1, 2, 3, 4], 95), 3.85);
});

test("MAE, RMSE y sesgo con signo", () => {
  const pred = [90, 50, 10], ref = [85, 60, 12];
  cerca(M.mae(pred, ref), (5 + 10 + 2) / 3);
  cerca(M.rmse(pred, ref), Math.sqrt((25 + 100 + 4) / 3));
  cerca(M.bias(pred, ref), (5 - 10 - 2) / 3);   // negativo: más severo que la referencia
  cerca(M.withinTolerance(pred, ref, 5), 2 / 3);
});

test("Pearson: 1 en relación lineal perfecta, -1 al invertirla", () => {
  cerca(M.pearson([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]), 1);
  cerca(M.pearson([1, 2, 3, 4, 5], [10, 8, 6, 4, 2]), -1);
  assert.ok(Number.isNaN(M.pearson([5, 5, 5], [1, 2, 3])), "sin varianza no hay correlación definida");
});

test("los rangos promedian los empates", () => {
  assert.deepEqual(M.ranks([10, 20, 20, 30]), [1, 2.5, 2.5, 4]);
});

test("Spearman es 1 si el orden coincide aunque la escala no", () => {
  // Caso real: notas de la PoC contra una referencia con la misma ordenación.
  cerca(M.spearman([96, 0, 92, 9], [95, 5, 90, 15]), 1);
  cerca(M.pearson([96, 0, 92, 9], [95, 5, 90, 15]), 0.9998325395937404, 1e-12);
});

test("las bandas son las de la escala del evaluador", () => {
  assert.equal(M.banda(0), 0);    // no evaluable
  assert.equal(M.banda(10), 0);
  assert.equal(M.banda(11), 1);   // insuficiente
  assert.equal(M.banda(45), 1);
  assert.equal(M.banda(46), 2);   // aceptable
  assert.equal(M.banda(66), 3);   // bueno
  assert.equal(M.banda(81), 4);   // excelente
  assert.equal(M.banda(100), 4);
});

test("κ cuadrática: 1 en acuerdo perfecto, 0 al puntuar todos igual", () => {
  const a = [0, 1, 2, 3, 4];
  cerca(M.quadraticWeightedKappa(a, a, 5), 1);
  // Un evaluador que da siempre la misma banda no tiene mérito: κ = 0.
  cerca(M.quadraticWeightedKappa([0, 1, 2, 3, 4], [2, 2, 2, 2, 2], 5), 0);
});

test("κ cuadrática contra un valor calculado a mano", () => {
  const a = [0, 1, 2, 3, 4, 2, 3, 1];
  const b = [0, 1, 3, 3, 4, 2, 2, 1];
  cerca(M.quadraticWeightedKappa(a, b, 5), 11 / 12, 1e-12);
});

test("κ penaliza más el error grande que el pequeño (por eso es cuadrática)", () => {
  const ref = [0, 1, 2, 3, 4];
  const cerca1 = [0, 1, 2, 3, 3];   // falla una banda
  const lejos = [0, 1, 2, 3, 0];    // falla cuatro
  assert.ok(M.quadraticWeightedKappa(ref, cerca1, 5) > M.quadraticWeightedKappa(ref, lejos, 5));
});

test("test-retest detecta si el evaluador deja de ser determinista", () => {
  const determinista = M.testRetest([[74, 74, 74], [88, 88, 88]]);
  assert.equal(determinista.sdMax, 0);
  assert.equal(determinista.rangoMax, 0);
  assert.equal(determinista.tasaIdenticos, 1);

  const inestable = M.testRetest([[74, 80, 68], [88, 88, 88]]);
  assert.ok(inestable.sdMax > 0);
  assert.equal(inestable.rangoMax, 12);
  assert.equal(inestable.tasaIdenticos, 0.5);
});

test("discriminación y bloqueo de inyección", () => {
  assert.equal(M.discriminacion([96, 92, 9]), 87);          // el 87 que cita la memoria
  assert.equal(M.tasaBloqueoInyeccion([0, 2, 5]), 1);
  assert.equal(M.tasaBloqueoInyeccion([0, 100]), 0.5);      // uno cayó en el ataque
  assert.equal(M.tasaBloqueoInyeccion([]), null);
});

test("el coste se calcula en dólares y se convierte a euros de forma explícita", () => {
  // La tarifa de Anthropic está en USD; llamar "€" a un número en dólares es
  // un error de un 9 % que un tribunal puede detectar en diez segundos.
  const c = M.coste(1882, 776, 1.09);
  cerca(c.usd, (1882 * 3 + 776 * 15) / 1e6);
  cerca(c.eur, c.usd / 1.09);
  assert.ok(c.eur < c.usd, "con EUR/USD > 1 el coste en euros es menor");
});
