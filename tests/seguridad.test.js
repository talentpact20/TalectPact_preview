/**
 * Seguridad de la plataforma: lo que se puede comprobar sin red.
 *  · Toda tabla de Supabase tiene RLS activado (sin políticas: solo el servidor,
 *    con su clave de servicio, la lee) y el comprobador check-rls la revisa.
 *  · Las funciones no aceptan llamadas de otras webs, salvo las públicas.
 *  · Las respuestas no se guardan en caché.
 *  · Los límites de frecuencia frenan antes de gastar IA.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const RAIZ = path.join(__dirname, "..");
const SQL = path.join(RAIZ, "tfm", "tech");

test("toda tabla creada en los SQL tiene RLS activado y la revisa check-rls", () => {
  const tablas = new Set(), conRls = new Set();
  for (const f of fs.readdirSync(SQL).filter((x) => x.endsWith(".sql"))) {
    const s = fs.readFileSync(path.join(SQL, f), "utf8");
    for (const m of s.matchAll(/create table if not exists ([a-z_]+)/g)) tablas.add(m[1]);
    for (const m of s.matchAll(/alter table ([a-z_]+)\s+enable row level security/g)) conRls.add(m[1]);
  }
  const sinRls = [...tablas].filter((t) => !conRls.has(t));
  assert.deepEqual(sinRls, [], "tablas sin RLS");
  const script = fs.readFileSync(path.join(RAIZ, "tfm", "tech", "scripts", "check-rls.js"), "utf8");
  const faltan = [...tablas].filter((t) => !script.includes(`"${t}"`));
  assert.deepEqual(faltan, [], "check-rls no revisa estas tablas");
});

test("las funciones solo aceptan su propio dominio, salvo las públicas por diseño", async () => {
  const { jsonResponse } = require("../netlify/functions/lib/tp.js");
  const r = jsonResponse(200, { ok: true });
  assert.equal(r.headers["access-control-allow-origin"], "https://talentpact.es");
  assert.equal(r.headers["cache-control"], "no-store");
  assert.equal(r.headers["x-content-type-options"], "nosniff");
  const did = require("../netlify/functions/lib/handlers/did-web.js");
  const sl = require("../netlify/functions/lib/handlers/status-list.js");
  // Verificar es público: cualquiera puede consultarlo desde su web.
  const env = { ...process.env };
  process.env.VC_SIGNING_KEY = require("node:crypto").generateKeyPairSync("ed25519").privateKey.export({ format: "pem", type: "pkcs8" });
  try {
    assert.equal((await did.handler({ httpMethod: "GET" })).headers["access-control-allow-origin"], "*");
  } finally { process.env = env; }
  assert.ok(sl.handler);
});

test("el corrector frena por IP a quien no tiene sesión antes de llamar a la IA", async () => {
  const { handler } = require("../netlify/functions/lib/handlers/evaluate-exercise.js");
  const env = { ...process.env };
  process.env.ANTHROPIC_API_KEY = "sk-prueba";
  const llamadas = [];
  const real = globalThis.fetch;
  globalThis.fetch = async (url) => { llamadas.push(String(url)); return { ok: false, status: 500, text: async () => "{}", json: async () => ({}) }; };
  const evento = { httpMethod: "POST", headers: { "x-nf-client-connection-ip": "198.51.100.77" },
    body: JSON.stringify({ exercise: { id: "x", title: "t", scenario: "s", type: "email" }, response: "una respuesta" }) };
  try {
    let ultimo;
    for (let i = 0; i < 13; i++) ultimo = await handler(evento);
    assert.equal(ultimo.statusCode, 429);
    const alModelo = llamadas.filter((u) => u.includes("anthropic")).length;
    assert.ok(alModelo <= 12, `llamó a la IA ${alModelo} veces`);
  } finally { globalThis.fetch = real; process.env = env; }
});

test("el catálogo con soluciones, las herramientas y los tests no se sirven como web", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const toml = fs.readFileSync(path.join(__dirname, "..", "netlify.toml"), "utf8");
  for (const ruta of ["/netlify/*", "/tools/*", "/tests/*", "/tfm/tech/*", "/Talentpact/*"]) {
    const bloque = toml.split("[[redirects]]").find((b) => b.includes(`from = "${ruta}"`));
    assert.ok(bloque && /status = 404/.test(bloque) && /force = true/.test(bloque), `${ruta} no está bloqueado en netlify.toml`);
  }
  const demo = fs.readFileSync(path.join(__dirname, "..", "serve-demo.js"), "utf8");
  for (const d of ["netlify", "tools", "tests", "Talentpact"]) assert.ok(demo.includes(`"${d}"`), `serve-demo.js no bloquea ${d}`);
});
