/**
 * Currículum en PDF del candidato.
 *  · Solo se aceptan PDF de verdad y de hasta 4 MB; el nombre no se usa como ruta.
 *  · La empresa solo recibe un enlace firmado si ha desbloqueado al candidato
 *    y este sigue aceptando contacto; cada entrega queda registrada.
 *  · El pool solo dice si hay CV, y sin la columna no pierde el filtro de visibilidad.
 *  · Al borrar la cuenta se borra también el PDF.
 */
const test = require("node:test");
const assert = require("node:assert/strict");

const cv = require("../netlify/functions/lib/cv.js");

const P1 = "a1a1a1a1-0000-4000-8000-000000000001";
const EMP = "e0e0e0e0-0000-4000-8000-000000000001";
const PDF = Buffer.concat([Buffer.from("%PDF-1.7\n"), Buffer.alloc(200, 32)]).toString("base64");

/** Supabase falso: rutas [regex, (url, opts) => datos | {status, data}]. */
function supabaseFalso(rutas) {
  process.env.SUPABASE_URL = "https://ejemplo.supabase.co";
  process.env.SUPABASE_SERVICE_KEY = "clave-servicio";
  const llamadas = [];
  const real = globalThis.fetch;
  globalThis.fetch = async (url, opts = {}) => {
    const u = String(url), m = opts.method || "GET";
    llamadas.push({ u, m, opts });
    let status = 200, data = [];
    for (const [re, fn] of rutas) {
      if (!re.test(m + " " + u)) continue;
      const r = fn(u, opts);
      if (r && r.status) ({ status, data } = r); else data = r;
      break;
    }
    return { ok: status < 400, status, headers: { get: () => null }, json: async () => data, text: async () => JSON.stringify(data) };
  };
  return { llamadas, restaurar: () => { globalThis.fetch = real; } };
}
const usuario = (id, rol) => [/GET .*\/auth\/v1\/user$/, () => ({ id, email: "x@acme.es", user_metadata: { role: rol } })];
const pedir = (handler, body) => handler({ httpMethod: "POST", headers: { authorization: "Bearer t" }, body: JSON.stringify(body) });

test("solo PDF de verdad, hasta 4 MB, y un nombre limpio", () => {
  assert.ok(cv.leerPdf(PDF).buf);
  assert.equal(cv.leerPdf(Buffer.from("<html>hola</html>").toString("base64")).status, 415, "no basta con llamarlo .pdf");
  assert.equal(cv.leerPdf("").status, 400);
  const grande = Buffer.concat([Buffer.from("%PDF-"), Buffer.alloc(cv.MAX_BYTES)]).toString("base64");
  assert.equal(cv.leerPdf(grande).status, 413);
  assert.equal(cv.nombreLimpio("../../etc/Mi CV <script>.PDF"), "Mi CV script.pdf");
  assert.equal(cv.nombreLimpio(""), "curriculum.pdf");
  assert.equal(cv.rutaDe(P1), P1 + ".pdf", "la ruta sale del perfil, no del nombre");
  assert.equal(cv.metaPublica({ nombre: "x" }), null);
});

test("la empresa solo abre el CV si lo ha desbloqueado y el candidato acepta contacto", async () => {
  const { handler } = require("../netlify/functions/lib/handlers/cv.js");
  let pagado = false, acepta = true;
  const sb = supabaseFalso([
    usuario(EMP, "empresa"),
    [/GET .*\/companies/, () => [{ id: "c1" }]],
    [/GET .*\/unlocks/, () => (pagado ? [{ id: "u1" }] : [])],
    [/GET .*\/profiles/, () => [{ id: P1, allow_contact: acepta, cv: { nombre: "cv.pdf", bytes: 10, subido: "2026-10-21T10:00:00Z" } }]],
    [/POST .*\/storage\/v1\/object\/sign\/cvs\//, () => ({ signedURL: `/object/sign/cvs/${P1}.pdf?token=abc` })]
  ]);
  try {
    const r1 = await pedir(handler, { accion: "ver", candidateRef: P1 });
    assert.equal(r1.statusCode, 402);
    assert.ok(!sb.llamadas.some((c) => /storage/.test(c.u)), "sin desbloqueo ni se firma");

    pagado = true;
    const r2 = await pedir(handler, { accion: "ver", candidateRef: P1 });
    assert.equal(r2.statusCode, 200, r2.body);
    const b = JSON.parse(r2.body);
    assert.match(b.url, /^https:\/\/ejemplo\.supabase\.co\/storage\/v1\/object\/sign\/cvs\/.+token=abc/);
    const firma = sb.llamadas.find((c) => /object\/sign/.test(c.u));
    assert.equal(JSON.parse(firma.opts.body).expiresIn, cv.FIRMA_EMPRESA_S);
    assert.ok(sb.llamadas.some((c) => c.m === "POST" && /contact_access/.test(c.u)), "la entrega queda registrada");

    acepta = false;
    assert.equal((await pedir(handler, { accion: "ver", candidateRef: P1 })).statusCode, 409, "retirar el consentimiento corta el acceso");
  } finally { sb.restaurar(); }
});

test("el candidato sube su PDF al bucket privado y se guarda en su perfil", async () => {
  const { handler } = require("../netlify/functions/lib/handlers/cv.js");
  const sb = supabaseFalso([
    usuario(P1, "candidate"),
    [/GET .*\/companies/, () => []],
    [/GET .*\/profiles/, () => [{ id: P1, user_id: P1, cv: null }]],
    [/PATCH .*\/profiles/, (_u, o) => [Object.assign({ id: P1 }, JSON.parse(o.body))]],
    [/POST .*\/storage\/v1\/object\/cvs\//, () => ({ Key: "cvs/x" })]
  ]);
  try {
    assert.equal((await pedir(handler, { accion: "subir", nombre: "cv.pdf", base64: Buffer.from("hola").toString("base64") })).statusCode, 415);
    const r = await pedir(handler, { accion: "subir", nombre: "Ana López CV.pdf", base64: PDF });
    assert.equal(r.statusCode, 200, r.body);
    const subida = sb.llamadas.find((c) => c.m === "POST" && /object\/cvs\//.test(c.u));
    assert.ok(subida.u.endsWith(`/object/cvs/${P1}.pdf`));
    assert.equal(subida.opts.headers["content-type"], "application/pdf");
    assert.equal(subida.opts.headers["x-upsert"], "true");
    const patch = JSON.parse(sb.llamadas.find((c) => c.m === "PATCH" && /profiles/.test(c.u)).opts.body);
    assert.equal(patch.cv.nombre, "Ana López CV.pdf");
    assert.equal(patch.cv.bytes, Buffer.from(PDF, "base64").length);
  } finally { sb.restaurar(); }
});

test("sin el bucket se avisa de la configuración, sin fingir que se ha guardado", async () => {
  const { handler } = require("../netlify/functions/lib/handlers/cv.js");
  const sb = supabaseFalso([
    usuario(P1, "candidate"),
    [/GET .*\/companies/, () => []],
    [/GET .*\/profiles/, () => [{ id: P1, user_id: P1, cv: null }]],
    [/POST .*\/storage/, () => ({ status: 400, data: { statusCode: "404", error: "Bucket not found" } })]
  ]);
  try {
    const r = await pedir(handler, { accion: "subir", nombre: "cv.pdf", base64: PDF });
    assert.equal(r.statusCode, 503);
    assert.equal(JSON.parse(r.body).code, "cv_sin_configurar");
    assert.ok(!sb.llamadas.some((c) => c.m === "PATCH"));
  } finally { sb.restaurar(); }
});

test("el pool dice si hay CV y, sin la columna, mantiene el filtro de visibilidad", async () => {
  const { handler, construirPool } = require("../netlify/functions/lib/handlers/get-talent-pool.js");
  const ficha = construirPool([{ id: P1, user_id: P1, cv: { nombre: "cv.pdf", subido: "2026-10-21" } }], [{ profile_id: P1, skill: "A", score: 70 }])[0];
  assert.equal(ficha.cv, true);
  assert.equal("nombre" in ficha, false);

  const sb = supabaseFalso([
    usuario(EMP, "empresa"),
    [/GET .*\/profiles\?select=[^&]*,cv&/, () => ({ status: 400, data: { message: "column profiles.cv does not exist" } })],
    [/GET .*\/profiles/, () => []]
  ]);
  try {
    const r = await pedir(handler, {});
    assert.equal(r.statusCode, 200, r.body);
    const consultas = sb.llamadas.filter((c) => /\/rest\/v1\/profiles/.test(c.u)).map((c) => c.u);
    assert.equal(consultas.length, 2);
    assert.match(consultas[1], /pool_visible=is\.true/, "nunca cae a la consulta sin filtro por culpa del CV");
  } finally { sb.restaurar(); }
});

test("borrar la cuenta borra también el PDF del currículum", async () => {
  const { handler } = require("../netlify/functions/lib/handlers/delete-account.js");
  const sb = supabaseFalso([
    usuario(P1, "candidate"),
    [/GET .*\/profiles/, () => [{ id: P1 }]],
    [/DELETE .*\/storage\/v1\/object\/cvs\//, () => ({ status: 404, data: { error: "not_found" } })]
  ]);
  try {
    const r = await pedir(handler, {});
    assert.equal(r.statusCode, 200, r.body);
    const i = sb.llamadas.findIndex((c) => c.m === "DELETE" && c.u.endsWith(`/object/cvs/${P1}.pdf`));
    const j = sb.llamadas.findIndex((c) => c.m === "DELETE" && /rest\/v1\/profiles/.test(c.u));
    assert.ok(i >= 0 && i < j, "el PDF se borra antes que el perfil (y sin PDF no falla)");
  } finally { sb.restaurar(); }
});
