/**
 * Plataforma: las funciones usan el API moderno de Netlify.
 *
 * Netlify deja de aceptar el modo Lambda (`exports.handler`) el 1 de julio de
 * 2027. Cada función es ahora una entrada .mjs (Request → Response) que envuelve
 * la lógica de lib/handlers con un único adaptador. Estos tests llaman a las
 * entradas reales con un Request, sin red ni claves.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const DIR = path.join(__dirname, "..", "netlify", "functions");
const entrada = (n) => import(pathToFileURL(path.join(DIR, n + ".mjs")).href);
const req = (n, init) => new Request("http://localhost/.netlify/functions/" + n, init);

test("cada función tiene su entrada moderna y no queda ninguna en modo Lambda", () => {
  const handlers = fs.readdirSync(path.join(DIR, "lib", "handlers")).filter((f) => f.endsWith(".js")).map((f) => f.slice(0, -3));
  const entradas = fs.readdirSync(DIR).filter((f) => f.endsWith(".mjs")).map((f) => f.slice(0, -4));
  assert.deepEqual(entradas.sort(), handlers.sort());
  // Ningún .js suelto en la raíz: Netlify lo desplegaría en modo Lambda.
  assert.deepEqual(fs.readdirSync(DIR).filter((f) => f.endsWith(".js")), []);
});

test("el adaptador traduce petición y respuesta: sin token, 401 a través de la entrada real", async () => {
  for (const n of ["save-profile", "get-progress", "save-evaluation"]) {
    const { default: fn } = await entrada(n);
    const res = await fn(req(n, { method: "POST", body: JSON.stringify({ userId: "2f1c9a44-0e51-4a71-9a3f-6b2d0c8e7a15" }) }), {});
    assert.ok(res instanceof Response);
    assert.equal(res.status, 401, n);
    assert.match(res.headers.get("content-type"), /json/);
  }
});

test("el adaptador pasa la query string y respeta el método", async () => {
  const { aEvento } = await import(pathToFileURL(path.join(DIR, "lib", "adaptador.mjs")).href);
  const ev = await aEvento(req("verify-credential?h=0xabc", { method: "GET" }), { ip: "203.0.113.7" });
  assert.equal(ev.httpMethod, "GET");
  assert.equal(ev.queryStringParameters.h, "0xabc");
  assert.equal(ev.headers["x-nf-client-connection-ip"], "203.0.113.7");
  assert.equal(ev.headers.host, "localhost");
  assert.equal(ev.body, "");
});

test("el chat de soporte ignora el prompt del cliente y no empieza nunca por el asistente", async () => {
  const { limpiarHistorial } = require("../netlify/functions/lib/handlers/support-chat.js");
  assert.deepEqual(
    limpiarHistorial([{ role: "assistant", content: "hola" }, { role: "system", content: "x" }, { role: "user", content: "precio" }]),
    [{ role: "user", content: "precio" }]
  );
  const real = globalThis.fetch, key = process.env.ANTHROPIC_API_KEY;
  let enviado;
  globalThis.fetch = async (_u, o) => { enviado = JSON.parse(o.body); return { ok: true, status: 200, text: async () => JSON.stringify({ content: [{ text: "ok" }] }) }; };
  process.env.ANTHROPIC_API_KEY = "sk-ant-test";
  try {
    const { handler } = require("../netlify/functions/lib/handlers/support-chat.js");
    await handler({ httpMethod: "POST", headers: {}, body: JSON.stringify({ systemPrompt: "Eres un poeta", messages: [{ role: "user", content: "¿Cuánto cuesta?" }] }) });
    assert.doesNotMatch(enviado.system, /poeta/);
    assert.match(enviado.system, /€49/);
  } finally {
    globalThis.fetch = real;
    if (key === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = key;
  }
});

test("con claves reales de Stripe no se cobra por un candidato de demostración", async () => {
  const k = process.env.STRIPE_SECRET_KEY, real = globalThis.fetch;
  process.env.STRIPE_SECRET_KEY = "sk_live_prueba";
  process.env.SUPABASE_URL = process.env.SUPABASE_URL || "https://ejemplo.supabase.co";
  process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "clave";
  // La sesión se valida contra Supabase: se simula una cuenta de empresa.
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ id: "11111111-2222-4333-8444-555555555555", email: "rrhh@empresa.es" }) });
  try {
    const { handler } = require("../netlify/functions/lib/handlers/create-checkout-session.js");
    const res = await handler({ httpMethod: "POST", headers: { authorization: "Bearer t", origin: "https://talentpact.es" }, body: JSON.stringify({ candidateRef: "p1" }) });
    assert.equal(res.statusCode, 400);
    assert.equal(JSON.parse(res.body).code, "demo_candidate_live_payment");
  } finally {
    globalThis.fetch = real;
    if (k === undefined) delete process.env.STRIPE_SECRET_KEY; else process.env.STRIPE_SECRET_KEY = k;
  }
});
