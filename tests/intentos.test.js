/**
 * Reto oficial: un intento por persona y reto, cámara obligatoria, contenido
 * sin soluciones y notas que solo se guardan con un intento válido.
 * Sin red: Supabase (PostgREST) se simula en memoria con fetch.
 */
const test = require("node:test");
const assert = require("node:assert/strict");

const I = require("../netlify/functions/lib/intentos.js");
const { retoComun } = require("../netlify/functions/lib/catalogo.js");
const { corregirSecuencias } = require("../netlify/functions/lib/evaluator.js");
const catalogo = require("../netlify/functions/lib/catalogo-retos.json");

const USER = "aaaaaaaa-0000-4000-8000-0000000000f1";
const RETO = "common_analytical";

test("el contenido del intento no lleva soluciones, pistas ni conceptos del corrector", () => {
  for (const r of catalogo) {
    const c = JSON.stringify(I.contenidoDelIntento(r.id));
    assert.doesNotMatch(c, /"correct"|"kw"/, r.id);
  }
  const logica = I.contenidoDelIntento("common_logic").find((e) => e.type === "cognitive");
  assert.ok(logica.data.puzzles.every((p) => !("hint" in p) && Array.isArray(p.options)));
  assert.equal(I.contenidoDelIntento("no_existe"), null);
});

test("duración, estado y guardado de un intento", () => {
  const reto = retoComun(RETO);
  const esperado = reto.exercises.reduce((s, e) => s + (e.timeLimit || 300) + 120, 0) + 300;
  assert.equal(I.duracionIntento(reto), esperado);
  const ahora = Date.parse("2026-10-19T10:00:00Z");
  const abierto = { user_id: USER, challenge_id: RETO, estado: "abierto", expira_en: "2026-10-19T10:30:00Z" };
  assert.equal(I.estadoIntento(abierto, ahora), "abierto");
  assert.equal(I.estadoIntento(abierto, Date.parse("2026-10-19T10:31:00Z")), "caducado");
  assert.ok(I.puedeGuardar(abierto, { userId: USER, challengeId: RETO }, ahora).ok);
  assert.ok(I.puedeGuardar(abierto, { userId: USER, challengeId: RETO }, Date.parse("2026-10-19T10:40:00Z")).ok);   // gracia de 15 min
  assert.match(I.puedeGuardar(abierto, { userId: USER, challengeId: RETO }, Date.parse("2026-10-19T10:50:00Z")).motivo, /plazo/);
  assert.match(I.puedeGuardar(Object.assign({}, abierto, { estado: "entregado" }), { userId: USER, challengeId: RETO }, ahora).motivo, /ya se entregó/);
  assert.match(I.puedeGuardar(abierto, { userId: "otro", challengeId: RETO }, ahora).motivo, /no corresponde/);
  assert.match(I.puedeGuardar(null, { userId: USER, challengeId: RETO }).motivo, /intento oficial/);
  assert.match(I.validarSolicitud({ tipo: "reapertura", challengeId: RETO, motivo: "corto" }).error, /30 caracteres/);
  assert.equal(I.validarSolicitud({ tipo: "sin_camara", motivo: "No tengo cámara en el ordenador del centro de formación." }).solicitud.challenge_id, null);
});

test("las secuencias se corrigen en el servidor, descontando el azar", () => {
  const oficial = retoComun("common_logic").exercises.find((e) => e.type === "cognitive");
  const bien = JSON.stringify(oficial.data.puzzles.map((p) => p.correct));
  assert.equal(corregirSecuencias(oficial, bien).score, 100);
  const mal = JSON.stringify(oficial.data.puzzles.map((p) => (p.correct + 1) % p.options.length));
  assert.equal(corregirSecuencias(oficial, mal).score, 0);
  assert.equal(corregirSecuencias(oficial, "no es json").score, 0);
});

/** PostgREST mínimo en memoria para attempts, attempt_requests, profiles y evaluations. */
function supabaseFalso({ sinTablas = false } = {}) {
  const db = { attempts: [], attempt_requests: [], evaluations: [] };
  const ok = (data, status = 200) => ({ ok: true, status, json: async () => data, text: async () => JSON.stringify(data) });
  const filtro = (q) => {
    const p = new URLSearchParams(q);
    const conds = [...p.entries()].filter(([k]) => !["select", "limit", "order"].includes(k));
    return (row) => conds.every(([k, v]) => {
      const [op, ...rest] = v.split("."); const val = decodeURIComponent(rest.join("."));
      return op === "eq" ? String(row[k]) === val : op === "neq" ? String(row[k]) !== val : true;
    });
  };
  const fetch = async (url, opts = {}) => {
    const u = new URL(String(url)), m = opts.method || "GET";
    if (u.pathname.endsWith("/auth/v1/user")) return ok({ id: USER, email: "ana@ejemplo.es", user_metadata: { role: "candidate" } });
    const tabla = u.pathname.split("/rest/v1/")[1];
    if (sinTablas && /^attempt/.test(tabla)) return { ok: false, status: 404, text: async () => JSON.stringify({ message: `Could not find the table 'public.${tabla}' in the schema cache` }) };
    if (tabla === "profiles") return ok([{ id: "p1", user_id: USER }]);
    const lista = db[tabla] || [];
    if (m === "GET") return ok(lista.filter(filtro(u.search.slice(1))));
    if (m === "POST") {
      const fila = Object.assign({ id: "00000000-0000-4000-8000-" + String(lista.length + 1).padStart(12, "0") }, JSON.parse(opts.body));
      if (tabla === "attempts" && lista.some((a) => a.user_id === fila.user_id && a.challenge_id === fila.challenge_id && a.estado !== "anulado")) {
        return { ok: false, status: 409, text: async () => JSON.stringify({ message: "duplicate key value violates unique constraint" }) };
      }
      lista.push(fila); db[tabla] = lista; return ok([fila], 201);
    }
    if (m === "PATCH") {
      const f = filtro(u.search.slice(1)), patch = JSON.parse(opts.body);
      const cambiadas = lista.filter(f).map((r) => Object.assign(r, patch));
      return ok(cambiadas);
    }
    return ok([]);
  };
  return { db, fetch };
}

async function conSupabase(opciones, fn) {
  const real = globalThis.fetch;
  process.env.SUPABASE_URL = "https://ejemplo.supabase.co";
  process.env.SUPABASE_SERVICE_KEY = "clave-servicio";
  const s = supabaseFalso(opciones);
  globalThis.fetch = s.fetch;
  try { await fn(s.db); } finally { globalThis.fetch = real; }
}

test("retos-intento: cámara obligatoria, un solo intento y retomar con el mismo reloj", async () => {
  const { handler } = require("../netlify/functions/lib/handlers/retos-intento.js");
  const llamar = (b, token = "t") => handler({ httpMethod: "POST", headers: token ? { authorization: "Bearer " + token } : {}, body: JSON.stringify(b) });
  await conSupabase({}, async (db) => {
    assert.equal((await llamar({ accion: "empezar", challengeId: RETO }, null)).statusCode, 401);
    assert.equal((await llamar({ accion: "empezar", challengeId: RETO, camara: "activa" })).statusCode, 400);   // sin aceptar normas
    const sinCam = await llamar({ accion: "empezar", challengeId: RETO, camara: "denegada", aceptaNormas: true });
    assert.equal(sinCam.statusCode, 403);
    assert.equal(JSON.parse(sinCam.body).code, "camara_obligatoria");

    const r1 = await llamar({ accion: "empezar", challengeId: RETO, camara: "activa", aceptaNormas: true });
    assert.equal(r1.statusCode, 200, r1.body);
    const b1 = JSON.parse(r1.body);
    assert.equal(b1.intento.retomado, false);
    assert.equal(b1.ejercicios.length, 3);
    assert.doesNotMatch(r1.body, /"correct"|"kw"/);
    assert.equal(db.attempts.length, 1);

    // Cerrar y volver dentro del plazo: el mismo intento, no uno nuevo.
    const r2 = await llamar({ accion: "empezar", challengeId: RETO, camara: "activa", aceptaNormas: true });
    assert.equal(JSON.parse(r2.body).intento.id, b1.intento.id);
    assert.equal(JSON.parse(r2.body).intento.retomado, true);

    // Plazo vencido: intento usado, se puede pedir otra oportunidad.
    db.attempts[0].expira_en = new Date(Date.now() - 1000).toISOString();
    const r3 = await llamar({ accion: "empezar", challengeId: RETO, camara: "activa", aceptaNormas: true });
    assert.equal(r3.statusCode, 409);
    assert.equal(JSON.parse(r3.body).code, "intento_usado");
    assert.equal((await llamar({ accion: "solicitar", tipo: "reapertura", challengeId: RETO, motivo: "Se cortó la luz en casa a mitad del segundo ejercicio." })).statusCode, 200);
    assert.equal(db.attempt_requests.length, 1);
    const r4 = await llamar({ accion: "empezar", challengeId: RETO, camara: "activa", aceptaNormas: true });
    assert.equal(JSON.parse(r4.body).solicitud.estado, "pendiente");
  });
  // Sin la migración: el reto funciona, sin control de intento.
  await conSupabase({ sinTablas: true }, async () => {
    const r = await llamar({ accion: "empezar", challengeId: RETO, camara: "activa", aceptaNormas: true });
    assert.equal(r.statusCode, 200);
    assert.equal(JSON.parse(r.body).control, false);
  });
});

test("save-evaluation: un reto oficial solo se guarda con un intento válido, y una sola vez", async () => {
  const { handler } = require("../netlify/functions/lib/handlers/save-evaluation.js");
  const guardar = (extra) => handler({ httpMethod: "POST", headers: { authorization: "Bearer t" },
    body: JSON.stringify(Object.assign({ challengeId: RETO, skill: "x", score: 80 }, extra)) });
  await conSupabase({}, async (db) => {
    const sin = await guardar({});
    assert.equal(sin.statusCode, 409);
    db.attempts.push({ id: "11111111-1111-4111-8111-111111111111", user_id: USER, challenge_id: RETO, estado: "abierto", expira_en: new Date(Date.now() + 600000).toISOString() });
    const ok = await guardar({ attemptId: "11111111-1111-4111-8111-111111111111" });
    assert.equal(ok.statusCode, 200, ok.body);
    assert.equal(db.attempts[0].estado, "entregado");
    assert.equal(db.evaluations.length, 1);
    const otra = await guardar({ attemptId: "11111111-1111-4111-8111-111111111111" });
    assert.equal(otra.statusCode, 409);
    assert.match(JSON.parse(otra.body).error, /ya se entregó/);
    assert.equal(db.evaluations.length, 1);
  });
});
