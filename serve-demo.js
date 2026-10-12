/**
 * Servidor de demo local para TalentPact — sin dependencias externas.
 *
 * Replica el comportamiento de `netlify dev` para la demo: sirve los archivos
 * estáticos (index.html, etc.) y ejecuta las funciones serverless de
 * netlify/functions/ en los endpoints /.netlify/functions/<nombre>.
 *
 * Requisitos: Node >= 18 (usa fetch global) y un archivo `.env` en la raiz
 * (copialo de `.env.example`). Las variables ya exportadas en el shell tienen
 * prioridad sobre las del `.env`.
 *
 * Uso:
 *   cp .env.example .env   &&   rellena los valores
 *   node serve-demo.js
 *   # abre http://localhost:8888
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

// --- Carga de .env (sin dependencias) ---------------------------------------
// Netlify inyecta sus propias variables de entorno; en local las leemos del
// archivo `.env` de la raiz. Lo ya presente en el entorno NO se sobrescribe.
function loadDotEnv(file) {
  if (!fs.existsSync(file)) return 0;
  let loaded = 0;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim().replace(/^export\s+/, "");
    let value = line.slice(eq + 1).trim();
    if (/^".*"$/.test(value) || /^'.*'$/.test(value)) value = value.slice(1, -1);
    if (!key || process.env[key] !== undefined) continue;
    process.env[key] = value;
    loaded++;
  }
  return loaded;
}
const DOTENV_COUNT = loadDotEnv(path.join(__dirname, ".env"));

// Cabeceras de seguridad: las mismas que netlify.toml declara para producción.
// Se leen de ahí para que la demo no se aparte de lo que se despliega.
function loadSecurityHeaders(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  let inValues = false;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith("[")) { inValues = line === "[headers.values]"; continue; }
    if (!inValues || !line || line.startsWith("#")) continue;
    const m = /^([A-Za-z-]+)\s*=\s*"(.*)"$/.exec(line);
    if (m && m[1] !== "Strict-Transport-Security") out[m[1]] = m[2]; // HSTS no tiene sentido en http://localhost
  }
  return out;
}
const SECURITY_HEADERS = loadSecurityHeaders(path.join(__dirname, "netlify.toml"));

const PORT = process.env.PORT || 8888;
const ROOT = __dirname;
const FUNCTIONS_DIR = path.join(ROOT, "netlify", "functions");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      // Netlify corta los cuerpos en 6 MB; aquí igual, para no llenar la memoria.
      if (data.length > 6 * 1024 * 1024) { data = ""; req.destroy(); resolve(""); }
    });
    req.on("end", () => resolve(data));
  });
}

// Ejecuta la misma entrada que Netlify (netlify/functions/<nombre>.mjs, API
// moderno: Request → Response), así el adaptador se prueba también en local.
// Las entradas .mjs se cachean: tras cambiar una función, reinicia el servidor.
const { pathToFileURL } = require("url");
const HOP_BY_HOP = new Set(["connection", "keep-alive", "transfer-encoding", "upgrade", "content-length"]);

async function handleFunction(req, res, fnName) {
  const fnPath = path.join(FUNCTIONS_DIR, fnName + ".mjs");
  if (!fs.existsSync(fnPath)) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "Function not found: " + fnName }));
    return;
  }
  try {
    const body = await readBody(req);
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (!HOP_BY_HOP.has(k) && v != null) headers.set(k, Array.isArray(v) ? v.join(", ") : v);
    }
    const url = new URL(req.url, "http://" + (req.headers.host || "localhost:" + PORT));
    const sinCuerpo = req.method === "GET" || req.method === "HEAD";
    const request = new Request(url, { method: req.method, headers, body: sinCuerpo ? undefined : body });
    const mod = await import(pathToFileURL(fnPath).href);
    const response = await mod.default(request, { ip: req.socket.remoteAddress });
    const out = {};
    response.headers.forEach((v, k) => { out[k] = v; });
    res.writeHead(response.status, out);
    res.end(await response.text());
  } catch (err) {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "Server error en la función", details: err.message }));
  }
}

function serveStatic(req, res) {
  let urlPath;
  // Una URL mal codificada (%E0%A4%A) hace lanzar a decodeURIComponent; sin
  // capturarlo, la excepción tumbaba el servidor entero en mitad de la demo.
  try { urlPath = decodeURIComponent(req.url.split("?")[0]); }
  catch (_e) { res.writeHead(400); res.end("Bad request"); return; }
  if (urlPath === "/") urlPath = "/index.html";
  const filePath = path.join(ROOT, path.normalize(urlPath));
  // Fuera de la raíz, o cualquier ruta con un segmento oculto (.env, .git/…):
  // ahí viven las claves de API y la clave privada del emisor.
  const rel = path.relative(ROOT, filePath);
  if (rel.startsWith("..") || path.isAbsolute(rel) || rel.split(path.sep).some((s) => s.startsWith(".")) ||
      rel.split(path.sep)[0] === "node_modules") {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("404 — No encontrado: " + urlPath);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, Object.assign({ "content-type": MIME[ext] || "application/octet-stream" }, SECURITY_HEADERS));
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  const fnMatch = req.url.match(/^\/\.netlify\/functions\/([\w-]+)/);
  if (fnMatch) return handleFunction(req, res, fnMatch[1]);
  if (req.method === "POST" && req.url === "/") {
    // El formulario de contacto hace POST a "/"; respondemos 200 sin procesar.
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("OK");
    return;
  }
  serveStatic(req, res);
});

function envState(name) {
  return process.env[name] ? "✓" : "✗";
}

// Solo en esta máquina por defecto: escuchar en todas las interfaces exponía
// las funciones (y la API key que gastan) a cualquiera de la misma red wifi.
// HOST=0.0.0.0 para enseñarlo desde otro dispositivo a propósito.
const HOST = process.env.HOST || "127.0.0.1";
server.listen(PORT, HOST, () => {
  console.log("");
  console.log("  TalentPact — servidor de demo");
  console.log("  ▶ http://localhost:" + PORT);
  console.log("  ▶ Verificador público: http://localhost:" + PORT + "/verify.html");
  console.log("  ▶ .env: " + (DOTENV_COUNT ? DOTENV_COUNT + " variable(s) cargada(s)" : "no encontrado (copia .env.example)"));
  console.log("");
  console.log("    IA          ANTHROPIC_API_KEY " + envState("ANTHROPIC_API_KEY"));
  console.log("    Datos       SUPABASE_URL " + envState("SUPABASE_URL") + "   SUPABASE_SERVICE_KEY " + envState("SUPABASE_SERVICE_KEY"));
  console.log("    Blockchain  ISSUER_PRIVATE_KEY " + envState("ISSUER_PRIVATE_KEY") + "   SKILLPASS_CONTRACT_ADDRESS " + envState("SKILLPASS_CONTRACT_ADDRESS"));
  console.log("");
  console.log("  Diagnóstico completo:  npm run doctor");
  console.log("");
});
