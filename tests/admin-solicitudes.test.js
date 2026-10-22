/**
 * Backoffice: cola de solicitudes de reapertura / sin cámara.
 * Solo admin (app_metadata). Alias, nunca email. Al aprobar reapertura se anula el intento.
 */
const test = require("node:test");
const assert = require("node:assert/strict");

const { sanearNota } = require("../netlify/functions/lib/handlers/admin-solicitudes.js");
const { mensajeSolicitudIntento } = require("../netlify/functions/lib/notify.js");

const ADMIN = "bbbbbbbb-0000-4000-8000-0000000000a1";
const CAND = "aaaaaaaa-0000-4000-8000-0000000000f1";
const RETO = "common_analytical";
const SID = "cccccccc-0000-4000-8000-0000000000a1";

test("la nota de rechazo es obligatoria y se recorta", () => {
  assert.match(sanearNota("no", true).error, /mín/);
  assert.equal(sanearNota("Motivo claro y suficiente", true).nota, "Motivo claro y suficiente");
  assert.equal(sanearNota(undefined, false).nota, null);
  assert.equal(sanearNota("x".repeat(900), false).nota.length, 800);
});

test("el aviso al candidato explica aprobación y rechazo sin datos de la empresa", () => {
  const ok = mensajeSolicitudIntento({ tipo: "reapertura", decision: "aprobada", reto: "Pensamiento Analítico" });
  assert.match(ok.title, /volver/i);
  assert.match(ok.body, /empezar de nuevo/i);
  const cam = mensajeSolicitudIntento({ tipo: "sin_camara", decision: "aprobada" });
  assert.match(cam.title, /sin cámara/i);
  const no = mensajeSolicitudIntento({ tipo: "reapertura", decision: "rechazada", reto: "X", nota: "Falta evidencia." });
  assert.match(no.body, /Falta evidencia/);
  assert.doesNotMatch(JSON.stringify(no), /@|email/i);
});

function supabaseFalso(role) {
  const db = { attempt_requests: [], attempts: [], notifications: [] };
  const ok = (data, status = 200) => ({ ok: true, status, json: async () => data, text: async () => JSON.stringify(data) });
  const filtro = (q) => {
    const p = new URLSearchParams(q);
    const conds = [...p.entries()].filter(([k]) => !["select", "limit", "order"].includes(k));
    return (row) => conds.every(([k, v]) => {
      const [op, ...rest] = v.split(".");
      const val = decodeURIComponent(rest.join("."));
      if (op === "eq") return String(row[k]) === val;
      if (op === "neq") return String(row[k]) !== val;
      return true;
    });
  };
  const fetch = async (url, opts = {}) => {
    const u = new URL(String(url)), m = opts.method || "GET";
    if (u.pathname.endsWith("/auth/v1/user")) {
      return ok({
        id: role === "admin" ? ADMIN : CAND,
        email: role === "admin" ? "admin@talentpact.es" : "ana@ejemplo.es",
        app_metadata: role === "admin" ? { role: "admin" } : {},
        user_metadata: { role: "candidate" }
      });
    }
    const tabla = u.pathname.split("/rest/v1/")[1];
    const lista = db[tabla] || [];
    if (m === "GET") {
      let rows = lista.filter(filtro(u.search.slice(1)));
      const p = new URLSearchParams(u.search);
      const lim = Number(p.get("limit") || 0);
      if (lim) rows = rows.slice(0, lim);
      return ok(rows);
    }
    if (m === "POST") {
      const fila = Object.assign({ id: "00000000-0000-4000-8000-" + String(lista.length + 1).padStart(12, "0"), created_at: new Date().toISOString() }, JSON.parse(opts.body));
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

async function conFetch(role, fn) {
  const real = globalThis.fetch;
  process.env.SUPABASE_URL = "https://ejemplo.supabase.co";
  process.env.SUPABASE_SERVICE_KEY = "clave-servicio";
  const s = supabaseFalso(role);
  globalThis.fetch = s.fetch;
  try { await fn(s.db); } finally { globalThis.fetch = real; }
}

test("sin rol admin no se abre la cola", async () => {
  const { handler } = require("../netlify/functions/lib/handlers/admin-solicitudes.js");
  await conFetch("candidato", async () => {
    const r = await handler({ httpMethod: "POST", headers: { authorization: "Bearer t" }, body: JSON.stringify({ accion: "listar" }) });
    assert.equal(r.statusCode, 403);
  });
});

test("listar solo enseña alias y el admin aprueba una reapertura anulando el intento", async () => {
  const { handler } = require("../netlify/functions/lib/handlers/admin-solicitudes.js");
  const { anonymousAlias } = require("../netlify/functions/lib/tp.js");
  await conFetch("admin", async (db) => {
    db.attempt_requests.push({
      id: SID, user_id: CAND, tipo: "reapertura", challenge_id: RETO,
      motivo: "Se cortó la luz a mitad del segundo ejercicio del reto.",
      estado: "pendiente", nota: null, created_at: "2026-10-22T10:00:00Z", resuelto_en: null
    });
    db.attempts.push({
      id: "11111111-1111-4111-8111-111111111111", user_id: CAND, challenge_id: RETO,
      estado: "caducado", expira_en: "2026-10-22T09:00:00Z"
    });

    const lista = await handler({ httpMethod: "POST", headers: { authorization: "Bearer t" }, body: JSON.stringify({ accion: "listar" }) });
    assert.equal(lista.statusCode, 200, lista.body);
    const body = JSON.parse(lista.body);
    assert.equal(body.pendientesCount, 1);
    assert.equal(body.pendientes[0].alias, anonymousAlias(CAND));
    assert.doesNotMatch(lista.body, /ana@ejemplo|admin@talentpact/i);
    assert.match(body.pendientes[0].reto, /Analítico/i);

    const ok = await handler({
      httpMethod: "POST", headers: { authorization: "Bearer t" },
      body: JSON.stringify({ accion: "resolver", id: SID, decision: "aprobada" })
    });
    assert.equal(ok.statusCode, 200, ok.body);
    assert.equal(db.attempt_requests[0].estado, "aprobada");
    assert.equal(db.attempts[0].estado, "anulado");
    assert.equal(db.notifications.length, 1);
    assert.equal(db.notifications[0].user_id, CAND);
    assert.match(db.notifications[0].title, /volver/i);
  });
});

test("rechazar exige nota y no anula el intento; sin_camara aprobada no toca attempts", async () => {
  const { handler } = require("../netlify/functions/lib/handlers/admin-solicitudes.js");
  await conFetch("admin", async (db) => {
    const idR = "dddddddd-0000-4000-8000-0000000000b1";
    const idC = "eeeeeeee-0000-4000-8000-0000000000c1";
    db.attempt_requests.push(
      { id: idR, user_id: CAND, tipo: "reapertura", challenge_id: RETO, motivo: "Quiero repetir porque no me concentraba bien en casa.", estado: "pendiente", created_at: "2026-10-22T11:00:00Z" },
      { id: idC, user_id: CAND, tipo: "sin_camara", challenge_id: null, motivo: "No tengo cámara en el ordenador del centro de formación.", estado: "pendiente", created_at: "2026-10-22T11:05:00Z" }
    );
    db.attempts.push({ id: "22222222-2222-4222-8222-222222222222", user_id: CAND, challenge_id: RETO, estado: "entregado" });

    const sinNota = await handler({
      httpMethod: "POST", headers: { authorization: "Bearer t" },
      body: JSON.stringify({ accion: "resolver", id: idR, decision: "rechazada" })
    });
    assert.equal(sinNota.statusCode, 400);

    const rech = await handler({
      httpMethod: "POST", headers: { authorization: "Bearer t" },
      body: JSON.stringify({ accion: "resolver", id: idR, decision: "rechazada", nota: "No hay indicios de incidencia técnica." })
    });
    assert.equal(rech.statusCode, 200, rech.body);
    assert.equal(db.attempt_requests[0].estado, "rechazada");
    assert.equal(db.attempts[0].estado, "entregado");

    const cam = await handler({
      httpMethod: "POST", headers: { authorization: "Bearer t" },
      body: JSON.stringify({ accion: "resolver", id: idC, decision: "aprobada" })
    });
    assert.equal(cam.statusCode, 200, cam.body);
    assert.equal(db.attempt_requests[1].estado, "aprobada");
    assert.equal(db.attempts[0].estado, "entregado");
    assert.equal(db.notifications.length, 2);
  });
});
