/**
 * Servidor de demo local para TalentPact — sin dependencias externas.
 *
 * Replica el comportamiento de `netlify dev` para la demo: sirve los archivos
 * estáticos (index.html, etc.) y ejecuta las funciones serverless de
 * netlify/functions/ en los endpoints /.netlify/functions/<nombre>.
 *
 * Requisitos: Node >= 18 (usa fetch global) y la variable ANTHROPIC_API_KEY.
 *
 * Uso:
 *   export ANTHROPIC_API_KEY="sk-ant-..."
 *   node serve-demo.js
 *   # abre http://localhost:8888
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

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
    const event = { httpMethod: req.method, body, headers: req.headers };
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

server.listen(PORT, () => {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  console.log("\n  TalentPact — servidor de demo");
  console.log("  ▶ http://localhost:" + PORT);
  console.log("  ▶ Funciones: /.netlify/functions/evaluate-exercise, /.netlify/functions/support-chat");
  console.log("  ▶ ANTHROPIC_API_KEY: " + (hasKey ? "detectada ✓" : "NO detectada ✗ (la corrección IA fallará)"));
  console.log("");
});
