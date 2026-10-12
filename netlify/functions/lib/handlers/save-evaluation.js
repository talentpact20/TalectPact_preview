/**
 * save-evaluation — persiste una evaluación de IA en Supabase.
 * Body: { challengeId, skill, score, criteria?, reasoning?,
 *         modelUsed?, tokensIn?, tokensOut?, costEur?, receipts?, integrity? }
 * Cabecera: Authorization: Bearer <access token de Supabase>
 *
 * El candidato sale del token. Antes bastaba con mandar el `userId` de otro (o
 * ni eso: sin id se escribía en un perfil "Candidato Demo") para inyectarle
 * notas que luego issue-credential sellaba en la blockchain.
 */
const { jsonResponse, sb, authUser, ensureProfileByUser } = require("../tp");
const { verifyReceipt } = require("../evaluator");

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
  const payloads = receipts.map(verifyReceipt);
  if (payloads.some((p) => !p)) return { verified: false, reason: "firma no válida o secreto no configurado" };
  // Un recibo válido de otro reto, caducado o repetido no puede inflar esta nota.
  if (payloads.some((p) => String(p.cid) !== String(challengeId))) return { verified: false, reason: "recibo de otro reto" };
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
      skill: String(b.skill).slice(0, 120),
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
      if (!/integrity/i.test(err.message)) throw err;
      const { integrity: _omit, ...sinIntegridad } = row0;
      inserted = await sb.insert("evaluations", sinIntegridad);
    }

    const row = Array.isArray(inserted) ? inserted[0] : inserted;
    return jsonResponse(200, {
      ok: true, profileId: profile.id, evaluationId: row && row.id,
      verified: integrity.verified, reason: integrity.reason || null
    });
  } catch (err) {
    return jsonResponse(500, { error: "No se pudo guardar la evaluación", details: err.message });
  }
};

module.exports.verificarNota = verificarNota;
