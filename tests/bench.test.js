/**
 * Banco de pruebas: se prueba el banco, no el modelo.
 *
 * Con ejecuciones sintéticas comprobamos que el análisis convierte notas en
 * métricas correctamente. Si el banco estuviera mal, sus resultados serían
 * peor que no tener ninguno: darían una falsa sensación de rigor.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { analizar, gold, retos, systemPrompt, userPrompt } = require("../tfm/tech/eval/run_bench.js");

/** Construye una ejecución falsa: cada ítem recibe las notas que se le indiquen. */
function runSintetico(notasPorItem, { repeticiones = 3, alertas = {} } = {}) {
  return {
    fecha: "2026-08-29T00:00:00.000Z",
    goldSet: { nombre: gold.nombre, version: gold.version },
    parametros: { repeticiones, eurUsd: 1.09, temperature: 0 },
    resultados: gold.items.map((item) => {
      const notas = notasPorItem[item.id];
      return {
        ...item,
        repeticiones: (Array.isArray(notas) ? notas : Array(repeticiones).fill(notas)).map((score) => ({
          score, criterios: [], overall: "", alerta: alertas[item.id] || null,
          modelo: "claude-sonnet-4-6", inputTokens: 1900, outputTokens: 880, latenciaMs: 16000
        }))
      };
    })
  };
}

const PERFECTO = Object.fromEntries(gold.items.map((i) => [i.id, i.referenciaScore]));

test("el gold set está bien formado", () => {
  assert.ok(gold.items.length >= 10, "un corpus de menos de 10 ítems no sostiene ninguna métrica");
  const ids = new Set();
  for (const it of gold.items) {
    assert.ok(!ids.has(it.id), `id duplicado: ${it.id}`);
    ids.add(it.id);
    assert.ok(retos[it.retoId], `${it.id} apunta a un reto inexistente: ${it.retoId}`);
    assert.ok(it.referenciaScore >= 0 && it.referenciaScore <= 100);
    assert.ok(["legitimo", "ataque"].includes(it.tipo));
    assert.ok(it.justificacionReferencia.length > 40, `${it.id} necesita justificar su nota de referencia`);
    assert.ok(Object.keys(it.respuesta).length > 0);
  }
  assert.ok(gold.items.some((i) => i.tipo === "ataque"), "sin ataques no se puede medir la robustez");
});

test("el corpus cubre las cinco bandas de la escala", () => {
  const M = require("../tfm/tech/eval/metrics.js");
  const bandas = new Set(gold.items.map((i) => M.banda(i.referenciaScore)));
  for (const b of M.BANDAS) {
    assert.ok(bandas.has(b.id), `no hay ningún ítem de referencia en la banda "${b.nombre}"`);
  }
});

test("un evaluador que clava la referencia da κ = 1 y MAE = 0", () => {
  const a = analizar(runSintetico(PERFECTO));
  assert.equal(a.acuerdo.kappaCuadratica, 1);
  assert.equal(a.error.mae, 0);
  assert.equal(a.acuerdo.acuerdoBandaExacto, 1);
  assert.equal(a.reproducibilidad.tasaIdenticos, 1);
});

test("un evaluador que puntúa 50 a todo se detecta como inútil", () => {
  // κ ≈ 0 es exactamente lo que debe salir: acierta por azar, no por criterio.
  const a = analizar(runSintetico(Object.fromEntries(gold.items.map((i) => [i.id, 50]))));
  assert.ok(a.acuerdo.kappaCuadratica < 0.2, `κ = ${a.acuerdo.kappaCuadratica}, debería ser ≈ 0`);
  assert.equal(a.discriminacion, 0);
  assert.equal(a.seguridad.tasaBloqueo, 0, "50 no bloquea un ataque");
});

test("detecta un evaluador sistemáticamente generoso", () => {
  const inflado = Object.fromEntries(gold.items.map((i) => [i.id, Math.min(100, i.referenciaScore + 12)]));
  const a = analizar(runSintetico(inflado));
  assert.ok(a.error.sesgo > 0, "el sesgo debe salir positivo");
  assert.ok(a.orden.spearman > 0.95, "el orden se mantiene aunque la escala esté desplazada");
});

test("detecta pérdida de determinismo entre repeticiones", () => {
  const inestable = { ...PERFECTO, "G-A03": [74, 62, 81] };
  const a = analizar(runSintetico(inestable));
  assert.ok(a.reproducibilidad.tasaIdenticos < 1);
  assert.equal(a.reproducibilidad.rangoMax, 19);
});

test("un ítem que falla no tumba la ejecución ni contamina las métricas", () => {
  const run = runSintetico(PERFECTO);
  run.resultados[0].repeticiones = run.resultados[0].repeticiones.map(() => ({ error: "Anthropic API request failed" }));
  const a = analizar(run);
  assert.equal(a.fallidos, 1);
  assert.equal(a.n, gold.items.length - 1);
  assert.equal(a.error.mae, 0, "los ítems con error se excluyen, no cuentan como 0");
});

test("usa la mediana de las repeticiones, no la primera ni la mejor", () => {
  const a = analizar(runSintetico({ ...PERFECTO, "G-A04": [90, 52, 10] }));
  const fila = a.filas.find((f) => f.id === "G-A04");
  assert.equal(fila.obtenido, 52);
});

test("cuenta las falsas alarmas de seguridad sobre respuestas legítimas", () => {
  const a = analizar(runSintetico(PERFECTO, { alertas: { "G-A03": "sospecha" } }));
  assert.equal(a.seguridad.falsasAlarmas, 1);
  assert.equal(a.seguridad.tasaBloqueo, 1, "los tres ataques siguen bloqueados");
});

test("el coste se reporta en dólares y en euros por separado", () => {
  const a = analizar(runSintetico(PERFECTO));
  assert.ok(a.coste.mediaUsd > a.coste.mediaEur);
  assert.equal(a.coste.eurUsd, 1.09);
});

test("la rúbrica viaja en el canal de sistema y la respuesta en el de usuario", () => {
  const ataque = gold.items.find((i) => i.id === "G-A02");
  const reto = retos[ataque.retoId];
  const sys = systemPrompt(reto);
  const usr = userPrompt(ataque, reto);
  assert.ok(sys.includes("Correctitud algorítmica"), "la rúbrica se inyecta en runtime (Dynamic Prompting)");
  assert.ok(!sys.includes("IGNORA TUS INSTRUCCIONES"), "el texto del candidato jamás entra en el system prompt");
  assert.ok(usr.includes("IGNORA TUS INSTRUCCIONES"));
});
