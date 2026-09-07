/**
 * set-supabase — apunta el proyecto a OTRA instancia de Supabase.
 *
 * La URL y la clave anon estan escritas dentro de index.html (el producto es un
 * unico HTML sin build, asi que no hay variables de entorno en el navegador).
 * Cambiarlas a mano en un archivo de ~800 KB es incomodo y facil de estropear,
 * y ademas hay que dejar .env en el mismo proyecto o el backend y el frontend
 * acabarian hablando con bases de datos distintas: un fallo silencioso y muy
 * desconcertante. Este script cambia los dos sitios a la vez.
 *
 * La clave anon es publica por diseño (el acceso a datos va por funciones con
 * la service_role); la que NUNCA debe pasar por aqui es la service_role.
 *
 * Uso:
 *   node tfm/tech/scripts/set-supabase.js https://xxxx.supabase.co eyJhbGci...
 *   node tfm/tech/scripts/set-supabase.js --mostrar     (solo consultar)
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..", "..");
const INDEX = path.join(ROOT, "index.html");
const ENV = path.join(ROOT, ".env");

const RE_URL = /const TP_SUPABASE_URL='([^']*)'/;
const RE_ANON = /const TP_SUPABASE_ANON='([^']*)'/;

function leerActual() {
  const html = fs.readFileSync(INDEX, "utf8");
  const url = html.match(RE_URL);
  const anon = html.match(RE_ANON);
  if (!url || !anon) {
    throw new Error(
      "No se encontraron TP_SUPABASE_URL / TP_SUPABASE_ANON en index.html. " +
      "Si se han renombrado, actualiza este script: apuntar a medias es peor que no apuntar."
    );
  }
  return { html, url: url[1], anon: anon[1] };
}

function recortar(s, n = 24) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

const args = process.argv.slice(2);

if (!args.length || args[0] === "--mostrar" || args[0] === "-m") {
  const { url, anon } = leerActual();
  console.log("");
  console.log("  index.html apunta a:");
  console.log("    URL  " + url);
  console.log("    anon " + recortar(anon, 32));
  if (fs.existsSync(ENV)) {
    const env = fs.readFileSync(ENV, "utf8");
    const m = env.match(/^SUPABASE_URL=(.*)$/m);
    console.log("");
    console.log("  .env (backend) apunta a:");
    console.log("    URL  " + (m ? m[1].trim() : "(no definida)"));
    if (m && m[1].trim() && m[1].trim() !== url) {
      console.log("");
      console.log("  ⚠  El frontend y el backend apuntan a proyectos DISTINTOS.");
      console.log("     El login funcionaria contra uno y los datos se guardarian en el otro.");
    }
  }
  console.log("");
  console.log("  Para cambiarlo:  npm run set:supabase -- <url> <clave-anon>");
  console.log("");
  process.exit(0);
}

const [nuevaUrl, nuevaAnon] = args;

if (!nuevaUrl || !nuevaAnon) {
  console.error("\n  Faltan argumentos.  Uso: npm run set:supabase -- <url> <clave-anon>\n");
  process.exit(1);
}
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(nuevaUrl)) {
  console.error("\n  La URL no parece de Supabase: " + nuevaUrl);
  console.error("  Se espera algo como https://abcdefghijkl.supabase.co\n");
  process.exit(1);
}
// Las claves de Supabase son JWT: tres partes separadas por puntos.
if (nuevaAnon.split(".").length !== 3) {
  console.error("\n  La clave anon no parece un JWT valido (deberia tener tres partes separadas por puntos).\n");
  process.exit(1);
}
// Salvaguarda: la service_role lleva "service_role" en el payload y jamas debe
// acabar en index.html, que es publico.
try {
  const payload = JSON.parse(Buffer.from(nuevaAnon.split(".")[1], "base64").toString("utf8"));
  if (payload.role && payload.role !== "anon") {
    console.error("\n  ⛔ Esa clave tiene rol \"" + payload.role + "\", no \"anon\".");
    console.error("  index.html es publico: la service_role daria acceso total a la base de datos.");
    console.error("  Usa la clave anon (Supabase → Project Settings → API → anon public).\n");
    process.exit(1);
  }
} catch (_e) {
  console.warn("  (aviso) no se pudo leer el payload de la clave; continuo igualmente.");
}

const url = nuevaUrl.replace(/\/$/, "");
const { html, url: antesUrl } = leerActual();

const nuevoHtml = html
  .replace(RE_URL, "const TP_SUPABASE_URL='" + url + "'")
  .replace(RE_ANON, "const TP_SUPABASE_ANON='" + nuevaAnon + "'");
fs.writeFileSync(INDEX, nuevoHtml, "utf8");

console.log("");
console.log("  index.html:  " + antesUrl + "  ->  " + url);

// .env: solo la URL. La service_role hay que copiarla a mano desde el panel,
// a proposito: no conviene que un script la mueva de sitio.
if (fs.existsSync(ENV)) {
  const env = fs.readFileSync(ENV, "utf8");
  if (/^SUPABASE_URL=.*$/m.test(env)) {
    fs.writeFileSync(ENV, env.replace(/^SUPABASE_URL=.*$/m, "SUPABASE_URL=" + url), "utf8");
    console.log("  .env:        SUPABASE_URL actualizada");
  } else {
    console.log("  .env:        no tiene SUPABASE_URL; añadela a mano");
  }
} else {
  console.log("  .env:        no existe (copia .env.example)");
}

console.log("");
console.log("  Falta por hacer a mano:");
console.log("    1. SUPABASE_SERVICE_KEY en .env y en Vercel (Project Settings → API → service_role)");
console.log("    2. Ejecutar tfm/tech/supabase_bootstrap.sql en el SQL Editor del proyecto nuevo");
console.log("    3. Authentication → URL Configuration: Site URL y Redirect URLs");
console.log("    4. Comprobar:  npm run doctor  &&  npm run test:supabase");
console.log("");
