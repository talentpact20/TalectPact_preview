/**
 * get-company — devuelve la ficha de empresa del usuario autenticado.
 * Cabecera: Authorization: Bearer <access token de Supabase>
 * Devuelve también `verificacion` ({ nivel, dominio, motivo, ayuda }): ver lib/verificacion.js.
 */
const { jsonResponse, authUser, ensureCompanyByUser, verificacionDeEmpresa, errorInterno } = require("../tp");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  try {
    const b = JSON.parse(event.body || "{}");
    const user = await authUser(event, b);
    if (!user) return jsonResponse(401, { error: "Sesión no válida o caducada" });
    // Sin crear ficha de empresa a una cuenta de candidato (ver save-company).
    if ((user.user_metadata || {}).role === "candidate") return jsonResponse(200, { ok: true, company: null });
    const company = await ensureCompanyByUser(user.id);
    const verificacion = await verificacionDeEmpresa(user, company);
    return jsonResponse(200, { ok: true, company, verificacion });
  } catch (err) {
    return errorInterno("No se pudo cargar la empresa", err);
  }
};
