/**
 * Avisos in-app al candidato. Sin proveedor de email aún: la bandeja del
 * panel cumple la promesa del FAQ; el correo se puede enganchar después.
 */
const { sb, isUuid } = require("./tp");

async function notificarDesbloqueo(unlock) {
  if (!unlock || !unlock.candidate_ref || !isUuid(String(unlock.candidate_ref))) return;
  try {
    const filas = await sb.select(
      "profiles",
      `id=eq.${unlock.candidate_ref}&select=user_id&limit=1`
    );
    const perfil = Array.isArray(filas) ? filas[0] : null;
    if (!perfil || !perfil.user_id) return;
    await sb.insert("notifications", {
      user_id: perfil.user_id,
      type: "contact_unlocked",
      title: "Una empresa ha desbloqueado tu contacto",
      body: "Una empresa ha pagado para escribirte. Revisa tu correo y tu bandeja en TalentPact.",
      meta: {
        unlock_id: unlock.id || null,
        company_user_id: unlock.company_user_id || null,
        candidate_ref: unlock.candidate_ref
      }
    });
  } catch (err) {
    // La tabla puede no existir aún (migración pendiente): no tumba el pago.
    console.warn("[TP] notificación desbloqueo:", err.message);
  }
}

module.exports = { notificarDesbloqueo };
