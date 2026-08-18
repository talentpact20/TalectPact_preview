/**
 * Utilidades compartidas por los scripts de tfm/tech/scripts.
 * Carga el `.env` de la raiz del repo (mismo formato que serve-demo.js) para
 * que los scripts de linea de comandos vean las mismas variables que el
 * servidor local y que Netlify.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..", "..");

function loadDotEnv(file = path.join(ROOT, ".env")) {
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

/** Valor de una variable, o null si falta o sigue siendo el placeholder. */
function env(name) {
  const v = process.env[name];
  if (!v) return null;
  const t = v.trim();
  // Los valores de .env.example terminan en "..." — no son configuracion real.
  if (!t || t === "0x..." || t.endsWith("...")) return null;
  return t;
}

function requireEnv(name, hint) {
  const v = env(name);
  if (!v) {
    throw new Error(
      `Falta ${name} en el .env (o sigue con el valor de ejemplo).` +
        (hint ? `\n   ${hint}` : "")
    );
  }
  return v;
}

/** Normaliza una clave privada: acepta con o sin prefijo 0x. */
function normalizePrivateKey(pk) {
  const clean = pk.trim().replace(/^0x/i, "");
  if (!/^[0-9a-fA-F]{64}$/.test(clean)) {
    throw new Error("ISSUER_PRIVATE_KEY no parece una clave privada valida (64 caracteres hex).");
  }
  return "0x" + clean;
}

const AMOY = {
  chainId: 80002,
  name: "Polygon Amoy",
  defaultRpc: "https://rpc-amoy.polygon.technology",
  explorer: "https://amoy.polygonscan.com",
  faucet: "https://faucet.polygon.technology/"
};

module.exports = { ROOT, loadDotEnv, env, requireEnv, normalizePrivateKey, AMOY };
