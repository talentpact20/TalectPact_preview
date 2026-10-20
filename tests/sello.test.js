/**
 * Sello público del SkillPass de pago: emitir es gratis, anclar en blockchain
 * cuesta SEAL_PRICE y solo se hace con el pago confirmado. Verificar es gratis.
 * Sin red: Supabase, Stripe y la cadena se simulan.
 */
const test = require("node:test");
const assert = require("node:assert/strict");

const tp = require("../netlify/functions/lib/tp.js");
const { SEAL_PRICE } = require("../netlify/functions/lib/sello.js");

const USER = "aaaaaaaa-0000-4000-8000-0000000000a5";
const CRED = "cccccccc-0000-4000-8000-0000000000c1";

function entorno({ pagos = [], sinTabla = false } = {}) {
  const db = { seal_payments: pagos, credentials: [{ id: CRED, profile_id: "p1", cv_hash: "0x" + "ab".repeat(32), tx_hash: null, block_number: null, anchored_at: null }] };
  const ok = (data, status = 200) => ({ ok: true, status, json: async () => data, text: async () => JSON.stringify(data), headers: { get: () => "0-0/0" } });
  const fetch = async (url, opts = {}) => {
    const u = new URL(String(url)), m = opts.method || "GET";
    if (u.pathname.endsWith("/auth/v1/user")) return ok({ id: USER, email: "ana@ejemplo.es", user_metadata: { role: "candidate" } });
    const tabla = u.pathname.split("/rest/v1/")[1];
    if (sinTabla && tabla === "seal_payments") return { ok: false, status: 404, text: async () => JSON.stringify({ message: "Could not find the table 'public.seal_payments' in the schema cache" }) };
    if (tabla === "profiles") return ok([{ id: "p1", user_id: USER }]);
    const q = new URLSearchParams(u.search);
    const lista = db[tabla] || [];
    const coincide = (r) => [...q.entries()].every(([k, v]) => ["select", "limit", "order"].includes(k) || (v.startsWith("eq.") ? String(r[k]) === decodeURIComponent(v.slice(3)) : v.startsWith("neq.") ? String(r[k]) !== v.slice(4) : true));
    if (m === "HEAD") return ok(null);
    if (m === "GET") return ok(lista.filter(coincide));
    if (m === "POST") { const f = JSON.parse(opts.body); lista.push(f); db[tabla] = lista; return ok([f], 201); }
    if (m === "PATCH") { const p = JSON.parse(opts.body); return ok(lista.filter(coincide).map((r) => Object.assign(r, p))); }
    return ok([]);
  };
  return { db, fetch };
}

async function con(opciones, fn) {
  const real = globalThis.fetch;
  const env = { ...process.env };
  Object.assign(process.env, { SUPABASE_URL: "https://ejemplo.supabase.co", SUPABASE_SERVICE_KEY: "k", STRIPE_SECRET_KEY: "sk_test_x",
    SKILLPASS_CONTRACT_ADDRESS: "0x" + "11".repeat(20), ISSUER_PRIVATE_KEY: "0x" + "22".repeat(32), ANCHOR_WAIT_MS: "50" });
  const e = entorno(opciones);
  globalThis.fetch = e.fetch;
  try { await fn(e.db); } finally { globalThis.fetch = real; process.env = env; }
}

// Stripe falso: guarda lo que se le pide.
let pedido = null, sesionPagada = null;
class StripeFalso {
  constructor() {
    this.checkout = { sessions: {
      create: async (p) => { pedido = p; return { id: "cs_test_sello1", url: "https://checkout.stripe.com/c/x", livemode: false }; },
      retrieve: async (id) => Object.assign({ id }, sesionPagada)
    } };
  }
}

test("pagar el sello: el importe lo pone el servidor y el pago queda pendiente hasta Stripe", async () => {
  tp.usarStripe(StripeFalso);
  const { handler } = require("../netlify/functions/lib/handlers/pay-seal.js");
  const llamar = (b) => handler({ httpMethod: "POST", headers: { authorization: "Bearer t", origin: "https://talentpact.es" }, body: JSON.stringify(b) });
  await con({}, async (db) => {
    const r = await llamar({ accion: "pagar", credentialId: CRED, returnUrl: "https://talentpact.es/", amount: 1 });
    assert.equal(r.statusCode, 200, r.body);
    assert.equal(JSON.parse(r.body).url, "https://checkout.stripe.com/c/x");
    assert.equal(pedido.line_items[0].price_data.unit_amount, SEAL_PRICE.amountCents);   // 4,99 € aunque el navegador mande otra cosa
    assert.deepEqual(pedido.metadata, { producto: "sello", user_id: USER, credential_id: CRED });
    assert.match(pedido.success_url, /sello=ok&session_id=/);
    assert.equal(db.seal_payments[0].status, "pending");

    // Confirmar solo vale para un pago de sello de esta persona.
    sesionPagada = { payment_status: "paid", metadata: { producto: "sello", user_id: "otra-persona", credential_id: CRED } };
    assert.equal((await llamar({ accion: "confirmar", sessionId: "cs_test_sello1" })).statusCode, 403);
    sesionPagada = { payment_status: "paid", metadata: { producto: "sello", user_id: USER, credential_id: CRED } };
    const c = await llamar({ accion: "confirmar", sessionId: "cs_test_sello1" });
    assert.equal(JSON.parse(c.body).pagado, true);
    assert.equal(db.seal_payments[0].status, "paid");
  });
  await con({ sinTabla: true }, async () => {
    const r = await llamar({ accion: "pagar", credentialId: CRED, returnUrl: "https://talentpact.es/" });
    assert.equal(r.statusCode, 503);
  });
});

test("sellar exige el sello pagado; pagado, entra en la cola del lote sin enviar ninguna transacción", async () => {
  let anclados = 0;
  class Contrato {
    async isAnchored() { return [false, 0n]; }
    async anchor() { anclados++; return { hash: "0x" + "cd".repeat(32), wait: async () => ({ blockNumber: 7 }) }; }
  }
  tp.usarEthers({ ethers: { JsonRpcProvider: class {}, Wallet: class {}, Contract: Contrato } });
  const { handler } = require("../netlify/functions/lib/handlers/anchor-credential.js");
  const anclar = () => handler({ httpMethod: "POST", headers: { authorization: "Bearer t" }, body: JSON.stringify({ credentialId: CRED }) });
  try {
    await con({}, async () => {
      const r = await anclar();
      assert.equal(r.statusCode, 402);
      assert.equal(JSON.parse(r.body).code, "sello_no_pagado");
    });
    await con({ pagos: [{ user_id: USER, credential_id: CRED, status: "paid" }] }, async (db) => {
      const r = await anclar();
      assert.equal(r.statusCode, 200, r.body);
      assert.equal(JSON.parse(r.body).sello.estado, "en_cola");
      assert.ok(db.credentials[0].seal_paid_at, "la credencial pagada entra en la cola");
      // El sello va por lotes: aquí no se gasta gas ni hay tope diario.
      assert.equal(anclados, 0);
      assert.equal(db.credentials[0].tx_hash, null);
    });
  } finally {
    tp.usarEthers(null);
  }
});
