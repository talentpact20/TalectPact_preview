/**
 * Corrector v2.1 — rúbrica con pesos del servidor, evidencia obligatoria,
 * topes por banderas y clasificaciones corregidas sin IA.
 *
 * Sin red: el modelo se simula. Lo que se fija es lo que el servidor hace con
 * la salida del modelo, que es lo que decide la nota.
 */
const test = require("node:test");
const assert = require("node:assert/strict");

const { puntuar, indicadores, corregirDecision, RUBRICAS } = require("../netlify/functions/lib/evaluator");
const { retoComun } = require("../netlify/functions/lib/catalogo");

const RESP = "El churn sube al 7,2% este trimestre. La causa es el onboarding: los clientes no activan la cuenta. Propongo un onboarding guiado en 30 días con responsable de Customer Success y medir la activación semanal.";

test("la nota global la calcula el servidor con los pesos, no el modelo", () => {
  const salida = {
    score: 99,   // se ignora
    criterios: [
      { id: "interpretacion", nota: 80, evidencia: ["El churn sube al 7,2% este trimestre"] },
      { id: "diagnostico", nota: 60, evidencia: ["La causa es el onboarding"] },
      { id: "plan", nota: 70, evidencia: ["onboarding guiado en 30 días con responsable de Customer Success"], falta: ["Priorizar entre varias acciones"], mejora: "Ordena tres acciones por impacto." },
      { id: "justificacion", nota: 50, evidencia: ["medir la activación semanal"] }
    ],
    banderas: { aborda_escenario: true, generica: false, copia_enunciado: false },
    resumen: "Buen diagnóstico.", siguiente_paso: "Priorizar."
  };
  const r = puntuar({ type: "analysis" }, salida, RESP);
  // 80·25 + 60·25 + 70·30 + 50·20 = 6600 → 66
  assert.equal(r.score, 66);
  assert.deepEqual(r.criteria.map((c) => c.weight), RUBRICAS.analysis.map((c) => c.peso));
  assert.match(r.criteria[2].comment, /Cita: «onboarding guiado.*Falta: Priorizar.*Para subir: Ordena/);
  assert.match(r.overall, /Siguiente paso: Priorizar\./);
});

test("una cita que no está en la respuesta se descarta y, sin evidencia, el criterio no pasa de 40", () => {
  const salida = {
    criterios: [
      { id: "interpretacion", nota: 90, evidencia: ["El candidato calcula el LTV/CAC de 3,1"] },   // inventada
      { id: "diagnostico", nota: 90, evidencia: ["la causa es el ONBOARDING…los clientes no activan"] }, // literal con «…» y mayúsculas
      { id: "plan", nota: 90 }                                                                     // sin citas
      // "justificacion" ausente: cuenta 0 y se dice
    ]
  };
  const r = puntuar({ type: "analysis" }, salida, RESP);
  const [interp, diag, plan, just] = r.criteria;
  assert.equal(interp.score, 40);
  assert.equal(diag.score, 90);
  assert.equal(plan.score, 40);
  assert.equal(just.score, 0);
  assert.match(just.comment, /no puntuó/);
  assert.equal(r.citasDescartadas, 1);
});

test("las banderas aplican los topes en el servidor", () => {
  const todo = (n) => RUBRICAS.email.map((c) => ({ id: c.id, nota: n, evidencia: ["El churn sube"] }));
  assert.equal(puntuar({ type: "email" }, { criterios: todo(90), banderas: { aborda_escenario: false } }, RESP).score, 10);
  assert.equal(puntuar({ type: "email" }, { criterios: todo(90), banderas: { generica: true } }, RESP).score, 40);
  const r = puntuar({ type: "email" }, { criterios: todo(90), banderas: { copia_enunciado: true, generica: true } }, RESP);
  assert.equal(r.score, 15);
  assert.match(r.capped, /enunciado/);
  // Formato antiguo: no se toca (lo usa el banco de pruebas del TFM).
  assert.equal(puntuar({ type: "email" }, { score: 70, criteria: [] }, RESP), null);
});

test("las clasificaciones se corrigen sin IA, con la solución del servidor y descontando el azar", async () => {
  const reto = retoComun("common_analytical");
  const ej = reto.exercises.find((e) => e.type === "decision") ||
    require("../netlify/functions/lib/catalogo-retos.json").flatMap((r) => r.exercises).find((e) => e.type === "decision");
  const ops = ej.data.options;
  const otra = (k) => ej.data.keys.find((x) => x !== k);
  // El navegador dice que todas sus elecciones eran «correctas»: da igual.
  const trampa = ops.map((o) => ({ text: o.text, chosen: otra(o.correct), correct: otra(o.correct) }));
  assert.equal(corregirDecision(ej, JSON.stringify(trampa)).score, 0);
  const perfecta = ops.map((o) => ({ text: o.text, chosen: o.correct }));
  assert.equal(corregirDecision(ej, JSON.stringify(perfecta)).score, 100);
  // 3 de 4 con dos categorías: 75 % de acierto, 50 % al azar → 50.
  if (ops.length === 4 && ej.data.keys.length === 2) {
    const tres = perfecta.map((x, i) => (i === 0 ? { text: x.text, chosen: otra(x.chosen) } : x));
    assert.equal(corregirDecision(ej, JSON.stringify(tres)).score, 50);
  }
  assert.equal(corregirDecision(ej, "esto no es json").score, 0);

  // Y por la función: no llama al modelo.
  process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "sk-ant-test";
  const real = globalThis.fetch;
  let llamadas = 0;
  globalThis.fetch = async () => { llamadas++; throw new Error("no debería llamar al modelo"); };
  try {
    const { handler } = require("../netlify/functions/lib/handlers/evaluate-exercise.js");
    const retoDe = require("../netlify/functions/lib/catalogo-retos.json").find((r) => r.exercises.includes(ej) || r.exercises.some((e) => e.id === ej.id && e.title === ej.title));
    const res = await handler({ httpMethod: "POST", headers: {}, body: JSON.stringify({
      exercise: { id: ej.id, challengeId: retoDe.id, title: "x", scenario: "x", type: "decision" },
      response: JSON.stringify(perfecta)
    }) });
    const p = JSON.parse(res.body);
    assert.equal(res.statusCode, 200);
    assert.equal(p.score, 100);
    assert.equal(p.deterministic, true);
    assert.equal(llamadas, 0);
  } finally { globalThis.fetch = real; }
});

test("la guía numerada de un correo se convierte en indicadores que el corrector revisa uno a uno", () => {
  const ind = indicadores({ type: "email", data: { hint: "Incluye: 1) Apertura (cómo empiezas sin atacar). 2) Hechos concretos (no sensaciones). 3) Pregunta abierta" } });
  assert.deepEqual(ind, ["Apertura (cómo empiezas sin atacar)", "Hechos concretos (no sensaciones)", "Pregunta abierta"]);
  assert.deepEqual(indicadores({ type: "email", data: { hint: "Ordena por prioridad. Justifica." } }), ["Ordena por prioridad. Justifica."]);
});
