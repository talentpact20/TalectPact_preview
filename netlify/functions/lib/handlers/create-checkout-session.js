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
  UNLOCK_PRICE, formatAmount, isUuid, faltaEnEsquema, errorInterno,
  companyOf, anonymousAlias
} = require("../tp");

// Una sesión de Checkout vive 24 h. Si la empresa vuelve a pulsar «Desbloquear»
// se le devuelve la misma, en vez de abrir otra que también podría pagar.
const REUSO_MS = 23 * 3600 * 1000;

/** Orígenes a los que se permite volver tras pagar. */
function origenesPermitidos(event) {
  const h = (event && event.headers) || {};
  const permitidos = new Set();

  // El sitio declarado en el entorno manda (útil tras un dominio propio).
  for (const v of [process.env.SITE_URL, process.env.URL, process.env.DEPLOY_PRIME_URL]) {
    if (v) { try { permitidos.add(new URL(v).origin); } catch (_e) {} }
  }
  // Y el origen desde el que llega la petición, que es el caso normal.
  const origin = h.origin || h.Origin;
  if (origin) { try { permitidos.add(new URL(origin).origin); } catch (_e) {} }
  const host = h.host || h.Host;
  if (host) {
    const esquema = /^localhost(:|$)|^127\.0\.0\.1(:|$)/.test(host) ? "http" : "https";
    try { permitidos.add(new URL(`${esquema}://${host}`).origin); } catch (_e) {}
  }
  return permitidos;
}

/**
 * Devuelve la URL de retorno si pertenece a un origen propio, o null.
 * Sin candidatos válidos devuelve null: es preferible fallar el pago a mandar
 * a alguien a un dominio de otro.
 */
function returnUrlSegura(event, propuesta) {
  const permitidos = origenesPermitidos(event);
  const candidatos = [propuesta, event && event.headers && (event.headers.origin || event.headers.Origin)];
  for (const c of candidatos) {
    const bruto = String(c || "").trim();
    if (!bruto) continue;
    let u;
    try { u = new URL(bruto); } catch (_e) { continue; }
    if (u.protocol !== "http:" && u.protocol !== "https:") continue;
    if (!permitidos.has(u.origin)) continue;
    return u.toString();
  }
  return null;
}

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
  catch (err) { return errorInterno("No se pudo validar la sesión", err); }
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

  // Solo se cobra por un perfil real del pool (id de Supabase): cualquier otra
  // referencia no tiene un contacto que entregar después del pago.
  if (!isUuid(candidateRef)) {
    return jsonResponse(400, { error: "Ese candidato no es un perfil del pool", code: "not_real_candidate" });
  }

  let candidateLabel;
  try {
    // ── Solo una cuenta de empresa compra contactos. Antes bastaba cualquier
    // sesión: un candidato podía pagar y llevarse el contacto de otro. ──
    if ((user.user_metadata || {}).role === "candidate" || !(await companyOf(user.id))) {
      return jsonResponse(403, { error: "Solo las cuentas de empresa pueden desbloquear contactos", code: "not_company" });
    }

    // ── Un candidato real tiene que existir y estar en el pool. ──
    {
      let filas;
      try { filas = await sb.select("profiles", `id=eq.${candidateRef}&select=id,user_id,pool_visible,allow_contact&limit=1`); }
      catch (err) {
        if (!faltaEnEsquema(err, /pool_visible|allow_contact/i)) throw err;
        filas = await sb.select("profiles", `id=eq.${candidateRef}&select=id,user_id&limit=1`);
      }
      const perfil = Array.isArray(filas) ? filas[0] : null;
      if (!perfil) return jsonResponse(404, { error: "Ese candidato ya no existe", code: "candidate_not_found" });
      if (perfil.allow_contact === false) {
        return jsonResponse(409, { error: "Este candidato no acepta solicitudes de contacto ahora mismo", code: "contact_not_allowed" });
      }
      if (perfil.pool_visible === false) {
        return jsonResponse(409, { error: "Este candidato ha dejado de estar visible para empresas", code: "candidate_hidden" });
      }
      // El texto que verá Stripe lo pone el servidor (antes llegaba del navegador).
      candidateLabel = anonymousAlias(perfil.user_id || perfil.id);
    }

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

    // ── Ya hay un pago abierto para este candidato: se reutiliza. Dos sesiones
    // abiertas permitían pagar dos veces el mismo desbloqueo. ──
    const desde = new Date(Date.now() - REUSO_MS).toISOString();
    const abiertas = await sb.select(
      "unlocks",
      `company_user_id=eq.${user.id}&candidate_ref=eq.${candidateRef}&status=eq.pending` +
        `&created_at=gte.${desde}&select=stripe_session_id&order=created_at.desc&limit=1`
    ).catch(() => []);
    const previa = Array.isArray(abiertas) && abiertas[0] && abiertas[0].stripe_session_id;
    if (previa) {
      try {
        const ses = await stripe.checkout.sessions.retrieve(previa);
        if (ses && ses.status === "open" && ses.url) {
          return jsonResponse(200, {
            ok: true, reused: true, url: ses.url, sessionId: ses.id, livemode: !!ses.livemode,
            testMode: !stripeLiveMode(), amount: formatAmount(UNLOCK_PRICE.amountCents, UNLOCK_PRICE.currency)
          });
        }
      } catch (_e) { /* sesión caducada o borrada: se crea otra */ }
    }
    // Stripe vuelve a la misma página con el id de sesión, que es lo que
    // confirm-checkout verifica contra la API de Stripe.
    //
    // `returnUrl` llega del cliente, así que hay que acotarlo a nuestro propio
    // origen. Comprobar solo que empieza por http:// dejaba abierto un redirect:
    // bastaba pedir la sesión con returnUrl de otro dominio para que Stripe
    // devolviera a la persona —recién pagada— a una página ajena con aspecto de
    // TalentPact. No escala privilegios (confirm-checkout ata cada sesión a su
    // cuenta), pero es un vector de phishing dentro del flujo de pago.
    const base = returnUrlSegura(event, b.returnUrl);
    if (!base) {
      return jsonResponse(400, {
        error: "URL de retorno no válida",
        details: "Debe pertenecer al mismo sitio desde el que se inicia el pago."
      });
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
    return errorInterno("No se pudo iniciar el pago", err);
  }
};

// Se exportan para los tests: la validación del retorno es un control de seguridad.
module.exports.returnUrlSegura = returnUrlSegura;
module.exports.origenesPermitidos = origenesPermitidos;
