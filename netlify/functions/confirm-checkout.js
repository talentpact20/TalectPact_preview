/**
 * confirm-checkout — comprueba el estado de un pago al volver de Stripe, y
 * devuelve los desbloqueos pagados de la empresa.
 *
 * Body: { sessionId? }
 * Cabecera: Authorization: Bearer <access token de Supabase>
 *
 * El webhook es el camino autoritativo, pero puede tardar o no estar
 * configurado (en local, por ejemplo). Aquí se pregunta a la API de Stripe por
 * la sesión: la respuesta viene de Stripe, nunca del cliente, así que sirve
 * igual de garantía. La operación es idempotente con el webhook.
 *
 * Devuelve: { paid, unlocks: [candidateRef…], sessionStatus? }
 */
const { jsonResponse, sb, authUser, getStripe, stripeConfigured, stripeLiveMode,
        UNLOCK_PRICE, formatAmount } = require("./lib/tp");

/** Estado de la pasarela, para que la interfaz no tenga que adivinarlo. */
function gatewayInfo() {
  return {
    configured: stripeConfigured(),
    testMode: stripeConfigured() ? !stripeLiveMode() : null,
    amountCents: UNLOCK_PRICE.amountCents,
    currency: UNLOCK_PRICE.currency,
    amount: formatAmount(UNLOCK_PRICE.amountCents, UNLOCK_PRICE.currency)
  };
}

async function paidRefs(userId) {
  const rows = await sb.select(
    "unlocks",
    `company_user_id=eq.${userId}&status=eq.paid&select=candidate_ref,candidate_label,amount_cents,currency,paid_at&order=paid_at.desc&limit=500`
  );
  return Array.isArray(rows) ? rows : [];
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  let b;
  try { b = JSON.parse(event.body || "{}"); }
  catch (_e) { return jsonResponse(400, { error: "Body JSON no válido" }); }

  let user;
  try { user = await authUser(event, b); }
  catch (err) { return jsonResponse(500, { error: "No se pudo validar la sesión", details: err.message }); }
  if (!user) return jsonResponse(401, { error: "Sesión no válida o caducada" });

  try {
    const sessionId = String(b.sessionId || "").trim();

    if (sessionId) {
      if (!stripeConfigured()) {
        return jsonResponse(503, {
          error: "Los pagos no están configurados en este entorno",
          code: "stripe_not_configured",
          stripe: gatewayInfo()
        });
      }
      // La fila se busca acotada al usuario: un sessionId ajeno no desbloquea nada.
      const rows = await sb.select(
        "unlocks",
        `stripe_session_id=eq.${encodeURIComponent(sessionId)}&company_user_id=eq.${user.id}&select=*&limit=1`
      );
      const row = Array.isArray(rows) ? rows[0] : null;
      if (!row) return jsonResponse(404, { error: "Ese pago no pertenece a esta cuenta" });

      if (row.status !== "paid") {
        // La verdad la da Stripe, no el parámetro de la URL.
        const session = await getStripe().checkout.sessions.retrieve(sessionId);
        if (session && session.payment_status === "paid") {
          await sb.update(
            "unlocks",
            `stripe_session_id=eq.${encodeURIComponent(sessionId)}&status=neq.paid`,
            {
              status: "paid",
              paid_at: new Date().toISOString(),
              stripe_payment_intent:
                typeof session.payment_intent === "string" ? session.payment_intent : null
            }
          );
        } else {
          return jsonResponse(200, {
            ok: true,
            paid: false,
            sessionStatus: (session && session.payment_status) || "unknown",
            unlocks: await paidRefs(user.id),
            stripe: gatewayInfo()
          });
        }
      }

      return jsonResponse(200, {
        ok: true,
        paid: true,
        candidateRef: row.candidate_ref,
        unlocks: await paidRefs(user.id),
        stripe: gatewayInfo()
      });
    }

    // Sin sessionId: solo se sincroniza el estado (al abrir el panel).
    return jsonResponse(200, { ok: true, paid: false, unlocks: await paidRefs(user.id), stripe: gatewayInfo() });
  } catch (err) {
    return jsonResponse(500, { error: "No se pudo confirmar el pago", details: err.message });
  }
};
