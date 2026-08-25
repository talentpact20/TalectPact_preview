/**
 * Utilidades compartidas de TalentPact para las funciones serverless.
 * - Respuestas JSON
 * - Cliente REST de Supabase (sin dependencias; usa fetch global de Node >= 18)
 * - Autenticación: identificar al usuario a partir de su access token
 * - Canonicalización de JSON (para hashes reproducibles)
 * - Helpers de blockchain (ethers) y configuración de la red
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
      "access-control-allow-headers": "content-type, authorization",
      "access-control-allow-methods": "GET, POST, OPTIONS"
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
    sbRequest("PATCH", `${table}?${query}`, { body: patch, prefer: "return=representation" }),
  remove: (table, query) => sbRequest("DELETE", `${table}?${query}`)
};

// ─── Autenticación ───────────────────────────────────────────────────────────
/**
 * Identifica al usuario a partir de su access token de Supabase.
 *
 * El cliente nunca dice quién es: manda su token y aquí se le pregunta a
 * Supabase. Así una petición manipulada no puede actuar en nombre de otro.
 * Devuelve null si el token falta, ha caducado o no es válido.
 */
async function userFromToken(accessToken) {
  if (!accessToken || typeof accessToken !== "string") return null;
  const { url, key } = supabaseEnv();
  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: key, authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) return null;
    const user = await res.json();
    return user && user.id ? user : null;
  } catch (_e) {
    return null;
  }
}

/**
 * Extrae el token de una petición: cabecera `Authorization: Bearer …` o, por
 * compatibilidad con las llamadas antiguas, el campo `accessToken` del body.
 */
function tokenFromEvent(event, body) {
  const h = (event && event.headers) || {};
  const raw = h.authorization || h.Authorization || "";
  const m = /^Bearer\s+(.+)$/i.exec(String(raw).trim());
  if (m) return m[1];
  if (body && typeof body.accessToken === "string") return body.accessToken;
  return null;
}

/** Usuario autenticado de la petición, o null. */
function authUser(event, body) {
  return userFromToken(tokenFromEvent(event, body));
}

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

/**
 * Alias público y anónimo derivado del id de usuario. El nombre real y el email
 * viven en sus propias columnas; `display_name` es lo que puede verse desde
 * fuera, así que nunca debe contener datos personales (premisa de anonimato).
 */
function anonymousAlias(userId) {
  return "Candidato #" + String(userId).replace(/-/g, "").slice(0, 4).toUpperCase();
}

/** Devuelve (creando o actualizando) el perfil vinculado a un usuario de Auth. */
async function ensureProfileByUser(userId, fields = {}) {
  if (!userId) throw new Error("userId requerido");
  const found = await sb.select("profiles", `user_id=eq.${userId}&select=*&limit=1`);
  const patch = pickProfileFields(fields);
  if (Array.isArray(found) && found.length) {
    if (Object.keys(patch).length) {
      const upd = await sb.update("profiles", `user_id=eq.${userId}`, patch);
      // Si el PATCH no devolvió filas, nos quedamos con lo que ya habíamos leído:
      // devolver undefined haría estallar a quien espere `profile.id`.
      if (Array.isArray(upd) && upd[0]) return upd[0];
      return found[0];
    }
    return found[0];
  }
  const row = Object.assign({ user_id: userId }, patch);
  if (!row.display_name) row.display_name = anonymousAlias(userId);
  try {
    const created = await sb.insert("profiles", row);
    return Array.isArray(created) ? created[0] : created;
  } catch (err) {
    // `user_id` es único: si dos peticiones del mismo usuario llegan a la vez,
    // una de las dos choca. No es un fallo real — releemos el perfil ganador.
    const retry = await sb.select("profiles", `user_id=eq.${userId}&select=*&limit=1`);
    if (Array.isArray(retry) && retry.length) return retry[0];
    throw err;
  }
}

const COMPANY_FIELDS = ["email", "company_name", "contact_name", "job_title", "company_size"];
function pickCompanyFields(fields = {}) {
  const out = {};
  for (const k of COMPANY_FIELDS) {
    if (fields[k] != null && fields[k] !== "") out[k] = fields[k];
  }
  return out;
}

/** Devuelve (creando o actualizando) la ficha de empresa vinculada a Auth. */
async function ensureCompanyByUser(userId, fields = {}) {
  if (!userId) throw new Error("userId requerido");
  const found = await sb.select("companies", `user_id=eq.${userId}&select=*&limit=1`);
  const patch = pickCompanyFields(fields);
  if (Array.isArray(found) && found.length) {
    if (Object.keys(patch).length) {
      const upd = await sb.update("companies", `user_id=eq.${userId}`, patch);
      return Array.isArray(upd) ? upd[0] : found[0];
    }
    return found[0];
  }
  const row = Object.assign({ user_id: userId }, patch);
  if (!row.company_name) row.company_name = fields.contact_name || fields.email || "Empresa";
  const created = await sb.insert("companies", row);
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
/**
 * Red donde vive SkillPassRegistry. Una sola fuente de verdad: el explorador,
 * el RPC por defecto y el `slug` que se guarda en Supabase salen todos de aquí.
 * Debe coincidir con `CHAIN` en tfm/tech/scripts/lib-env.js, que es lo que usan
 * los scripts de despliegue y diagnóstico.
 */
const CHAIN = {
  chainId: 11155111,
  name: "Ethereum Sepolia",
  slug: "ethereum-sepolia",
  defaultRpc: "https://ethereum-sepolia-rpc.publicnode.com",
  explorer: "https://sepolia.etherscan.io"
};

const explorerTx = (hash) => `${CHAIN.explorer}/tx/${hash}`;
const explorerAddress = (addr) => `${CHAIN.explorer}/address/${addr}`;

/** ¿Es un bytes32 con formato válido? Evita que ethers reviente con un 500. */
function isHash32(v) {
  return typeof v === "string" && /^0x[0-9a-fA-F]{64}$/.test(v.trim());
}

/** ¿Es un UUID? Los ids de Supabase lo son; validarlo evita inyección en filtros PostgREST. */
function isUuid(v) {
  return typeof v === "string" && /^[0-9a-fA-F-]{36}$/.test(v.trim()) &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.trim());
}

/** ¿Está la capa blockchain configurada en este entorno? */
function chainConfigured({ signer = false } = {}) {
  if (!process.env.SKILLPASS_CONTRACT_ADDRESS) return false;
  if (signer && !process.env.ISSUER_PRIVATE_KEY) return false;
  return true;
}

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
  // POLYGON_AMOY_RPC se sigue aceptando por compatibilidad con despliegues
  // antiguos, pero la red efectiva es siempre CHAIN (Sepolia).
  const rpc = process.env.SEPOLIA_RPC || process.env.POLYGON_AMOY_RPC || CHAIN.defaultRpc;
  const { ethers } = getEthers();
  // `staticNetwork` fija la red: ethers se ahorra el eth_chainId de sondeo en
  // cada arranque en frío, que en una función serverless es latencia pura.
  return new ethers.JsonRpcProvider(rpc, CHAIN.chainId, { staticNetwork: true });
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
  supabaseEnv,
  sb,
  userFromToken,
  tokenFromEvent,
  authUser,
  ensureProfile,
  ensureProfileByUser,
  ensureCompanyByUser,
  canonicalJson,
  hashCv,
  getProvider,
  getContract,
  chainConfigured,
  isHash32,
  isUuid,
  CHAIN,
  explorerTx,
  explorerAddress,
  SKILLPASS_ABI
};
