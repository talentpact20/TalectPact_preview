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
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
  });
}

async function handleFunction(req, res, fnName) {
  const fnPath = path.join(FUNCTIONS_DIR, fnName + ".js");
  if (!fs.existsSync(fnPath)) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "Function not found: " + fnName }));
    return;
  }
  try {
    const body = await readBody(req);
    delete require.cache[require.resolve(fnPath)]; // recarga en caliente
    const mod = require(fnPath);
    // Netlify entrega la query ya parseada; sin esto los endpoints GET
    // (verify-credential?h=…) funcionan en produccion pero no en local.
    const qs = new URL(req.url, "http://localhost").searchParams;
    const queryStringParameters = {};
    for (const [k, v] of qs) queryStringParameters[k] = v;
    const event = { httpMethod: req.method, body, headers: req.headers, queryStringParameters };
    const result = await mod.handler(event, {});
    const headers = result.headers || { "content-type": "application/json" };
    res.writeHead(result.statusCode || 200, headers);
    res.end(result.body || "");
  } catch (err) {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "Server error en la función", details: err.message }));
  }
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  const filePath = path.join(ROOT, path.normalize(urlPath));
  if (!filePath.startsWith(ROOT)) {
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
    res.writeHead(200, { "content-type": MIME[ext] || "application/octet-stream" });
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

server.listen(PORT, () => {
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
