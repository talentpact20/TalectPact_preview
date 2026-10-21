/**
 * cv — currículum en PDF del candidato.
 *
 * Candidato (su perfil se deduce del token):
 *   { accion: "estado" }                    → { cv: {nombre, bytes, subido} | null }
 *   { accion: "subir", nombre, base64 }     → { cv }
 *   { accion: "ver" }                       → { url }  (enlace de 2 minutos)
 *   { accion: "borrar" }                    → { cv: null }
 *
 * Empresa:
 *   { accion: "ver", candidateRef }         → { url, cv }  (enlace de 5 minutos)
 *
 * Igual que get-contact: el CV es un dato personal y solo sale hacia una
 * empresa con un desbloqueo `paid` de ese candidato y si este sigue aceptando
 * contacto. Cada entrega queda en `contact_access`.
 */
const { jsonResponse, sb, authUser, isUuid, faltaEnEsquema, errorInterno, companyOf, ensureProfileByUser } = require("../tp");
const { limitar } = require("../limites");
const cv = require("../cv");

const SIN_CONFIGURAR = {
  error: "El currículum todavía no está activado en este entorno. Falta ejecutar supabase_schema_cv.sql en Supabase.",
  code: "cv_sin_configurar"
};

async function guardarMeta(userId, valor) {
  try {
    await sb.update("profiles", `user_id=eq.${userId}`, { cv: valor });
    return true;
  } catch (err) {
    if (faltaEnEsquema(err, /\bcv\b/i)) return false;
    throw err;
  }
}

async function paraCandidato(user, b) {
  if (await companyOf(user.id)) {
    return jsonResponse(403, { error: "Las cuentas de empresa no tienen currículum", code: "not_candidate" });
  }
  const perfil = await ensureProfileByUser(user.id, {});
  const accion = b.accion || "estado";

  if (accion === "estado") {
    if (!("cv" in perfil)) return jsonResponse(200, { ok: true, cv: null, disponible: false });
    return jsonResponse(200, { ok: true, cv: cv.metaPublica(perfil.cv), disponible: true });
  }

  if (accion === "subir") {
    if (await limitar("cv-subir:" + user.id, { max: 10, ventanaS: 3600 })) {
      return jsonResponse(429, { error: "Has subido varios archivos seguidos. Prueba dentro de un rato." });
    }
    const pdf = cv.leerPdf(b.base64);
    if (pdf.error) return jsonResponse(pdf.status, { error: pdf.error });
    if (!("cv" in perfil)) return jsonResponse(503, SIN_CONFIGURAR);
    await cv.subirCv(perfil.id, pdf.buf);
    const meta = cv.metaCv(b.nombre, pdf.buf.length);
    if (!(await guardarMeta(user.id, meta))) return jsonResponse(503, SIN_CONFIGURAR);
    return jsonResponse(200, { ok: true, cv: meta });
  }

  if (accion === "ver") {
    const meta = cv.metaPublica(perfil.cv);
    if (!meta) return jsonResponse(404, { error: "Todavía no has subido tu currículum", code: "sin_cv" });
    return jsonResponse(200, { ok: true, url: await cv.firmarCv(perfil.id, cv.FIRMA_PROPIA_S), cv: meta });
  }

  if (accion === "borrar") {
    await cv.borrarCv(perfil.id);
    if ("cv" in perfil) await guardarMeta(user.id, null);
    return jsonResponse(200, { ok: true, cv: null });
  }

  return jsonResponse(400, { error: "Acción no válida" });
}

async function paraEmpresa(user, ref) {
  if (!(await companyOf(user.id))) {
    return jsonResponse(403, { error: "Solo las empresas ven currículums de candidatos", code: "not_company" });
  }
  if (!isUuid(ref)) return jsonResponse(400, { error: "Ese candidato no es un perfil real", code: "not_real_candidate" });
  if (await limitar("cv-ver:" + user.id, { max: 60, ventanaS: 3600 })) {
    return jsonResponse(429, { error: "Demasiadas peticiones seguidas. Prueba dentro de un rato." });
  }

  const pagos = await sb.select(
    "unlocks",
    `company_user_id=eq.${user.id}&candidate_ref=eq.${ref}&status=eq.paid&select=id&order=paid_at.desc&limit=1`
  );
  const unlock = Array.isArray(pagos) ? pagos[0] : null;
  if (!unlock) return jsonResponse(402, { error: "Desbloquea el contacto para ver su currículum", code: "not_unlocked" });

  let filas;
  try { filas = await sb.select("profiles", `id=eq.${ref}&select=id,allow_contact,cv&limit=1`); }
  catch (err) {
    if (!faltaEnEsquema(err, /\bcv\b/i)) throw err;
    return jsonResponse(404, { error: "Este candidato no ha subido currículum", code: "sin_cv" });
  }
  const perfil = Array.isArray(filas) ? filas[0] : null;
  if (!perfil) return jsonResponse(410, { error: "El candidato ha eliminado su cuenta", code: "candidate_deleted" });
  if (perfil.allow_contact === false) {
    return jsonResponse(409, { error: "El candidato ha retirado su consentimiento a ser contactado", code: "contact_withdrawn" });
  }
  const meta = cv.metaPublica(perfil.cv);
  if (!meta) return jsonResponse(404, { error: "Este candidato no ha subido currículum", code: "sin_cv" });

  const url = await cv.firmarCv(perfil.id, cv.FIRMA_EMPRESA_S);
  try {
    await sb.insert("contact_access", { company_user_id: user.id, candidate_profile_id: perfil.id, unlock_id: unlock.id });
  } catch (err) {
    console.warn("cv: no se pudo registrar el acceso:", err.message);
  }
  return jsonResponse(200, { ok: true, url, cv: meta, caduca: cv.FIRMA_EMPRESA_S });
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  try {
    const b = JSON.parse(event.body || "{}");
    const user = await authUser(event, b);
    if (!user) return jsonResponse(401, { error: "Inicia sesión para gestionar el currículum" });
    if (b.candidateRef != null) return await paraEmpresa(user, String(b.candidateRef).trim());
    return await paraCandidato(user, b);
  } catch (err) {
    if (err instanceof cv.CvError) {
      if (err.code === "cv_sin_configurar") return jsonResponse(503, SIN_CONFIGURAR);
      if (err.code === "cv_no_encontrado") return jsonResponse(404, { error: "No se encuentra el archivo del currículum. Vuelve a subirlo.", code: "sin_cv" });
    }
    return errorInterno("No se pudo procesar el currículum", err);
  }
};
