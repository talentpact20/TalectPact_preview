/**
 * Filtro de calidad del cliente (index.html).
 *
 * Es un control económico y de producto: una respuesta basura se corta ANTES
 * de gastar una llamada al modelo. Con ~€0,018 por evaluación, dejar pasar la
 * basura no arruina el margen, pero sí convierte el catálogo en un juguete:
 * cualquiera podría "completar" 102 retos pegando ruido.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadFunctions } = require("./helpers/extract-fn.js");

const { detectQuality, fallbackScore } = loadFunctions(["detectQuality", "fallbackScore"]);

const RESPUESTA_SENIOR = `Hola Marta, gracias por enviarme el informe del cierre trimestral.
He revisado los datos y he detectado dos discrepancias en la tabla de ingresos recurrentes:
el MRR de junio no incorpora las cinco altas del día 28 y la tasa de churn está calculada
sobre clientes activos a inicio de mes en lugar de sobre el promedio. Te propongo que
corrijamos ambos puntos antes de enviarlo al comité del jueves y que revisemos juntos la
plantilla para que no vuelva a ocurrir. Quedo a tu disposición esta tarde. Un saludo.`;

test("una respuesta profesional pasa el filtro", () => {
  const q = detectQuality(RESPUESTA_SENIOR);
  assert.equal(q.garbage, false);
  assert.equal(q.quality, "high");
});

test("la basura se detecta con su motivo, sin gastar una llamada al modelo", () => {
  const casos = [
    ["", "empty"],
    ["ab", "empty"],
    ["asdkjfh98237#$%&/()=?¿|@#~€¬{}[]*^`+´ç", "random_chars"],
    ["aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "repeated_chars"],
    ["hola que tal", "too_few_words"],
    [Array(20).fill("bueno").join(" "), "word_spam"]
  ];
  for (const [texto, motivo] of casos) {
    const q = detectQuality(texto);
    assert.equal(q.garbage, true, `"${texto.slice(0, 20)}…" debería marcarse como basura`);
    assert.equal(q.reason, motivo);
  }
});

test("no penaliza una respuesta corta pero legítima", () => {
  // Corta no es basura: la escala dice explícitamente que la longitud no es
  // indicador de calidad. Si el filtro local la cortase, el evaluador nunca
  // podría premiar "50 palabras brillantes".
  const corta = "Priorizaría el checkout: concentra el 60 % del abandono. Lanzaría un test A/B de pago en un paso.";
  const q = detectQuality(corta);
  assert.equal(q.garbage, false);
  assert.ok(["low", "medium"].includes(q.quality));
});

test("la nota de reserva nunca se sale de la escala", () => {
  const ej = { type: "analysis", data: { kw: ["churn", "retención", "cohorte"] } };
  for (const texto of ["", "%%%%%%", RESPUESTA_SENIOR, RESPUESTA_SENIOR.repeat(20)]) {
    const r = fallbackScore(ej, texto);
    assert.ok(r.score >= 0 && r.score <= 100, `score fuera de escala: ${r.score}`);
    assert.equal(r.aiPowered, false, "la nota de reserva debe declararse como no-IA");
  }
});

test("la nota de reserva marca la basura como tal (3/100), no como aprobado", () => {
  assert.equal(fallbackScore({ type: "analysis" }, "aaaaaaaaaaaaaaaaaaaaaa").score, 3);
});

test("la nota de reserva discrimina: mencionar los conceptos clave sube la nota", () => {
  const ej = { type: "analysis", data: { kw: ["churn", "retención", "cohorte"] } };
  const conConceptos = "El churn del 8 % concentra la fuga; propongo un análisis por cohorte y un plan de retención con onboarding asistido durante las dos primeras semanas.";
  const sinConceptos = "Creo que habría que mejorar las cosas y hacer que todo funcione mejor en general para el negocio.";
  assert.ok(fallbackScore(ej, conConceptos).score > fallbackScore(ej, sinConceptos).score);
});

test("un ejercicio de clasificación con JSON inválido puntúa 0, no revienta", () => {
  const r = fallbackScore({ type: "decision" }, "esto no es JSON pero tiene bastantes palabras sueltas aquí");
  assert.equal(r.score, 0);
});
