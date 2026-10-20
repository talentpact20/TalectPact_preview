/**
 * Piezas comunes del SkillPass v2 que usan emitir, sellar, verificar y revocar.
 */
const { sb, faltaEnEsquema, CHAIN, explorerTx, sealChain, SEAL_CHAINS } = require("./tp");

/** El SkillPass caduca: ¿sigue vigente en `ahora`? Las v1 cuentan 12 meses desde su emisión. */
function vigenteHasta(cred) {
  if (cred.valid_until) return new Date(cred.valid_until);
  const v = cred.cv_json && (cred.cv_json.validUntil || cred.cv_json.issuedAt);
  if (!v) return null;
  const d = new Date(v);
  if (!cred.cv_json.validUntil) d.setUTCMonth(d.getUTCMonth() + 12);
  return d;
}

/** Lote de una credencial (o null). Tolera que la migración no esté aplicada. */
async function cargarLote(batchId) {
  if (!batchId) return null;
  try {
    const f = await sb.select("anchor_batches", `id=eq.${batchId}&select=*&limit=1`);
    return Array.isArray(f) ? f[0] || null : null;
  } catch (err) {
    if (faltaEnEsquema(err, /anchor_batches/i)) return null;
    throw err;
  }
}

/**
 * Estado del sello público, sin datos personales:
 *  · no        — no se ha pagado el sello (el SkillPass sigue siendo verificable en TalentPact).
 *  · en_cola   — pagado; entra en el lote de esta noche.
 *  · enviado   — el lote está en la red, falta la confirmación.
 *  · sellado   — la raíz del lote está en la cadena (o, en v1, el hash).
 * `comprobar` lleva lo necesario para comprobarlo sin TalentPact.
 */
function estadoSello(cred, lote) {
  // v1: una transacción por credencial en Sepolia.
  if (cred.tx_hash && !cred.batch_id) {
    const confirmado = cred.block_number != null || !!cred.anchored_at;
    return {
      estado: confirmado ? "sellado" : "enviado",
      version: 1,
      red: CHAIN.name,
      fecha: cred.anchored_at || null,
      txHash: cred.tx_hash,
      explorerUrl: explorerTx(cred.tx_hash),
      comprobar: { contrato: process.env.SKILLPASS_CONTRACT_ADDRESS || null, funcion: "isAnchored(bytes32)", huella: cred.cv_hash }
    };
  }
  if (lote) {
    const red = (lote.chain && Object.values(SEAL_CHAINS).find((c) => c.slug === lote.chain)) || sealChain();
    const estado = lote.status === "confirmado" ? "sellado" : (lote.status === "fallido" ? "en_cola" : "enviado");
    return {
      estado,
      version: 2,
      red: red.name,
      fecha: lote.anchored_at || null,
      lote: String(lote.created_at || "").slice(0, 10),
      txHash: lote.tx_hash || null,
      explorerUrl: lote.tx_hash ? red.explorer + "/tx/" + lote.tx_hash : null,
      comprobar: {
        contrato: lote.contract || process.env.SKILLPASS_V2_CONTRACT_ADDRESS || null,
        funcion: "verifyLeaf(bytes32,bytes32[],bytes32)",
        raiz: lote.root,
        hoja: cred.merkle_leaf || null,
        prueba: Array.isArray(cred.merkle_proof) ? cred.merkle_proof : [],
        sal: cred.salt || null
      }
    };
  }
  if (cred.seal_paid_at) return { estado: "en_cola", version: 2, red: sealChain().name };
  return { estado: "no" };
}

module.exports = { vigenteHasta, cargarLote, estadoSello };
