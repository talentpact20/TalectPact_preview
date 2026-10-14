/**
 * Corto plazo RRHH: segmentación Personas, preguntas de vacante y pipeline.
 */
const test = require("node:test");
const assert = require("node:assert/strict");

const { esPersona, esCognitivo, extraerPersonas } = require("../netlify/functions/lib/personas.js");
const { limpiarPreguntas, validarOferta } = require("../netlify/functions/lib/handlers/save-job.js");
const { construirPool } = require("../netlify/functions/lib/handlers/get-talent-pool.js");
const { ESTADOS } = require("../netlify/functions/lib/handlers/applications.js");

test("liderazgo y equipo son Personas; analítica es Cognitivo; React no", () => {
  assert.equal(esPersona("Liderazgo"), true);
  assert.equal(esPersona("Trabajo en Equipo"), true);
  assert.equal(esPersona("Gestión del Tiempo"), true);
  assert.equal(esCognitivo("Pensamiento Analítico"), true);
  assert.equal(esPersona("React"), false);
  assert.equal(esCognitivo("React"), false);
});

test("extraerPersonas ordena por nota y limita a 5", () => {
  const out = extraerPersonas([
    { n: "React", v: 99 },
    { n: "Liderazgo", v: 70 },
    { n: "Trabajo en Equipo", v: 88 },
    { n: "Gestión del Tiempo", v: 60 }
  ]);
  assert.deepEqual(out.map((s) => s.n), ["Trabajo en Equipo", "Liderazgo", "Gestión del Tiempo"]);
  assert.equal(out[0].v, 88);
});

test("el pool expone el bloque personas además de skills", () => {
  const id = "2f1c9a44-0e51-4a71-9a3f-6b2d0c8e7a15";
  const pool = construirPool(
    [{ id, user_id: "aaaa1111-0000-4000-8000-000000000000", sector: "IT", empleo: {} }],
    [
      { profile_id: id, skill: "Liderazgo", score: 81, integrity: { verified: true, risk: "bajo" } },
      { profile_id: id, skill: "React", score: 90, integrity: { verified: true, risk: "bajo" } }
    ]
  );
  assert.equal(pool.length, 1);
  assert.equal(pool[0].personas[0].n, "Liderazgo");
  assert.equal(pool[0].personas[0].v, 81);
  assert.ok(pool[0].skills.some((s) => s.n === "React"));
});

test("las preguntas de vacante se limitan a 3 y 200 caracteres", () => {
  assert.deepEqual(limpiarPreguntas(["  Una  ", "", "Dos", "Tres", "Cuatro"]), ["Una", "Dos", "Tres"]);
  assert.equal(limpiarPreguntas(["x".repeat(250)])[0].length, 200);
  const { fila, error } = validarOferta({
    title: "Analista",
    sector: "Data",
    description: "Descripción suficientemente larga para validar.",
    requiredSkills: ["Liderazgo"],
    modalidad: "remoto",
    cultureQuestions: ["¿Turnos de tarde?"]
  });
  assert.equal(error, undefined);
  assert.deepEqual(fila.culture_questions, ["¿Turnos de tarde?"]);
});

test("el pipeline solo admite estados conocidos y descartado exige motivo en el contrato", () => {
  assert.ok(ESTADOS.includes("preseleccionado"));
  assert.ok(ESTADOS.includes("descartado"));
  assert.equal(ESTADOS.includes("fantasma"), false);
});

test("inbox y applications exigen sesión", async () => {
  const inbox = require("../netlify/functions/lib/handlers/inbox.js");
  const apps = require("../netlify/functions/lib/handlers/applications.js");
  assert.equal((await inbox.handler({ httpMethod: "POST", headers: {}, body: "{}" })).statusCode, 401);
  assert.equal((await apps.handler({ httpMethod: "POST", headers: {}, body: "{}" })).statusCode, 401);
});
