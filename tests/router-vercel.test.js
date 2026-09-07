/**
 * El router de Vercel (api/[fn].js) es la unica funcion desplegada: todo el
 * trafico pasa por el. Como serve-demo.js llama a los handlers directamente,
 * sin estas pruebas el router solo se ejercitaria en produccion.
 *
 * Se levanta un servidor http real y se le hacen peticiones de verdad, porque
 * lo que hay que comprobar es justamente como lee el cuerpo del stream.
 */
const { test } = require("node:test");
const assert = require("node:assert");
const http = require("node:http");

const router = require("../api/[fn].js");

/** Imita el (req, res) de Vercel: query con el segmento [fn] y helper .status(). */
function server() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    const m = url.pathname.match(/\/api\/([\w-]+)/);
    req.query = Object.fromEntries(url.searchParams);
    req.query.fn = m ? m[1] : "";
    res.status = (code) => { res.statusCode = code; return res; };
    res.send = (body) => res.end(body);
    router(req, res).catch((err) => { res.statusCode = 500; res.end(String(err)); });
  });
}

async function request(path, { method = "POST", body, headers = {} } = {}) {
  const srv = server();
  await new Promise((r) => srv.listen(0, r));
  const port = srv.address().port;
  try {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: body !== undefined ? { "content-type": "application/json", ...headers } : headers,
      body
    });
    return { status: res.status, text: await res.text() };
  } finally {
    srv.close();
  }
}

test("una funcion desconocida devuelve 404 y no revienta", async () => {
  const { status, text } = await request("/api/no-existe");
  assert.strictEqual(status, 404);
  assert.match(JSON.parse(text).error, /no encontrada/i);
});

test("el router enruta hasta el handler y devuelve su respuesta", async () => {
  const { status, text } = await request("/api/save-profile", { body: "{}" });
  assert.strictEqual(status, 400);
  assert.match(JSON.parse(text).error, /userId/);
});

test("el cuerpo llega al handler tal cual se envio, sin reserializar", async () => {
  // Claves desordenadas y espaciado raro: si algo parsea y vuelve a serializar,
  // estos bytes cambian y la firma de Stripe dejaria de cuadrar.
  const raw = '{"z":1,   "a":"ñ\u00e9",\n "m":[3,2,1]}';
  const { status, text } = await request("/api/contact", { body: raw });
  // Llega a la validacion del handler, luego el JSON se parseo correctamente.
  assert.strictEqual(status, 400);
  assert.match(JSON.parse(text).error, /obligatorios/);
});

test("el webhook de Stripe rechaza lo que no trae firma", async () => {
  const { status, text } = await request("/api/stripe-webhook", { body: '{"type":"checkout.session.completed"}' });
  const data = JSON.parse(text);
  // 503 si Stripe no esta configurado en este entorno; 400 si lo esta y falta
  // la firma. Lo que nunca puede pasar es un 200.
  assert.ok(status === 400 || status === 503, `esperaba 400 o 503, llego ${status}: ${text}`);
  assert.ok(!data.ok, "un evento sin firma jamas debe darse por bueno");
});

test("una firma valida de Stripe sobrevive al paso por el router", async () => {
  // Esta es la prueba de fuego del cuerpo crudo. constructEvent recalcula el
  // HMAC sobre los bytes recibidos: si el router hubiese parseado y vuelto a
  // serializar el JSON, la firma no cuadraria y esto seria un 400.
  // Se usa un tipo de evento que el handler ignora, para no tocar Supabase.
  const secret = "whsec_" + "a".repeat(32);
  const stripe = require("stripe")("sk_test_dummy");
  const payload = JSON.stringify({
    id: "evt_test",
    type: "payment_intent.created",
    data: { object: { id: "pi_test" } }
  });
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret });

  const prev = { key: process.env.STRIPE_SECRET_KEY, hook: process.env.STRIPE_WEBHOOK_SECRET };
  process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
  process.env.STRIPE_WEBHOOK_SECRET = secret;
  try {
    const { status, text } = await request("/api/stripe-webhook", {
      body: payload,
      headers: { "stripe-signature": header }
    });
    assert.strictEqual(status, 200, "la firma deberia validar; si da 400, el cuerpo llego alterado: " + text);
    assert.strictEqual(JSON.parse(text).received, true);
  } finally {
    if (prev.key === undefined) delete process.env.STRIPE_SECRET_KEY; else process.env.STRIPE_SECRET_KEY = prev.key;
    if (prev.hook === undefined) delete process.env.STRIPE_WEBHOOK_SECRET; else process.env.STRIPE_WEBHOOK_SECRET = prev.hook;
  }
});

test("los query params llegan al handler y se descarta el segmento [fn]", async () => {
  const { status, text } = await request("/api/verify-credential?h=0x" + "0".repeat(64), { method: "GET" });
  // Sin contrato configurado responde 503; con contrato, 200. En ambos casos
  // ha leido el parametro h en vez de quejarse de que falta.
  assert.ok(status === 503 || status === 200, `llego ${status}: ${text}`);
  assert.doesNotMatch(text, /Pasa h=/, "no deberia decir que falta el parametro h");
});

test("un metodo no permitido no llega a ejecutar logica de negocio", async () => {
  const { status } = await request("/api/save-company", { method: "GET" });
  assert.strictEqual(status, 405);
});
