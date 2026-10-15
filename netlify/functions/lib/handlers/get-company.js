/**
 * get-company — devuelve la ficha de empresa del usuario autenticado.
 * Cabecera: Authorization: Bearer <access token de Supabase>
 */
const { jsonResponse, authUser, ensureCompanyByUser, errorInterno } = require("../tp");

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
    return jsonResponse(200, { ok: true, company });
  } catch (err) {
    return errorInterno("No se pudo cargar la empresa", err);
  }
};
