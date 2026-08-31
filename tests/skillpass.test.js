/**
 * SkillPass — la propiedad que se defiende ante el tribunal:
 * "si cambia una coma del CV, el sello deja de cuadrar".
 *
 * Estos tests son la prueba de esa afirmación. No hablan con la blockchain
 * (verificar no exige red: el hash se recompone en local), así que corren
 * siempre, sin claves y sin gas.
 */
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  canonicalJson, hashCv, isHash32, isUuid, anonymousAlias,
  UNLOCK_PRICE, formatAmount, tokenFromEvent, CHAIN
} = require("../netlify/functions/lib/tp");

const CV = {
  type: "TalentPactSkillPass",
  version: "1.0",
  subject: "did:talentpact:candidate:2f1c9a44-0e51-4a71-9a3f-6b2d0c8e7a15",
  issuer: "did:talentpact:issuer",
  issuedAt: "2026-08-20T10:00:00.000Z",
  skills: [
    { skill: "Comunicación", score: 85, challengeId: "C-01", evaluatedAt: "2026-08-19T09:00:00.000Z" },
    { skill: "Análisis de datos", score: 74, challengeId: "C-07", evaluatedAt: "2026-08-19T09:20:00.000Z" }
  ],
  evaluator: { engine: "TalentPact AI Evaluator", method: "Dynamic Prompting + Chain of Thought" }
};

test("canonicalJson es independiente del orden de las claves", () => {
  const a = { b: 1, a: { d: 4, c: 3 } };
  const b = { a: { c: 3, d: 4 }, b: 1 };
  assert.equal(canonicalJson(a), canonicalJson(b));
});

test("canonicalJson conserva el orden de los arrays (no es un set)", () => {
  // El orden de skills forma parte del documento: reordenarlo es otro CV.
  assert.notEqual(canonicalJson({ s: [1, 2] }), canonicalJson({ s: [2, 1] }));
});

test("hashCv es determinista y con formato bytes32", () => {
  const h1 = hashCv(CV);
  const h2 = hashCv(JSON.parse(JSON.stringify(CV)));
  assert.equal(h1, h2);
  assert.ok(isHash32(h1), `${h1} no tiene forma de bytes32`);
});

test("hashCv no depende del orden en que se serializó el objeto", () => {
  const reordenado = {
    evaluator: CV.evaluator, skills: CV.skills, issuedAt: CV.issuedAt,
    issuer: CV.issuer, subject: CV.subject, version: CV.version, type: CV.type
  };
  assert.equal(hashCv(CV), hashCv(reordenado));
});

test("alterar un solo punto de una nota rompe el sello", () => {
  const manipulado = JSON.parse(JSON.stringify(CV));
  manipulado.skills[0].score = 86; // 85 -> 86
  assert.notEqual(hashCv(CV), hashCv(manipulado));
});

test("añadir una skill que nunca se evaluó rompe el sello", () => {
  const inflado = JSON.parse(JSON.stringify(CV));
  inflado.skills.push({ skill: "Liderazgo", score: 99, challengeId: "C-99", evaluatedAt: "2026-08-19T10:00:00.000Z" });
  assert.notEqual(hashCv(CV), hashCv(inflado));
});

test("cambiar el sujeto rompe el sello (un CV no se puede reasignar a otra persona)", () => {
  const robado = JSON.parse(JSON.stringify(CV));
  robado.subject = "did:talentpact:candidate:00000000-0000-4000-8000-000000000000";
  assert.notEqual(hashCv(CV), hashCv(robado));
});

test("isHash32 rechaza lo que reventaría dentro de ethers", () => {
  assert.ok(isHash32("0x" + "a".repeat(64)));
  assert.ok(isHash32("  0x" + "F".repeat(64) + "  "));
  for (const malo of ["", "0x", "0x123", "a".repeat(64), "0x" + "z".repeat(64), "0x" + "a".repeat(63), null, 42, {}]) {
    assert.equal(isHash32(malo), false, `isHash32(${JSON.stringify(malo)}) debería ser false`);
  }
});

test("isUuid filtra lo que podría inyectarse en un filtro de PostgREST", () => {
  assert.ok(isUuid("2f1c9a44-0e51-4a71-9a3f-6b2d0c8e7a15"));
  for (const malo of ["1 or 1=1", "*", "2f1c9a44", "2f1c9a44-0e51-4a71-9a3f-6b2d0c8e7a15x", null]) {
    assert.equal(isUuid(malo), false, `isUuid(${JSON.stringify(malo)}) debería ser false`);
  }
});

test("el alias público no filtra datos personales", () => {
  const alias = anonymousAlias("2f1c9a44-0e51-4a71-9a3f-6b2d0c8e7a15");
  assert.match(alias, /^Candidato #[0-9A-F]{4}$/);
  // La premisa del producto es el anonimato: el alias no puede contener el id
  // completo (sería reidentificable contra la tabla de perfiles).
  assert.ok(!alias.includes("2f1c9a44-0e51"));
});

test("el precio del desbloqueo lo fija el servidor, no el navegador", () => {
  assert.equal(UNLOCK_PRICE.amountCents, 4900);
  assert.equal(UNLOCK_PRICE.currency, "eur");
  assert.equal(formatAmount(4900, "eur").replace(/ /g, " "), "49,00 €");
});

test("el token se lee de la cabecera Authorization y no de un campo suplantable", () => {
  assert.equal(tokenFromEvent({ headers: { authorization: "Bearer abc.def" } }, {}), "abc.def");
  assert.equal(tokenFromEvent({ headers: { Authorization: "bearer   xyz" } }, {}), "xyz");
  assert.equal(tokenFromEvent({ headers: {} }, {}), null);
  // Compatibilidad con las llamadas antiguas, pero la cabecera manda.
  assert.equal(tokenFromEvent({ headers: { authorization: "Bearer real" } }, { accessToken: "falso" }), "real");
});

test("la red declarada en las funciones es la misma que la de los scripts", () => {
  const { CHAIN: CHAIN_SCRIPTS } = require("../tfm/tech/scripts/lib-env.js");
  assert.equal(CHAIN.chainId, CHAIN_SCRIPTS.chainId);
  assert.equal(CHAIN.slug, CHAIN_SCRIPTS.slug);
  assert.equal(CHAIN.explorer, CHAIN_SCRIPTS.explorer);
});
