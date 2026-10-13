/**
 * Sistema de diseño.
 *
 * Los colores, tamaños de letra y estilos viven en tokens (assets/css/tokens.css)
 * y en clases; estos tests impiden que vuelvan los valores escritos a mano, que
 * rompían el modo oscuro y hacían imposible mantener una estética coherente.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const RAIZ = path.join(__dirname, "..");
const leer = (p) => fs.readFileSync(path.join(RAIZ, p), "utf8");
const sinComentarios = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");
const CSS = fs.readdirSync(path.join(RAIZ, "assets/css")).filter((f) => f.endsWith(".css"));
const index = leer("index.html");

test("los CSS no llevan colores ni tamaños de letra escritos a mano: usan tokens", () => {
  for (const f of CSS.filter((f) => f !== "tokens.css")) {
    const css = sinComentarios(leer("assets/css/" + f));
    const cuerpos = (css.match(/\{[^{}]*\}/g) || []).join("");
    assert.deepEqual(cuerpos.match(/#[0-9a-fA-F]{3,8}\b/g) || [], [], `${f} tiene colores hexadecimales`);
    assert.deepEqual(cuerpos.match(/:\s*white\b|[\s,(]white\b/g) || [], [], `${f} usa white en lugar de un token`);
    const tamanos = (cuerpos.match(/font-size:\s*[^;}]+/g) || []).filter((d) => !/var\(--fs-|clamp\(|inherit/.test(d));
    assert.deepEqual(tamanos, [], `${f} tiene tamaños de letra fuera de la escala`);
  }
});

test("toda variable CSS que se usa está definida", () => {
  const definidas = new Set();
  const usadas = new Map();
  for (const f of CSS) {
    const css = sinComentarios(leer("assets/css/" + f));
    for (const m of css.matchAll(/(--[a-z0-9-]+)\s*:/gi)) definidas.add(m[1]);
    for (const m of css.matchAll(/var\((--[a-z0-9-]+)/gi)) usadas.set(m[1], f);
  }
  for (const m of index.matchAll(/var\((--[a-z0-9-]+)/gi)) usadas.set(m[1], "index.html");
  // Las que fija el JavaScript en tiempo de ejecución (style.setProperty) también cuentan.
  for (const f of fs.readdirSync(path.join(RAIZ, "assets/js/app"))) {
    for (const m of leer("assets/js/app/" + f).matchAll(/setProperty\(\s*['"](--[a-z0-9-]+)/gi)) definidas.add(m[1]);
  }
  const faltan = [...usadas].filter(([v]) => !definidas.has(v)).map(([v, f]) => `${v} (${f})`);
  assert.deepEqual(faltan, []);
});

test("hay modo oscuro por preferencia del sistema y por elección del usuario", () => {
  const t = leer("assets/css/tokens.css");
  assert.match(t, /@media \(prefers-color-scheme:dark\)\{\s*:root:not\(\[data-theme="light"\]\)/);
  assert.match(t, /:root\[data-theme="dark"\]\{/);
  for (const v of ["--c-superficie", "--c-texto", "--c-sobre-tinta", "--slate-900", "--emerald-600"]) {
    assert.ok((t.match(new RegExp(v + ":", "g")) || []).length >= 3, `${v} no se redefine en oscuro`);
  }
  // El tema se aplica en <head> antes de pintar, para que no haya destello.
  const cabeza = index.slice(0, index.indexOf("</head>"));
  assert.ok(cabeza.indexOf("head/tema.js") < cabeza.indexOf("assets/css/"), "tema.js debe ir antes de los CSS");
  assert.ok(cabeza.indexOf("tokens.css") < cabeza.indexOf("app.css"), "tokens.css debe cargarse el primero");
});

test("index.html no lleva estilos en línea salvo el estado que cambia el JavaScript", () => {
  const estilos = [...index.matchAll(/\sstyle="([^"]*)"/g)].map((m) => m[1]);
  const raros = estilos.filter((s) => !/^(display:none|width:\d+(\.\d+)?%)$/.test(s));
  assert.deepEqual(raros, []);
  const util = leer("assets/css/utilidades.css");
  const faltan = [...new Set([...index.matchAll(/\b(u-[a-z0-9_-]+)/g)].map((m) => m[1]))].filter((c) => !util.includes("." + c + "{"));
  assert.deepEqual(faltan, [], "clases de utilidad usadas que no existen");
});

test("las cifras de los paneles no traen números de ejemplo: salen de los datos", () => {
  const valores = [...index.matchAll(/class="dsc-val[^"]*"[^>]*>([^<]*)</g)].map((m) => m[1].trim());
  assert.ok(valores.length >= 8);
  for (const v of valores) assert.ok(v === "—" || v === "0", `cifra fija en un panel: ${v}`);
  assert.doesNotMatch(index, /TechCorp|127<\/div>|4 activas/);
});

// Carga 18-interfaz.js en un contexto aislado con lo mínimo del navegador.
function interfaz() {
  const ctx = {
    console, Math, Number, String, Array, JSON,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [], querySelector: () => null, documentElement: { setAttribute() {}, removeAttribute() {}, getAttribute: () => null } },
    tpIcon: (n) => `<i data-i="${n}"></i>`
  };
  vm.createContext(ctx);
  vm.runInContext(leer("assets/js/app/18-interfaz.js") + ";this.api={tpPasos,tpBarraNota,tpAnillo,tpChip,tpEncaje};", ctx);
  return ctx.api;
}

test("los componentes son accesibles y no dejan pasar HTML", () => {
  const { tpPasos, tpBarraNota, tpAnillo, tpChip, tpEncaje } = interfaz();
  const pasos = tpPasos([{ txt: "Registro", hecho: true }, { txt: "Primer reto", hecho: false }, { txt: "Pool", hecho: false }], "Perfil");
  assert.equal((pasos.match(/aria-current="step"/g) || []).length, 1, "un único paso actual");
  assert.match(pasos, /<li class="tp-paso actual" aria-current="step">.*Primer reto/);
  const barra = tpBarraNota({ nombre: "<b>x</b>", nota: 140, minimo: 60, comentario: "<script>" });
  assert.doesNotMatch(barra, /<b>x<\/b>|<script>/);
  assert.match(barra, /width:100%/, "la nota se limita a 100");
  assert.match(barra, /aria-label="&lt;b&gt;x&lt;\/b&gt;: 100 sobre 100, mínimo 60"/);
  assert.match(tpBarraNota({ nombre: "A", nota: 40, minimo: 60 }), /tp-nota bajo/, "por debajo del mínimo se marca");
  assert.match(tpAnillo(73, "media"), /role="img" aria-label="media: 73 sobre 100"/);
  assert.equal(tpChip("Verificada", "ok"), '<span class="tp-chip tp-chip-ok">Verificada</span>');
  assert.match(tpEncaje(-5), /Encaje: 0 %/);
});

test("el formulario de problemas ya no finge un envío: abre el correo", () => {
  const js = leer("assets/js/app/12-soporte-y-ranking.js");
  const f = js.slice(js.indexOf("function submitBugReport"), js.indexOf("function tpPedirRevision"));
  assert.match(f, /mailto:hello@talentpact\.io/);
  assert.doesNotMatch(f, /toast\('Reporte enviado/);
});
