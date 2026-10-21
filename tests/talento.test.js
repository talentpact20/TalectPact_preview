/**
 * Búsqueda de candidatos para empresas (estilo Recruiter), cribado y
 * desbloqueos gratis de las primeras ofertas.
 *  · El pool da a cada empresa sus señales (le interesa, se ha postulado) sin
 *    enseñar a qué otras empresas sigue el candidato.
 *  · El cribado marca, no descarta: la postulación entra igual.
 *  · Los desbloqueos gratis salen de las 3 primeras ofertas y no se pasan.
 *  · El buscador del navegador filtra, cuenta y lee una descripción sin IA.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const { construirPool, limpiarCond, resumirPostulaciones } = require("../netlify/functions/lib/handlers/get-talent-pool.js");
const { calcularCreditos } = require("../netlify/functions/lib/gratis.js");
const { limpiarCribado, evaluarCribado } = require("../netlify/functions/lib/cribado.js");

const EMPRESA = "c0c0c0c0-0000-4000-8000-000000000001";
const OTRA = "c0c0c0c0-0000-4000-8000-000000000002";
const P1 = "a1a1a1a1-0000-4000-8000-000000000001";
const P2 = "a1a1a1a1-0000-4000-8000-000000000002";

test("el pool da a cada empresa su señal de interés sin revelar la lista del candidato", () => {
  const perfiles = [
    { id: P1, user_id: P1, empleo: { busqueda: "activa", interes: [EMPRESA, OTRA], ciudad: "Madrid" } },
    { id: P2, user_id: P2, empleo: { busqueda: "raro", interes: ["no-es-uuid"] } }
  ];
  const evals = [
    ...["A", "B", "C", "D", "E", "F", "G"].map((s, i) => ({ profile_id: P1, skill: s, score: 90 - i })),
    { profile_id: P2, skill: "Liderazgo", score: 70 }
  ];
  const post = resumirPostulaciones([
    { candidate_profile_id: P2, status: "aplicado" },
    { candidate_profile_id: P2, status: "entrevista" },
    { candidate_profile_id: P2, status: "descartado" }
  ]);
  const pool = construirPool(perfiles, evals, { empresaId: EMPRESA, postulaciones: post });
  const a = pool.find((f) => f.ref === P1), b = pool.find((f) => f.ref === P2);
  assert.equal(a.cond.busqueda, "activa");
  assert.equal(a.interesa, true);
  assert.equal("interes" in a.cond, false, "la lista de empresas no sale nunca");
  assert.equal(a.skills.length, 6);
  assert.equal(a.todas.length, 7, "el buscador ve también la 7.ª skill");
  assert.equal(b.cond.busqueda, "", "un estado desconocido no se publica");
  assert.equal(b.interesa, false);
  assert.equal(b.postulado, 3);
  assert.equal(b.etapa, "entrevista", "manda la etapa más avanzada");
  // Otra empresa no ve el interés por la primera.
  assert.equal(construirPool(perfiles, evals, { empresaId: OTRA }).find((f) => f.ref === P2).interesa, false);
  assert.equal(construirPool(perfiles, evals).find((f) => f.ref === P1).interesa, false);
  // Al guardar el perfil, la lista se conserva saneada.
  assert.deepEqual(limpiarCond({ interes: [EMPRESA, EMPRESA, "x"] }).interes, [EMPRESA]);
});

test("desbloqueos gratis: 1 por cada una de las 3 primeras ofertas", () => {
  assert.deepEqual(
    [0, 1, 2, 3, 7].map((n) => calcularCreditos(n, 0).incluidos),
    [0, 1, 2, 3, 3]
  );
  const g = calcularCreditos(2, 1);
  assert.equal(g.restantes, 1);
  assert.equal(g.ofertasGratisPendientes, 1);
  assert.equal(calcularCreditos(3, 5).restantes, 0, "nunca negativo");
});

test("cribado: preguntas saneadas, sin criterios prohibidos, y la eliminatoria marca sin descartar", () => {
  const qs = limpiarCribado([
    { grupo: "contrato", texto: "¿Aceptas un contrato indefinido?", esperada: "si" },
    { grupo: "requisito", texto: "¿Tienes permiso para trabajar en España?", esperada: "si", eliminatoria: true },
    { grupo: "requisito", texto: "¿Cuál es tu nacionalidad?", esperada: "si", eliminatoria: true },
    { grupo: "requisito", texto: "¿Tienes hijos?", esperada: "no" },
    { grupo: "raro", texto: "¿Tienes carné de conducir B?", esperada: "", eliminatoria: true },
    ...Array.from({ length: 8 }, (_, i) => ({ texto: "Pregunta de relleno " + i, esperada: "si" }))
  ]);
  assert.equal(qs.length, 6, "como máximo 6");
  assert.ok(!qs.some((q) => /nacionalidad|hijos/.test(q.texto)), "fuera las que discriminan");
  const carne = qs.find((q) => /carné/.test(q.texto));
  assert.equal(carne.grupo, "requisito");
  assert.equal(carne.eliminatoria, false, "sin respuesta esperada no puede ser eliminatoria");

  const dos = qs.slice(0, 2);
  assert.match(evaluarCribado(dos, ["si"]).error, /Responde las 2/);
  const ok = evaluarCribado(dos, ["si", "si"]);
  assert.equal(ok.cumple, true);
  const contratoNo = evaluarCribado(dos, ["no", "si"]);
  assert.equal(contratoNo.cumple, true, "una pregunta no eliminatoria no cuenta como requisito");
  assert.equal(contratoNo.respuestas[0].cumple, false);
  const no = evaluarCribado(dos, ["si", "no"]);
  assert.equal(no.cumple, false);
  assert.deepEqual(no.noCumple, ["¿Tienes permiso para trabajar en España?"]);
});

// ── Handlers con un Supabase falso ──
function supabaseFalso(rutas) {
  process.env.SUPABASE_URL = "https://ejemplo.supabase.co";
  process.env.SUPABASE_SERVICE_KEY = "clave-servicio";
  const llamadas = [];
  const real = globalThis.fetch;
  globalThis.fetch = async (url, opts = {}) => {
    const u = String(url), m = opts.method || "GET";
    llamadas.push({ u, m, body: opts.body ? JSON.parse(opts.body) : null });
    const ok = (data) => ({ ok: true, status: 200, headers: { get: () => null }, json: async () => data, text: async () => JSON.stringify(data) });
    for (const [re, fn] of rutas) if (re.test(m + " " + u)) return ok(fn(u, opts));
    return ok([]);
  };
  return { llamadas, restaurar: () => { globalThis.fetch = real; } };
}
const usuario = (id, rol) => [/GET .*\/auth\/v1\/user$/, () => ({ id, email: "x@acme.es", user_metadata: { role: rol } })];

test("unlock-free usa un desbloqueo incluido y responde 402 cuando no quedan", async () => {
  const { handler } = require("../netlify/functions/lib/handlers/unlock-free.js");
  let ofertas = 1, usados = 0;
  const sb = supabaseFalso([
    usuario("e0e0e0e0-0000-4000-8000-000000000001", "empresa"),
    [/GET .*\/companies/, () => [{ id: EMPRESA, company_name: "Acme" }]],
    [/GET .*\/profiles/, () => [{ id: P1, user_id: P1, pool_visible: true, allow_contact: true }]],
    [/GET .*\/jobs/, () => Array.from({ length: ofertas }, (_, i) => ({ id: "j" + i }))],
    [/GET .*\/unlocks.*amount_cents=eq\.0/, () => Array.from({ length: usados }, (_, i) => ({ id: "u" + i }))],
    [/POST .*\/unlocks/, (_u, o) => { usados++; return [Object.assign({ id: "nuevo" }, JSON.parse(o.body))]; }]
  ]);
  try {
    const pedir = (body) => handler({ httpMethod: "POST", headers: { authorization: "Bearer t" }, body: JSON.stringify(body) });
    const info = JSON.parse((await pedir({})).body);
    assert.equal(info.gratis.restantes, 1);
    const r = await pedir({ candidateRef: P1 });
    assert.equal(r.statusCode, 200, r.body);
    const fila = sb.llamadas.find((c) => c.m === "POST" && /unlocks/.test(c.u)).body;
    assert.equal(fila.status, "paid");
    assert.equal(fila.amount_cents, 0);
    const r2 = await pedir({ candidateRef: P2 });
    assert.equal(r2.statusCode, 402);
    assert.equal(JSON.parse(r2.body).code, "no_free_unlocks");
  } finally { sb.restaurar(); }
});

test("apply guarda el cribado y la postulación entra aunque no cumpla una eliminatoria", async () => {
  const { handler } = require("../netlify/functions/lib/handlers/apply.js");
  const JOB = "b2b2b2b2-0000-4000-8000-000000000001";
  const sb = supabaseFalso([
    usuario(P1, "candidate"),
    [/GET .*\/profiles/, () => [{ id: P1, user_id: P1 }]],
    [/GET .*\/jobs/, () => [{ id: JOB, title: "Técnico", company_user_id: "e0", dilemmas: [], screening: [
      { grupo: "requisito", texto: "¿Tienes permiso para trabajar en España?", esperada: "si", eliminatoria: true }
    ] }]],
    [/POST .*\/applications/, (_u, o) => [JSON.parse(o.body)]]
  ]);
  try {
    const pedir = (body) => handler({ httpMethod: "POST", headers: { authorization: "Bearer t" }, body: JSON.stringify(body) });
    assert.equal((await pedir({ jobId: JOB })).statusCode, 400, "sin responder no se postula");
    const r = await pedir({ jobId: JOB, screeningAnswers: ["no"] });
    assert.equal(r.statusCode, 200, r.body);
    const b = JSON.parse(r.body);
    assert.equal(b.application.status, "aplicado", "no se descarta a nadie de forma automática");
    assert.equal(b.cribado.cumple, false);
    const fila = sb.llamadas.find((c) => c.m === "POST" && /applications/.test(c.u)).body;
    assert.equal(fila.screening_answers[0].respuesta, "no");
    assert.equal(fila.screening_answers[0].cumple, false);
  } finally { sb.restaurar(); }
});

// ── Buscador del navegador ──
function buscador(candidatos) {
  const raiz = path.join(__dirname, "..", "assets", "js", "app");
  const ctx = {
    console, Math, Number, String, Array, JSON, Set, Map, Object, RegExp,
    CANDIDATES: candidatos, COMMON_EXERCISES: [{ skill: "Negociación" }, { skill: "Contabilidad" }],
    TP_COND: { jornadas: { completa: "Jornada completa", parcial: "Media jornada" }, modalidades: { remoto: "Remoto", presencial: "Presencial" }, contratos: { indefinido: "Indefinido" }, disponibilidad: { inmediata: "Inmediata", mes: "En 1 mes" } },
    TP_APP_ESTADOS: {}, unlockContact() {}, openDashEmp() {}, publishJob: async () => {}, renderEmpPool() {},
    tpNorm: (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(),
    tpK: (n) => Math.round(n / 1000) + " k€",
    tpEsPersonaSkill: (n) => n === "Negociación", escHtml: (s) => String(s)
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(raiz, "01b-taxonomia.js"), "utf8"), ctx);
  vm.runInContext(fs.readFileSync(path.join(raiz, "25-talento.js"), "utf8") + ";this.api={TPBusca,tpBuscaReglas,tpBuscaFiltrar,tpBuscaLeerTexto};", ctx);
  ctx.api.TPBusca.init();
  return ctx.api;
}

test("el buscador combina filtros, cuenta y encuentra skills fuera del top 6", () => {
  const cands = [
    { id: "1", sector: "RRHH", cond: { busqueda: "activa", ciudad: "Madrid", modalidades: ["presencial"] }, skills: [], todas: [{ n: "Negociación", v: 72 }], interesa: true, postulado: 0 },
    { id: "2", sector: "RRHH", cond: { busqueda: "abierta", ciudad: "Sevilla", modalidades: ["remoto"] }, skills: [{ n: "Negociación", v: 45 }], postulado: 1 },
    { id: "3", sector: "Finanzas", cond: { ciudad: "Bilbao" }, skills: [{ n: "Contabilidad", v: 90 }] }
  ];
  const { TPBusca, tpBuscaReglas, tpBuscaFiltrar } = buscador(cands);
  const f = TPBusca.f;
  const ids = () => tpBuscaFiltrar(tpBuscaReglas()).map((c) => c.id).join(",");
  f.skills = [{ n: "Negociación", min: "bueno" }];
  assert.equal(ids(), "1");
  f.skills = [{ n: "Negociación", min: "aceptable" }];
  f.ciudad = "Madrid";
  assert.equal(ids(), "1,2", "incluye a quien trabaja en remoto");
  f.remotos = false;
  assert.equal(ids(), "1");
  f.ciudad = ""; f.skills = []; f.interesa = true;
  assert.equal(ids(), "1,2", "interés marcado o postulación");
  f.interesa = false; f.situacion = ["activa"];
  const reglas = tpBuscaReglas();
  assert.equal(tpBuscaFiltrar(reglas).length, 1);
  assert.equal(tpBuscaFiltrar(reglas, "situacion").length, 3, "quitar un filtro vuelve a contar sin él");
});

test("sin IA, el buscador lee la descripción y la convierte en filtros", () => {
  const { tpBuscaLeerTexto } = buscador([]);
  const p = tpBuscaLeerTexto("Busco técnico de selección en Madrid, en remoto, que negocie bien: negociación y contabilidad. Jornada completa, indefinido, hasta 30k, incorporación inmediata.");
  assert.equal(JSON.stringify(p.skillRequirements.map((r) => r.skill).sort()), JSON.stringify(["Contabilidad", "Negociación"]));
  assert.equal(p.area, "rrhh");
  assert.equal(p.modalidad, "remoto");
  assert.equal(p.jornada, "completa");
  assert.equal(p.contrato, "indefinido");
  assert.equal(p.ubicacion, "Madrid");
  assert.equal(p.salMax, 30000);
  assert.equal(p.disponibilidad, "inmediata");
});
