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

/**
 * Error interno → 500 sin filtrar detalles. El mensaje de un fallo de Supabase
 * lleva la consulta entera (tabla, filtros, ids); antes salía en `details` al
 * navegador. Ahora se registra en el log y solo se devuelve fuera de producción
 * (Netlify pone CONTEXT=production en el sitio publicado).
 * Un JSON mal formado en el cuerpo no es un fallo nuestro: responde 400.
 */
function errorInterno(mensaje, err) {
  if (err instanceof SyntaxError) return jsonResponse(400, { error: "Body JSON no válido" });
  console.error("[TP] " + mensaje + ":", (err && err.stack) || err);
  const payload = { error: mensaje, code: "internal" };
  if (process.env.CONTEXT !== "production") payload.details = String((err && err.message) || err);
  return jsonResponse(500, payload);
}

/** Texto acotado o undefined: lo que no es string no se guarda. */
function textoCorto(v, max) {
  if (typeof v !== "string") return undefined;
  const t = v.trim().slice(0, max);
  return t || undefined;
}

// ─── Supabase REST (PostgREST) ───────────────────────────────────────────────
// Sin límite, una consulta colgada retenía la función hasta el corte de Netlify
// (60 s) y la persona veía un error genérico tarde. 10 s sobra para PostgREST.
const SB_TIMEOUT_MS = Number(process.env.SUPABASE_TIMEOUT_MS || 10000);
const conLimite = () => AbortSignal.timeout(SB_TIMEOUT_MS);

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
    body: body != null ? JSON.stringify(body) : undefined,
    signal: conLimite()
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

/** Número de filas que cumplen un filtro, sin descargarlas (Content-Range de PostgREST). */
async function sbCount(table, query = "") {
  const { url, key } = supabaseEnv();
  const q = `select=id${query ? "&" + query : ""}`;
  const res = await fetch(`${url}/rest/v1/${table}?${q}`, {
    method: "HEAD",
    headers: { apikey: key, authorization: `Bearer ${key}`, prefer: "count=exact", range: "0-0" },
    signal: conLimite()
  });
  if (!res.ok) throw new Error(`Supabase COUNT ${table} -> ${res.status}`);
  const total = Number(String(res.headers.get("content-range") || "").split("/")[1]);
  return Number.isFinite(total) ? total : 0;
}

const sb = {
  count: sbCount,
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
      headers: { apikey: key, authorization: `Bearer ${accessToken}` },
      signal: conLimite()
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

const PROFILE_FIELDS = ["email", "full_name", "sector", "phone", "linkedin", "display_name", "empleo", "pool_visible", "allow_contact"];
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

const COMPANY_FIELDS = ["email", "company_name", "contact_name", "job_title", "company_size", "description", "sector", "website", "location"];
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
      // Un PATCH sin filas devolvía [] y aquí salía undefined (mismo fallo que
      // ya se corrigió en ensureProfileByUser).
      return (Array.isArray(upd) && upd[0]) || found[0];
    }
    return found[0];
  }
  const row = Object.assign({ user_id: userId }, patch);
  if (!row.company_name) row.company_name = fields.contact_name || fields.email || "Empresa";
  try {
    const created = await sb.insert("companies", row);
    return Array.isArray(created) ? created[0] : created;
  } catch (err) {
    // Dos peticiones simultáneas de la misma cuenta: gana la primera.
    const retry = await sb.select("companies", `user_id=eq.${userId}&select=*&limit=1`);
    if (Array.isArray(retry) && retry.length) return retry[0];
    throw err;
  }
}

/** Ficha de empresa SIN crearla: para comprobar que quien pide es una empresa. */
async function companyOf(userId) {
  const rows = await sb.select("companies", `user_id=eq.${userId}&select=id,company_name&limit=1`);
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
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

/**
 * ¿El error es que falta una tabla o columna (migración sin aplicar)?
 * Solo mira el mensaje de Supabase, no la ruta: "Supabase GET applications?… -> 500"
 * nombra siempre la tabla, y con un test sobre el mensaje entero cualquier
 * fallo (red, permisos, timeout) pasaba por "migración pendiente".
 */
function faltaEnEsquema(err, nombre) {
  const m = String((err && err.message) || "");
  const i = m.indexOf("->");
  const detalle = i >= 0 ? m.slice(i + 2) : m;
  const re = nombre instanceof RegExp ? nombre : new RegExp(nombre, "i");
  return re.test(detalle) && /does not exist|schema cache/i.test(detalle);
}

/** Violación de una restricción unique (p. ej. dos postulaciones simultáneas). */
function esDuplicado(err) {
  return /-> 409|duplicate key|23505/i.test(String((err && err.message) || ""));
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

// Dependencias pesadas inyectadas por la entrada de cada función.
// En el API moderno, Netlify solo empaqueta los paquetes que la entrada .mjs
// importa: un `require` perezoso desde aquí no lo ve, y en producción daba
// "Cannot find module 'ethers'". Las entradas que los necesitan los importan y
// los registran aquí; tests y scripts locales siguen cayendo al `require`.
let _ethersMod = null;
let _stripe = null;
let _StripeCtor = null;
function usarEthers(mod) { _ethersMod = mod; }
function usarStripe(ctor) { _StripeCtor = ctor; _stripe = null; }

function getEthers() {
  return _ethersMod || require("ethers");
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

// ─── Stripe (pagos) ──────────────────────────────────────────────────────────
/**
 * Precio del desbloqueo de contacto. Vive aquí y no en el cliente: el importe
 * lo fija el servidor al crear la sesión de Checkout, así que manipular el
 * navegador no cambia lo que se cobra.
 */
const UNLOCK_PRICE = {
  amountCents: Number(process.env.UNLOCK_PRICE_CENTS || 4900),
  currency: (process.env.UNLOCK_CURRENCY || "eur").toLowerCase(),
  label: "Desbloqueo de contacto — TalentPact"
};

function stripeConfigured() {
  return !!process.env.STRIPE_SECRET_KEY;
}

/** ¿Son claves de producción? Sirve para avisar en la interfaz. */
function stripeLiveMode() {
  return /^sk_live_/.test(process.env.STRIPE_SECRET_KEY || "");
}

function getStripe() {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Falta STRIPE_SECRET_KEY en variables de entorno");
  // Carga perezosa: las funciones que no cobran no deben pagar el arranque.
  const Stripe = _StripeCtor || require("stripe");
  // Sin fijar apiVersion a proposito: stripe-node ya viene anclado a la
  // version de API para la que fue construido. Forzar una antigua hace que
  // la libreria construya peticiones con una forma y Stripe las interprete
  // con otra. maxNetworkRetries cubre cortes de red puntuales.
  _stripe = new Stripe(key, { maxNetworkRetries: 2 });
  return _stripe;
}

/** Importe formateado para mostrarlo (4900 -> "49,00 €"). */
function formatAmount(cents, currency) {
  const value = (Number(cents) || 0) / 100;
  try {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: (currency || "eur").toUpperCase() }).format(value);
  } catch (_e) {
    return value.toFixed(2) + " " + (currency || "eur").toUpperCase();
  }
}

module.exports = {
  jsonResponse,
  errorInterno,
  textoCorto,
  companyOf,
  supabaseEnv,
  sb,
  userFromToken,
  tokenFromEvent,
  authUser,
  ensureProfileByUser,
  anonymousAlias,
  ensureCompanyByUser,
  canonicalJson,
  hashCv,
  getProvider,
  getContract,
  chainConfigured,
  isHash32,
  isUuid,
  faltaEnEsquema,
  esDuplicado,
  CHAIN,
  explorerTx,
  explorerAddress,
  SKILLPASS_ABI,
  UNLOCK_PRICE,
  stripeConfigured,
  stripeLiveMode,
  getStripe,
  usarEthers,
  usarStripe,
  formatAmount
};
