/**
 * Pool de talento real y entrega de contacto.
 *
 * Es donde un dato personal puede salir de TalentPact, así que se fija:
 * el pool solo lleva datos anónimos, y el contacto solo se entrega a la empresa
 * que tiene un desbloqueo pagado de ese candidato. Supabase se simula.
 */
const test = require("node:test");
const assert = require("node:assert/strict");

const { construirPool, limpiarCond } = require("../netlify/functions/lib/handlers/get-talent-pool.js");

const EMPRESA = "11111111-2222-4333-8444-555555555555";
const CAND = "2f1c9a44-0e51-4a71-9a3f-6b2d0c8e7a15";

/** Supabase simulado: responde según la ruta pedida y registra las URLs. */
function simularSupabase(rutas) {
  const pedidas = [];
  const real = globalThis.fetch;
  process.env.SUPABASE_URL = "https://ejemplo.supabase.co";
  process.env.SUPABASE_SERVICE_KEY = "clave-servicio";
  globalThis.fetch = async (url, opts = {}) => {
    pedidas.push({ url: String(url), method: opts.method || "GET", body: opts.body });
    for (const [patron, resp] of rutas) {
      if (String(url).includes(patron)) {
        const data = typeof resp === "function" ? resp(String(url), opts) : resp;
        return { ok: true, status: 200, json: async () => data, text: async () => JSON.stringify(data) };
      }
    }
    return { ok: true, status: 200, json: async () => [], text: async () => "[]" };
  };
  return { pedidas, restaurar: () => { globalThis.fetch = real; } };
}
const conToken = (body) => ({ httpMethod: "POST", headers: { authorization: "Bearer t" }, body: JSON.stringify(body) });

test("el pool solo lleva datos anónimos, la mejor nota por skill y oculta a quien no quiere aparecer", () => {
  const perfiles = [
    { id: CAND, user_id: "aaaa1111-0000-4000-8000-000000000000", sector: "Data", email: "x@y.es", full_name: "Ana", phone: "600", empleo: { jornadas: ["parcial"], modalidades: ["remoto"], ciudad: "Madrid", disponibilidad: "quince", horas: 20, salMin: 24000, reubicacion: true } },
    { id: "b", user_id: "bbbb", sector: "IT", pool_visible: false },
    { id: "c", user_id: "cccc", sector: "IT" }   // sin evaluaciones
  ];
  const evals = [
    { profile_id: CAND, skill: "SQL", score: 70, integrity: { verified: true, risk: "bajo" } },
    { profile_id: CAND, skill: "SQL", score: 88, integrity: { verified: true, risk: "medio" } },
    { profile_id: CAND, skill: "Comunicación", score: 60, integrity: { verified: false } },
    { profile_id: "b", skill: "SQL", score: 99, integrity: { verified: true } }
  ];
  const pool = construirPool(perfiles, evals);
  assert.equal(pool.length, 1);
  const f = pool[0];
  assert.equal(f.ref, CAND);
  assert.match(f.alias, /^Candidato #[0-9A-F]{4}$/);
  assert.deepEqual(f.skills.map((s) => [s.n, s.v]), [["SQL", 88], ["Comunicación", 60]]);
  assert.equal(f.verified, false);          // una de sus notas no está verificada
  assert.equal(f.integ, "medio");
  assert.deepEqual(f.cond.jornadas, ["parcial"]);
  assert.equal(f.cond.ciudad, "Madrid");
  assert.equal(f.cond.disponibilidad, "quince");
  assert.equal(f.cond.horas, 20);
  assert.equal(f.cond.salMin, 24000);
  assert.equal(f.cond.reubicacion, true);
  // Ningún dato personal, ni siquiera anidado.
  assert.doesNotMatch(JSON.stringify(pool), /x@y\.es|Ana|"600"|email|phone|full_name/);

  const soloVerif = construirPool(perfiles, evals, { soloVerificados: true });
  assert.deepEqual(soloVerif[0].skills.map((s) => s.n), ["SQL"]);
  assert.equal(soloVerif[0].verified, true);
});

test("limpiarCond conserva jornada, ciudad, disponibilidad, horas y salario", () => {
  const c = limpiarCond({
    jornadas: ["parcial", "horas"],
    modalidades: ["hibrido"],
    contratos: ["indefinido"],
    ciudad: "Barcelona",
    disponibilidad: "inmediata",
    horas: 25,
    salMin: 28000,
    reubicacion: false,
    basura: "<script>"
  });
  assert.deepEqual(c.jornadas, ["parcial", "horas"]);
  assert.equal(c.ciudad, "Barcelona");
  assert.equal(c.disponibilidad, "inmediata");
  assert.equal(c.horas, 25);
  assert.equal(c.salMin, 28000);
  assert.equal(c.reubicacion, false);
  assert.equal(c.basura, undefined);
  assert.equal(limpiarCond({ horas: 2 }).horas, null);
});

test("el pool exige sesión", async () => {
  const { handler } = require("../netlify/functions/lib/handlers/get-talent-pool.js");
  const res = await handler({ httpMethod: "POST", headers: {}, body: "{}" });
  assert.equal(res.statusCode, 401);
});

test("el contacto no sale sin un desbloqueo pagado de esa misma empresa", async () => {
  const { handler } = require("../netlify/functions/lib/handlers/get-contact.js");
  assert.equal((await handler({ httpMethod: "POST", headers: {}, body: JSON.stringify({ candidateRef: CAND }) })).statusCode, 401);

  const sim = simularSupabase([
    ["/auth/v1/user", { id: EMPRESA, email: "rrhh@empresa.es" }],
    ["/rest/v1/unlocks", []]
  ]);
  try {
    const noReal = await handler(conToken({ candidateRef: "p1" }));
    assert.equal(noReal.statusCode, 400);
    const sinPago = await handler(conToken({ candidateRef: CAND }));
    assert.equal(sinPago.statusCode, 402);
    // La consulta del desbloqueo va acotada a la empresa del token y al estado pagado.
    const q = sim.pedidas.find((p) => p.url.includes("/rest/v1/unlocks")).url;
    assert.match(q, new RegExp(`company_user_id=eq\\.${EMPRESA}`));
    assert.match(q, /status=eq\.paid/);
    assert.ok(!sim.pedidas.some((p) => p.url.includes("/rest/v1/profiles")), "no debe leer el perfil sin pago");
  } finally { sim.restaurar(); }
});

test("con el desbloqueo pagado se entrega el contacto real y queda registrado", async () => {
  const { handler } = require("../netlify/functions/lib/handlers/get-contact.js");
  const sim = simularSupabase([
    ["/auth/v1/user", { id: EMPRESA, email: "rrhh@empresa.es" }],
    ["/rest/v1/unlocks", [{ id: "99999999-0000-4000-8000-000000000000", paid_at: "2026-10-12T10:00:00Z" }]],
    ["/rest/v1/profiles", [{ id: CAND, user_id: "aaaa", full_name: "Ana Ruiz", email: "ana@correo.es", phone: "+34 600 000 000", linkedin: "linkedin.com/in/ana" }]],
    ["/rest/v1/contact_access", [{ id: "log" }]]
  ]);
  try {
    const res = await handler(conToken({ candidateRef: CAND }));
    assert.equal(res.statusCode, 200);
    const { contact, unlockedAt } = JSON.parse(res.body);
    assert.deepEqual(contact, { name: "Ana Ruiz", email: "ana@correo.es", phone: "+34 600 000 000", linkedin: "linkedin.com/in/ana" });
    assert.equal(unlockedAt, "2026-10-12T10:00:00Z");
    const log = sim.pedidas.find((p) => p.url.includes("/rest/v1/contact_access"));
    assert.equal(log.method, "POST");
    assert.equal(JSON.parse(log.body).company_user_id, EMPRESA);
  } finally { sim.restaurar(); }
});

test("no se puede pagar por un candidato real que ya no existe", async () => {
  const k = process.env.STRIPE_SECRET_KEY;
  process.env.STRIPE_SECRET_KEY = "sk_test_prueba";
  const sim = simularSupabase([
    ["/auth/v1/user", { id: EMPRESA, email: "rrhh@empresa.es" }],
    ["/rest/v1/companies", [{ id: "co-1", company_name: "Empresa" }]],
    ["/rest/v1/profiles", []]
  ]);
  try {
    const { handler } = require("../netlify/functions/lib/handlers/create-checkout-session.js");
    const res = await handler({ httpMethod: "POST", headers: { authorization: "Bearer t", origin: "https://talentpact.es" }, body: JSON.stringify({ candidateRef: CAND }) });
    assert.equal(res.statusCode, 404);
  } finally {
    sim.restaurar();
    if (k === undefined) delete process.env.STRIPE_SECRET_KEY; else process.env.STRIPE_SECRET_KEY = k;
  }
});

test("una cuenta sin ficha de empresa no puede pagar por el contacto de un candidato", async () => {
  const k = process.env.STRIPE_SECRET_KEY;
  process.env.STRIPE_SECRET_KEY = "sk_test_prueba";
  const sim = simularSupabase([
    ["/auth/v1/user", { id: EMPRESA, email: "otro@candidato.es", user_metadata: { role: "candidate" } }],
    ["/rest/v1/companies", []]
  ]);
  try {
    const { handler } = require("../netlify/functions/lib/handlers/create-checkout-session.js");
    const res = await handler({ httpMethod: "POST", headers: { authorization: "Bearer t", origin: "https://talentpact.es" }, body: JSON.stringify({ candidateRef: CAND }) });
    assert.equal(res.statusCode, 403);
    assert.equal(JSON.parse(res.body).code, "not_company");
    // No se llega a mirar el perfil del candidato.
    assert.ok(!sim.pedidas.some((p) => p.url.includes("/rest/v1/profiles")));
  } finally {
    sim.restaurar();
    if (k === undefined) delete process.env.STRIPE_SECRET_KEY; else process.env.STRIPE_SECRET_KEY = k;
  }
});

test("una empresa no mete en su proceso (ni avisa) a quien ni se postuló ni está visible en el pool", async () => {
  const { handler } = require("../netlify/functions/lib/handlers/applications.js");
  const OFERTA = "33333333-4444-4555-8666-777777777777";
  const sim = simularSupabase([
    ["/auth/v1/user", { id: EMPRESA, email: "rrhh@empresa.es" }],
    ["/rest/v1/jobs", [{ id: OFERTA }]],
    ["/rest/v1/applications", (url, opts) => (opts.method && opts.method !== "GET" ? [{ id: "x" }] : [])],
    // Perfil oculto: la consulta con pool_visible=is.true no lo devuelve.
    ["/rest/v1/profiles", (url) => (url.includes("pool_visible=is.true") ? [] : [{ id: CAND, user_id: "aaaa" }])],
    ["/rest/v1/notifications", [{ id: "n" }]]
  ]);
  try {
    const res = await handler(conToken({ jobId: OFERTA, candidateRef: CAND, status: "contratado" }));
    assert.equal(res.statusCode, 404);
    assert.ok(!sim.pedidas.some((p) => p.url.includes("/rest/v1/notifications")), "no debe avisar al candidato");
    assert.ok(!sim.pedidas.some((p) => p.url.includes("/rest/v1/applications") && p.method === "POST"), "no debe crear la postulación");
  } finally { sim.restaurar(); }
});

test("una empresa sí puede mover a un candidato visible en el pool, y se le avisa", async () => {
  const { handler } = require("../netlify/functions/lib/handlers/applications.js");
  const OFERTA = "33333333-4444-4555-8666-777777777777";
  const sim = simularSupabase([
    ["/auth/v1/user", { id: EMPRESA, email: "rrhh@empresa.es" }],
    ["/rest/v1/jobs", [{ id: OFERTA }]],
    ["/rest/v1/applications", (url, opts) => (opts.method && opts.method !== "GET" ? [{ id: "x" }] : [])],
    ["/rest/v1/profiles", [{ id: CAND, user_id: "aaaa" }]],
    ["/rest/v1/notifications", [{ id: "n" }]]
  ]);
  try {
    const res = await handler(conToken({ jobId: OFERTA, candidateRef: CAND, status: "preseleccionado" }));
    assert.equal(res.statusCode, 200);
    assert.ok(sim.pedidas.some((p) => p.url.includes("/rest/v1/applications") && p.method === "POST"));
    assert.ok(sim.pedidas.some((p) => p.url.includes("/rest/v1/notifications") && p.method === "POST"));
  } finally { sim.restaurar(); }
});
