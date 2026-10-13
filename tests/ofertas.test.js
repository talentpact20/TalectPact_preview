/**
 * Ofertas reales y backoffice.
 *
 * Las ofertas viven en Supabase: se valida lo que una empresa puede publicar,
 * que la lista pública no exponga quién las publicó y que el backoffice solo
 * se abra con el rol de administrador que asigna el servidor.
 */
const test = require("node:test");
const assert = require("node:assert/strict");

const { validarOferta } = require("../netlify/functions/lib/handlers/save-job.js");
const { aOferta } = require("../netlify/functions/lib/handlers/list-jobs.js");
const { resumirEvaluaciones, esAdmin } = require("../netlify/functions/lib/handlers/admin-metrics.js");

const BUENA = {
  title: "Analista de Datos", sector: "Data", description: "Análisis de cohortes y cuadros de mando para producto.",
  requiredSkills: ["Pensamiento Analítico"], jornada: "parcial", modalidad: "hibrido", ubicacion: "Madrid", salMin: 20000, salMax: 26000
};

test("una oferta válida se normaliza y una incompleta o incoherente se rechaza", () => {
  const { fila, error } = validarOferta(BUENA);
  assert.equal(error, undefined);
  assert.equal(fila.jornada, "parcial");
  assert.equal(fila.contrato, "indefinido");            // valor por defecto
  assert.deepEqual(fila.required_skills, ["Pensamiento Analítico"]);
  const casos = [
    [{ title: "x" }, /título/],
    [{ sector: "Astrología" }, /Sector/],
    [{ description: "corta" }, /descripción/],
    [{ requiredSkills: [] }, /skill/],
    [{ salMin: 40000, salMax: 30000 }, /salario/],
    [{ modalidad: "presencial", ubicacion: "" }, /ubicación/]
  ];
  for (const [cambio, patron] of casos) {
    assert.match(validarOferta(Object.assign({}, BUENA, cambio)).error || "", patron, JSON.stringify(cambio));
  }
  // Valores fuera de catálogo no entran: se sustituyen por el valor por defecto.
  assert.equal(validarOferta(Object.assign({}, BUENA, { jornada: "<script>" })).fila.jornada, "completa");
});

test("la lista pública de ofertas no expone la cuenta que las publicó", () => {
  const o = aOferta({ id: "j1", title: "T", sector: "Data", description: "d", company_user_id: "secreto", required_skills: ["A"], companies: { company_name: "Nubia", website: "https://nubia.es" } });
  assert.equal(o.company.name, "Nubia");
  assert.equal(o.company.website, "https://nubia.es");
  assert.doesNotMatch(JSON.stringify(o), /secreto|company_user_id/);
});

test("el backoffice exige el rol admin de app_metadata, no el que el usuario puede escribirse", async () => {
  assert.equal(esAdmin({ app_metadata: { role: "admin" } }), true);
  assert.equal(esAdmin({ user_metadata: { role: "admin" } }), false);
  assert.equal(esAdmin(null), false);
  const { handler } = require("../netlify/functions/lib/handlers/admin-metrics.js");
  assert.equal((await handler({ httpMethod: "POST", headers: {}, body: "{}" })).statusCode, 401);
});

test("las métricas de evaluación se agregan sin datos personales", () => {
  const r = resumirEvaluaciones([
    { score: 80, cost_eur: 0.012, model_used: "m1", integrity: { verified: true, risk: "bajo" } },
    { score: 60, cost_eur: 0.014, model_used: "m1", integrity: { verified: false, risk: "alto", injectionSignals: ["exige_nota"] } },
    { score: 70, cost_eur: null, model_used: null, integrity: null }
  ]);
  assert.equal(r.notaMedia, 70);
  assert.equal(r.costeMedioEur, 0.013);
  assert.deepEqual(r.porModelo, { m1: 2, "sin IA (reserva)": 1 });
  assert.equal(r.verificadasPct, 33);
  assert.equal(r.conSenalesInyeccion, 1);
  assert.deepEqual(r.riesgo, { bajo: 1, medio: 0, alto: 1, sin: 1 });
});
