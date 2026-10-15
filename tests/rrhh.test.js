/**
 * Corto plazo RRHH: taxonomía de aptitudes, preguntas/dilemas de vacante y pipeline.
 */
const test = require("node:test");
const assert = require("node:assert/strict");

const { esPersona, esCognitivo, familiaDe, extraerPersonas } = require("../netlify/functions/lib/personas.js");
const { limpiarPreguntas, limpiarDilemas, validarOferta } = require("../netlify/functions/lib/handlers/save-job.js");
const { construirPool } = require("../netlify/functions/lib/handlers/get-talent-pool.js");
const { ESTADOS } = require("../netlify/functions/lib/handlers/applications.js");
const { limpiarRespuestasDilema } = require("../netlify/functions/lib/handlers/apply.js");

test("taxonomía: ejecución / interpersonales / cognitivas; React y Excel son técnico", () => {
  assert.equal(familiaDe("Liderazgo"), "ejecucion");
  assert.equal(familiaDe("Trabajo en Equipo"), "interpersonales");
  assert.equal(familiaDe("Gestión del Tiempo"), "ejecucion");
  assert.equal(familiaDe("Toma de Decisiones"), "autogestion");
  assert.equal(familiaDe("Pensamiento Analítico"), "cognitivas");
  assert.equal(familiaDe("Excel y Datos"), "sector");
  assert.equal(esPersona("Liderazgo"), true);
  assert.equal(esPersona("Comunicación Escrita"), true);
  assert.equal(esCognitivo("Pensamiento Analítico"), true);
  assert.equal(esPersona("React"), false);
  assert.equal(esCognitivo("React"), false);
  assert.equal(esCognitivo("Excel y Datos"), false);
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
    cultureQuestions: ["¿Turnos de tarde?"],
    dilemmas: ["Cliente pide saltarse calidad. ¿Qué haces?"]
  });
  assert.equal(error, undefined);
  assert.deepEqual(fila.culture_questions, ["¿Turnos de tarde?"]);
  assert.equal(fila.dilemmas.length, 1);
});

test("dilemas de oferta y respuestas del candidato se limitan", () => {
  assert.deepEqual(limpiarDilemas(["  A  ", "", "B", "C", "D"]), ["A", "B", "C"]);
  assert.equal(limpiarDilemas(["x".repeat(700)])[0].length, 600);
  assert.deepEqual(limpiarRespuestasDilema([" sí ", "", "no", "tal vez", "extra"]), ["sí", "no", "tal vez"]);
  assert.equal(limpiarRespuestasDilema(["y".repeat(2500)])[0].length, 2000);
});

test("el pipeline solo admite estados conocidos y descartado exige motivo en el contrato", () => {
  assert.ok(ESTADOS.includes("preseleccionado"));
  assert.ok(ESTADOS.includes("descartado"));
  assert.equal(ESTADOS.includes("fantasma"), false);
  // El aviso al candidato no nombra a la empresa ni filtra el motivo del descarte.
  const { mensajeEtapa } = require("../netlify/functions/lib/notify.js");
  assert.equal(mensajeEtapa("aplicado"), null);
  for (const e of ["preseleccionado", "entrevista", "contratado", "descartado"]) {
    const m = mensajeEtapa(e);
    assert.ok(m.title && m.body, e);
    assert.doesNotMatch(m.title + m.body, /motivo|NortePay|razón/i);
  }
});

test("inbox y applications exigen sesión", async () => {
  const inbox = require("../netlify/functions/lib/handlers/inbox.js");
  const apps = require("../netlify/functions/lib/handlers/applications.js");
  assert.equal((await inbox.handler({ httpMethod: "POST", headers: {}, body: "{}" })).statusCode, 401);
  assert.equal((await apps.handler({ httpMethod: "POST", headers: {}, body: "{}" })).statusCode, 401);
  // La postulación del candidato también exige sesión (antes el botón Aplicar no guardaba nada).
  const apply = require("../netlify/functions/lib/handlers/apply.js");
  assert.equal((await apply.handler({ httpMethod: "POST", headers: {}, body: JSON.stringify({ jobId: "x" }) })).statusCode, 401);
  assert.equal((await apply.handler({ httpMethod: "GET", headers: {}, body: "" })).statusCode, 405);
});

test("un fallo cualquiera no se confunde con una migración pendiente (ni salta filtros de privacidad)", () => {
  const { faltaEnEsquema, esDuplicado } = require("../netlify/functions/lib/tp.js");
  const err = (m) => new Error(m);
  // La ruta nombra siempre la tabla: eso solo no puede bastar.
  assert.equal(faltaEnEsquema(err("Supabase GET applications?job_id=eq.x -> 500: canceling statement due to statement timeout"), "applications"), false);
  assert.equal(faltaEnEsquema(err("Supabase GET applications?x -> 404: Could not find the table 'public.applications' in the schema cache"), "applications"), true);
  assert.equal(faltaEnEsquema(err('Supabase GET notifications?x -> 404: relation "public.notifications" does not exist'), "notifications"), true);
  assert.equal(faltaEnEsquema(err('Supabase GET applications?x -> 404: relation "public.notifications" does not exist'), "applications"), false);
  // Pool: un timeout con pool_visible en la ruta no puede activar la consulta
  // sin filtro (enseñaría candidatos ocultos); una columna ausente sí.
  const ruta = "Supabase GET profiles?select=id,user_id,sector,empleo,pool_visible,allow_contact&pool_visible=is.true";
  assert.equal(faltaEnEsquema(err(ruta + " -> 500: canceling statement due to statement timeout"), /empleo|pool_visible|allow_contact/i), false);
  assert.equal(faltaEnEsquema(err(ruta + " -> 400: column profiles.pool_visible does not exist"), /empleo|pool_visible|allow_contact/i), true);
  assert.equal(esDuplicado(err('Supabase POST applications -> 409: duplicate key value violates unique constraint')), true);
  assert.equal(esDuplicado(err("Supabase POST applications -> 500: error")), false);
});

test("la bandeja no entrega al candidato el identificador de la empresa", () => {
  const { metaPublica } = require("../netlify/functions/lib/handlers/inbox.js");
  const m = metaPublica({ unlock_id: "u", company_user_id: "c", candidate_ref: "r", job_id: "j", status: "entrevista" });
  assert.deepEqual(m, { job_id: "j", status: "entrevista" });
  assert.deepEqual(metaPublica(null), {});
});
