/**
 * applications — mini-pipeline por oferta.
 *
 * Body: { jobId }                         → lista de candidatos en proceso
 * Body: { jobId, candidateRef, status, reason? } → crea/actualiza etapa
 *
 * Estados: aplicado | retos | preseleccionado | entrevista | contratado | descartado
 * Descartado exige motivo (trazabilidad AI Act).
 */
const { jsonResponse, sb, authUser, isUuid, faltaEnEsquema } = require("../tp");
const { notificarEtapa } = require("../notify");

const ESTADOS = ["aplicado", "retos", "preseleccionado", "entrevista", "contratado", "descartado"];

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  try {
    const b = JSON.parse(event.body || "{}");
    const user = await authUser(event, b);
    if (!user) return jsonResponse(401, { error: "Inicia sesión con tu cuenta de empresa" });

    const jobId = String(b.jobId || "");
    if (!isUuid(jobId)) return jsonResponse(400, { error: "jobId no válido" });

    // Solo el dueño de la oferta.
    const jobs = await sb.select("jobs", `id=eq.${jobId}&company_user_id=eq.${user.id}&select=id&limit=1`);
    if (!Array.isArray(jobs) || !jobs.length) return jsonResponse(404, { error: "Oferta no encontrada" });

    // Actualizar / crear
    if (b.status) {
      const ref = String(b.candidateRef || "");
      if (!isUuid(ref)) return jsonResponse(400, { error: "candidateRef no válido" });
      if (!ESTADOS.includes(b.status)) return jsonResponse(400, { error: "Estado no válido" });
      const reason = typeof b.reason === "string" ? b.reason.trim().slice(0, 400) : "";
      if (b.status === "descartado" && reason.length < 3) {
        return jsonResponse(400, { error: "Indica un motivo al descartar (obligatorio)" });
      }

      const ahora = new Date().toISOString();
      const campos = {
        job_id: jobId,
        candidate_profile_id: ref,
        company_user_id: user.id,
        status: b.status,
        reason: b.status === "descartado" ? reason : (reason || null),
        updated_at: ahora
      };

      try {
        const existentes = await sb.select(
          "applications",
          `job_id=eq.${jobId}&candidate_profile_id=eq.${ref}&select=id,status&limit=1`
        );
        // Solo se avisa al candidato si la etapa cambia de verdad.
        const previa = Array.isArray(existentes) ? existentes[0] || null : null;
        if (previa) {
          await sb.update("applications", `id=eq.${previa.id}`, {
            status: campos.status,
            reason: campos.reason,
            updated_at: ahora
          });
        } else {
          await sb.insert("applications", Object.assign({ created_at: ahora }, campos));
        }
        if (!previa || previa.status !== b.status) await notificarEtapa({ profileId: ref, status: b.status, jobId });
      } catch (err) {
        if (faltaEnEsquema(err, "applications")) {
          return jsonResponse(503, {
            error: "Falta la migración del pipeline (applications)",
            code: "pending_migration"
          });
        }
        throw err;
      }
    }

    let filas;
    try {
      filas = await sb.select(
        "applications",
        `job_id=eq.${jobId}&company_user_id=eq.${user.id}&select=id,candidate_profile_id,status,reason,dilemma_answers,updated_at,created_at&order=updated_at.desc&limit=200`
      );
    } catch (err) {
      if (faltaEnEsquema(err, "applications")) {
        return jsonResponse(200, { ok: true, applications: [], pendingMigration: true });
      }
      if (faltaEnEsquema(err, /dilemma_answers/i)) {
        filas = await sb.select(
          "applications",
          `job_id=eq.${jobId}&company_user_id=eq.${user.id}&select=id,candidate_profile_id,status,reason,updated_at,created_at&order=updated_at.desc&limit=200`
        );
      } else {
        throw err;
      }
    }

    const applications = (Array.isArray(filas) ? filas : []).map((a) => {
      const answers = Array.isArray(a.dilemma_answers)
        ? a.dilemma_answers
            .filter((x) => x && typeof x === "object")
            .slice(0, 3)
            .map((x) => ({
              prompt: String(x.prompt || "").slice(0, 600),
              answer: String(x.answer || "").slice(0, 2000)
            }))
        : [];
      return {
        id: a.id,
        candidateRef: a.candidate_profile_id,
        status: a.status,
        reason: a.reason || "",
        dilemmaAnswers: answers,
        updatedAt: a.updated_at,
        createdAt: a.created_at
      };
    });
    return jsonResponse(200, { ok: true, applications });
  } catch (err) {
    return jsonResponse(500, { error: "No se pudo gestionar el proceso", details: err.message });
  }
};

module.exports.ESTADOS = ESTADOS;
