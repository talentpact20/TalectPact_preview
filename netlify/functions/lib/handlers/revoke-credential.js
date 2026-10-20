/**
 * revoke-credential — retira un SkillPass (lista de revocación, lib/statuslist.js).
 *
 * Body: { credentialId, motivo? }
 * Cabecera: Authorization: Bearer <access token de Supabase>
 *
 * Puede revocar el propio titular (siempre, sin dar explicaciones) o una cuenta
 * admin tras una revisión humana por fraude (motivo obligatorio). La revocación
 * no se deshace: para volver a tener SkillPass se emite uno nuevo.
 */
const { jsonResponse, sb, authUser, isUuid, faltaEnEsquema, errorInterno } = require("../tp");
const { esAdmin } = require("./admin-metrics");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });
  let b;
  try { b = JSON.parse(event.body || "{}"); } catch (_e) { return jsonResponse(400, { error: "Body JSON no válido" }); }
  try {
    const user = await authUser(event, b);
    if (!user) return jsonResponse(401, { error: "Inicia sesión para retirar tu SkillPass" });
    const id = String(b.credentialId || "");
    if (!isUuid(id)) return jsonResponse(400, { error: "credentialId no válido" });

    const admin = esAdmin(user);
    let filtro = `id=eq.${id}`;
    let motivo = "titular";
    if (admin && b.motivo) {
      motivo = String(b.motivo).trim().slice(0, 300);
      if (motivo.length < 5) return jsonResponse(400, { error: "Indica el motivo de la revocación" });
    } else {
      // El titular solo puede revocar lo suyo: la propiedad va en la consulta.
      const perfiles = await sb.select("profiles", `user_id=eq.${user.id}&select=id&limit=1`);
      const perfil = Array.isArray(perfiles) ? perfiles[0] : null;
      if (!perfil) return jsonResponse(404, { error: "Credencial no encontrada" });
      filtro += `&profile_id=eq.${perfil.id}`;
    }
    const filas = await sb.update("credentials", `${filtro}&revoked_at=is.null`, {
      revoked_at: new Date().toISOString(), revocation_reason: motivo
    });
    if (!Array.isArray(filas) || !filas.length) {
      const existe = await sb.select("credentials", `${filtro}&select=id,revoked_at&limit=1`);
      if (Array.isArray(existe) && existe[0] && existe[0].revoked_at) return jsonResponse(200, { ok: true, yaRevocada: true });
      return jsonResponse(404, { error: "Credencial no encontrada" });
    }
    return jsonResponse(200, { ok: true, revocada: true });
  } catch (err) {
    if (faltaEnEsquema(err, /revoked_at|revocation_reason/i)) {
      return jsonResponse(503, { error: "La revocación aún no está activada (falta supabase_schema_vc.sql).", code: "pending_migration" });
    }
    return errorInterno("No se pudo revocar la credencial", err);
  }
};
