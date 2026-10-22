/**
 * Ingeniería (ola 1): 6 especialidades bajo Hard → Tecnología, 1 reto × 3
 * ejercicios cada una, rúbrica técnica y errores que penalizan.
 */
const test = require("node:test");
const assert = require("node:assert/strict");

const catalogo = require("../netlify/functions/lib/catalogo-retos.json");
const { rubricaDe, erroresQuePenalizan } = require("../netlify/functions/lib/evaluator.js");
const { contenidoDelIntento } = require("../netlify/functions/lib/intentos.js");
const { familiaDe } = require("../netlify/functions/lib/personas.js");
const T = require("../netlify/functions/lib/taxonomia.json");

const ing = catalogo.filter((r) => r.category === "ingenieria");

test("Ingeniería tiene 6 especialidades bajo Tecnología, cada una con tres ejercicios", () => {
  assert.equal(ing.length, 6);
  assert.deepEqual(ing.map((r) => r.id).sort(), [
    "ing_civil", "ing_electrica", "ing_industrial", "ing_mecanica", "ing_sistemas", "ing_software"
  ]);
  assert.equal(T.ingenieria.grupos.length, 6);
  const tec = T.areas.find((a) => a.id === "tecnologia");
  for (const r of ing) {
    assert.equal(r.exercises.length, 3, r.id);
    assert.ok(T.ingenieria.skills[r.skill], r.skill);
    assert.equal(T.areaDeSkill[r.skill], "tecnologia");
    assert.ok(T.areaConcretaDeSkill[r.skill], r.skill);
    assert.ok(tec.especialidades.includes(T.areaConcretaDeSkill[r.skill]), r.skill);
    assert.ok(r.exercises.some((e) => e.type === "decision"), `${r.id} sin clasificación`);
  }
});

test("los ejercicios técnicos de ingeniería usan la rúbrica tecnico y traen errores que penalizan", () => {
  for (const r of ing) {
    for (const e of r.exercises.filter((x) => x.type !== "decision")) {
      assert.equal(e.rubrica, "tecnico", `${r.id}.${e.id}`);
      assert.ok(erroresQuePenalizan(e).length >= 1, `${r.id}.${e.id}`);
    }
  }
  const r = rubricaDe({ type: "email", rubrica: "tecnico" });
  assert.deepEqual(r.map((c) => [c.id, c.peso]), [["correccion", 35], ["justificacion", 25], ["riesgos", 20], ["comunicacion", 20]]);
});

test("el candidato no recibe penaliza ni kw de los retos de ingeniería", () => {
  for (const r of ing) {
    const texto = JSON.stringify(contenidoDelIntento(r.id));
    assert.ok(!/"penaliza"|"kw"|"correct"/.test(texto), r.id);
  }
});

test("las skills de ingeniería cuentan como hard skills (no como bloque aparte ni soft)", () => {
  assert.equal(familiaDe("Ingeniería de software"), "hard");
  assert.equal(familiaDe("Ingeniería civil y de caminos"), "hard");
  assert.equal(familiaDe("Ingeniería eléctrica"), "hard");
  assert.equal(Object.keys(T.competenciasDeSkill || {}).some((s) => /^Ingeniería /.test(s)), false);
});
