/**
 * apply — el candidato se postula a una oferta y consulta sus postulaciones.
 *
 * Body: { jobId, dilemmaAnswers?, screeningAnswers? } → crea la postulación (etapa "aplicado"); es idempotente
 * Body: {}                          → lista las postulaciones del candidato
 * Cabecera: Authorization Bearer
 *
 * dilemmaAnswers: array de strings (máx. 3, 2000 chars) alineados con jobs.dilemmas.
 * screeningAnswers: "si" | "no" alineados con jobs.screening (lib/cribado.js).
 * Antes el botón "Aplicar" solo enseñaba una pantalla de éxito: no se guardaba
 * nada y la empresa nunca se enteraba. La identidad sale siempre del token. La
 * empresa ve el alias del candidato, nunca su identidad (eso sigue siendo el
 * desbloqueo de pago).
 */
const { jsonResponse, sb, authUser, ensureProfileByUser, isUuid, faltaEnEsquema, esDuplicado, errorInterno } = require("../tp");
const { limitar } = require("../limites");
const { evaluarCribado } = require("../cribado");

/** Respuestas en la misma posición que su dilema: una vacía se queda vacía, no corre las demás. */
function limpiarRespuestasDilema(v) {
  if (!Array.isArray(v)) return [];
  return v
    .slice(0, 3)
    .map((x) => (typeof x === "string" ? x.trim().slice(0, 2000) : ""));
}

function aPostulacion(a) {
  return {
    jobId: a.job_id,
    status: a.status,
    // El motivo de un descarte lo ve solo la empresa.
    updatedAt: a.updated_at,
    createdAt: a.created_at
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  try {
    const b = JSON.parse(event.body || "{}");
    const user = await authUser(event, b);
    if (!user) return jsonResponse(401, { error: "Inicia sesión con tu cuenta de candidato para postularte" });
    if (user.user_metadata && user.user_metadata.role === "empresa") {
      return jsonResponse(403, { error: "Las cuentas de empresa no se postulan a ofertas" });
    }

    const perfil = await ensureProfileByUser(user.id);

    if (b.jobId != null) {
      if (await limitar("apply:" + user.id, { max: 30, ventanaS: 3600 })) {
        return jsonResponse(429, { error: "Te has postulado a muchas ofertas seguidas. Prueba dentro de un rato." });
      }
      const jobId = String(b.jobId);
      if (!isUuid(jobId)) return jsonResponse(400, { error: "jobId no válido" });
      let jobs = null;
      for (const campos of ["id,title,company_user_id,dilemmas,screening", "id,title,company_user_id,dilemmas", "id,title,company_user_id"]) {
        try {
          jobs = await sb.select("jobs", `id=eq.${jobId}&status=eq.open&select=${campos}&limit=1`);
          break;
        } catch (err) {
          if (!faltaEnEsquema(err, /dilemmas|screening/i)) throw err;
        }
      }
      if (!Array.isArray(jobs) || !jobs.length) {
        return jsonResponse(404, { error: "Esta oferta ya no está abierta" });
      }
      const prompts = Array.isArray(jobs[0].dilemmas)
        ? jobs[0].dilemmas.filter((x) => typeof x === "string" && x.trim()).slice(0, 3)
        : [];
      const respuestas = limpiarRespuestasDilema(b.dilemmaAnswers);
      if (respuestas.slice(0, prompts.length).filter(Boolean).length < prompts.length) {
        return jsonResponse(400, {
          error: "Responde los dilemas de la empresa antes de postularte (" + prompts.length + " en total)"
        });
      }
      const dilemma_answers = prompts.map((prompt, i) => ({
        prompt: String(prompt).slice(0, 600),
        answer: respuestas[i] || ""
      }));
      // Cribado: se guarda si cumple, pero no se descarta a nadie aquí.
      const cribado = evaluarCribado(jobs[0].screening, b.screeningAnswers);
      if (cribado.error) return jsonResponse(400, { error: cribado.error });
      const screening_answers = cribado.respuestas;
      const previas = await sb.select(
        "applications",
        `job_id=eq.${jobId}&candidate_profile_id=eq.${perfil.id}&select=job_id,status,updated_at,created_at&limit=1`
      );
      if (Array.isArray(previas) && previas[0]) {
        return jsonResponse(200, { ok: true, yaPostulado: true, application: aPostulacion(previas[0]) });
      }
      const ahora = new Date().toISOString();
      const base = {
        job_id: jobId,
        candidate_profile_id: perfil.id,
        company_user_id: jobs[0].company_user_id,
        status: "aplicado",
        created_at: ahora,
        updated_at: ahora
      };
      // Sin las columnas de dilemas o de cribado (migración pendiente) se
      // guarda la postulación igual, sin ellas.
      let datos = Object.assign({}, base,
        dilemma_answers.length ? { dilemma_answers } : {},
        screening_answers.length ? { screening_answers } : {});
      let filas;
      for (;;) {
        try {
          filas = await sb.insert("applications", datos);
          break;
        } catch (err) {
          // Doble clic: la otra petición ya la ha guardado (unique job_id+perfil).
          if (esDuplicado(err)) return jsonResponse(200, { ok: true, yaPostulado: true, application: aPostulacion({ job_id: jobId, status: "aplicado", created_at: ahora, updated_at: ahora }) });
          const falta = ["dilemma_answers", "screening_answers"].find((c) => c in datos && faltaEnEsquema(err, new RegExp(c, "i")));
          if (!falta) throw err;
          const { [falta]: _x, ...resto } = datos;
          datos = resto;
        }
      }
      const fila = Array.isArray(filas) ? filas[0] : filas;
      // Aviso a la empresa (best effort: si falta la tabla, la postulación ya está guardada).
      try {
        await sb.insert("notifications", {
          user_id: jobs[0].company_user_id,
          type: "application_received",
          title: "Nueva postulación",
          body: "Un candidato anónimo se ha postulado a «" + String(jobs[0].title || "tu oferta").slice(0, 120) + "». Míralo en «Ver candidatos».",
          meta: { job_id: jobId }
        });
      } catch (e) {
        console.warn("[TP] aviso de postulación:", e.message);
      }
      return jsonResponse(200, {
        ok: true,
        application: aPostulacion(fila || { job_id: jobId, status: "aplicado", created_at: ahora, updated_at: ahora }),
        cribado: { cumple: cribado.cumple, noCumple: cribado.noCumple }
      });
    }

    let lista;
    try {
      lista = await sb.select(
        "applications",
        `candidate_profile_id=eq.${perfil.id}&select=job_id,status,updated_at,created_at&order=updated_at.desc&limit=100`
      );
    } catch (err) {
      if (faltaEnEsquema(err, "applications")) return jsonResponse(200, { ok: true, applications: [], pendingMigration: true });
      throw err;
    }
    return jsonResponse(200, { ok: true, applications: (Array.isArray(lista) ? lista : []).map(aPostulacion) });
  } catch (err) {
    if (faltaEnEsquema(err, "applications")) {
      return jsonResponse(503, { error: "Falta la migración del pipeline (applications)", code: "pending_migration" });
    }
    return errorInterno("No se pudo gestionar la postulación", err);
  }
};

module.exports.aPostulacion = aPostulacion;
module.exports.limpiarRespuestasDilema = limpiarRespuestasDilema;
