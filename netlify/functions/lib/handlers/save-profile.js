/**
 * save-profile — crea o actualiza el perfil de un candidato autenticado.
 * Body: { email?, fullName?, sector?, phone?, linkedin? }
 * Cabecera: Authorization: Bearer <access token de Supabase>
 *
 * El candidato se deduce del token. Antes se aceptaba un `userId` en el body,
 * así que cualquiera podía sobrescribir el nombre, teléfono o LinkedIn de otro.
 */
const { jsonResponse, authUser, ensureProfileByUser } = require("../tp");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  try {
    const b = JSON.parse(event.body || "{}");
    const user = await authUser(event, b);
    if (!user) return jsonResponse(401, { error: "Sesión no válida o caducada" });

    const profile = await ensureProfileByUser(user.id, {
      // El email es el de la cuenta, no uno que proponga el cliente.
      email: user.email,
      full_name: b.fullName,
      sector: b.sector,
      phone: b.phone,
      linkedin: b.linkedin
    });

    return jsonResponse(200, { ok: true, profileId: profile.id, profile });
  } catch (err) {
    return jsonResponse(500, { error: "No se pudo guardar el perfil", details: err.message });
  }
};
