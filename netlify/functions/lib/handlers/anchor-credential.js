/**
 * anchor-credential — pide el sello público de una credencial ya pagada.
 *
 * Body: { credentialId }  (o { cvHash })
 * Cabecera: Authorization: Bearer <access token de Supabase>
 *
 * Desde el SkillPass v2 el sello va por lotes (docs/plan_post_reunion/03 §4.2):
 * aquí no se envía ninguna transacción. La credencial pagada entra en la cola
 * y anchor-batch publica cada noche una sola raíz de Merkle con todas las del
 * día. El coste para TalentPact es constante y desaparece el tope diario por
 * persona, que solo existía porque cada sello era una transacción.
 *
 * Las credenciales v1 con una transacción ya enviada (contrato v1, Sepolia)
 * siguen recogiendo aquí su recibo.
 *
 * Devuelve: { ok, sello: { estado: no | en_cola | enviado | sellado, … } }
 */
const {
  jsonResponse, sb, authUser, getProvider, chainConfigured, isHash32, isUuid,
  errorInterno, faltaEnEsquema, formatAmount
} = require("../tp");
const { SEAL_PRICE, selloPagado } = require("../sello");
const { estadoSello, cargarLote } = require("../skillpass");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  let b;
  try { b = JSON.parse(event.body || "{}"); }
  catch (_e) { return jsonResponse(400, { error: "Body JSON no válido" }); }

  let user;
  try { user = await authUser(event, b); }
  catch (err) { return errorInterno("No se pudo validar la sesión", err); }
  if (!user) {
    return jsonResponse(401, {
      error: "Necesitas iniciar sesión para sellar tu SkillPass",
      details: "Falta la cabecera Authorization: Bearer <access token> o el token ha caducado."
    });
  }

  try {
    // La credencial se busca siempre acotada al perfil de quien pide.
    const profiles = await sb.select("profiles", `user_id=eq.${user.id}&select=id&limit=1`);
    const profile = Array.isArray(profiles) ? profiles[0] : null;
    if (!profile) return jsonResponse(404, { error: "Este usuario no tiene perfil ni credenciales" });

    let filter;
    if (b.credentialId) {
      if (!isUuid(b.credentialId)) return jsonResponse(400, { error: "credentialId no válido" });
      filter = `id=eq.${b.credentialId}`;
    } else if (b.cvHash) {
      if (!isHash32(b.cvHash)) return jsonResponse(400, { error: "cvHash no válido: se espera 0x + 64 hex" });
      filter = `cv_hash=eq.${b.cvHash.trim()}`;
    } else {
      return jsonResponse(400, { error: "Falta credentialId o cvHash" });
    }

    const rows = await sb.select("credentials", `${filter}&profile_id=eq.${profile.id}&select=*&limit=1`);
    const cred = Array.isArray(rows) ? rows[0] : null;
    if (!cred) return jsonResponse(404, { error: "Credencial no encontrada" });

    // ── v1 con transacción ya enviada: solo falta recoger el recibo. ──
    if (cred.tx_hash && !cred.batch_id && cred.block_number == null && chainConfigured()) {
      const receipt = await getProvider().getTransactionReceipt(cred.tx_hash);
      if (receipt && receipt.blockNumber != null) {
        const anchoredAt = cred.anchored_at || new Date().toISOString();
        await sb.update("credentials", `id=eq.${cred.id}`, { block_number: Number(receipt.blockNumber), anchored_at: anchoredAt });
        Object.assign(cred, { block_number: Number(receipt.blockNumber), anchored_at: anchoredAt });
      }
      return jsonResponse(200, { ok: true, sello: estadoSello(cred, null) });
    }
    if (cred.tx_hash || cred.batch_id) {
      return jsonResponse(200, { ok: true, already: true, sello: estadoSello(cred, await cargarLote(cred.batch_id)) });
    }
    if (cred.revoked_at) return jsonResponse(409, { error: "Esta credencial está revocada: no se puede sellar." });

    // ── El sello es de pago (lib/sello.js). ──
    const pagado = await selloPagado(sb, faltaEnEsquema, cred.id, user.id);
    if (pagado === null) return jsonResponse(503, { error: "El sello público todavía no está disponible.", code: "sello_no_disponible" });
    if (!pagado) {
      return jsonResponse(402, {
        error: "El sello público es un extra de pago", code: "sello_no_pagado",
        precio: formatAmount(SEAL_PRICE.amountCents, SEAL_PRICE.currency)
      });
    }

    // ── Pagado: entra en la cola del lote de esta noche (idempotente). ──
    if (!cred.seal_paid_at) {
      const ahora = new Date().toISOString();
      try {
        await sb.update("credentials", `id=eq.${cred.id}&seal_paid_at=is.null`, { seal_paid_at: ahora });
      } catch (err) {
        if (faltaEnEsquema(err, /seal_paid_at/i)) {
          return jsonResponse(503, { error: "El sello por lotes aún no está activado (falta supabase_schema_vc.sql).", code: "sello_no_disponible" });
        }
        throw err;
      }
      cred.seal_paid_at = ahora;
    }
    return jsonResponse(200, { ok: true, sello: estadoSello(cred, null) });
  } catch (err) {
    return errorInterno("No se pudo pedir el sello", err);
  }
};
