/**
 * create-checkout-session — abre una sesión de Stripe Checkout para desbloquear
 * el contacto de un candidato (pago por resultado).
 *
 * Body: { candidateRef, candidateLabel?, returnUrl? }
 * Cabecera: Authorization: Bearer <access token de Supabase>
 *
 * El importe NO viaja desde el cliente: lo fija el servidor (UNLOCK_PRICE), así
 * que manipular el navegador no cambia lo que se cobra. Y el desbloqueo no se
 * concede aquí: esta función solo deja una fila en estado `pending`. Quien la
 * pasa a `paid` es Stripe, vía webhook o vía confirm-checkout.
 *
 * Devuelve: { url, sessionId, alreadyUnlocked? }
 */
const {
  jsonResponse, sb, authUser, getStripe, stripeConfigured, stripeLiveMode,
  UNLOCK_PRICE, formatAmount
} = require("./lib/tp");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  let b;
  try { b = JSON.parse(event.body || "{}"); }
  catch (_e) { return jsonResponse(400, { error: "Body JSON no válido" }); }

  if (!stripeConfigured()) {
    return jsonResponse(503, {
      error: "Los pagos no están configurados en este entorno",
      details: "Falta STRIPE_SECRET_KEY en las variables de entorno del servidor.",
      code: "stripe_not_configured"
    });
  }

  // ── Solo una empresa identificada puede iniciar un pago. ──
  let user;
  try { user = await authUser(event, b); }
  catch (err) { return jsonResponse(500, { error: "No se pudo validar la sesión", details: err.message }); }
  if (!user) {
    return jsonResponse(401, {
      error: "Necesitas una cuenta de empresa para desbloquear un contacto",
      details: "Falta la cabecera Authorization: Bearer <access token> o el token ha caducado."
    });
  }

  const candidateRef = String(b.candidateRef || "").trim();
  if (!candidateRef || candidateRef.length > 120) {
    return jsonResponse(400, { error: "Falta el candidato a desbloquear (candidateRef)" });
  }
  const candidateLabel = String(b.candidateLabel || "").trim().slice(0, 200) || candidateRef;

  try {
    // ── Ya pagado: no se cobra dos veces por el mismo candidato. ──
    const paid = await sb.select(
      "unlocks",
      `company_user_id=eq.${user.id}&candidate_ref=eq.${encodeURIComponent(candidateRef)}` +
        `&status=eq.paid&select=id,paid_at&limit=1`
    );
    if (Array.isArray(paid) && paid.length) {
      return jsonResponse(200, {
        ok: true,
        alreadyUnlocked: true,
        unlockId: paid[0].id,
        paidAt: paid[0].paid_at
      });
    }

    const stripe = getStripe();
    // Stripe vuelve a la misma página con el id de sesión, que es lo que
    // confirm-checkout verifica contra la API de Stripe.
    const base = String(b.returnUrl || "").trim() || (
      (event.headers && (event.headers.origin || event.headers.Origin)) || ""
    );
    if (!/^https?:\/\//.test(base)) {
      return jsonResponse(400, { error: "No se pudo determinar la URL de retorno" });
    }
    const sep = base.includes("?") ? "&" : "?";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // El correo se rellena solo: una fricción menos y liga el pago a la cuenta.
      customer_email: user.email || undefined,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: UNLOCK_PRICE.currency,
          unit_amount: UNLOCK_PRICE.amountCents,
          product_data: {
            name: UNLOCK_PRICE.label,
            description: "Datos de contacto de " + candidateLabel
          }
        }
      }],
      // El webhook necesita saber a quién pertenece el pago sin fiarse del cliente.
      metadata: {
        company_user_id: user.id,
        candidate_ref: candidateRef,
        candidate_label: candidateLabel
      },
      success_url: base + sep + "pay=success&session_id={CHECKOUT_SESSION_ID}",
      cancel_url: base + sep + "pay=cancel",
      locale: "es"
    });

    // Fila en `pending`. Si el usuario abandona, se queda así y nunca da acceso.
    await sb.insert("unlocks", {
      company_user_id: user.id,
      candidate_ref: candidateRef,
      candidate_label: candidateLabel,
      amount_cents: UNLOCK_PRICE.amountCents,
      currency: UNLOCK_PRICE.currency,
      status: "pending",
      stripe_session_id: session.id,
      livemode: !!session.livemode
    });

    return jsonResponse(200, {
      ok: true,
      url: session.url,
      sessionId: session.id,
      livemode: !!session.livemode,
      testMode: !stripeLiveMode(),
      amount: formatAmount(UNLOCK_PRICE.amountCents, UNLOCK_PRICE.currency)
    });
  } catch (err) {
    return jsonResponse(500, { error: "No se pudo iniciar el pago", details: err.message });
  }
};
