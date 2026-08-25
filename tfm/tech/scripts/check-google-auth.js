/**
 * check-google-auth — comprueba, sin abrir el navegador, si el acceso con
 * Google esta bien configurado en Supabase y en Google Cloud.
 *
 * Revisa en orden lo que suele fallar:
 *   1. El proveedor Google esta habilitado en Supabase Auth.
 *   2. Supabase acepta el Client ID y redirige de verdad a Google.
 *   3. La redirect URI que Google va a recibir es la del proyecto Supabase
 *      (la que hay que pegar en Google Cloud).
 *   4. La URL de vuelta a la web esta en la lista de Redirect URLs de Supabase.
 *
 * Uso:
 *   npm run check:google                       -> comprueba http://localhost:8888/
 *   npm run check:google -- https://tu-sitio   -> comprueba tambien produccion
 */
const fs = require("fs");
const path = require("path");
const { ROOT, loadDotEnv, env } = require("./lib-env");

loadDotEnv();

// ─── Credenciales publicas: se leen del propio index.html para que el script
//     funcione sin tocar el .env (la anon key es publica por diseno). ───────
function readFrontendConfig() {
  const file = path.join(ROOT, "index.html");
  const html = fs.readFileSync(file, "utf8");
  const url = (html.match(/TP_SUPABASE_URL\s*=\s*'([^']+)'/) || [])[1];
  const anon = (html.match(/TP_SUPABASE_ANON\s*=\s*'([^']+)'/) || [])[1];
  return { url: env("SUPABASE_URL") || url, anon };
}

const { url: SUPABASE_URL, anon: ANON } = readFrontendConfig();
const SITE = (process.argv[2] || "http://localhost:8888/").replace(/\/*$/, "/");
const CALLBACK = SUPABASE_URL.replace(/\/$/, "") + "/auth/v1/callback";

const results = [];
const ok = (m, extra) => results.push({ level: "ok", m, extra });
const warn = (m, extra) => results.push({ level: "warn", m, extra });
const fail = (m, extra) => results.push({ level: "fail", m, extra });

/** Decodifica el payload de un JWT sin verificar la firma (solo lectura). */
function decodeJwtPayload(token) {
  try {
    const part = String(token).split(".")[1];
    if (!part) return null;
    const json = Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    return JSON.parse(json);
  } catch (_e) {
    return null;
  }
}

async function checkProviderEnabled() {
  let data;
  try {
    const res = await fetch(SUPABASE_URL.replace(/\/$/, "") + "/auth/v1/settings", {
      headers: { apikey: ANON }
    });
    data = await res.json();
  } catch (err) {
    fail("No se puede contactar con Supabase: " + err.message);
    return false;
  }
  const ext = (data && data.external) || {};
  if (ext.google === true) {
    ok("Google esta habilitado en Supabase Auth.");
    return true;
  }
  fail(
    "Google NO esta habilitado en Supabase Auth.",
    "Supabase -> Authentication -> Sign In / Providers -> Google -> activar y pegar\n" +
      "     el Client ID y el Client Secret de Google Cloud."
  );
  return false;
}

async function checkAuthorize() {
  const authorize =
    SUPABASE_URL.replace(/\/$/, "") +
    "/auth/v1/authorize?provider=google&redirect_to=" +
    encodeURIComponent(SITE);

  let res;
  try {
    res = await fetch(authorize, { redirect: "manual" });
  } catch (err) {
    fail("No se puede contactar con Supabase: " + err.message);
    return;
  }

  if (res.status === 400) {
    let detail = "";
    try { detail = JSON.stringify(await res.json()); } catch (_e) { /* sin cuerpo */ }
    fail("Supabase rechaza el inicio de sesion con Google (HTTP 400). " + detail,
      "Es lo que pasa cuando el proveedor esta desactivado o le falta el Client Secret.");
    return;
  }

  const location = res.headers.get("location") || "";
  if (!location) {
    fail("Supabase no devuelve redireccion (HTTP " + res.status + ").");
    return;
  }

  let target;
  try { target = new URL(location); } catch (_e) {
    fail("Supabase devuelve una redireccion ilegible: " + location);
    return;
  }

  // Si Supabase devuelve a la propia web con un error, el problema es de Google.
  const err = target.searchParams.get("error") || target.searchParams.get("error_description");
  if (err) {
    fail("Google rechaza la peticion: " + err);
    return;
  }

  if (!/accounts\.google\.com$/.test(target.hostname)) {
    fail("Supabase no redirige a Google sino a " + target.hostname + ".");
    return;
  }
  ok("Supabase redirige correctamente a la pantalla de Google.");

  const clientId = target.searchParams.get("client_id");
  const redirectUri = target.searchParams.get("redirect_uri");

  if (clientId) ok("Client ID en uso: " + clientId);
  else warn("La redireccion a Google no lleva client_id.");

  if (redirectUri === CALLBACK) {
    ok("Redirect URI que recibira Google: " + redirectUri);
  } else {
    warn("Redirect URI inesperada: " + redirectUri,
      "En Google Cloud debe estar autorizada exactamente esta:\n     " + CALLBACK);
  }

  // La URL de vuelta viaja firmada dentro de `state`. Si Supabase la ha
  // sustituido por el Site URL, es que no estaba en la lista de Redirect URLs.
  const state = decodeJwtPayload(target.searchParams.get("state"));
  const back = state && (state.referrer || state.redirect_to || state.site_url);
  if (!back) {
    warn("No se puede leer a que URL volvera la sesion (formato de `state` desconocido).",
      "Compruebalo a mano en Supabase -> Authentication -> URL Configuration.");
  } else if (String(back).replace(/\/*$/, "/") === SITE) {
    ok("Tras el login, Supabase devolvera a: " + back);
  } else {
    fail("Supabase devolvera a " + back + " en lugar de a " + SITE + ".",
      "Anade esta entrada en Supabase -> Authentication -> URL Configuration -> Redirect URLs:\n" +
        "     " + SITE + "**");
  }
}

(async () => {
  console.log("\nComprobando el acceso con Google");
  console.log("  proyecto Supabase : " + SUPABASE_URL);
  console.log("  web a comprobar   : " + SITE);
  console.log("");

  if (!ANON) {
    console.log("  [FALLO] No encuentro TP_SUPABASE_ANON en index.html.");
    process.exitCode = 1;
    return;
  }

  const enabled = await checkProviderEnabled();
  if (enabled) await checkAuthorize();

  const icon = { ok: "[OK]   ", warn: "[AVISO]", fail: "[FALLO]" };
  for (const r of results) {
    console.log("  " + icon[r.level] + " " + r.m);
    if (r.extra) console.log("     -> " + r.extra);
  }

  const fails = results.filter((r) => r.level === "fail").length;
  console.log("");
  if (fails) {
    console.log("  Faltan cosas por configurar. Guia paso a paso: README seccion 2.4.");
    console.log("  Valores que necesitas en Google Cloud:");
    console.log("    Origenes JavaScript autorizados : " + SITE.replace(/\/$/, ""));
    console.log("    URI de redireccion autorizado   : " + CALLBACK);
  } else {
    console.log("  Todo listo: el boton de Google deberia funcionar en " + SITE);
  }
  // process.exitCode en vez de process.exit(): en Windows, salir con peticiones
  // fetch aun abiertas hace que libuv aborte con un assert.
  process.exitCode = fails ? 1 : 0;
})().catch((err) => {
  console.error("Error inesperado:", err);
  process.exitCode = 2;
});
