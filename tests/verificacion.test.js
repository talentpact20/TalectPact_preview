/**
 * Verificación de empresa: Google Workspace o email corporativo confirmado.
 *
 * Lo que decide el nivel lo pone Supabase o Google (identities, email
 * confirmado, configuración del proyecto), nunca user_metadata, que el propio
 * usuario puede editar. Sin red: Supabase se simula con fetch.
 */
const test = require("node:test");
const assert = require("node:assert/strict");

const v = require("../netlify/functions/lib/verificacion.js");
const { aOferta } = require("../netlify/functions/lib/handlers/list-jobs.js");
const { loadFunctions } = require("./helpers/extract-fn.js");

const google = (hd) => [{ provider: "google", identity_data: hd ? { hd, email_verified: true } : { email_verified: true } }];

test("Google Workspace verifica solo si Google certifica el mismo dominio del email", () => {
  const ok = v.verificarEmpresa({ email: "Ana@Acme.es", identities: google("acme.es") }, { autoconfirm: true });
  assert.equal(ok.nivel, "google_workspace");
  assert.equal(ok.dominio, "acme.es");
  // Otro dominio de Workspace, o una cuenta de Gmail con Google: no.
  assert.equal(v.verificarEmpresa({ email: "ana@acme.es", identities: google("otra.com") }).nivel, "sin_verificar");
  assert.equal(v.verificarEmpresa({ email: "ana@gmail.com", identities: google(null) }).motivo, "correo_gratuito");
  // El hd escrito en user_metadata lo puede poner cualquiera: no cuenta.
  const falso = v.verificarEmpresa({ email: "ana@acme.es", user_metadata: { custom_claims: { hd: "acme.es" } }, identities: [] }, { autoconfirm: true });
  assert.equal(falso.nivel, "sin_verificar");
});

test("el email corporativo solo verifica si está confirmado y el proyecto exige confirmar", () => {
  const u = { email: "rrhh@acme-iberica.com", email_confirmed_at: "2026-10-19T10:00:00Z", identities: [] };
  assert.equal(v.verificarEmpresa(u, { autoconfirm: false }).nivel, "email_corporativo");
  // Con la confirmación automática, cualquiera se registra con un correo ajeno.
  const auto = v.verificarEmpresa(u, { autoconfirm: true });
  assert.deepEqual([auto.nivel, auto.motivo, auto.dominio], ["sin_verificar", "confirmacion_desactivada", null]);
  assert.equal(v.verificarEmpresa(u, { autoconfirm: null }).nivel, "sin_verificar");   // si no se sabe, no se concede
  assert.equal(v.verificarEmpresa(Object.assign({}, u, { email_confirmed_at: null }), { autoconfirm: false }).motivo, "email_sin_confirmar");
  assert.equal(v.verificarEmpresa({ email: "rrhh@hotmail.es", email_confirmed_at: "x" }, { autoconfirm: false }).motivo, "correo_gratuito");
  assert.ok(v.AYUDA.confirmacion_desactivada.includes("Google"));
});

test("la web de la empresa solo «coincide» si es de su dominio verificado", () => {
  const u = { email: "ana@acme.es", identities: google("acme.es") };
  assert.equal(v.verificarEmpresa(u, { web: "https://www.acme.es/empleo" }).webCoincide, true);
  assert.equal(v.verificarEmpresa(u, { web: "empleo.acme.es" }).webCoincide, true);
  assert.equal(v.verificarEmpresa(u, { web: "https://acme-falsa.es" }).webCoincide, false);
  assert.equal(v.dominioDeWeb("no es una url %%"), null);
});

test("get-company calcula la verificación, la guarda en la ficha y la devuelve", async () => {
  const real = globalThis.fetch;
  process.env.SUPABASE_URL = "https://ejemplo.supabase.co";
  process.env.SUPABASE_SERVICE_KEY = "clave-servicio";
  const { handler } = require("../netlify/functions/lib/handlers/get-company.js");
  const parches = [];
  let columnaFalta = false;
  globalThis.fetch = async (url, opts = {}) => {
    const u = String(url), m = opts.method || "GET";
    const ok = (data) => ({ ok: true, status: 200, json: async () => data, text: async () => JSON.stringify(data) });
    if (u.endsWith("/auth/v1/user")) return ok({ id: "aaaaaaaa-0000-4000-8000-0000000000e1", email: "rrhh@acme.es", user_metadata: { role: "empresa" }, identities: google("acme.es") });
    if (u.endsWith("/auth/v1/settings")) return ok({ mailer_autoconfirm: true, external: { google: true } });
    if (m === "PATCH" && u.includes("/rest/v1/companies")) {
      parches.push(JSON.parse(opts.body));
      if (columnaFalta) return { ok: false, status: 400, text: async () => JSON.stringify({ message: "Could not find the 'verificacion' column of 'companies' in the schema cache" }) };
      return ok([{}]);
    }
    if (u.includes("/rest/v1/companies")) return ok([{ id: "c1", company_name: "Acme", verificacion: "sin_verificar" }]);
    return ok([]);
  };
  try {
    const r = await handler({ httpMethod: "POST", headers: { authorization: "Bearer t" }, body: "{}" });
    assert.equal(r.statusCode, 200, r.body);
    const b = JSON.parse(r.body);
    assert.equal(b.verificacion.nivel, "google_workspace");
    assert.equal(parches[0].verificacion, "google_workspace");
    assert.equal(parches[0].dominio_verificado, "acme.es");
    // Sin la migración se responde igual, sin guardar.
    columnaFalta = true;
    const r2 = await handler({ httpMethod: "POST", headers: { authorization: "Bearer t" }, body: "{}" });
    assert.equal(r2.statusCode, 200);
    assert.equal(JSON.parse(r2.body).verificacion.nivel, "google_workspace");
  } finally {
    globalThis.fetch = real;
  }
});

test("las ofertas publican el nivel de verificación, nunca el dominio", () => {
  const o = aOferta({ id: "1", title: "x", companies: { company_name: "Acme", verificacion: "google_workspace", dominio_verificado: "acme.es" } });
  assert.equal(o.company.verificacion, "google_workspace");
  assert.ok(!JSON.stringify(o).includes("acme.es"));
  assert.equal(aOferta({ id: "2", title: "y", companies: { verificacion: "<script>" } }).company.verificacion, "sin_verificar");
  assert.equal(aOferta({ id: "3", title: "z" }).company.verificacion, "sin_verificar");
});

test("el sello de empresa verificada solo aparece si lo está y el nombre propuesto sale del dominio corporativo", () => {
  const fns = loadFunctions(["tpSelloEmpresa", "tpNombreDesdeDominio"]);
  const ctx = { TP_VERIF_TXT: { google_workspace: { titulo: "Empresa verificada con Google Workspace", corto: "Empresa verificada" }, sin_verificar: { corto: "" } },
    escHtml: (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])), tpIcon: () => "" };
  const vm = require("node:vm");
  const sello = vm.runInNewContext(`(${fns.tpSelloEmpresa.toString()})`, ctx);
  assert.match(sello("google_workspace"), /Empresa verificada/);
  assert.equal(sello("sin_verificar"), "");
  assert.equal(sello("inventado"), "");
  assert.equal(fns.tpNombreDesdeDominio("ana@acme-iberica.es"), "Acme Iberica");
  assert.equal(fns.tpNombreDesdeDominio("ana@gmail.com"), "");
});
