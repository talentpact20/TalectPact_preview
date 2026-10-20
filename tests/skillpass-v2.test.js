/**
 * SkillPass v2 (docs/plan_post_reunion/03_blockchain_de_pago.md): credencial
 * W3C firmada con Ed25519, revocación, caducidad, verificación en cinco estados
 * y sello por lotes con árbol de Merkle. Sin red: Supabase y la cadena se simulan.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const { privateKey } = crypto.generateKeyPairSync("ed25519");
process.env.VC_SIGNING_KEY = privateKey.export({ format: "pem", type: "pkcs8" });
process.env.VC_SUBJECT_SECRET = "secreto-de-prueba";

const tp = require("../netlify/functions/lib/tp.js");
const vc = require("../netlify/functions/lib/vc.js");
const merkle = require("../netlify/functions/lib/merkle.js");
const statuslist = require("../netlify/functions/lib/statuslist.js");

const PERFIL = "2f1c9a44-0e51-4a71-9a3f-6b2d0c8e7a15";
const USER = "aaaaaaaa-0000-4000-8000-0000000000a5";
const SKILLS = [
  { skill: "Negociación", score: 72, evaluatedAt: "2026-10-10T10:00:00Z", verified: true, rubricVersion: "2.1.0" },
  { skill: "Contabilidad", score: 85, evaluatedAt: "2026-10-12T09:00:00Z", verified: false }
];

function credencial(id = crypto.randomUUID(), ahora = new Date(), statusIndex = 42) {
  return vc.firmar(vc.construirVC({ id, profileId: PERFIL, skills: SKILLS, ahora, statusIndex }), ahora);
}

/** Supabase en memoria con los filtros que usan estas funciones. */
function simularSupabase(db) {
  const real = globalThis.fetch;
  Object.assign(process.env, { SUPABASE_URL: "https://ejemplo.supabase.co", SUPABASE_SERVICE_KEY: "k" });
  const ok = (data, status = 200) => ({ ok: true, status, json: async () => data, text: async () => JSON.stringify(data), headers: { get: () => "0-0/0" } });
  const cumple = (r, k, v) => {
    if (v === "is.null") return r[k] == null;
    if (v === "not.is.null") return r[k] != null;
    if (v.startsWith("eq.")) return String(r[k]) === decodeURIComponent(v.slice(3));
    if (v.startsWith("neq.")) return String(r[k]) !== decodeURIComponent(v.slice(4));
    if (v.startsWith("gte.")) return String(r[k]) >= decodeURIComponent(v.slice(4));
    return true;
  };
  globalThis.fetch = async (url, opts = {}) => {
    const u = new URL(String(url)), m = opts.method || "GET";
    if (u.pathname.endsWith("/auth/v1/user")) return ok({ id: USER, email: "ana@ejemplo.es", user_metadata: {}, app_metadata: {} });
    const tabla = u.pathname.split("/rest/v1/")[1];
    const lista = db[tabla] || (db[tabla] = []);
    const q = [...new URLSearchParams(u.search).entries()].filter(([k]) => !["select", "limit", "order"].includes(k));
    const filtra = (r) => q.every(([k, v]) => cumple(r, k, v));
    if (m === "GET") return ok(lista.filter(filtra));
    if (m === "POST") { const f = Object.assign({ id: crypto.randomUUID(), created_at: new Date().toISOString() }, JSON.parse(opts.body)); lista.push(f); return ok([f], 201); }
    if (m === "PATCH") { const p = JSON.parse(opts.body); return ok(lista.filter(filtra).map((r) => Object.assign(r, p))); }
    return ok([]);
  };
  return () => { globalThis.fetch = real; };
}

const llamarVerificar = (handler, b) => handler({ httpMethod: "POST", headers: {}, body: JSON.stringify(b) }).then((r) => JSON.parse(r.body));

test("el SkillPass es una VC 2.0 firmada: con bandas, seudónimo, caducidad a 12 meses y sin datos personales", () => {
  const ahora = new Date("2026-10-20T10:00:00Z");
  const c = credencial(undefined, ahora);
  assert.deepEqual(c["@context"], ["https://www.w3.org/ns/credentials/v2"]);
  assert.deepEqual(c.type, ["VerifiableCredential", "TalentPactSkillPass"]);
  assert.equal(c.issuer, "did:web:talentpact.es");
  assert.equal(c.validUntil, "2027-10-20T10:00:00Z");
  assert.equal(c.proof.cryptosuite, "eddsa-jcs-2022");
  assert.equal(c.credentialStatus.type, "BitstringStatusListEntry");
  const [neg, cont] = c.credentialSubject.skills;
  assert.equal(neg.banda, "Bueno");
  assert.equal(neg.bloque, "soft");
  assert.equal(cont.banda, "Muy bueno");
  assert.equal(cont.bloque, "hard");
  // Ni el id del perfil ni la nota exacta salen en la credencial.
  const texto = JSON.stringify(c);
  assert.ok(!texto.includes(PERFIL));
  assert.ok(!/"score"|:72|:85/.test(texto));
  assert.match(c.credentialSubject.id, /^urn:tp:cand:[0-9a-f]{24}$/);
});

test("la firma se comprueba con la clave publicada en did.json y detecta cualquier cambio", () => {
  const c = credencial();
  assert.equal(vc.verificarFirma(c).ok, true);
  const publica = vc.publicaDeMultibase(vc.documentoDid().verificationMethod[0].publicKeyMultibase);
  assert.equal(vc.verificarFirma(c, publica).ok, true, "un tercero la verifica solo con did.json");
  const subida = JSON.parse(JSON.stringify(c));
  subida.credentialSubject.skills[0].banda = "Muy bueno";
  assert.deepEqual(vc.verificarFirma(subida), { firmada: true, ok: false, motivo: "firma_no_coincide" });
  const otra = JSON.parse(JSON.stringify(c));
  otra.validUntil = "2099-01-01T00:00:00Z";
  assert.equal(vc.verificarFirma(otra).ok, false);
});

test("árbol de Merkle: cada credencial prueba su inclusión y nada más", () => {
  for (const n of [1, 2, 3, 5, 8]) {
    const hojas = Array.from({ length: n }, (_, i) => merkle.hoja("0x" + crypto.randomBytes(32).toString("hex"), { i }));
    const { raiz, pruebas } = merkle.construir(hojas);
    hojas.forEach((h, i) => assert.ok(merkle.verificar(h, pruebas[i], raiz), `hoja ${i} de ${n}`));
    if (n > 1) assert.equal(merkle.verificar(hojas[0], pruebas[1], raiz), false);
  }
  // Dos hojas: la raíz es keccak256(menor ‖ mayor), lo mismo que verifyLeaf() del contrato.
  const { ethers } = require("ethers");
  const a = "0x" + "11".repeat(32), b = "0x" + "ff".repeat(32);
  assert.equal(merkle.construir([b, a]).raiz, ethers.keccak256(ethers.concat([a, b])));
  // Sin la sal no se puede rehacer la hoja: borrarla desvincula lo publicado.
  const sal = "0x" + "ab".repeat(32);
  assert.notEqual(merkle.hoja(sal, { x: 1 }), merkle.hoja("0x" + "ac".repeat(32), { x: 1 }));
});

test("la lista de revocación marca solo los índices revocados y va firmada", () => {
  const lista = statuslist.credencialDeLista([7, 42]);
  assert.equal(lista.credentialSubject.type, "BitstringStatusList");
  const enc = lista.credentialSubject.encodedList;
  assert.ok(statuslist.bitActivo(enc, 42) && statuslist.bitActivo(enc, 7));
  assert.equal(statuslist.bitActivo(enc, 43), false);
  assert.equal(vc.verificarFirma(lista).ok, true);
});

test("verificar: válida, revocada, caducada, alterada y no encontrada, sin exponer el perfil", async () => {
  const { handler } = require("../netlify/functions/lib/handlers/verify-credential.js");
  const ID = crypto.randomUUID(), VIEJA = crypto.randomUUID(), REV = crypto.randomUUID();
  const doc = credencial(ID);
  const vieja = credencial(VIEJA, new Date("2024-01-01T00:00:00Z"));
  const db = {
    credentials: [
      { id: ID, profile_id: PERFIL, cv_json: doc, cv_hash: tp.hashCv(doc), valid_until: doc.validUntil },
      { id: VIEJA, profile_id: PERFIL, cv_json: vieja, cv_hash: tp.hashCv(vieja), valid_until: vieja.validUntil },
      { id: REV, profile_id: PERFIL, cv_json: credencial(REV), cv_hash: "0x" + "12".repeat(32), revoked_at: "2026-10-19T00:00:00Z" }
    ]
  };
  const restaurar = simularSupabase(db);
  try {
    const v = await llamarVerificar(handler, { credentialId: ID });
    assert.equal(v.estado, "valida");
    assert.equal(v.skills[0].banda, "Bueno");
    assert.equal(v.sello.estado, "no");
    assert.ok(!JSON.stringify(v).includes(PERFIL), "la verificación no puede devolver el id del perfil");
    assert.equal((await llamarVerificar(handler, { credentialId: REV })).estado, "revocada");
    assert.equal((await llamarVerificar(handler, { credentialId: VIEJA })).estado, "caducada");
    assert.equal((await llamarVerificar(handler, { vc: JSON.stringify(doc) })).estado, "valida");
    const tocada = JSON.parse(JSON.stringify(doc));
    tocada.credentialSubject.skills[0].banda = "Muy bueno";
    assert.equal((await llamarVerificar(handler, { vc: tocada })).estado, "alterada");
    assert.equal((await llamarVerificar(handler, { credentialId: crypto.randomUUID() })).estado, "no_encontrada");
    // Si alguien edita la fila en la base de datos, la firma lo delata.
    db.credentials[0].cv_json = tocada;
    assert.equal((await llamarVerificar(handler, { credentialId: ID })).estado, "alterada");
  } finally { restaurar(); }
});

test("lote diario: una sola transacción con la raíz, y cada credencial guarda una prueba que lleva a ella", async () => {
  const { ejecutarLote } = require("../netlify/functions/lib/handlers/anchor-batch.js");
  const enviados = [];
  class Contrato {
    constructor() { this.runner = { provider: { getTransactionReceipt: async () => null } }; }
    async anchorRoot(raiz, n) { enviados.push([raiz, n]); return { hash: "0x" + "cd".repeat(32), wait: async () => ({ blockNumber: 9, status: 1 }) }; }
  }
  tp.usarEthers({ ethers: Object.assign({}, require("ethers").ethers, { JsonRpcProvider: class {}, Wallet: class {}, Contract: Contrato }) });
  const env = { ...process.env };
  Object.assign(process.env, { SKILLPASS_V2_CONTRACT_ADDRESS: "0x" + "11".repeat(20), ISSUER_PRIVATE_KEY: "0x" + "22".repeat(32), ANCHOR_WAIT_MS: "50" });
  const fila = (pagado) => {
    const id = crypto.randomUUID(), d = credencial(id);
    return { id, profile_id: PERFIL, cv_json: d, cv_hash: tp.hashCv(d), salt: "0x" + crypto.randomBytes(32).toString("hex"), seal_paid_at: pagado, batch_id: null, revoked_at: null };
  };
  const db = { credentials: [fila("2026-10-20T08:00:00Z"), fila("2026-10-20T09:00:00Z"), fila(null), fila("2026-10-20T10:00:00Z")], anchor_batches: [] };
  db.credentials[3].revoked_at = "2026-10-20T11:00:00Z";
  const restaurar = simularSupabase(db);
  try {
    const r = await ejecutarLote();
    assert.equal(r.ok, true, JSON.stringify(r));
    assert.equal(r.sellados, 2, "solo las pagadas y sin revocar");
    assert.equal(enviados.length, 1, "una transacción por lote, no por credencial");
    const [raiz, n] = enviados[0];
    assert.equal(n, 2);
    assert.equal(db.anchor_batches[0].status, "confirmado");
    for (const c of db.credentials.slice(0, 2)) {
      assert.equal(c.batch_id, db.anchor_batches[0].id);
      assert.equal(c.merkle_leaf, merkle.hoja(c.salt, c.cv_json));
      assert.ok(merkle.verificar(c.merkle_leaf, c.merkle_proof, raiz));
    }
    assert.equal(db.credentials[2].batch_id, null);
    assert.equal(db.credentials[3].batch_id, null);

    // Y quien verifica ve el sello con todo lo necesario para comprobarlo sin TalentPact.
    const { handler } = require("../netlify/functions/lib/handlers/verify-credential.js");
    delete process.env.SKILLPASS_V2_CONTRACT_ADDRESS;
    const v = await llamarVerificar(handler, { credentialId: db.credentials[0].id });
    assert.equal(v.estado, "valida");
    assert.equal(v.sello.estado, "sellado");
    assert.equal(v.sello.comprobar.raiz, raiz);
    assert.equal(v.sello.comprobar.funcion, "verifyLeaf(bytes32,bytes32[],bytes32)");
  } finally {
    restaurar();
    process.env = env;
    tp.usarEthers(null);
  }
});

test("solo el titular revoca su SkillPass (o un admin con motivo)", async () => {
  const { handler } = require("../netlify/functions/lib/handlers/revoke-credential.js");
  const MIA = crypto.randomUUID(), AJENA = crypto.randomUUID();
  const db = {
    profiles: [{ id: PERFIL, user_id: USER }],
    credentials: [{ id: MIA, profile_id: PERFIL, revoked_at: null }, { id: AJENA, profile_id: "otro", revoked_at: null }]
  };
  const restaurar = simularSupabase(db);
  const revocar = (id) => handler({ httpMethod: "POST", headers: { authorization: "Bearer t" }, body: JSON.stringify({ credentialId: id }) });
  try {
    assert.equal((await revocar(AJENA)).statusCode, 404);
    assert.equal(db.credentials[1].revoked_at, null);
    assert.equal((await revocar(MIA)).statusCode, 200);
    assert.ok(db.credentials[0].revoked_at);
    assert.equal(db.credentials[0].revocation_reason, "titular");
  } finally { restaurar(); }
});

test("el contrato v2 compila sin avisos y su ABI es el que usa el servidor", () => {
  const solc = require("solc");
  const { ethers } = require("ethers");
  const fuente = fs.readFileSync(path.join(__dirname, "..", "tfm", "tech", "contracts", "SkillPassRegistryV2.sol"), "utf8");
  const salida = JSON.parse(solc.compile(JSON.stringify({
    language: "Solidity",
    sources: { "V2.sol": { content: fuente } },
    settings: { optimizer: { enabled: true, runs: 200 }, outputSelection: { "*": { "*": ["abi"] } } }
  })));
  assert.deepEqual((salida.errors || []).map((e) => e.formattedMessage), []);
  const real = new ethers.Interface(salida.contracts["V2.sol"].SkillPassRegistryV2.abi);
  const usado = new ethers.Interface(tp.SKILLPASS_V2_ABI);
  for (const f of usado.fragments) {
    assert.equal(real.getFunction(f.name).selector, usado.getFunction(f.name).selector, f.name);
  }
  const cuerpo = fuente.slice(fuente.indexOf("function anchorRoot("), fuente.indexOf("function verifyLeaf("));
  assert.match(cuerpo, /onlyIssuer/);
  assert.match(cuerpo, /rootAnchoredAt\[root\] == 0/);
  assert.ok(!/selfdestruct|delete\s+root/.test(fuente));
});
