/**
 * Currículum en PDF del candidato, en un bucket privado de Supabase Storage.
 *
 * El bucket no tiene políticas para `anon` ni `authenticated`: solo la service
 * key del servidor lee y escribe. La empresa nunca recibe la ruta, solo un
 * enlace firmado de pocos minutos que da la función `cv` tras comprobar el
 * desbloqueo (ver handlers/cv.js).
 */
const { supabaseEnv } = require("./tp");

const BUCKET = "cvs";
// Netlify corta el cuerpo de la petición en 6 MB; en base64 un PDF de 4 MB ocupa ~5,4.
const MAX_BYTES = 4 * 1024 * 1024;
const FIRMA_EMPRESA_S = 300;
const FIRMA_PROPIA_S = 120;

const rutaDe = (profileId) => `${profileId}.pdf`;

/** Nombre que se enseña (no se usa como ruta): sin carpetas ni caracteres raros. */
function nombreLimpio(n) {
  let t = String(n || "").split(/[\\/]/).pop().replace(/[^\p{L}\p{N} ._()-]/gu, "").replace(/\s+/g, " ").trim();
  t = t.replace(/\.pdf$/i, "").slice(0, 100).trim();
  return (t || "curriculum") + ".pdf";
}

/** base64 → Buffer de un PDF de verdad, o el error para el usuario. */
function leerPdf(base64) {
  if (typeof base64 !== "string" || !base64) return { status: 400, error: "No ha llegado el archivo." };
  if (base64.length > Math.ceil(MAX_BYTES / 3) * 4 + 8) return { status: 413, error: "El PDF pasa de 4 MB. Exporta una versión más ligera." };
  const buf = Buffer.from(base64, "base64");
  if (!buf.length) return { status: 400, error: "El archivo está vacío." };
  if (buf.length > MAX_BYTES) return { status: 413, error: "El PDF pasa de 4 MB. Exporta una versión más ligera." };
  if (buf.subarray(0, 5).toString("latin1") !== "%PDF-") return { status: 415, error: "Solo se admite el currículum en PDF." };
  return { buf };
}

/** Lo que se guarda en profiles.cv y se enseña. */
function metaCv(nombre, bytes, fecha = new Date()) {
  return { nombre: nombreLimpio(nombre), bytes: Number(bytes) || 0, subido: fecha.toISOString() };
}

function metaPublica(cv) {
  if (!cv || typeof cv !== "object" || !cv.subido) return null;
  return { nombre: nombreLimpio(cv.nombre), bytes: Number(cv.bytes) || 0, subido: String(cv.subido) };
}

async function storage(method, ruta, { body, headers = {} } = {}) {
  const { url, key } = supabaseEnv();
  const res = await fetch(`${url}/storage/v1/${ruta}`, {
    method,
    headers: Object.assign({ apikey: key, authorization: `Bearer ${key}` }, headers),
    body,
    signal: AbortSignal.timeout(15000)
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch (_e) { data = text; }
  return { ok: res.ok, status: res.status, data };
}

/** Supabase responde 400 con «Bucket not found» si falta el SQL. */
const sinBucket = (r) => !r.ok && /bucket not found/i.test(JSON.stringify(r.data || ""));
const noExiste = (r) => !r.ok && (r.status === 404 || /not.?found/i.test(JSON.stringify(r.data || "")));

class CvError extends Error {
  constructor(msg, code) { super(msg); this.code = code; }
}

async function subirCv(profileId, buf) {
  const r = await storage("POST", `object/${BUCKET}/${rutaDe(profileId)}`, {
    body: buf,
    headers: { "content-type": "application/pdf", "x-upsert": "true", "cache-control": "no-store" }
  });
  if (sinBucket(r)) throw new CvError("bucket", "cv_sin_configurar");
  if (!r.ok) throw new Error(`Storage subir -> ${r.status}: ${JSON.stringify(r.data)}`);
}

async function firmarCv(profileId, segundos, nombre) {
  const r = await storage("POST", `object/sign/${BUCKET}/${rutaDe(profileId)}`, {
    body: JSON.stringify({ expiresIn: segundos }),
    headers: { "content-type": "application/json" }
  });
  if (sinBucket(r)) throw new CvError("bucket", "cv_sin_configurar");
  if (noExiste(r)) throw new CvError("archivo", "cv_no_encontrado");
  const firmado = r.data && (r.data.signedURL || r.data.signedUrl);
  if (!r.ok || !firmado) throw new Error(`Storage firmar -> ${r.status}: ${JSON.stringify(r.data)}`);
  const { url } = supabaseEnv();
  const sep = firmado.includes("?") ? "&" : "?";
  return `${url}/storage/v1${firmado}${nombre ? sep + "download=" + encodeURIComponent(nombreLimpio(nombre)) : ""}`;
}

/** Borra el PDF. Si no existe (o no hay bucket), no es un fallo. */
async function borrarCv(profileId) {
  const r = await storage("DELETE", `object/${BUCKET}/${rutaDe(profileId)}`);
  if (r.ok || noExiste(r) || sinBucket(r)) return r.ok;
  throw new Error(`Storage borrar -> ${r.status}: ${JSON.stringify(r.data)}`);
}

module.exports = {
  BUCKET, MAX_BYTES, FIRMA_EMPRESA_S, FIRMA_PROPIA_S, CvError,
  rutaDe, nombreLimpio, leerPdf, metaCv, metaPublica, subirCv, firmarCv, borrarCv
};
