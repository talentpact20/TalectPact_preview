/**
 * pay-seal — pago del sello público del SkillPass (candidato).
 *
 * Body: { accion: "pagar", credentialId, returnUrl }  → { url } de Stripe Checkout
 *       { accion: "confirmar", sessionId }            → { pagado, credentialId }
 * Cabecera: Authorization: Bearer <access token de Supabase>
 *
 * El importe lo fija el servidor (lib/sello.js). Pagar no sella: deja el pago
 * en `paid` (aquí, verificándolo con Stripe, o en stripe-webhook) y entonces
 * anchor-credential acepta anclar esa credencial.
 */
const { jsonResponse, sb, authUser, getStripe, stripeConfigured, stripeLiveMode, formatAmount, isUuid, faltaEnEsquema, errorInterno } = require("../tp");
const { SEAL_PRICE, selloPagado } = require("../sello");
const { returnUrlSegura } = require("./create-checkout-session");

async function credencialDe(userId, credentialId) {
  const perfiles = await sb.select("profiles", `user_id=eq.${userId}&select=id&limit=1`);
  const perfil = Array.isArray(perfiles) ? perfiles[0] : null;
  if (!perfil) return null;
  const f = await sb.select("credentials", `id=eq.${credentialId}&profile_id=eq.${perfil.id}&select=id,cv_hash,tx_hash,anchored_at&limit=1`);
  return Array.isArray(f) ? f[0] : null;
}

async function pagar(event, user, b) {
  if (!isUuid(String(b.credentialId || ""))) return jsonResponse(400, { error: "credentialId no válido" });
  const cred = await credencialDe(user.id, b.credentialId);
  if (!cred) return jsonResponse(404, { error: "Credencial no encontrada" });
  if (cred.anchored_at) return jsonResponse(200, { ok: true, yaSellado: true });
  const pagado = await selloPagado(sb, faltaEnEsquema, cred.id, user.id);
  if (pagado === null) return jsonResponse(503, { error: "El sello público todavía no está disponible.", code: "sello_no_disponible" });
  if (pagado) return jsonResponse(200, { ok: true, pagado: true, credentialId: cred.id });

  const base = returnUrlSegura(event, b.returnUrl);
  if (!base) return jsonResponse(400, { error: "URL de retorno no válida" });
  const sep = base.includes("?") ? "&" : "?";
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email || undefined,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: SEAL_PRICE.currency,
        unit_amount: SEAL_PRICE.amountCents,
        product_data: { name: SEAL_PRICE.label, description: "Huella de tu SkillPass anclada en blockchain, comprobable sin TalentPact" }
      }
    }],
    metadata: { producto: "sello", user_id: user.id, credential_id: cred.id },
    success_url: base + sep + "sello=ok&session_id={CHECKOUT_SESSION_ID}",
    cancel_url: base + sep + "sello=cancelado",
    locale: "es"
  });
  await sb.insert("seal_payments", {
    user_id: user.id, credential_id: cred.id, amount_cents: SEAL_PRICE.amountCents, currency: SEAL_PRICE.currency,
    status: "pending", stripe_session_id: session.id, livemode: !!session.livemode
  });
  return jsonResponse(200, { ok: true, url: session.url, testMode: !stripeLiveMode(), amount: formatAmount(SEAL_PRICE.amountCents, SEAL_PRICE.currency) });
}

async function confirmar(user, b) {
  const id = String(b.sessionId || "");
  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) return jsonResponse(400, { error: "sessionId no válido" });
  const ses = await getStripe().checkout.sessions.retrieve(id);
  const m = (ses && ses.metadata) || {};
  // La sesión tiene que ser de un sello y de esta persona: si no, no se marca nada.
  if (m.producto !== "sello" || m.user_id !== user.id) return jsonResponse(403, { error: "Ese pago no es tuyo" });
  if (ses.payment_status !== "paid") return jsonResponse(200, { ok: true, pagado: false, estado: ses.payment_status });
  await marcarSelloPagado(ses);
  return jsonResponse(200, { ok: true, pagado: true, credentialId: m.credential_id });
}

/** Marca el sello como pagado (lo usan confirmar y stripe-webhook). */
async function marcarSelloPagado(session) {
  return sb.update("seal_payments", `stripe_session_id=eq.${encodeURIComponent(session.id)}&status=neq.paid`, {
    status: "paid", paid_at: new Date().toISOString(),
    stripe_payment_intent: typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent && session.payment_intent.id) || null
  });
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });
  let b;
  try { b = JSON.parse(event.body || "{}"); } catch { return jsonResponse(400, { error: "Body JSON no válido" }); }
  if (!stripeConfigured()) return jsonResponse(503, { error: "Los pagos no están configurados en este entorno", code: "stripe_not_configured" });
  try {
    const user = await authUser(event, b);
    if (!user) return jsonResponse(401, { error: "Inicia sesión para sellar tu SkillPass" });
    if ((user.user_metadata || {}).role === "empresa") return jsonResponse(403, { error: "El sello es para candidatos" });
    if (b.accion === "pagar") return await pagar(event, user, b);
    if (b.accion === "confirmar") return await confirmar(user, b);
    return jsonResponse(400, { error: "Acción no válida" });
  } catch (err) {
    if (faltaEnEsquema(err, /seal_payments/i)) return jsonResponse(503, { error: "El sello público todavía no está disponible.", code: "sello_no_disponible" });
    return errorInterno("No se pudo gestionar el pago del sello", err);
  }
};

module.exports.marcarSelloPagado = marcarSelloPagado;
