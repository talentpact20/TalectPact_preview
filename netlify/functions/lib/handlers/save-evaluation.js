/**
 * save-evaluation — persiste una evaluación de IA en Supabase.
 * Body: { challengeId, skill, score, attemptId?, criteria?, reasoning?,
 *         modelUsed?, tokensIn?, tokensOut?, costEur?, receipts?, integrity? }
 * Cabecera: Authorization: Bearer <access token de Supabase>
 *
 * El candidato sale del token. Antes bastaba con mandar el `userId` de otro (o
 * ni eso: sin id se escribía en un perfil "Candidato Demo") para inyectarle
 * notas que luego issue-credential sellaba en la blockchain.
 */
const { jsonResponse, sb, authUser, ensureProfileByUser, faltaEnEsquema, errorInterno } = require("../tp");
const { verifyReceipt } = require("../evaluator");
const { puedeGuardar } = require("../intentos");
const { isUuid } = require("../tp");

/**
 * Reto oficial del catálogo: la nota solo se guarda si va unida a un intento
 * válido de esta persona (uno por reto) y solo una vez. Devuelve { intento } si
 * vale, { error } si no, o { sinControl } si la migración aún no está.
 */
async function comprobarIntento(userId, challengeId, attemptId) {
  let filas;
  try {
    filas = isUuid(String(attemptId || "")) ? await sb.select("attempts", `id=eq.${attemptId}&select=*&limit=1`) : [];
  } catch (err) {
    if (faltaEnEsquema(err, /attempts/i)) return { sinControl: true };
    throw err;
  }
  const intento = Array.isArray(filas) ? filas[0] : null;
  const r = puedeGuardar(intento, { userId, challengeId });
  return r.ok ? { intento } : { error: r.motivo };
}
const { retoComun } = require("../catalogo");

const MAX_TEXT = 20000;

function nullableInt(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

/**
 * ¿La nota la puso el Corrector v2? Lo está si cada ejercicio trae un recibo
 * con firma válida y la media de esas notas es la que se intenta guardar.
 * Sin recibos (modo invitado sincronizado, corrección de reserva sin IA) la
 * evaluación se guarda igual, pero marcada como no verificada.
 */
const RECEIPT_TTL_S = 24 * 3600;

function verificarNota(receipts, score, challengeId, nowS = Math.floor(Date.now() / 1000)) {
  if (!Array.isArray(receipts) || !receipts.length || receipts.length > 10) {
    return { verified: false, reason: "sin recibos" };
  }
  // Solo el servidor conoce el enunciado de los retos del catálogo. Un reto de
  // fuera (ejercicios de oferta) se corrige con el texto que manda el
  // navegador, así que su nota no puede presentarse como verificada.
  if (!retoComun(challengeId)) return { verified: false, reason: "reto fuera del catálogo del servidor" };
  const payloads = receipts.map(verifyReceipt);
  if (payloads.some((p) => !p)) return { verified: false, reason: "firma no válida o secreto no configurado" };
  // Un recibo válido de otro reto, caducado o repetido no puede inflar esta nota.
  if (payloads.some((p) => String(p.cid) !== String(challengeId))) return { verified: false, reason: "recibo de otro reto" };
  if (payloads.some((p) => p.cat !== 1)) return { verified: false, reason: "corregido sin el enunciado oficial" };
  if (payloads.some((p) => !(nowS - Number(p.iat) <= RECEIPT_TTL_S))) return { verified: false, reason: "recibo caducado" };
  if (new Set(payloads.map((p) => p.ex + ":" + p.rh)).size !== payloads.length) return { verified: false, reason: "recibo repetido" };
  const media = Math.round(payloads.reduce((n, p) => n + (Number(p.s) || 0), 0) / payloads.length);
  if (Math.abs(media - score) > 1) return { verified: false, reason: `la nota (${score}) no cuadra con los recibos (${media})` };
  return {
    verified: true,
    evaluatorVersion: payloads[0].ev,
    injectionSignals: [...new Set(payloads.flatMap((p) => p.inj || []))]
  };
}

/** Informe de integridad del navegador, acotado: es dato del cliente, no prueba. */
function limpiarIntegridad(raw) {
  if (!raw || typeof raw !== "object") return null;
  const num = (v) => (Number.isFinite(Number(v)) ? Math.max(0, Math.round(Number(v))) : 0);
  return {
    risk: ["bajo", "medio", "alto"].includes(raw.risk) ? raw.risk : null,
    camera: typeof raw.camera === "string" ? raw.camera.slice(0, 20) : null,
    tabSwitches: num(raw.tabSwitches),
    hiddenSeconds: num(raw.hiddenSeconds),
    pasteBlocked: num(raw.pasteBlocked),
    bulkInserts: num(raw.bulkInserts),
    relaunches: num(raw.relaunches),
    cameraIncidents: num(raw.cameraIncidents)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  try {
    const b = JSON.parse(event.body || "{}");
    const user = await authUser(event, b);
    if (!user) return jsonResponse(401, { error: "Sesión no válida o caducada" });

    if (!b.challengeId || !b.skill || b.score == null) {
      return jsonResponse(400, { error: "challengeId, skill y score son obligatorios" });
    }

    // En un reto del catálogo la skill la dice el catálogo: antes se podía
    // guardar el reto de Liderazgo como «Python».
    const reto = retoComun(b.challengeId);
    const skill = reto ? reto.skill : String(b.skill).slice(0, 120);

    // Un reto oficial sin intento válido no se guarda: es lo que impide repetirlo
    // o subir una nota hecha fuera de la plataforma.
    let intento = null;
    if (reto) {
      const c = await comprobarIntento(user.id, reto.id, b.attemptId);
      if (c.error) return jsonResponse(409, { error: c.error, code: "intento_no_valido" });
      intento = c.intento || null;
    }

    const profile = await ensureProfileByUser(user.id);
    const score = Math.max(0, Math.min(100, Math.round(Number(b.score) || 0)));
    const cost = Number(b.costEur);

    const integrity = Object.assign(
      { source: "client" },
      limpiarIntegridad(b.integrity) || {},
      verificarNota(b.receipts, score, b.challengeId)
    );

    const row0 = {
      profile_id: profile.id,
      challenge_id: String(b.challengeId).slice(0, 120),
      skill,
      score,
      criteria: Array.isArray(b.criteria) ? b.criteria.slice(0, 20) : null,
      reasoning: b.reasoning ? String(b.reasoning).slice(0, MAX_TEXT) : null,
      model_used: b.modelUsed ? String(b.modelUsed).slice(0, 120) : null,
      tokens_in: nullableInt(b.tokensIn),
      tokens_out: nullableInt(b.tokensOut),
      cost_eur: b.costEur != null && Number.isFinite(cost) ? cost : null,
      integrity
    };
    let inserted;
    try {
      inserted = await sb.insert("evaluations", row0);
    } catch (err) {
      // Base de datos sin la migración de integridad (supabase_schema_integrity.sql):
      // se guarda la evaluación igual antes que perderla.
      if (!faltaEnEsquema(err, /integrity/i)) throw err;
      const { integrity: _omit, ...sinIntegridad } = row0;
      inserted = await sb.insert("evaluations", sinIntegridad);
    }

    const row = Array.isArray(inserted) ? inserted[0] : inserted;
    if (intento) {
      await sb.update("attempts", `id=eq.${intento.id}&estado=neq.entregado`, {
        estado: "entregado", entregado_en: new Date().toISOString(), evaluation_id: row && row.id
      });
    }
    return jsonResponse(200, {
      ok: true, profileId: profile.id, evaluationId: row && row.id,
      verified: integrity.verified, reason: integrity.reason || null
    });
  } catch (err) {
    return errorInterno("No se pudo guardar la evaluación", err);
  }
};

module.exports.verificarNota = verificarNota;
