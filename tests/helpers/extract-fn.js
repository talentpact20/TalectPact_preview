/**
 * Extrae el código fuente de una función declarada dentro de index.html.
 *
 * El producto es un único HTML de ~800 KB sin build ni módulos: la lógica de
 * cliente no se puede `require`. En vez de trocear un fichero que funciona
 * (riesgo alto, beneficio nulo para el TFM), el test lee la declaración,
 * la aísla por conteo de llaves y la evalúa en su propio ámbito.
 *
 * Si alguien renombra la función, el test falla con un mensaje explícito en
 * lugar de pasar en verde sobre código que ya no existe.
 */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const INDEX = path.join(__dirname, "..", "..", "index.html");

function extractSource(name, file = INDEX) {
  const html = fs.readFileSync(file, "utf8");
  const start = html.indexOf(`function ${name}(`);
  if (start === -1) {
    throw new Error(
      `No se encontró "function ${name}(" en ${path.basename(file)}. ` +
      `Si la función se ha renombrado o movido, actualiza el test: está cubriendo un control real, no decoración.`
    );
  }
  const open = html.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < html.length; i++) {
    const c = html[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return html.slice(start, i + 1);
    }
  }
  throw new Error(`Llaves sin cerrar al extraer ${name}`);
}

/** Devuelve las funciones pedidas, evaluadas juntas en un contexto compartido. */
function loadFunctions(names, file = INDEX) {
  const src = names.map((n) => extractSource(n, file)).join("\n");
  const context = vm.createContext({});
  vm.runInContext(`${src}\n;({ ${names.join(", ")} })`, context);
  return vm.runInContext(`({ ${names.join(", ")} })`, context);
}

module.exports = { extractSource, loadFunctions, INDEX };
