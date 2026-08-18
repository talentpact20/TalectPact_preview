/**
 * save-profile — crea o actualiza el perfil de un candidato autenticado.
 * Body: { userId, email?, fullName?, sector?, phone?, linkedin? }
 */
const { jsonResponse, ensureProfileByUser } = require("./lib/tp");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  try {
    const b = JSON.parse(event.body || "{}");
    if (!b.userId) return jsonResponse(400, { error: "userId es obligatorio" });

    const profile = await ensureProfileByUser(b.userId, {
      email: b.email,
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
