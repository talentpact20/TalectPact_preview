/**
 * Extrae el código fuente de una función declarada en el JS de cliente
 * (assets/js/app/*.js, que index.html carga en orden).
 *
 * Son scripts clásicos que comparten el ámbito global, sin build ni módulos:
 * la lógica de cliente no se puede `require`. El test lee la declaración, la
 * aísla por conteo de llaves y la evalúa en su propio ámbito.
 *
 * Si alguien renombra la función, el test falla con un mensaje explícito en
 * lugar de pasar en verde sobre código que ya no existe.
 */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const APP_DIR = path.join(__dirname, "..", "..", "assets", "js", "app");

/** Todo el JS de cliente, en el mismo orden en que lo carga index.html. */
function clientSource() {
  return fs.readdirSync(APP_DIR).filter((f) => f.endsWith(".js")).sort()
    .map((f) => fs.readFileSync(path.join(APP_DIR, f), "utf8")).join("\n");
}

function extractSource(name, file) {
  const html = file ? fs.readFileSync(file, "utf8") : clientSource();
  const start = html.indexOf(`function ${name}(`);
  if (start === -1) {
    throw new Error(
      `No se encontró "function ${name}(" en ${file ? path.basename(file) : "assets/js/app"}. ` +
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
function loadFunctions(names, file) {
  const src = names.map((n) => extractSource(n, file)).join("\n");
  const context = vm.createContext({});
  vm.runInContext(`${src}\n;({ ${names.join(", ")} })`, context);
  return vm.runInContext(`({ ${names.join(", ")} })`, context);
}

/**
 * Extrae el valor de una constante declarada dentro de index.html (por ejemplo
 * el catálogo COMMON_EXERCISES o candidateProfile).
 *
 * Mismo motivo que extractSource: el catálogo vive dentro del HTML y no se
 * puede `require`. A diferencia de aquélla, aquí sí hace falta saltarse el
 * contenido de las cadenas: los enunciados de los retos llevan corchetes y
 * llaves dentro del texto, y contarlos rompería el aislamiento.
 */
function extractDeclaration(name, file) {
  const html = file ? fs.readFileSync(file, "utf8") : clientSource();
  const decl = new RegExp(`(?:const|let|var)\\s+${name}\\s*=`).exec(html);
  if (!decl) {
    throw new Error(
      `No se encontró la declaración de ${name} en ${file ? path.basename(file) : "assets/js/app"}. ` +
      `Si se ha renombrado, actualiza el test: cubre un dato de producto, no decoración.`
    );
  }
  const inicio = decl.index + decl[0].length;
  let i = inicio;
  while (/\s/.test(html[i])) i++;
  const abre = html[i];
  const cierra = { "[": "]", "{": "}" }[abre];
  if (!cierra) throw new Error(`${name} no abre con [ ni con {`);
  let profundidad = 0, comilla = null;
  for (; i < html.length; i++) {
    const c = html[i];
    if (comilla) {
      if (c === "\\") { i++; continue; }   // escape dentro de la cadena
      if (c === comilla) comilla = null;
      continue;
    }
    if (c === "'" || c === '"' || c === "`") { comilla = c; continue; }
    if (c === abre) profundidad++;
    else if (c === cierra) {
      profundidad--;
      if (profundidad === 0) return html.slice(inicio, i + 1);
    }
  }
  throw new Error(`Delimitadores sin cerrar al extraer ${name}`);
}

/**
 * Evalúa esa constante y devuelve el valor.
 *
 * El round-trip por JSON no es decorativo: sin él los arrays vuelven del
 * contexto del vm con otro prototipo y deepStrictEqual falla comparando dos
 * listas idénticas. Los catálogos son datos puros, así que la copia es exacta.
 */
function loadValue(name, file) {
  return JSON.parse(JSON.stringify(vm.runInNewContext(`(${extractDeclaration(name, file)})`)));
}

module.exports = { extractSource, loadFunctions, extractDeclaration, loadValue, clientSource, APP_DIR };
