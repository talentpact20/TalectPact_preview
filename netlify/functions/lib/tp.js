/**
 * Utilidades compartidas de TalentPact para las funciones serverless.
 * - Respuestas JSON
 * - Cliente REST de Supabase (sin dependencias; usa fetch global de Node >= 18)
 * - Canonicalización de JSON (para hashes reproducibles)
 * - Helpers de blockchain (ethers)
 *
 * Este archivo vive en un subdirectorio `lib/` para que Netlify NO lo trate
 * como un endpoint de función.
 */

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "POST, OPTIONS"
    },
    body: JSON.stringify(payload)
  };
}

// ─── Supabase REST (PostgREST) ───────────────────────────────────────────────
function supabaseEnv() {
  // Tolerante a distintos nombres (mayúsculas/minúsculas) por comodidad de despliegue.
  const url = process.env.SUPABASE_URL || process.env.supabaseurl || process.env.SUPABASE_PROJECT_URL;
  const key =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.supabaseservicekey ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY en variables de entorno");
  }
  return { url: url.replace(/\/$/, ""), key };
}

async function sbRequest(method, path, { body, prefer } = {}) {
  const { url, key } = supabaseEnv();
  const headers = {
    apikey: key,
    authorization: `Bearer ${key}`,
    "content-type": "application/json"
  };
  if (prefer) headers.prefer = prefer;
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch (_e) { data = text; }
  if (!res.ok) {
    const msg = (data && data.message) || (typeof data === "string" ? data : "error");
    throw new Error(`Supabase ${method} ${path} -> ${res.status}: ${msg}`);
  }
  return data;
}

const sb = {
  select: (table, query = "") => sbRequest("GET", `${table}${query ? "?" + query : ""}`),
  insert: (table, row) =>
    sbRequest("POST", table, { body: row, prefer: "return=representation" }),
  update: (table, query, patch) =>
    sbRequest("PATCH", `${table}?${query}`, { body: patch, prefer: "return=representation" })
};

/** Devuelve el perfil con ese display_name; lo crea si no existe. */
async function ensureProfile(displayName) {
  const name = displayName || "Candidato Demo";
  const found = await sb.select(
    "profiles",
    `display_name=eq.${encodeURIComponent(name)}&select=*&limit=1`
  );
  if (Array.isArray(found) && found.length) return found[0];
  const created = await sb.insert("profiles", { display_name: name });
  return Array.isArray(created) ? created[0] : created;
}

const PROFILE_FIELDS = ["email", "full_name", "sector", "phone", "linkedin", "display_name"];
function pickProfileFields(fields = {}) {
  const out = {};
  for (const k of PROFILE_FIELDS) {
    if (fields[k] != null && fields[k] !== "") out[k] = fields[k];
  }
  return out;
}

/** Devuelve (creando o actualizando) el perfil vinculado a un usuario de Auth. */
async function ensureProfileByUser(userId, fields = {}) {
  if (!userId) throw new Error("userId requerido");
  const found = await sb.select("profiles", `user_id=eq.${userId}&select=*&limit=1`);
  const patch = pickProfileFields(fields);
  if (Array.isArray(found) && found.length) {
    if (Object.keys(patch).length) {
      const upd = await sb.update("profiles", `user_id=eq.${userId}`, patch);
      return Array.isArray(upd) ? upd[0] : found[0];
    }
    return found[0];
  }
  const row = Object.assign({ user_id: userId }, patch);
  if (!row.display_name) row.display_name = fields.full_name || fields.email || "Candidato";
  const created = await sb.insert("profiles", row);
  return Array.isArray(created) ? created[0] : created;
}

// ─── Canonicalización JSON (orden de claves estable) ─────────────────────────
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc, k) => {
        acc[k] = canonicalize(value[k]);
        return acc;
      }, {});
  }
  return value;
}
function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

// ─── Blockchain (ethers) ─────────────────────────────────────────────────────
const SKILLPASS_ABI = [
  "function anchor(bytes32 cvHash) external",
  "function isAnchored(bytes32 cvHash) external view returns (bool exists, uint256 timestamp)",
  "function issuer() view returns (address)"
];

function getEthers() {
  // Carga perezosa para no romper funciones que no usan blockchain.
  return require("ethers");
}

function getProvider() {
  const rpc =
    process.env.SEPOLIA_RPC ||
    process.env.POLYGON_AMOY_RPC ||
    "https://ethereum-sepolia-rpc.publicnode.com";
  const { ethers } = getEthers();
  return new ethers.JsonRpcProvider(rpc);
}

function getContract({ signer = false } = {}) {
  const { ethers } = getEthers();
  const address = process.env.SKILLPASS_CONTRACT_ADDRESS;
  if (!address) throw new Error("Falta SKILLPASS_CONTRACT_ADDRESS en variables de entorno");
  const provider = getProvider();
  if (signer) {
    const pk = process.env.ISSUER_PRIVATE_KEY;
    if (!pk) throw new Error("Falta ISSUER_PRIVATE_KEY en variables de entorno");
    const wallet = new ethers.Wallet(pk, provider);
    return new ethers.Contract(address, SKILLPASS_ABI, wallet);
  }
  return new ethers.Contract(address, SKILLPASS_ABI, provider);
}

/** keccak256 del CV canonicalizado -> string 0x... (bytes32). */
function hashCv(cvJson) {
  const { ethers } = getEthers();
  return ethers.keccak256(ethers.toUtf8Bytes(canonicalJson(cvJson)));
}

module.exports = {
  jsonResponse,
  sb,
  ensureProfile,
  ensureProfileByUser,
  canonicalJson,
  hashCv,
  getProvider,
  getContract,
  SKILLPASS_ABI
};
