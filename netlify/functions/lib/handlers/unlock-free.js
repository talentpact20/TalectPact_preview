/**
 * unlock-free — desbloquea un contacto con uno de los desbloqueos gratis de la
 * empresa (las 3 primeras ofertas incluyen 1 cada una; ver lib/gratis.js).
 *
 * Body: {}                → { gratis } (cuántos tiene y le quedan)
 * Body: { candidateRef }  → { ok, unlockId, gratis } o 402 si no le quedan
 * Cabecera: Authorization: Bearer <access token de Supabase>
 *
 * Mismas comprobaciones que create-checkout-session: solo empresas, solo
 * perfiles reales visibles que aceptan contacto, y nunca dos veces el mismo.
 */
const { jsonResponse, sb, authUser, isUuid, faltaEnEsquema, errorInterno, companyOf, anonymousAlias } = require("../tp");
const { creditosGratis } = require("../gratis");
const { notificarDesbloqueo } = require("../notify");
const { limitar } = require("../limites");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  try {
    const b = JSON.parse(event.body || "{}");
    const user = await authUser(event, b);
    if (!user) return jsonResponse(401, { error: "Inicia sesión con tu cuenta de empresa" });
    if ((user.user_metadata || {}).role === "candidate" || !(await companyOf(user.id))) {
      return jsonResponse(403, { error: "Solo las cuentas de empresa pueden desbloquear contactos", code: "not_company" });
    }

    if (b.candidateRef == null) return jsonResponse(200, { ok: true, gratis: await creditosGratis(user.id) });

    const ref = String(b.candidateRef || "").trim();
    if (!isUuid(ref)) return jsonResponse(400, { error: "Ese candidato no es un perfil del pool", code: "not_real_candidate" });
    if (await limitar("unlock-free:" + user.id, { max: 10, ventanaS: 3600 })) {
      return jsonResponse(429, { error: "Demasiados intentos seguidos. Prueba dentro de un rato." });
    }

    let filas;
    try { filas = await sb.select("profiles", `id=eq.${ref}&select=id,user_id,pool_visible,allow_contact&limit=1`); }
    catch (err) {
      if (!faltaEnEsquema(err, /pool_visible|allow_contact/i)) throw err;
      filas = await sb.select("profiles", `id=eq.${ref}&select=id,user_id&limit=1`);
    }
    const perfil = Array.isArray(filas) ? filas[0] : null;
    if (!perfil) return jsonResponse(404, { error: "Ese candidato ya no existe", code: "candidate_not_found" });
    if (perfil.allow_contact === false) {
      return jsonResponse(409, { error: "Este candidato no acepta solicitudes de contacto ahora mismo", code: "contact_not_allowed" });
    }
    if (perfil.pool_visible === false) {
      return jsonResponse(409, { error: "Este candidato ha dejado de estar visible para empresas", code: "candidate_hidden" });
    }

    const ya = await sb.select("unlocks", `company_user_id=eq.${user.id}&candidate_ref=eq.${ref}&status=eq.paid&select=id,paid_at&limit=1`);
    if (Array.isArray(ya) && ya.length) {
      return jsonResponse(200, { ok: true, alreadyUnlocked: true, unlockId: ya[0].id, gratis: await creditosGratis(user.id) });
    }

    const antes = await creditosGratis(user.id);
    if (antes.restantes <= 0) {
      return jsonResponse(402, {
        error: antes.ofertasGratisPendientes
          ? "No te quedan desbloqueos gratis. Publica otra oferta para conseguir uno más, o paga este contacto."
          : "Ya has usado los desbloqueos gratis de tus 3 primeras ofertas.",
        code: "no_free_unlocks",
        gratis: antes
      });
    }

    const ahora = new Date().toISOString();
    const creada = await sb.insert("unlocks", {
      company_user_id: user.id,
      candidate_ref: ref,
      candidate_label: anonymousAlias(perfil.user_id || perfil.id),
      amount_cents: 0,
      currency: "eur",
      status: "paid",
      livemode: false,
      paid_at: ahora
    });
    const fila = Array.isArray(creada) ? creada[0] : creada;

    // Dos peticiones a la vez podrían gastar más de lo incluido: se recuenta
    // y, si se ha pasado, se deshace esta.
    const despues = await creditosGratis(user.id);
    if (despues.usados > despues.incluidos && fila && fila.id) {
      await sb.remove("unlocks", `id=eq.${fila.id}`);
      return jsonResponse(402, { error: "Ya has usado tus desbloqueos gratis.", code: "no_free_unlocks", gratis: await creditosGratis(user.id) });
    }

    await notificarDesbloqueo(Object.assign({ company_user_id: user.id, candidate_ref: ref }, fila || {}));
    return jsonResponse(200, { ok: true, unlockId: fila && fila.id, gratis: despues });
  } catch (err) {
    return errorInterno("No se pudo usar el desbloqueo gratis", err);
  }
};
