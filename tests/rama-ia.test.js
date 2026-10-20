/**
 * Rama IA (docs/plan_post_reunion/02_rama_ia.md): 10 retos técnicos de la ola 1
 * con rúbrica técnica y errores que penalizan, y «IA en el trabajo» (05.6).
 */
const test = require("node:test");
const assert = require("node:assert/strict");

const catalogo = require("../netlify/functions/lib/catalogo-retos.json");
const { puntuar, rubricaDe, erroresQuePenalizan, buildRubric } = require("../netlify/functions/lib/evaluator.js");
const { contenidoDelIntento } = require("../netlify/functions/lib/intentos.js");
const { familiaDe } = require("../netlify/functions/lib/personas.js");
const T = require("../netlify/functions/lib/taxonomia.json");

const ia = catalogo.filter((r) => r.category === "ia");

test("la rama IA tiene los 10 retos técnicos de la ola 1 e «IA en el trabajo», cada uno con tres ejercicios", () => {
  const competencias = ia.map((r) => T.ia.skills[r.skill] && T.ia.skills[r.skill].competencia).sort();
  assert.deepEqual(competencias, ["01.01", "01.03", "02.01", "02.03", "03.02", "03.03", "03.04", "04.01", "05.02", "05.6", "06.01"]);
  for (const r of ia) {
    assert.equal(r.exercises.length, 3, r.id);
    assert.ok(r.exercises.some((e) => e.type === "decision"), `${r.id} sin ejercicio que se corrija sin IA`);
  }
  // Los técnicos que corrige la IA usan la rúbrica técnica y traen errores que penalizan.
  for (const r of ia.filter((x) => T.ia.skills[x.skill].grupo === "ia_tecnica")) {
    for (const e of r.exercises.filter((x) => x.type !== "decision")) {
      assert.equal(e.rubrica, "tecnico_ia", `${r.id}.${e.id}`);
      assert.ok(erroresQuePenalizan(e).length >= 1, `${r.id}.${e.id} sin errores que penalizan`);
    }
  }
});

test("rúbrica técnica: corrección 35 · justificación 25 · riesgos 20 · comunicación 20", () => {
  const r = rubricaDe({ type: "email", rubrica: "tecnico_ia" });
  assert.deepEqual(r.map((c) => [c.id, c.peso]), [["correccion", 35], ["justificacion", 25], ["riesgos", 20], ["comunicacion", 20]]);
  // El navegador no puede elegir rúbrica: sin «rubrica» del catálogo, manda el tipo.
  assert.equal(rubricaDe({ type: "email" })[0].id, "contenido");
});

test("un error que penaliza limita su criterio aunque el resto esté bien", () => {
  const ex = ia.find((r) => r.id === "ia_rag").exercises[0];
  const respuesta = "Indexo por trozos con metadatos y filtro los permisos después de generar la respuesta.";
  const criterio = (id) => ({ id, nota: 90, evidencia: ["filtro los permisos después de generar la respuesta"], cumple: [], falta: [] });
  const base = { criterios: ["correccion", "justificacion", "riesgos", "comunicacion"].map(criterio), banderas: { aborda_escenario: true } };
  const sin = puntuar(ex, base, respuesta);
  const con = puntuar(ex, Object.assign({}, base, { errores: ["permisos_despues"] }), respuesta);
  assert.equal(sin.criteria.find((c) => c.id === "riesgos").score, 90);
  assert.equal(con.criteria.find((c) => c.id === "riesgos").score, 40);
  assert.match(con.criteria.find((c) => c.id === "riesgos").comment, /Limitado a 40/);
  assert.ok(con.score < sin.score);
  assert.deepEqual(con.erroresCometidos, ["permisos_despues"]);
  // Un id inventado por el modelo no penaliza nada.
  assert.equal(puntuar(ex, Object.assign({}, base, { errores: ["no_existe"] }), respuesta).score, sin.score);
  assert.match(buildRubric(Object.assign({}, ex)), /Errores que penalizan/);
});

test("el candidato no recibe ni los errores que penalizan ni los conceptos del corrector", () => {
  for (const r of ia) {
    const texto = JSON.stringify(contenidoDelIntento(r.id));
    assert.ok(!/"penaliza"|"kw"|"correct"/.test(texto), r.id);
  }
});

test("los técnicos son hard skills; «IA en el trabajo» es soft (competencia 05.6)", () => {
  assert.equal(familiaDe("RAG"), "hard");
  assert.equal(familiaDe("Seguridad de IA"), "hard");
  assert.equal(familiaDe("IA en el trabajo"), "soft");
});
