/**
 * Avisos in-app al candidato. Sin proveedor de email aún: la bandeja del
 * panel cumple la promesa del FAQ; el correo se puede enganchar después.
 */
const { sb, isUuid } = require("./tp");

async function notificarDesbloqueo(unlock) {
  if (!unlock || !unlock.candidate_ref || !isUuid(String(unlock.candidate_ref))) return;
  try {
    const filas = await sb.select(
      "profiles",
      `id=eq.${unlock.candidate_ref}&select=user_id&limit=1`
    );
    const perfil = Array.isArray(filas) ? filas[0] : null;
    if (!perfil || !perfil.user_id) return;
    await sb.insert("notifications", {
      user_id: perfil.user_id,
      type: "contact_unlocked",
      title: "Una empresa ha desbloqueado tu contacto",
      body: "Una empresa quiere escribirte y ya tiene tus datos de contacto. Revisa tu correo y tu bandeja en TalentPact.",
      meta: {
        unlock_id: unlock.id || null,
        company_user_id: unlock.company_user_id || null,
        candidate_ref: unlock.candidate_ref
      }
    });
  } catch (err) {
    // La tabla puede no existir aún (migración pendiente): no tumba el pago.
    console.warn("[TP] notificación desbloqueo:", err.message);
  }
}

/**
 * Aviso de cambio de etapa en un proceso. El candidato es anónimo para la
 * empresa y viceversa hasta el desbloqueo: el aviso no nombra a la empresa ni
 * incluye el motivo del descarte (lo ve solo la empresa; queda registrado).
 */
const AVISOS_ETAPA = {
  preseleccionado: ["Has pasado a la siguiente fase", "Una empresa te ha preseleccionado para una oferta a la que encajas."],
  entrevista: ["Una empresa quiere entrevistarte", "Has pasado a la fase de entrevista en una oferta. Revisa tu correo: si la empresa ha desbloqueado tu contacto, te escribirá."],
  contratado: ["Enhorabuena: te han elegido", "Una empresa ha marcado tu candidatura como contratada."],
  descartado: ["Tu candidatura no continúa", "Una empresa ha cerrado tu candidatura en una oferta. Tus notas y tu perfil siguen disponibles para otras ofertas."]
};

function mensajeEtapa(status) {
  const a = AVISOS_ETAPA[status];
  return a ? { title: a[0], body: a[1] } : null;
}

async function notificarEtapa({ profileId, status, jobId }) {
  const msg = mensajeEtapa(status);
  if (!msg || !isUuid(String(profileId || ""))) return;
  try {
    const filas = await sb.select("profiles", `id=eq.${profileId}&select=user_id&limit=1`);
    const perfil = Array.isArray(filas) ? filas[0] : null;
    if (!perfil || !perfil.user_id) return;
    await sb.insert("notifications", {
      user_id: perfil.user_id,
      type: "application_" + status,
      title: msg.title,
      body: msg.body,
      meta: { job_id: jobId || null, status }
    });
  } catch (err) {
    console.warn("[TP] notificación de etapa:", err.message);
  }
}

/**
 * Aviso al candidato cuando TalentPact resuelve su solicitud de reapertura
 * o de alternativa a la cámara.
 */
function mensajeSolicitudIntento({ tipo, decision, reto, nota }) {
  const esCam = tipo === "sin_camara";
  const deQue = esCam ? "alternativa a la cámara" : ("otra oportunidad" + (reto ? ` en «${reto}»` : ""));
  if (decision === "aprobada") {
    return {
      title: esCam ? "Puedes hacer el reto sin cámara" : "Puedes volver a hacer el reto",
      body: esCam
        ? "Hemos aprobado tu solicitud. Al empezar un reto oficial puedes continuar sin cámara; el informe lo registrará."
        : `Hemos aprobado tu solicitud de ${deQue}. Ya puedes empezar de nuevo desde el catálogo.`
    };
  }
  const motivo = nota ? ` Motivo: ${nota}` : "";
  return {
    title: "Tu solicitud no se ha podido aprobar",
    body: `No hemos podido aprobar tu solicitud de ${deQue}.${motivo}`
  };
}

async function notificarSolicitudIntento({ userId, tipo, decision, challengeId, reto, nota, requestId, adminId }) {
  if (!userId || !isUuid(String(userId))) return;
  const msg = mensajeSolicitudIntento({ tipo, decision, reto, nota });
  try {
    await sb.insert("notifications", {
      user_id: userId,
      type: "attempt_request_" + decision,
      title: msg.title,
      body: msg.body,
      meta: {
        request_id: requestId || null,
        tipo: tipo || null,
        challenge_id: challengeId || null,
        decision: decision || null,
        admin_id: adminId || null
      }
    });
  } catch (err) {
    console.warn("[TP] notificación solicitud intento:", err.message);
  }
}

module.exports = {
  notificarDesbloqueo,
  notificarEtapa,
  mensajeEtapa,
  AVISOS_ETAPA,
  notificarSolicitudIntento,
  mensajeSolicitudIntento
};
