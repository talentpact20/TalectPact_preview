/**
 * stripe-webhook — camino autoritativo por el que un desbloqueo pasa a `paid`.
 *
 * Stripe llama aquí cuando el pago se completa. La firma se verifica con
 * STRIPE_WEBHOOK_SECRET: sin esa comprobación cualquiera podría enviar un POST
 * fingiendo un cobro y regalarse los contactos.
 *
 * Se registra en Stripe (Developers → Webhooks) apuntando a:
 *   https://<tu-sitio>/.netlify/functions/stripe-webhook
 * con los eventos checkout.session.completed y checkout.session.expired.
 */
const { jsonResponse, sb, getStripe, stripeConfigured } = require("./lib/tp");

/** Marca la fila como pagada. Idempotente: Stripe reintenta los webhooks. */
async function markPaid(session) {
  const rows = await sb.update(
    "unlocks",
    `stripe_session_id=eq.${encodeURIComponent(session.id)}&status=neq.paid`,
    {
      status: "paid",
      paid_at: new Date().toISOString(),
      stripe_payment_intent:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent && session.payment_intent.id) || null
    }
  );
  return Array.isArray(rows) ? rows.length : 0;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  if (!stripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return jsonResponse(503, {
      error: "Webhook de Stripe no configurado",
      details: "Faltan STRIPE_SECRET_KEY o STRIPE_WEBHOOK_SECRET."
    });
  }

  const sig = (event.headers && (event.headers["stripe-signature"] || event.headers["Stripe-Signature"])) || "";
  if (!sig) return jsonResponse(400, { error: "Falta la cabecera stripe-signature" });

  // La firma se calcula sobre el cuerpo EXACTO. Netlify puede entregarlo en
  // base64, y parsearlo o reserializarlo lo invalidaría.
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body || "", "base64")
    : (event.body || "");

  let stripeEvent;
  try {
    stripeEvent = getStripe().webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    // Firma inválida: se rechaza sin tocar la base de datos.
    return jsonResponse(400, { error: "Firma del webhook no válida", details: err.message });
  }

  try {
    switch (stripeEvent.type) {
      case "checkout.session.completed": {
        const session = stripeEvent.data.object;
        // `completed` no implica cobrado en todos los métodos de pago.
        if (session.payment_status === "paid") await markPaid(session);
        break;
      }
      case "checkout.session.async_payment_succeeded": {
        // Métodos diferidos (SEPA, por ejemplo) confirman más tarde.
        await markPaid(stripeEvent.data.object);
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = stripeEvent.data.object;
        await sb.update(
          "unlocks",
          `stripe_session_id=eq.${encodeURIComponent(session.id)}&status=eq.pending`,
          { status: stripeEvent.type.endsWith("expired") ? "expired" : "failed" }
        );
        break;
      }
      default:
        break;   // El resto de eventos no nos incumben.
    }
    // Siempre 200 tras procesar: un error nuestro haría a Stripe reintentar en bucle.
    return jsonResponse(200, { received: true, type: stripeEvent.type });
  } catch (err) {
    // Aquí sí conviene fallar: que Stripe reintente si Supabase estaba caído.
    return jsonResponse(500, { error: "No se pudo registrar el evento", details: err.message });
  }
};
