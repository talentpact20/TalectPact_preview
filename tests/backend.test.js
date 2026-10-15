/**
 * Revisión del backend (15/10/2026): lo que se fija aquí son los fallos
 * encontrados al revisarlo entero, para que no vuelvan.
 */
const test = require("node:test");
const assert = require("node:assert/strict");

const { errorInterno } = require("../netlify/functions/lib/tp.js");
const { construirPool } = require("../netlify/functions/lib/handlers/get-talent-pool.js");
const { mejoresSkills } = require("../netlify/functions/lib/handlers/issue-credential.js");
const { enlaceSeguro } = require("../netlify/functions/lib/handlers/save-profile.js");

test("una nota verificada manda sobre una no verificada, en el pool y en el SkillPass", () => {
  const CAND = "aaaaaaaa-0000-4000-8000-000000000001";
  const evals = [
    { profile_id: CAND, skill: "Liderazgo", score: 100, integrity: { verified: false } },  // enviada por el navegador
    { profile_id: CAND, skill: "Liderazgo", score: 72, integrity: { verified: true } },
    { profile_id: CAND, skill: "Excel y Datos", score: 90, integrity: { verified: false } }
  ];
  const [ficha] = construirPool([{ id: CAND, user_id: CAND }], evals);
  const lid = ficha.skills.find((s) => s.n === "Liderazgo");
  assert.deepEqual([lid.v, lid.verified], [72, true]);

  const pass = mejoresSkills(evals.map((e) => Object.assign({ challenge_id: "c", created_at: "t" }, e)));
  assert.deepEqual(pass.map((s) => [s.skill, s.score, s.verified]), [["Liderazgo", 72, true], ["Excel y Datos", 90, false]]);
});

test("los errores internos no enseñan la consulta en producción y un JSON roto es un 400", () => {
  const prev = process.env.CONTEXT;
  const err = new Error("Supabase GET profiles?user_id=eq.1234&select=email -> 500: timeout");
  const original = console.error;
  console.error = () => {};
  try {
    process.env.CONTEXT = "production";
    const r = errorInterno("No se pudo cargar", err);
    assert.equal(r.statusCode, 500);
    assert.doesNotMatch(r.body, /profiles|user_id|email/);
    process.env.CONTEXT = "dev";
    assert.match(errorInterno("No se pudo cargar", err).body, /profiles/);   // en local sí, para depurar
    let roto;
    try { JSON.parse("{mal"); } catch (e) { roto = e; }
    assert.equal(errorInterno("x", roto).statusCode, 400);
  } finally {
    console.error = original;
    if (prev === undefined) delete process.env.CONTEXT; else process.env.CONTEXT = prev;
  }
  // El LinkedIn del candidato solo se guarda como enlace http(s).
  assert.equal(enlaceSeguro("javascript:alert(1)"), undefined);
  assert.equal(enlaceSeguro("linkedin.com/in/ana"), "https://linkedin.com/in/ana");
  assert.equal(enlaceSeguro({ toString: () => "x" }), undefined);
});

test("borrar la cuenta borra los avisos y no toca el usuario de Auth si falla una tabla", async () => {
  const real = globalThis.fetch;
  process.env.SUPABASE_URL = "https://ejemplo.supabase.co";
  process.env.SUPABASE_SERVICE_KEY = "clave-servicio";
  const { handler } = require("../netlify/functions/lib/handlers/delete-account.js");
  const USER = "bbbbbbbb-0000-4000-8000-000000000002";
  const simular = (falla) => {
    const pedidas = [];
    globalThis.fetch = async (url, opts = {}) => {
      const u = String(url), m = opts.method || "GET";
      pedidas.push(m + " " + u);
      const ok = (data) => ({ ok: true, status: 200, json: async () => data, text: async () => JSON.stringify(data) });
      if (u.endsWith("/auth/v1/user")) return ok({ id: USER });
      if (falla && m === "DELETE" && u.includes(falla)) return { ok: false, status: 500, text: async () => '{"message":"permission denied"}' };
      return ok([]);
    };
    return pedidas;
  };
  const original = console.error;
  console.error = () => {};
  try {
    const bien = simular(null);
    const r = await handler({ httpMethod: "POST", headers: { authorization: "Bearer t" }, body: "{}" });
    assert.equal(r.statusCode, 200);
    assert.ok(bien.some((p) => p.startsWith("DELETE") && p.includes("/rest/v1/notifications")), "borra los avisos");
    assert.ok(bien.some((p) => p.startsWith("DELETE") && p.includes("/auth/v1/admin/users/")), "borra el usuario");

    const mal = simular("/rest/v1/companies");
    const r2 = await handler({ httpMethod: "POST", headers: { authorization: "Bearer t" }, body: "{}" });
    assert.equal(r2.statusCode, 500);
    assert.ok(!mal.some((p) => p.includes("/auth/v1/admin/users/")), "con un error real no se borra el usuario: se puede reintentar");
  } finally {
    console.error = original;
    globalThis.fetch = real;
  }
});
